"""Hosted entry point; reuse the local engine without exposing private write routes."""

from __future__ import annotations

import argparse
import hmac
import json
import os
import signal
import threading
import time
from http.cookies import SimpleCookie
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from engine import Settings
from public_access import (
    COOKIE_NAME,
    SESSION_SECONDS,
    check_password,
    members,
    origin,
    read_session,
    sign_session,
)
from public_presentation import display_data, display_text
from server import Application, Handler


class HostedServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(
        self,
        address,
        data_dir,
        public_origin,
        users,
        secret,
        settings=None,
        provider=None,
        bridge_secret=None,
    ):
        if not isinstance(secret, str) or len(secret) < 32:
            raise ValueError("Configure a session signing secret of at least 32 characters.")
        self.public_origin = origin(public_origin)
        self.users = members(users)
        self.secret = secret
        if bridge_secret is not None and len(bridge_secret) < 32:
            raise ValueError("Configure a bridge secret of at least 32 characters.")
        self.bridge_secret = bridge_secret
        self.attempts = {}
        self.access_lock = threading.Lock()
        settings = settings or Settings.load()
        directory = Path(data_dir)
        self.public_app = Application(directory / "public-empty", settings, provider)
        self.apps = {
            identifier: Application(directory / "members" / identifier, settings, provider)
            for identifier in self.users
        }
        # Preserve the existing single-job restriction across member accounts.
        job_lock = threading.Lock()
        for app in self.apps.values():
            app.job_lock = job_lock
        super().__init__(address, HostedHandler)


class HostedHandler(Handler):
    server_version = "AutoRubric/1.0"

    @property
    def member(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
            value = cookie[COOKIE_NAME].value if COOKIE_NAME in cookie else ""
            return read_session(value, self.server.secret, self.server.users)
        except Exception:
            return None

    @property
    def app(self):
        member = self.member
        return self.server.apps[member["id"]] if member else self.server.public_app

    def end_headers(self):
        if getattr(self, "session_cookie", None):
            self.send_header("Set-Cookie", self.session_cookie)
        self.send_header("X-Frame-Options", "DENY")
        if self.server.public_origin.startswith("https://"):
            self.send_header("Strict-Transport-Security", "max-age=31536000")
        super().end_headers()

    def send(self, status, body, content_type="application/json; charset=utf-8", filename=None):
        if urlparse(self.path).path == "/api/config" and isinstance(body, dict) and status == 200:
            member = self.member
            body = {
                **body,
                "access": {
                    "hosted": True,
                    "authenticated": bool(member),
                    "can_evaluate": bool(member and member["role"] in {"admin", "evaluator"}),
                    "can_review": bool(member),
                    "online": True,
                },
            }
        if isinstance(body, (dict, list)):
            body = display_data(body)
        elif isinstance(body, str):
            body = display_text(body)
        elif (
            isinstance(body, bytes)
            and urlparse(self.path).path.startswith("/api/")
            and (content_type.startswith(("text/", "application/json")))
        ):
            # Public downloads are display copies. Preserve original archives on disk.
            text = body.decode("utf-8")
            if content_type.startswith("application/json"):
                try:
                    text = json.dumps(display_data(json.loads(text)), ensure_ascii=False, indent=2)
                except ValueError:
                    text = display_text(text)
            else:
                text = display_text(text)
            body = text.encode("utf-8")
        super().send(status, body, content_type, filename)

    def set_session(self, token=""):
        cookie = SimpleCookie()
        cookie[COOKIE_NAME] = token
        cookie[COOKIE_NAME]["path"] = "/"
        cookie[COOKIE_NAME]["httponly"] = True
        cookie[COOKIE_NAME]["samesite"] = "Strict"
        cookie[COOKIE_NAME]["max-age"] = SESSION_SECONDS if token else 0
        if self.server.public_origin.startswith("https://"):
            cookie[COOKIE_NAME]["secure"] = True
        self.session_cookie = cookie[COOKIE_NAME].OutputString()

    def guarded(self, mutation=False):
        bridge = self.server.bridge_secret
        if bridge and not hmac.compare_digest(self.headers.get("X-Arena-Bridge", ""), bridge):
            raise PermissionError("Use the public website address.")
        expected_host = urlparse(self.server.public_origin).netloc
        if self.headers.get("Host", "").lower() != expected_host:
            raise PermissionError("Use the configured website address.")
        if mutation and self.headers.get("Origin") != self.server.public_origin:
            raise PermissionError("Use the website’s own sign-in and review forms.")
        path = urlparse(self.path).path
        if path in {"/api/access/login", "/api/access/logout"}:
            return
        member = self.member
        if mutation and not member:
            raise PermissionError("Sign in to generate, score or save a review.")
        if mutation and path.startswith("/api/runs"):
            is_review = path.endswith("/review")
            if not is_review and member["role"] not in {"admin", "evaluator"}:
                raise PermissionError(
                    "This account can review; evaluation access is required to run models."
                )
        if not mutation and path.startswith("/api/runs/") and not member:
            raise PermissionError("Sign in to view your saved evaluations.")

    def body(self):
        body = super().body()
        path = urlparse(self.path).path
        if self.member and (
            path.startswith(("/api/review/", "/api/requirements/")) or path.endswith("/review")
        ):
            body["reviewer"] = self.member["id"]
        return body

    def dispatch(self, mutation):
        path = urlparse(self.path).path
        if path == "/healthz" and not mutation:
            return self.send(200, {"ok": True})
        if path in {"/api/access/login", "/api/access/logout"}:
            try:
                self.guarded(mutation)
                if not mutation:
                    return self.send(405, {"error": "Use POST."})
                body = self.body()
                if path.endswith("logout"):
                    self.set_session()
                    return self.send(200, {"signed_in": False})
                identifier = body.get("id", "")
                password = body.get("password", "")
                if not isinstance(identifier, str) or not isinstance(password, str):
                    raise ValueError("Enter an account ID and access password.")
                if len(identifier) > 40 or len(password) > 256:
                    raise ValueError("Invalid sign-in details.")
                with self.server.access_lock:
                    now = time.time()
                    self.server.attempts = {
                        k: times
                        for k, times in self.server.attempts.items()
                        if times[-1] > now - 300
                    }
                    recent = self.server.attempts.get(identifier, [])
                    if len(recent) >= 5:
                        return self.send(
                            429, {"error": "Too many sign-in attempts. Try again in five minutes."}
                        )
                    if len(self.server.attempts) >= 1000:
                        return self.send(429, {"error": "Sign-in is busy. Try again shortly."})
                    self.server.attempts[identifier] = [*recent, now]
                member = self.server.users.get(identifier)
                if not member or not check_password(password, member["password_hash"]):
                    return self.send(
                        403, {"error": "Sign-in failed. Check your account ID and access password."}
                    )
                with self.server.access_lock:
                    self.server.attempts.pop(identifier, None)
                self.set_session(sign_session(member, self.server.secret))
                return self.send(200, {"signed_in": True})
            except (ValueError, PermissionError) as exc:
                return self.send(403, {"error": str(exc)})
        return super().dispatch(mutation)


def main():
    os.umask(0o077)
    parser = argparse.ArgumentParser(description="Run the restricted website backend.")
    parser.add_argument("--config", type=Path)
    args = parser.parse_args()
    if args.config:
        config = json.loads(args.config.read_text(encoding="utf-8"))
        for key, value in config.items():
            if not key.startswith("ARENA_") and key != "PORT":
                raise ValueError("Unexpected hosted configuration key.")
            os.environ[key] = str(value)
    port = int(os.getenv("PORT", "10000"))
    public_origin = os.getenv("ARENA_PUBLIC_ORIGIN")
    if not public_origin and os.getenv("RENDER_EXTERNAL_HOSTNAME"):
        public_origin = "https://" + os.environ["RENDER_EXTERNAL_HOSTNAME"]
    server = HostedServer(
        (os.getenv("ARENA_BIND", "127.0.0.1"), port),
        os.getenv("ARENA_DATA_DIR", "/var/data/arena"),
        public_origin or "",
        os.getenv("ARENA_MEMBERS_JSON", ""),
        os.getenv("ARENA_SESSION_SECRET", ""),
        bridge_secret=os.getenv("ARENA_BRIDGE_SECRET") or None,
    )

    def stop(*_):
        for app in server.apps.values():
            app.stop.set()
        threading.Thread(target=server.shutdown, daemon=True).start()

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    print(
        "AutoRubric hosted server: public study, member-only evaluations and reviews.", flush=True
    )
    try:
        server.serve_forever()
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
