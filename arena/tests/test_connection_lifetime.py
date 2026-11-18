"""Local resource checks; no provider calls or clinical grades."""

import sqlite3
from concurrent.futures import ThreadPoolExecutor

import pytest

from membership import Membership
from public_access import password_hash
from sqlite_store import connect


def test_database_context_commits_rolls_back_and_closes(tmp_path):
    path = tmp_path / "store.sqlite3"
    with connect(path) as db:
        db.execute("CREATE TABLE values_test (value TEXT)")
        db.execute("INSERT INTO values_test VALUES ('kept')")
    with pytest.raises(sqlite3.ProgrammingError, match="closed"):
        db.execute("SELECT 1")
    with pytest.raises(RuntimeError):
        with connect(path) as db:
            db.execute("INSERT INTO values_test VALUES ('rolled back')")
            raise RuntimeError("fixture rollback")
    with pytest.raises(sqlite3.ProgrammingError, match="closed"):
        db.execute("SELECT 1")
    with connect(path) as db:
        assert db.execute("SELECT value FROM values_test").fetchall() == [("kept",)]


def test_repeated_concurrent_member_reads_release_connections(tmp_path):
    users = {"owner": {"id": "owner", "role": "admin", "workspace": "owner",
                       "password_hash": password_hash("offline-only-test-password")}}
    membership = Membership(tmp_path / "members.sqlite3", users)
    with ThreadPoolExecutor(max_workers=10) as pool:
        results = list(pool.map(lambda _: membership.users(), range(1000)))
    assert all(result["owner"]["role"] == "admin" for result in results)
    with membership.connect() as db:
        assert db.execute("PRAGMA quick_check").fetchone()[0] == "ok"
