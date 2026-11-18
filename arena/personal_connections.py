"""Per-member, encrypted OpenAI-compatible API connections; no browser key storage."""

from __future__ import annotations

import os
import re
import sqlite3

from sqlite_store import connect as connect_store
import time
import uuid
from dataclasses import replace
from pathlib import Path

import httpx
from cryptography.fernet import Fernet, InvalidToken

PROVIDERS = {
    "kcl": {"name": "KCL", "url": "https://ai.create.kcl.ac.uk/api/v1"},
    "openrouter": {"name": "OpenRouter", "url": "https://openrouter.ai/api/v1"},
    "groq": {"name": "Groq", "url": "https://api.groq.com/openai/v1"},
    "nvidia": {"name": "NVIDIA NIM", "url": "https://integrate.api.nvidia.com/v1"},
}


class Connections:
    def __init__(self, directory):
        self.root = Path(directory)
        self.root.mkdir(parents=True, exist_ok=True)
        key = os.getenv("ARENA_CONNECTION_ENCRYPTION_KEY", "")
        if not key:
            keyfile = self.root / "connection-encryption.key"
            try:
                with keyfile.open("xb") as stream:
                    os.chmod(keyfile, 0o600)
                    stream.write(Fernet.generate_key())
            except FileExistsError:
                pass
            key = keyfile.read_bytes()
        self.cipher = Fernet(key)
        self.path = self.root / "connections.sqlite3"
        with self.connect() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.execute("CREATE TABLE IF NOT EXISTS connections ("
                       "id TEXT PRIMARY KEY,owner TEXT NOT NULL,label TEXT NOT NULL,"
                       "provider TEXT NOT NULL,secret BLOB NOT NULL,created REAL NOT NULL,"
                       "expires REAL,revoked REAL)")

    def connect(self):
        return connect_store(self.path, timeout=10, row_factory=sqlite3.Row)

    def add(self, owner, body):
        provider = body.get("provider")
        label, key = body.get("label", ""), body.get("api_key", "")
        if provider not in PROVIDERS:
            raise ValueError("Choose a supported provider. Custom network addresses are not accepted.")
        if not isinstance(label, str) or not 1<=len(label.strip())<=80:
            raise ValueError("Enter a connection label of up to 80 characters.")
        if not isinstance(key, str) or not 12<=len(key)<=1024 or re.search(r"\s", key):
            raise ValueError("Enter a valid API key without spaces.")
        if key in label:
            raise ValueError("Use a label rather than the API key as the connection name.")
        identifier = uuid.uuid4().hex
        now = time.time()
        expires = None if body.get("remember") is True else now+8*60*60
        with self.connect() as db:
            if db.execute("SELECT count(*) FROM connections WHERE owner=? AND revoked IS NULL "
                          "AND (expires IS NULL OR expires>?)",
                          (owner,now)).fetchone()[0] >= 20:
                raise ValueError("Remove an unused connection before adding another.")
            db.execute("INSERT INTO connections VALUES(?,?,?,?,?,?,?,NULL)",
                       (identifier, owner, label.strip(), provider,
                        self.cipher.encrypt(key.encode()), now, expires))
        return next(r for r in self.list(owner) if r["id"] == identifier)

    def list(self, owner):
        with self.connect() as db:
            return [dict(row) for row in db.execute(
                "SELECT id,label,provider,created,expires FROM connections WHERE owner=? "
                "AND revoked IS NULL AND (expires IS NULL OR expires>?) ORDER BY created DESC",
                (owner, time.time()))]

    def describe(self, owner, identifier):
        with self.connect() as db:
            row = db.execute("SELECT id,label,provider FROM connections WHERE owner=? AND id=?",
                             (owner,identifier)).fetchone()
        if not row:
            return {"connection_id":identifier,"source":"personal","provider":"Unavailable"}
        return {"connection_id":row["id"],"source":"personal","label":row["label"],
                "provider":row["provider"],"base_url":PROVIDERS[row["provider"]]["url"]}

    def belongs_to(self, owner, identifier):
        with self.connect() as db:
            return db.execute("SELECT 1 FROM connections WHERE owner=? AND id=?",
                              (owner,identifier)).fetchone() is not None

    def resolve(self, owner, identifier, settings):
        with self.connect() as db:
            row = db.execute("SELECT * FROM connections WHERE id=? AND owner=? "
                             "AND revoked IS NULL AND (expires IS NULL OR expires>?)",
                             (identifier, owner, time.time())).fetchone()
        if not row:
            raise PermissionError("This personal connection is missing, expired or belongs to another account.")
        try:
            key = self.cipher.decrypt(row["secret"]).decode()
        except InvalidToken as exc:
            raise PermissionError("The connection could not be unlocked. Add it again.") from exc
        return replace(settings, api_key=key, base_url=PROVIDERS[row["provider"]]["url"])

    def remove(self, owner, identifier):
        with self.connect() as db:
            db.execute("UPDATE connections SET revoked=?,secret=? WHERE owner=? AND id=?",
                       (time.time(), b"", owner, identifier))

    def secrets(self):
        # For redaction only; this method is never exposed by an HTTP route.
        with self.connect() as db:
            rows = db.execute("SELECT secret FROM connections").fetchall()
        values = []
        for row in rows:
            try:
                values.append(self.cipher.decrypt(row[0]).decode())
            except InvalidToken:
                continue
        return values

    def test(self, owner, identifier, settings):
        selected = self.resolve(owner, identifier, settings)
        try:
            with httpx.Client(timeout=20, follow_redirects=False, trust_env=False) as client:
                response = client.get(selected.base_url+"/models",
                                      headers={"Authorization": "Bearer "+selected.api_key})
            if response.status_code != 200:
                raise ValueError(f"Provider model listing returned HTTP {response.status_code}.")
            data = response.json()
            models = [r["id"] for r in data.get("data", []) if isinstance(r.get("id"), str)]
            return {"ok": True, "models": models[:300],
                    "message": "Connection accepted by the provider. No answer was generated or scored."}
        except (httpx.HTTPError, ValueError, TypeError, AttributeError) as exc:
            # Provider responses and key strings never enter this error.
            if isinstance(exc, ValueError) and str(exc).startswith("Provider model listing"):
                raise
            raise ValueError("Could not verify this connection. Check the key and provider access.") from exc
