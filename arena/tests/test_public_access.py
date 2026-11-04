"""Test hosted authorisation without calling a model or changing saved study files."""

# ruff: noqa: E402 -- Standalone application modules.

import hashlib
import hmac
import json
import sys
import threading
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import evidence
from engine import Settings
from public_access import check_password, members, origin, password_hash, read_session, sign_session
from public_server import HostedServer

TEST_PASSWORD = "test-only-access-password-not-a-real-account"
TEST_SECRET = "test-only-session-secret-not-a-deployment-secret"


@pytest.fixture(scope="module")
def accounts():
    encoded = password_hash(TEST_PASSWORD)
    return json.dumps(
        [
            {"id": "R01", "role": "admin", "password_hash": encoded},
            {"id": "R02", "role": "reviewer", "password_hash": encoded},
        ]
    )


@pytest.fixture
def hosted(tmp_path, accounts):
    server = HostedServer(
        ("127.0.0.1", 0),
        tmp_path,
        "http://127.0.0.1:0",
        accounts,
        TEST_SECRET,
        Settings("", "https://offline.invalid/v1"),
        object(),
    )
    server.public_origin = f"http://127.0.0.1:{server.server_port}"
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    with httpx.Client(
        base_url=server.public_origin, headers={"Origin": server.public_origin}
    ) as client:
        yield server, client
    server.shutdown()
    server.server_close()
    thread.join(2)


def login(client, identifier="R01"):
    response = client.post("/api/access/login", json={"id": identifier, "password": TEST_PASSWORD})
    assert response.status_code == 200
    return response


def test_password_and_sessions_reject_forgery_expiry_and_password_rotation(accounts):
    users = members(accounts)
    assert check_password(TEST_PASSWORD, users["R01"]["password_hash"])
    assert not check_password("incorrect", users["R01"]["password_hash"])
    token = sign_session(users["R01"], TEST_SECRET, now=100)
    assert read_session(token, TEST_SECRET, users, now=101)["id"] == "R01"
    assert read_session(token + "x", TEST_SECRET, users, now=101) is None
    assert read_session(token, TEST_SECRET, users, now=100000) is None
    users["R01"]["password_hash"] = password_hash("a-different-test-only-password")
    assert read_session(token, TEST_SECRET, users, now=101) is None


def test_hosted_configuration_fails_closed(accounts, tmp_path):
    with pytest.raises(ValueError):
        origin("http://public.example")
    with pytest.raises(ValueError):
        origin("https://user:password@example.test")
    with pytest.raises(ValueError):
        members('[{"id":"../../private","role":"admin","password_hash":"plaintext"}]')
    with pytest.raises(ValueError):
        HostedServer(("127.0.0.1", 0), tmp_path, "https://example.test", accounts, "")


def test_public_browsing_has_no_private_runs_and_cannot_write(hosted):
    server, client = hosted
    assert client.get("/healthz").json() == {"ok": True}
    config = client.get("/api/config").json()
    assert config["access"] == {
        "hosted": True,
        "authenticated": False,
        "can_evaluate": False,
        "can_review": False,
        "can_manage_rubric": False,
        "online": True,
    }
    assert "api_key" not in config["settings"]
    assert config["active_run"] is None
    assert client.get("/api/runs").json() == []
    assert len(client.get("/api/study").json()["interviews"]) == 24
    assert client.post("/api/runs", json={"action": "generate"}).status_code == 403
    assert client.get("/api/runs/" + "a" * 32).status_code == 403
    assert client.get("/api/config", headers={"Host": "wrong.example"}).status_code == 403
    assert not server.public_app.list_runs()


def test_comparison_is_public_read_only_and_invalid_cases_do_not_escape(hosted):
    _, client = hosted
    data = client.get("/api/comparison").json()
    assert data["case_count"] == 78
    assert len(data["models"]) == 5
    response = client.get("/api/comparison/cases/N01")
    assert response.status_code == 200
    assert response.json()["id"] == "N01"
    assert len(response.json()["models"]) == 6
    bmj = client.get("/api/comparison/cases/B22")
    assert bmj.status_code == 200
    assert bmj.json()["mode"] == "written-record"
    assert bmj.json()["clinical_status"] == "awaiting confirmation"
    for identifier in ("J01", "JA10", "SR01", "SR10"):
        response = client.get("/api/comparison/cases/" + identifier)
        assert response.status_code == 200
        assert len(response.json()["models"]) == 6
        assert response.json()["requirements_status"] == "awaiting confirmation"
    assert client.post("/api/comparison", json={"score": 5}).status_code == 403
    assert client.get("/api/comparison/cases/CAND99").status_code != 200
    assert client.get("/api/comparison/cases/B23").status_code != 200


@pytest.mark.parametrize("identifier", ["R01", "R02"])
def test_zero_shot_comparison_requires_a_valid_existing_session(
    hosted, monkeypatch, tmp_path, identifier
):
    import public_server

    packet = {"case_count": 78, "rows": [{"id": f"CHECK{i}"} for i in range(78)]}
    saved = tmp_path / "comparison.json"
    saved.write_text(json.dumps(packet))
    monkeypatch.setattr(public_server, "RESULT_COMPARISON_PATH", saved)
    _, client = hosted
    assert client.get("/api/result-comparison").status_code == 401
    assert (
        client.get("/api/result-comparison", headers={"Cookie": "arena_session=forged"}).status_code
        == 401
    )
    login(client, identifier)
    response = client.get("/api/result-comparison")
    assert response.status_code == 200 and response.json() == packet
    assert response.headers["Cache-Control"] == "no-store"
    assert client.post("/api/result-comparison", json={}).status_code == 405
    assert client.post("/api/access/logout", json={}).status_code == 200
    assert client.get("/api/result-comparison").status_code == 401


def test_zero_shot_comparison_missing_packet_does_not_expose_details(hosted, monkeypatch, tmp_path):
    import public_server

    monkeypatch.setattr(public_server, "RESULT_COMPARISON_PATH", tmp_path / "missing.json")
    _, client = hosted
    assert client.get("/api/result-comparison").status_code == 401
    login(client)
    response = client.get("/api/result-comparison")
    assert response.status_code == 503
    assert str(tmp_path) not in response.text
    assert client.get("/api/comparison/cases/JA03").status_code != 200
    assert client.get("/api/comparison/cases/J05").status_code != 200
    assert client.get("/api/comparison/cases/SR11").status_code != 200


def test_bridge_requires_the_private_shared_header(hosted):
    server, client = hosted
    server.bridge_secret = "test-only-bridge-secret-not-a-deployment-secret"
    assert client.get("/api/config").status_code == 403
    response = client.get("/api/config", headers={"X-Arena-Bridge": server.bridge_secret})
    assert response.status_code == 200
    assert response.json()["rubric_version"]["id"] == "original"
    assert "Josh" not in response.text
    assert client.get("/healthz").json() == {"ok": True}


def test_recovery_probe_proves_the_backend_without_transmitting_its_secret(hosted):
    server, client = hosted
    server.bridge_secret = "test-only-probe-key-not-a-deployment-secret"
    nonce = "c" * 32
    response = client.get("/healthz?probe_nonce=" + nonce)
    assert response.status_code == 200
    expected = hmac.new(
        server.bridge_secret.encode(), ("AutoRubric probe\n" + nonce).encode(), hashlib.sha256
    ).hexdigest()
    assert response.json()["proof"] == expected
    assert server.bridge_secret not in response.text
    assert client.get("/healthz?probe_nonce=bad").status_code == 400


def test_origin_check_cookie_flags_and_logout(hosted):
    _, client = hosted
    assert (
        client.post(
            "/api/access/login",
            json={"id": "R01", "password": TEST_PASSWORD},
            headers={"Origin": "https://other.example"},
        ).status_code
        == 403
    )
    response = login(client)
    cookie = response.headers["set-cookie"]
    assert "HttpOnly" in cookie and "SameSite=Strict" in cookie and "Max-Age=28800" in cookie
    assert client.get("/api/config").json()["access"]["can_evaluate"] is True
    assert client.post("/api/access/logout", json={}).status_code == 200
    assert client.get("/api/config").json()["access"]["authenticated"] is False


def test_reviewer_cannot_start_or_stop_model_jobs(hosted):
    _, client = hosted
    login(client, "R02")
    assert client.get("/api/config").json()["access"]["can_review"] is True
    assert client.get("/api/config").json()["access"]["can_evaluate"] is False
    assert client.post("/api/runs", json={"action": "generate"}).status_code == 403
    assert client.post("/api/runs/" + "a" * 32 + "/stop", json={}).status_code == 403


def test_member_review_is_attributed_by_id_and_isolated_from_other_members(hosted):
    _, client = hosted
    identifier = evidence.followup_packet("n04-fresh-arc-lite")["id"]
    login(client, "R02")
    result = client.post(
        f"/api/review/{identifier}/rating",
        json={
            "reviewer": "An impersonated personal name",
            "items": {
                "D3a": {"score": "Indeterminate", "note": "Authorisation test, no clinical rating."}
            },
        },
    )
    assert result.status_code == 200
    assert result.json()["reviewer"] == "R02"
    assert client.get(f"/api/review/{identifier}/D5c").status_code == 200
    client.post("/api/access/logout", json={})
    login(client, "R01")
    assert client.get(f"/api/review/{identifier}").json()["review"] is None
    assert client.get(f"/api/review/{identifier}/D5c").status_code == 400


def test_new_private_runs_are_not_visible_in_public_or_other_accounts(hosted):
    server, client = hosted
    run_id = "b" * 32
    server.apps["R01"].save(
        {
            "id": run_id,
            "status": "complete",
            "input": {"title": "Private example", "criteria": []},
            "grades": {},
            "created_at": "2026-10-26",
        }
    )
    assert client.get("/api/runs").json() == []
    login(client, "R02")
    assert client.get("/api/runs").json() == []
    login(client, "R01")
    assert client.get("/api/runs").json()[0]["title"] == "Private example"
    assert server.apps["R01"].job_lock is server.apps["R02"].job_lock


def test_login_attempts_are_limited(hosted):
    _, client = hosted
    for _ in range(5):
        assert (
            client.post(
                "/api/access/login", json={"id": "R01", "password": "incorrect"}
            ).status_code
            == 403
        )
    assert (
        client.post("/api/access/login", json={"id": "R01", "password": TEST_PASSWORD}).status_code
        == 429
    )


def test_shared_admin_retains_a_declared_reviewer_id(tmp_path, accounts):
    original = json.loads(accounts)[0]
    users = json.dumps([{**original, "id": "workspace", "role": "admin"}])
    server = HostedServer(
        ("127.0.0.1", 0),
        tmp_path,
        "http://127.0.0.1:0",
        users,
        TEST_SECRET,
        Settings("", "https://offline.invalid/v1"),
        object(),
    )
    server.public_origin = f"http://127.0.0.1:{server.server_port}"
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with httpx.Client(
            base_url=server.public_origin, headers={"Origin": server.public_origin}
        ) as client:
            assert (
                client.post(
                    "/api/access/login", json={"id": "R02", "password": TEST_PASSWORD}
                ).status_code
                == 403
            )
            assert (
                client.post(
                    "/api/access/login", json={"id": "workspace", "password": TEST_PASSWORD}
                ).status_code
                == 200
            )
            access = client.get("/api/config").json()["access"]
            assert access["can_evaluate"] and access["can_review"]
            identifier = evidence.followup_packet("n04-fresh-arc-lite")["id"]
            response = client.post(
                f"/api/review/{identifier}/rating",
                json={
                    "reviewer": "CLINICIAN_A",
                    "items": {
                        "D3a": {
                            "score": "Indeterminate",
                            "note": "Authorisation fixture, not a clinical rating.",
                        }
                    },
                },
            )
            assert response.status_code == 200
            assert response.json()["reviewer"] == "workspace/CLINICIAN_A"
            assert len(list((tmp_path / "members/workspace/_reviews").glob("*.json"))) == 1
    finally:
        server.shutdown()
        server.server_close()
        thread.join(2)
