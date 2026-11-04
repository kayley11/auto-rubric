"""Attribution, batch grouping and shared visibility without model calls."""

import json
import sys
import threading
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from engine import Settings, generation_messages, judge_query, validate_input
from public_access import password_hash
from public_server import HostedServer
from server import Application
from workspace_cases import WorkspaceCases


def submission(contributor="R01", batch="batch-one"):
    return {
        "contributor_id": contributor,
        "batch_id": batch,
        "batch_name": "November reports",
        "filename": "cases.csv",
    }


def test_case_resubmission_preserves_identity_source_and_distinct_contributors(tmp_path):
    store = WorkspaceCases(tmp_path)
    row = {
        "case_code": "CASE-A",
        "facts": "Known facts",
        "task": "Summarise",
        "source": "DOI:original",
    }
    a = store.save([row], submission())[0]
    again = store.save([row], submission())[0]
    assert again == a
    b = store.save([row], submission("R02", "batch-two"))[0]
    assert b["id"] == a["id"] and b["created_at"] == a["created_at"]
    assert b["input"] == a["input"]
    assert len(b["submissions"]) == 2
    assert len(list(store.root.glob("*.json"))) == 1
    with pytest.raises(ValueError):
        store.save([row], submission("<invalid>"))
    with pytest.raises(ValueError):
        store.save([row, {"case_code": "CASE-B", "facts": "No task"}], submission())
    assert len(list(store.root.glob("*.json"))) == 1


def test_catalogue_keeps_old_grades_and_unknown_attribution_without_rewriting(tmp_path):
    app = Application(tmp_path, Settings("", "https://offline.invalid/v1"), object())
    data = validate_input(
        {
            "case_code": "CASE-OLD",
            "facts": "Old facts",
            "task": "Summarise",
            "answer": "Old answer",
            "source": "Original citation",
            "criteria": ["D1"],
            "comparison_id": "old-batch",
        }
    )
    run = {
        "id": "a" * 32,
        "created_at": "2026-10-20T12:00:00+00:00",
        "status": "complete",
        "input": data,
        "grades": {"D1": {"status": "scored", "score": 4, "explanation": "Saved reason"}},
    }
    app.save(run)
    original = app.path(run["id"]).read_bytes()
    record = app.cases.catalogue(app)[0]
    assert record["submissions"][0]["contributor_id"] == ""
    assert record["submissions"][0]["batch_id"] == "earlier-old-batch"
    assert record["runs"][0]["graded"] == 1
    assert record["input"]["source"] == "Original citation"
    assert app.path(run["id"]).read_bytes() == original


def test_run_provenance_is_saved_separately_and_never_enters_model_prompts(tmp_path, monkeypatch):
    app = Application(tmp_path, Settings("test-only-key", "https://offline.invalid/v1"), object())
    monkeypatch.setattr(app, "work", lambda *_: app.job_lock.release())
    body = {
        "case_code": "CASE-NEW",
        "facts": "Known facts",
        "task": "Summarise",
        "answer": "Existing answer",
        "criteria": ["D1"],
        "case_submission": submission("CONTRIBUTOR_SENTINEL", "BATCH_SENTINEL"),
    }
    run = app.start("evaluate", body)
    assert run["case_submission"]["contributor_id"] == "CONTRIBUTOR_SENTINEL"
    assert "case_submission" not in run["input"]
    prompts = json.dumps(generation_messages(run["input"])) + judge_query(run["input"], "D1")
    assert "CONTRIBUTOR_SENTINEL" not in prompts and "BATCH_SENTINEL" not in prompts
    record = app.cases.catalogue(app)[0]
    assert record["code"] == "CASE-NEW"
    assert record["submissions"][0]["batch_id"] == "BATCH_SENTINEL"


def test_shared_members_see_batches_but_anonymous_visitors_do_not(tmp_path):
    encoded = password_hash("test-only-workspace-password")
    users = json.dumps(
        [
            {"id": "workspace", "role": "evaluator", "password_hash": encoded},
            {
                "id": "rubric-editor",
                "role": "admin",
                "workspace": "workspace",
                "password_hash": encoded,
            },
        ]
    )
    server = HostedServer(
        ("127.0.0.1", 0),
        tmp_path,
        "http://127.0.0.1:0",
        users,
        "test-only-signing-secret-32-chars-long",
        Settings("", "https://offline.invalid/v1"),
        object(),
    )
    server.public_origin = f"http://127.0.0.1:{server.server_port}"
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with httpx.Client(
            base_url=server.public_origin, headers={"Origin": server.public_origin}, trust_env=False
        ) as client:
            assert client.get("/api/cases/submitted").json() == []
            client.post(
                "/api/access/login",
                json={"id": "workspace", "password": "test-only-workspace-password"},
            ).raise_for_status()
            for contributor, batch in [("R01", "one"), ("R02", "two")]:
                meta = {**submission(contributor, batch), "account_id": "FORGED_ACCOUNT"}
                client.post(
                    "/api/cases/submitted",
                    json={
                        "cases": [{"case_code": "CASE-" + batch, "facts": "A", "task": "B"}],
                        "case_submission": meta,
                    },
                ).raise_for_status()
            rows = client.get("/api/cases/submitted").json()
            assert len(rows) == 2
            assert {r["submissions"][0]["contributor_id"] for r in rows} == {"R01", "R02"}
            assert all(r["submissions"][0]["account_id"] == "workspace" for r in rows)
            client.post(
                "/api/access/login",
                json={"id": "rubric-editor", "password": "test-only-workspace-password"},
            ).raise_for_status()
            assert len(client.get("/api/cases/submitted").json()) == 2
            client.post("/api/access/logout", json={}).raise_for_status()
            assert client.get("/api/cases/submitted").json() == []
    finally:
        server.shutdown()
        server.server_close()
        thread.join(2)
