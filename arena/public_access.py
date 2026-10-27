"""Small, explicit member access for the hosted research workspace."""

import base64
import hashlib
import hmac
import json
import re
import secrets
import time
from urllib.parse import urlparse

COOKIE_NAME = "arena_session"
SESSION_SECONDS = 8 * 60 * 60
ITERATIONS = 310000


def password_hash(password):
    if len(password) < 16:
        raise ValueError("Use an access password of at least 16 characters.")
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), ITERATIONS)
    return f"pbkdf2_sha256${ITERATIONS}${salt}${digest.hex()}"


def check_password(password, encoded):
    try:
        kind, rounds, salt, expected = encoded.split("$")
        if kind != "pbkdf2_sha256" or not 100000 <= int(rounds) <= 1000000:
            return False
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(rounds))
        return hmac.compare_digest(actual.hex(), expected)
    except (ValueError, TypeError, AttributeError):
        return False


def origin(value):
    parsed = urlparse(value)
    if (
        parsed.scheme not in {"https", "http"}
        or not parsed.netloc
        or parsed.username
        or parsed.password
        or parsed.path not in {"", "/"}
        or parsed.query
        or parsed.fragment
        or (parsed.scheme == "http" and parsed.hostname not in {"127.0.0.1", "localhost"})
    ):
        raise ValueError("Set a public HTTPS origin; HTTP is allowed only for local testing.")
    return f"{parsed.scheme}://{parsed.netloc.lower()}"


def members(raw):
    try:
        rows = json.loads(raw)
    except (TypeError, json.JSONDecodeError) as exc:
        raise ValueError("Configure the hosted member access secret.") from exc
    if not isinstance(rows, list) or not 1 <= len(rows) <= 30:
        raise ValueError("Configure between 1 and 30 member IDs.")
    result = {}
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("Invalid member record.")
        identifier = row.get("id", "")
        if not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_-]{0,39}", identifier):
            raise ValueError("Member IDs must use letters, digits, underscores or hyphens.")
        if row.get("role") not in {"admin", "evaluator", "reviewer"}:
            raise ValueError("Choose an admin, evaluator or reviewer role.")
        encoded = row.get("password_hash", "")
        if not re.fullmatch(r"pbkdf2_sha256\$\d{6,7}\$[a-f0-9]{32}\$[a-f0-9]{64}", encoded):
            raise ValueError("Configure hashed passwords, not plaintext passwords.")
        if identifier in result:
            raise ValueError("Member IDs must be unique.")
        result[identifier] = {"id": identifier, "role": row["role"], "password_hash": encoded}
    return result


def sign_session(member, secret, now=None):
    issued = int(time.time() if now is None else now)
    stamp = hashlib.sha256(member["password_hash"].encode()).hexdigest()[:20]
    body = (
        base64.urlsafe_b64encode(
            json.dumps(
                {"id": member["id"], "expires": issued + SESSION_SECONDS, "stamp": stamp}
            ).encode()
        )
        .decode()
        .rstrip("=")
    )
    signature = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
    return f"{body}.{signature}"


def read_session(token, secret, users, now=None):
    try:
        body, signature = token.split(".")
        expected = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            return None
        data = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
        member = users.get(data["id"])
        if not member or data["expires"] <= (time.time() if now is None else now):
            return None
        stamp = hashlib.sha256(member["password_hash"].encode()).hexdigest()[:20]
        return member if hmac.compare_digest(stamp, data["stamp"]) else None
    except (ValueError, KeyError, TypeError, AttributeError):
        return None
