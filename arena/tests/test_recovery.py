"""Recovery preserves private state and uses signed, model-free connection checks."""

# ruff: noqa: E402 -- Import the standalone host launcher.

import hashlib
import hmac
import json
import os
import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "hosting"))
import recover

SECRET = "test-only-recovery-signing-secret-not-a-deployment-key"


@pytest.fixture
def config(tmp_path):
    records = tmp_path / "records"
    records.mkdir()
    value = {
        "ARENA_PUBLIC_ORIGIN": "https://arena.example.test",
        "ARENA_BIND": "127.0.0.1",
        "ARENA_BRIDGE_SECRET": SECRET,
        "ARENA_DATA_DIR": str(records),
        "PORT": "8766",
        "ARENA_MEMBERS_JSON": "existing-accounts-remain-untouched",
    }
    (tmp_path / "config.json").write_text(json.dumps(value), encoding="utf-8")
    return value


def test_existing_configuration_and_records_are_not_replaced(tmp_path, config):
    file = tmp_path / "config.json"
    before = file.read_bytes()
    old = tmp_path / "records/saved.json"
    old.write_text('{"existing": true}', encoding="utf-8")
    assert recover.load_config(tmp_path) == config
    assert file.read_bytes() == before
    assert old.read_bytes() == b'{"existing": true}'
    file.unlink()
    with pytest.raises(recover.RecoveryError, match="no accounts were created"):
        recover.load_config(tmp_path)
    assert not file.exists()


def test_missing_result_directory_fails_instead_of_starting_an_empty_store(tmp_path, config):
    (tmp_path / "records").rmdir()
    with pytest.raises(recover.RecoveryError, match="saved-results directory"):
        recover.load_config(tmp_path)
    assert not (tmp_path / "records").exists()


def test_signature_is_bound_to_exact_body_address_and_timestamp():
    body, headers = recover.signed_payload(
        SECRET, "https://first.trycloudflare.com", 1800000000, "a" * 32
    )
    expected = hmac.new(
        SECRET.encode(), f"POST\n/api/host/connection\n1800000000\n{body}".encode(), hashlib.sha256
    ).hexdigest()
    assert headers["X-Arena-Signature"] == expected
    assert SECRET not in body and SECRET not in json.dumps(headers)
    changed, other = recover.signed_payload(
        SECRET, "https://second.trycloudflare.com", 1800000000, "a" * 32
    )
    assert changed != body and other["X-Arena-Signature"] != expected
    for bad in (
        "https://evil.example",
        "http://first.trycloudflare.com",
        "https://first.trycloudflare.com/path",
        "https://first.trycloudflare.com?q=1",
    ):
        with pytest.raises(recover.RecoveryError):
            recover.signed_payload(SECRET, bad, 1800000000)


def test_registration_uses_server_time_and_never_sends_model_or_login_credentials(config):
    requests = []

    def respond(request):
        requests.append(request)
        assert request.url.path == "/api/host/connection"
        assert not request.headers.get("Authorization")
        assert not request.headers.get("Cookie")
        assert SECRET not in request.content.decode()
        if request.method == "GET":
            return httpx.Response(200, json={"supported": True, "server_time": 1800000000})
        assert request.headers["X-Arena-Time"] == "1800000000"
        assert set(json.loads(request.content)) == {"origin", "registration_id"}
        return httpx.Response(200, json={"registered": True, "expires_at": 1800000180})

    with httpx.Client(transport=httpx.MockTransport(respond)) as client:
        assert recover.register(client, config, "https://new.trycloudflare.com") == 1800000180
    assert len(requests) == 2


def test_website_check_distinguishes_public_only_from_live_evaluations():
    online = False

    def respond(request):
        assert request.method == "GET"
        if request.url.path == "/api/config":
            return httpx.Response(
                200, json={"access": {"online": online}, "settings": {"configured": True}}
            )
        assert request.url.path == "/api/study"
        return httpx.Response(200, json={"interviews": [None] * 24})

    with httpx.Client(transport=httpx.MockTransport(respond)) as client:
        with pytest.raises(recover.RecoveryError, match="reconnecting"):
            recover.website_check(client, "https://arena.example.test")
        online = True
        assert recover.website_check(client, "https://arena.example.test") == 24


@pytest.mark.skipif(os.name != "posix", reason="The double-click launcher targets macOS.")
def test_repeated_launches_share_one_supervisor_lock(tmp_path):
    assert not recover.is_running(tmp_path)
    with recover.instance_lock(tmp_path):
        assert recover.is_running(tmp_path)
    assert not recover.is_running(tmp_path)


def test_backend_already_running_is_reused_without_replacing_accounts(
    tmp_path, config, monkeypatch
):
    manager = recover.Supervisor(root=tmp_path, directory=tmp_path)
    manager.client.close()
    manager.client = httpx.Client(
        transport=httpx.MockTransport(
            lambda request: httpx.Response(200, json={"access": {"hosted": True}})
        )
    )
    monkeypatch.setattr(
        recover.subprocess, "Popen", lambda *a, **kw: pytest.fail("Existing backend was restarted.")
    )
    before = (tmp_path / "config.json").read_bytes()
    manager.ensure_backend()
    assert (tmp_path / "config.json").read_bytes() == before
    manager.client.close()


def test_tunnel_restart_reads_only_its_new_address(tmp_path, config, monkeypatch):
    binary = tmp_path / "bin/cloudflared"
    binary.parent.mkdir()
    binary.touch()
    manager = recover.Supervisor(root=tmp_path, directory=tmp_path)
    processes = []

    class Process:
        pid = 12345
        code = None

        def poll(self):
            return self.code

    def spawn(command, **kwargs):
        assert SECRET not in " ".join(command)
        process = Process()
        processes.append(process)
        address = "first" if len(processes) == 1 else "second"
        kwargs["stdout"].write(f"https://{address}.trycloudflare.com\n".encode())
        kwargs["stdout"].flush()
        return process

    monkeypatch.setattr(recover.subprocess, "Popen", spawn)
    manager.ensure_tunnel()
    assert manager.address == "https://first.trycloudflare.com"
    manager.ensure_tunnel()
    assert len(processes) == 1
    processes[0].code = 1
    manager.ensure_tunnel()
    assert manager.address == "https://second.trycloudflare.com"
    assert len(processes) == 2
    manager.client.close()
