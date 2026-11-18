"""Invite-only members, reusing the existing password/session implementation."""

from __future__ import annotations

import hashlib
import re
import secrets
import sqlite3

from sqlite_store import connect as connect_store
import time
from pathlib import Path

from public_access import password_hash


class Membership:
    def __init__(self, path, seeds):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.executescript("""
                CREATE TABLE IF NOT EXISTS members (
                  id TEXT PRIMARY KEY, role TEXT NOT NULL, workspace TEXT NOT NULL,
                  password_hash TEXT NOT NULL, seed_hash TEXT, active INTEGER NOT NULL DEFAULT 1
                );
                CREATE TABLE IF NOT EXISTS invitations (
                  token_hash TEXT PRIMARY KEY, member_id TEXT NOT NULL,
                  role TEXT NOT NULL, workspace TEXT NOT NULL, creator TEXT NOT NULL,
                  expires REAL NOT NULL, accepted REAL, created REAL NOT NULL
                );
            """)
            if "reset" not in {r[1] for r in db.execute("PRAGMA table_info(invitations)")}:
                db.execute("ALTER TABLE invitations ADD COLUMN reset INTEGER NOT NULL DEFAULT 0")
            for member in seeds.values():
                db.execute("INSERT OR IGNORE INTO members(id,role,workspace,password_hash,seed_hash) "
                           "VALUES(?,?,?,?,?)", (member["id"], member["role"],
                           member.get("workspace", member["id"]), member["password_hash"],
                           member["password_hash"]))
                # An explicit rotation in the host configuration still revokes old sessions.
                db.execute("UPDATE members SET password_hash=?,seed_hash=? WHERE id=? "
                           "AND seed_hash IS NOT NULL AND seed_hash<>?",
                           (member["password_hash"], member["password_hash"], member["id"],
                            member["password_hash"]))

    def connect(self):
        return connect_store(self.path, timeout=10, row_factory=sqlite3.Row)

    def users(self):
        with self.connect() as db:
            return {r["id"]: {k: r[k] for k in ("id", "role", "workspace", "password_hash")}
                    for r in db.execute("SELECT * FROM members WHERE active=1")}

    def catalogue(self):
        with self.connect() as db:
            return {"members": [dict(r) for r in db.execute(
                "SELECT id,role,workspace,active FROM members ORDER BY id")],
                "invitations": [dict(r) for r in db.execute(
                    "SELECT member_id,role,workspace,expires,accepted,created FROM invitations "
                    "WHERE expires>? ORDER BY created DESC", (time.time(),))]}

    def invite(self, creator, identifier, role="reviewer", reset=False):
        actor = self.users().get(creator)
        if not actor or actor["role"] != "admin":
            raise PermissionError("Administrator access is required to invite members.")
        if not isinstance(identifier, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,39}", identifier):
            raise ValueError("Use an account ID with letters, digits, underscores or hyphens.")
        if role not in {"reviewer", "evaluator"}:
            raise ValueError("Invitations can grant reviewer or evaluator access.")
        token = secrets.token_urlsafe(32)
        now, expires = time.time(), time.time()+7*24*60*60
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            existing = db.execute("SELECT role,workspace FROM members WHERE id=?", (identifier,)).fetchone()
            if existing:
                if not reset:
                    raise ValueError("This account ID is already in use. Use Reset sign-in for an existing member.")
                if existing[0] == "admin" or existing[1] != actor["workspace"]:
                    raise PermissionError("This account cannot be reset through a member invitation.")
                role = existing[0]
            elif reset:
                raise ValueError("Member not found.")
            # Issuing a replacement invitation invalidates earlier unused links.
            db.execute("DELETE FROM invitations WHERE member_id=? AND accepted IS NULL", (identifier,))
            db.execute("INSERT INTO invitations(token_hash,member_id,role,workspace,creator,expires,accepted,created,reset) VALUES(?,?,?,?,?,?,NULL,?,?)",
                       (hashlib.sha256(token.encode()).hexdigest(), identifier, role,
                        actor["workspace"], creator, expires, now, int(bool(reset))))
        return {"member_id": identifier, "role": role, "expires": expires,
                "invite_path": "/#join/"+token,
                "message": "Share this one-use invitation privately. It expires in seven days."}

    def update(self, creator, identifier, changes):
        actor = self.users().get(creator)
        if not actor or actor["role"] != "admin":
            raise PermissionError("Administrator access is required.")
        with self.connect() as db:
            row = db.execute("SELECT role,workspace,active FROM members WHERE id=?", (identifier,)).fetchone()
            if not row or row[1] != actor["workspace"] or row[0] == "admin":
                raise PermissionError("This account cannot be changed through member management.")
            role, active = changes.get("role",row[0]), changes.get("active",bool(row[2]))
            if role not in {"reviewer","evaluator"} or type(active) is not bool:
                raise ValueError("Choose reviewer/evaluator access and an active status.")
            db.execute("UPDATE members SET role=?,active=? WHERE id=?", (role,int(active),identifier))
        return {"updated":True}

    def accept(self, token, password):
        if not isinstance(token, str) or not re.fullmatch(r"[A-Za-z0-9_-]{43}", token):
            raise ValueError("This invitation is invalid or expired.")
        if not isinstance(password, str) or len(password)>256:
            raise ValueError("Use a password between 16 and 256 characters.")
        with self.connect() as db:
            exists = db.execute("SELECT 1 FROM invitations WHERE token_hash=? AND accepted IS NULL AND expires>?",
                                (hashlib.sha256(token.encode()).hexdigest(), time.time())).fetchone()
        if not exists:
            raise ValueError("This invitation is invalid, expired or already used.")
        encoded = password_hash(password)
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT * FROM invitations WHERE token_hash=? AND accepted IS NULL "
                             "AND expires>?", (hashlib.sha256(token.encode()).hexdigest(),
                             time.time())).fetchone()
            if not row:
                raise ValueError("This invitation is invalid, expired or already used.")
            if row["reset"]:
                changed = db.execute("UPDATE members SET password_hash=?,active=1 WHERE id=? AND workspace=? AND role<>'admin'",
                           (encoded,row["member_id"],row["workspace"]))
                if changed.rowcount != 1:
                    raise PermissionError("This sign-in reset is no longer valid for the account.")
            else:
                db.execute("INSERT INTO members(id,role,workspace,password_hash) VALUES(?,?,?,?)",
                           (row["member_id"], row["role"], row["workspace"], encoded))
            db.execute("UPDATE invitations SET accepted=? WHERE token_hash=?",
                       (time.time(), row["token_hash"]))
        return self.users()[row["member_id"]]
