"""Restore the existing local backend and its signed, short-lived Site connection."""

from __future__ import annotations

import argparse
import contextlib
import hashlib
import hmac
import json
import os
import re
import signal
import socket
import subprocess
import sys
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse

import httpx

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = ROOT / "arena/.data/public-access"
CONNECTION_PATH = "/api/host/connection"


class RecoveryError(Exception):
    pass


def load_config(directory=PRIVATE):
    try:
        config = json.loads((directory / "config.json").read_text(encoding="utf-8"))
        site = urlparse(config["ARENA_PUBLIC_ORIGIN"])
        if site.scheme != "https" or not site.hostname or site.path or site.query or site.fragment:
            raise ValueError()
        if site.username or site.password or site.port:
            raise ValueError()
        if config.get("ARENA_BIND") != "127.0.0.1":
            raise ValueError()
        if len(config["ARENA_BRIDGE_SECRET"]) < 32:
            raise ValueError()
        if not Path(config["ARENA_DATA_DIR"]).is_dir():
            raise RecoveryError("The saved-results directory is missing. Check its existing path.")
        return config
    except (OSError, ValueError, KeyError, TypeError) as exc:
        raise RecoveryError(
            "Existing private configuration is missing or invalid; no accounts were created."
        ) from exc


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.chmod(temporary, 0o600)
    temporary.replace(path)


def read_status(directory=PRIVATE):
    try:
        return json.loads((directory / "recovery-status.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def signed_payload(secret, address, stamp, registration_id=None):
    parsed = urlparse(address)
    if not (
        parsed.scheme == "https"
        and re.fullmatch(r"[a-z0-9-]+\.trycloudflare\.com", parsed.hostname or "")
        and parsed.path in {"", "/"}
        and not any((parsed.username, parsed.password, parsed.port, parsed.query, parsed.fragment))
    ):
        raise RecoveryError("Unexpected tunnel address.")
    body = json.dumps(
        {"origin": address.rstrip("/"), "registration_id": registration_id or uuid.uuid4().hex},
        sort_keys=True,
        separators=(",", ":"),
    )
    message = f"POST\n{CONNECTION_PATH}\n{stamp}\n{body}"
    signature = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()
    return body, {
        "X-Arena-Time": str(stamp),
        "X-Arena-Signature": signature,
        "Content-Type": "application/json",
    }


def register(client, config, address):
    url = config["ARENA_PUBLIC_ORIGIN"] + CONNECTION_PATH
    response = client.get(url)
    if response.status_code != 200:
        raise RecoveryError(
            "The public recovery endpoint is not ready. Retrying in the background."
        )
    try:
        stamp = int(response.json()["server_time"])
    except (ValueError, KeyError, TypeError) as exc:
        raise RecoveryError("The website returned an unexpected recovery response.") from exc
    body, headers = signed_payload(config["ARENA_BRIDGE_SECRET"], address, stamp)
    response = client.post(url, content=body.encode(), headers=headers)
    if response.status_code != 200 or not response.json().get("registered"):
        raise RecoveryError(f"Connection registration is not ready (HTTP {response.status_code}).")
    return response.json()["expires_at"]


def website_check(client, site):
    response = client.get(site + "/api/config")
    if response.status_code != 200:
        raise RecoveryError("The public website is not responding yet.")
    data = response.json()
    if not data.get("access", {}).get("online"):
        raise RecoveryError(
            "Public browsing works, but the evaluation backend is still reconnecting."
        )
    if not data.get("settings", {}).get("configured"):
        raise RecoveryError(
            "The backend is online, but its existing model API configuration is missing."
        )
    study = client.get(site + "/api/study")
    if study.status_code != 200:
        raise RecoveryError("The saved public study is not responding yet.")
    return len(study.json().get("interviews", []))


@contextlib.contextmanager
def instance_lock(directory=PRIVATE, blocking=False):
    if os.name != "posix":
        raise RecoveryError("This one-click launcher is for macOS.")
    import fcntl

    directory.mkdir(parents=True, exist_ok=True)
    with (directory / "recovery.lock").open("a+") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | (0 if blocking else fcntl.LOCK_NB))
        except BlockingIOError as exc:
            raise RecoveryError("Recovery is already running.") from exc
        try:
            yield
        finally:
            fcntl.flock(lock, fcntl.LOCK_UN)


def is_running(directory=PRIVATE):
    try:
        with instance_lock(directory):
            return False
    except RecoveryError:
        return True


class Supervisor:
    def __init__(self, root=ROOT, directory=PRIVATE):
        self.root, self.directory = root, directory
        self.config = load_config(directory)
        self.site = self.config["ARENA_PUBLIC_ORIGIN"]
        self.port = int(self.config["PORT"])
        self.backend = None
        self.tunnel = None
        self.address = None
        self.stop = False
        self.tunnel_log = directory / "tunnel-recovery.log"
        self.log_offset = 0
        self.next_registration = 0
        self.client = httpx.Client(timeout=12, follow_redirects=False, trust_env=False)

    def state(self, phase, message, **extra):
        write_json(
            self.directory / "recovery-status.json",
            {
                "phase": phase,
                "message": message,
                "website": self.site,
                "updated_at": time.time(),
                "supervisor_pid": os.getpid(),
                **extra,
            },
        )

    def ensure_backend(self):
        url = f"http://127.0.0.1:{self.port}"
        headers = {
            "Host": urlparse(self.site).netloc,
            "X-Arena-Bridge": self.config["ARENA_BRIDGE_SECRET"],
        }
        try:
            response = self.client.get(url + "/api/config", headers=headers, timeout=2)
            if response.status_code == 200 and response.json().get("access", {}).get("hosted"):
                return
            raise RecoveryError(
                "The backend port belongs to another configuration; it was not stopped."
            )
        except (httpx.ConnectError, httpx.ConnectTimeout):
            pass
        if self.backend and self.backend.poll() is None:
            raise RecoveryError("The backend is starting.")
        with socket.socket() as sock:
            if sock.connect_ex(("127.0.0.1", self.port)) == 0:
                raise RecoveryError("The backend port is occupied; no other process was stopped.")
        with (self.directory / "backend-recovery.log").open("ab") as log:
            self.backend = subprocess.Popen(
                [
                    sys.executable,
                    str(self.root / "arena/public_server.py"),
                    "--config",
                    str(self.directory / "config.json"),
                ],
                cwd=self.root,
                stdout=log,
                stderr=subprocess.STDOUT,
                start_new_session=True,
            )
        write_json(self.directory / "backend-process.json", {"pid": self.backend.pid})
        raise RecoveryError(
            "Starting the existing protected backend; accounts and results are unchanged."
        )

    def ensure_tunnel(self):
        if not self.tunnel or self.tunnel.poll() is not None:
            binary = self.directory / "bin/cloudflared"
            if not binary.is_file():
                raise RecoveryError(
                    "The local cloudflared client is missing; no configuration was replaced."
                )
            self.address = None
            self.log_offset = self.tunnel_log.stat().st_size if self.tunnel_log.exists() else 0
            with self.tunnel_log.open("ab") as log:
                self.tunnel = subprocess.Popen(
                    [
                        str(binary),
                        "tunnel",
                        "--no-autoupdate",
                        "--url",
                        f"http://127.0.0.1:{self.port}",
                        "--http-host-header",
                        urlparse(self.site).netloc,
                        "--metrics",
                        "127.0.0.1:0",
                        "--loglevel",
                        "info",
                    ],
                    cwd=self.root,
                    stdout=log,
                    stderr=subprocess.STDOUT,
                    start_new_session=True,
                )
            write_json(self.directory / "tunnel-process.json", {"pid": self.tunnel.pid})
        if not self.address:
            with self.tunnel_log.open("rb") as log:
                log.seek(self.log_offset)
                text = log.read(100000).decode("utf-8", errors="replace")
            urls = re.findall(r"https://[a-z0-9-]+\.trycloudflare\.com", text)
            if not urls:
                raise RecoveryError("Connecting the tunnel; waiting for its new address.")
            self.address = urls[-1]
            self.next_registration = 0

    def serve(self):
        with instance_lock(self.directory):
            os.umask(0o077)
            self.state("starting", "Restoring AutoRubric.")
            signal.signal(signal.SIGTERM, lambda *_: setattr(self, "stop", True))
            signal.signal(signal.SIGINT, lambda *_: setattr(self, "stop", True))
            try:
                while not self.stop:
                    try:
                        self.ensure_backend()
                        self.ensure_tunnel()
                        if time.monotonic() >= self.next_registration:
                            expires = register(self.client, self.config, self.address)
                            count = website_check(self.client, self.site)
                            self.state(
                                "online",
                                "Website and protected evaluations are online.",
                                connection_expires_at=expires,
                                public_interviews=count,
                            )
                            self.next_registration = time.monotonic() + 60
                        time.sleep(2)
                    except (RecoveryError, httpx.HTTPError, ValueError, OSError) as exc:
                        message = (
                            str(exc)
                            if isinstance(exc, RecoveryError)
                            else "Connection interrupted; retrying safely."
                        )
                        self.state("recovering", message)
                        time.sleep(5)
            finally:
                if self.tunnel and self.tunnel.poll() is None:
                    self.tunnel.terminate()
                    try:
                        self.tunnel.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        self.tunnel.kill()
                self.client.close()
                self.state(
                    "stopped", "Recovery stopped. Existing accounts and results are retained."
                )


def start(timeout=120):
    os.umask(0o077)
    config = load_config()
    if not is_running():
        with (PRIVATE / "recovery.log").open("ab") as log:
            subprocess.Popen(
                [sys.executable, str(Path(__file__).resolve()), "--serve"],
                cwd=ROOT,
                stdout=log,
                stderr=subprocess.STDOUT,
                start_new_session=True,
            )
    print("Restoring AutoRubric. Existing accounts and results will be retained.", flush=True)
    deadline = time.monotonic() + timeout
    previous = None
    with httpx.Client(timeout=15, follow_redirects=False, trust_env=False) as client:
        while time.monotonic() < deadline:
            state = read_status()
            message = state.get("message", "Starting the recovery service...")
            if message != previous:
                print(message, flush=True)
                previous = message
            if state.get("phase") == "online" and time.time() - state.get("updated_at", 0) < 100:
                try:
                    website_check(client, config["ARENA_PUBLIC_ORIGIN"])
                    print("\nREADY: " + config["ARENA_PUBLIC_ORIGIN"], flush=True)
                    print(
                        "You can close this window. Recovery continues in the background.",
                        flush=True,
                    )
                    return 0
                except (RecoveryError, httpx.HTTPError, ValueError):
                    pass
            time.sleep(2)
    print(
        "Recovery is still retrying in the background. "
        "Check the internet connection and run this launcher again.",
        flush=True,
    )
    return 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--serve", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--status", action="store_true")
    args = parser.parse_args()
    try:
        if args.serve:
            Supervisor().serve()
            return 0
        if args.status:
            config = load_config()
            with httpx.Client(timeout=15, trust_env=False) as client:
                count = website_check(client, config["ARENA_PUBLIC_ORIGIN"])
            print(f"ONLINE: {config['ARENA_PUBLIC_ORIGIN']} ({count} public interviews)")
            return 0
        return start()
    except (RecoveryError, httpx.HTTPError, ValueError, OSError) as exc:
        print(
            str(exc)
            if isinstance(exc, RecoveryError)
            else "Recovery could not finish. Existing data was not changed.",
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
