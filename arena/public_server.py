"""Hosted entry point; reuse the local engine without exposing private write routes."""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
import signal
import threading
import time
from http.cookies import SimpleCookie
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from engine import Settings
from job_queue import JobQueue
from membership import Membership
from personal_connections import Connections, PROVIDERS
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

RESULT_COMPARISON_PATH = Path(__file__).resolve().parent / ".data/result-comparison.json"


class HostedServer(ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 64
    max_request_threads = 64
    request_timeout = 30

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
        seeds = members(users)
        self.secret = secret
        if bridge_secret is not None and len(bridge_secret) < 32:
            raise ValueError("Configure a bridge secret of at least 32 characters.")
        self.bridge_secret = bridge_secret
        self.request_slots = threading.BoundedSemaphore(self.max_request_threads)
        self.attempts = {}
        self.access_lock = threading.Lock()
        settings = settings or Settings.load()
        directory = Path(data_dir)
        self.directory = directory
        self.member_lock = threading.RLock()
        self.membership = Membership(directory / "_identity/members.sqlite3", seeds)
        self.users = self.membership.users()
        self.connections = Connections(directory / "_identity/api")
        self.queue = JobQueue(directory / "_jobs.sqlite3", workers=os.getenv("ARENA_JOB_WORKERS", "2"))
        self.project_settings = settings
        self.project_provider = provider
        self.public_app = Application(directory / "public-empty", settings, provider, self.queue)
        self.workspaces = {}
        self.apps = {}
        self.extraction_lock = threading.Lock()
        self.refresh_members()
        super().__init__(address, HostedHandler)

    def get_request(self):
        request, address = super().get_request()
        request.settimeout(self.request_timeout)
        return request, address

    def process_request(self, request, client_address):
        # A blocked database or slow client must not exhaust all OS threads.
        if not self.request_slots.acquire(blocking=False):
            try:
                request.sendall(
                    b"HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n"
                    b"Retry-After: 5\r\nContent-Length: 0\r\n\r\n"
                )
            except OSError:
                pass
            self.shutdown_request(request)
            return
        try:
            super().process_request(request, client_address)
        except BaseException:
            self.request_slots.release()
            raise

    def process_request_thread(self, request, client_address):
        try:
            super().process_request_thread(request, client_address)
        finally:
            self.request_slots.release()

    def refresh_members(self):
        with self.member_lock:
            self.users = self.membership.users()
            for identifier, member in self.users.items():
                space = member.get("workspace", identifier)
                if space not in self.workspaces:
                    app = Application(self.directory / "members" / space, self.project_settings,
                                      self.project_provider, self.queue, self.connections,
                                      lambda actor: self.membership.users().get(actor))
                    app.job_lock = self.extraction_lock
                    app.member_resolver = lambda actor: self.membership.users().get(actor)
                    self.workspaces[space] = app
                self.apps[identifier] = self.workspaces[space]

    def server_close(self):
        for app in self.workspaces.values():
            app.batches.close()
        self.public_app.batches.close()
        self.queue.close()
        super().server_close()


class HostedHandler(Handler):
    server_version = "AutoRubric/1.0"

    @property
    def member(self):
        self.server.refresh_members()
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
        if member:
            app = self.server.apps[member["id"]]
            app._local.reviewer = member["id"]
            return app
        return self.server.public_app

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
            own_active = None
            if member:
                for row in self.app.queue.pending(self.app.queue_space):
                    job = self.app.queue.latest(self.app.queue_space,row["run_id"])
                    if job and job["actor"] == member["id"]:
                        own_active = row["run_id"]
                        break
            body = {
                **body,
                "active_run":own_active,
                "access": {
                    "hosted": True,
                    "authenticated": bool(member),
                    "can_evaluate": bool(member and member["role"] in {"admin", "evaluator"}),
                    "can_review": bool(member),
                    "can_manage_rubric": bool(member and member["role"] == "admin"),
                    "online": True,
                    "member_id": member["id"] if member else "",
                    "role": member["role"] if member else "",
                    "personal_connections": bool(member),
                    "durable_queue": True,
                },
            }
        # Source intervals address immutable text. Presentation substitutions must
        # never rewrite article quotations or extraction records.
        if urlparse(self.path).path.startswith(("/api/literature", "/api/evidence-annotations")):
            return super().send(status, body, content_type, filename)
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
        if path in {"/api/access/login", "/api/access/logout", "/api/access/accept-invite"}:
            return
        member = self.member
        if path.startswith("/api/evidence-annotations") and not member:
            raise PermissionError("Sign in to view or save workspace evidence notes.")
        if path.startswith("/api/literature"):
            if not member:
                raise PermissionError("Sign in to read article sources or extraction drafts.")
            if mutation and member["role"] not in {"admin", "evaluator"}:
                raise PermissionError(
                    "Evaluation access is required to extract or confirm article cases."
                )
        if mutation and not member:
            raise PermissionError("Sign in to generate, score or save a review.")
        if path in {"/api/rubrics/manage", "/api/decisions"} or (
            mutation and path.startswith("/api/requirements/")
        ):
            if not member or member["role"] != "admin":
                raise PermissionError(
                    "Higher-level decision access is required "
                    "to change rubric rules or confirm requirements."
                )
        if mutation and (path.startswith(("/api/runs", "/api/batches")) or path == "/api/cases/submitted"):
            is_review = path.endswith("/review")
            if not is_review and member["role"] not in {"admin", "evaluator"}:
                raise PermissionError(
                    "This account can review; evaluation access is required to run models."
                )
        if not mutation and path.startswith(("/api/runs/", "/api/batches")) and not member:
            raise PermissionError("Sign in to view your saved evaluations.")

    def body(self):
        body = super().body()
        path = urlparse(self.path).path
        if isinstance(body.get("case_submission"), dict):
            body["case_submission"]["account_id"] = self.member["id"] if self.member else ""
            if self.member and self.member["id"] != "workspace":
                body["case_submission"]["contributor_id"] = self.member["id"]
        if self.member and (
            path.startswith(("/api/review/", "/api/requirements/")) or path.endswith("/review")
        ):
            identifier = self.member["id"]
            if identifier == "workspace":
                declared = body.get("reviewer", "")
                if not isinstance(declared, str):
                    raise ValueError("Enter a short reviewer ID.")
                declared = declared.removeprefix("workspace/").strip()
                if declared and not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,79}", declared):
                    raise ValueError(
                        "Use a reviewer ID with letters, digits, dots, underscores or hyphens."
                    )
                body["reviewer"] = f"workspace/{declared}" if declared else identifier
            else:
                body["reviewer"] = identifier
        return body

    def dispatch(self, mutation):
        path = urlparse(self.path).path
        if path == "/api/access/accept-invite":
            try:
                self.guarded(mutation)
                if not mutation:
                    return self.send(405, {"error":"Use POST."})
                body = self.body()
                member = self.server.membership.accept(body.get("token"), body.get("password"))
                self.server.refresh_members()
                self.set_session(sign_session(member, self.server.secret))
                return self.send(201, {"signed_in":True, "member_id":member["id"], "role":member["role"]})
            except (ValueError, PermissionError) as exc:
                return self.send(403, {"error":str(exc)})
        if path.startswith("/api/members") or path.startswith("/api/connections"):
            try:
                self.guarded(mutation)
                member = self.member
                if not member:
                    raise PermissionError("Sign in to manage your account connections.")
                if path.startswith("/api/members"):
                    if member["role"] != "admin":
                        raise PermissionError("Administrator access is required to manage invitations.")
                    if path == "/api/members" and not mutation:
                        return self.send(200, self.server.membership.catalogue())
                    if path == "/api/members/invitations" and mutation:
                        body = self.body()
                        return self.send(201, self.server.membership.invite(member["id"], body.get("member_id"), body.get("role", "reviewer")))
                member_action = re.fullmatch(r"/api/members/([A-Za-z0-9_-]{1,40})/(update|reset-invite)",path)
                if member_action and mutation:
                    body = self.body()
                    if member_action[2] == "reset-invite":
                        return self.send(201,self.server.membership.invite(member["id"],member_action[1],reset=True))
                    result = self.server.membership.update(member["id"],member_action[1],body)
                    self.server.refresh_members()
                    return self.send(200,result)
                if path == "/api/connections":
                    if mutation:
                        return self.send(201, self.server.connections.add(member["id"], self.body()))
                    return self.send(200, {"connections":self.server.connections.list(member["id"]), "providers":PROVIDERS})
                match = re.fullmatch(r"/api/connections/([a-f0-9]{32})/(test|remove)", path)
                if match and mutation:
                    if match[2] == "remove":
                        self.server.connections.remove(member["id"], match[1])
                        return self.send(200, {"removed":True})
                    return self.send(200, self.server.connections.test(member["id"], match[1], self.server.project_settings))
                return self.send(404, {"error":"Account operation not found."})
            except PermissionError as exc:
                return self.send(403, {"error":str(exc)})
            except ValueError as exc:
                return self.send(400, {"error":str(exc)})
        if path == "/api/result-comparison":
            try:
                self.guarded(mutation)
                if mutation:
                    return self.send(405, {"error": "Use GET."})
                if not self.member:
                    return self.send(
                        401,
                        {"error": "Sign in with your workspace account to view this comparison."},
                    )
                data = json.loads(RESULT_COMPARISON_PATH.read_text(encoding="utf-8"))
                if data.get("case_count") != 78 or len(data.get("rows", [])) != 78:
                    raise ValueError("The saved comparison is incomplete.")
                return self.send(200, data)
            except PermissionError as exc:
                return self.send(403, {"error": str(exc)})
            except (OSError, ValueError):
                return self.send(
                    503, {"error": "The saved comparison is unavailable. Please try again later."}
                )
        if path == "/healthz" and not mutation:
            nonce = parse_qs(urlparse(self.path).query).get("probe_nonce", [""])[0]
            if nonce:
                if not re.fullmatch(r"[a-f0-9]{32}", nonce) or not self.server.bridge_secret:
                    return self.send(400, {"error": "Invalid recovery probe."})
                proof = hmac.new(
                    self.server.bridge_secret.encode(),
                    ("AutoRubric probe\n" + nonce).encode(),
                    hashlib.sha256,
                ).hexdigest()
                return self.send(200, {"ok": True, "proof": proof})
            return self.send(200, {"ok": True})
        if path in {"/api/access/login", "/api/access/logout", "/api/access/accept-invite"}:
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
                return self.send(200, {"signed_in": True, "member_id":member["id"], "role":member["role"]})
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
