"""Technical workflow checks; no provider calls or clinical ground truth."""

import json
import sys
import threading
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import evidence
import scoring
from engine import RUBRIC, Settings, judge_query, validate_input
from public_access import password_hash
from public_server import HostedServer
from server import Application
from workspace_cases import WorkspaceCases
from workspace_rules import WorkspaceRules


def test_cases_are_persistent_idempotent_and_keep_changed_inputs(tmp_path):
    store = WorkspaceCases(tmp_path)
    row = {
        "case_code": "CASE-ONE",
        "facts": "Supplied facts",
        "task": "Summarise",
        "source": "DOI:example",
    }
    a = store.save([row])[0]
    assert store.save([row])[0] == a
    store.save([{**row, "facts": "Changed facts"}])
    assert len(list(store.root.glob("*.json"))) == 2
    with pytest.raises(ValueError):
        store.save([{**row, "case_code": "CASE-TWO"}, {"facts": "missing task"}])
    assert len(list(store.root.glob("*.json"))) == 2
    app = Application(tmp_path, Settings("", "https://offline.invalid/v1"), object())
    assert len(store.catalogue(app)) == 2
    assert all(r["reference_status"] == "awaiting confirmation" for r in store.catalogue(app))


def test_review_includes_all_saved_items_and_no_hidden_reference_for_synthesis(tmp_path):
    run = {
        "id": "a" * 32,
        "created_at": "2026-11-02",
        "status": "complete",
        "rubric": scoring.rubric_snapshot(RUBRIC),
        "input": validate_input(
            {
                "facts": "Available facts",
                "task": "Summarise",
                "answer": "Saved answer",
                "criteria": ["D1", "D3a"],
                "case_code": "CASE-TEST",
                "reference": "HIDDEN_REFERENCE",
            }
        ),
        "grades": {"D1": {"status": "scored", "score": 4}, "D3a": {"status": "scored", "score": 5}},
        "answer_source": "pasted",
    }
    app = Application(tmp_path, Settings("", "https://offline.invalid/v1"), object())
    app.save(run)
    packet = evidence.run_packet(run)
    assert set(packet["rules"]) == {"D1", "D3a"}
    assert evidence.review_order(packet) == ["D3a", "D1"]
    blind = evidence.blind_packet(packet)
    assert blind["run_id"] == run["id"]
    assert "HIDDEN_REFERENCE" not in json.dumps(blind)
    assert "scores" not in blind and "model" not in blind
    assert evidence.blind_packet(packet, "D1")["reference"] == "HIDDEN_REFERENCE"
    run["purpose"] = "ui-validation"
    app.save(run)
    assert packet["id"] not in {r["id"] for r in evidence.review_catalogue(app)}
    assert evidence.get_packet(packet["id"], app)["technical_check"]


def test_editor_permission_and_immutable_versioned_rules(tmp_path, monkeypatch):
    store = WorkspaceRules(tmp_path / "rules")
    monkeypatch.setattr(scoring, "WORKSPACE_RULES", store)
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
            assert client.get("/api/rubrics/manage").status_code == 403
            client.post(
                "/api/access/login",
                json={"id": "workspace", "password": "test-only-workspace-password"},
            ).raise_for_status()
            assert client.get("/api/rubrics/manage").status_code == 403
            assert client.get("/api/config").json()["access"]["can_manage_rubric"] is False
            assert client.post("/api/rubrics/manage", json={}).status_code == 403
            rows = [{"case_code": "CASE-NEW", "facts": "A", "task": "B"}]
            client.post("/api/cases/submitted", json={"cases": rows}).raise_for_status()
            client.post(
                "/api/access/login",
                json={"id": "rubric-editor", "password": "test-only-workspace-password"},
            ).raise_for_status()
            assert len(client.get("/api/cases/submitted").json()) == 1
            assert client.get("/api/config").json()["access"]["can_manage_rubric"] is True
            decisions = client.get("/api/decisions").json()
            assert {"B01", "B22", "JA10", "SR10", "C02"}.issubset({r["case_id"] for r in decisions})
            original = scoring.rubric_snapshot(RUBRIC, scoring.MANUSCRIPT_ID)
            changed = client.post(
                "/api/rubrics/manage",
                json={
                    "base_version": scoring.MANUSCRIPT_ID,
                    "label": "TEST ONLY",
                    "reason": "Test versioning, no clinical rule change.",
                    "changes": {"D3a": {"definition": "TEST DEFINITION"}},
                    "make_default": True,
                },
            )
            assert changed.status_code == 200, changed.text
            new_id = changed.json()["id"]
            assert store.active() == new_id
            assert scoring.rubric_snapshot(RUBRIC, scoring.MANUSCRIPT_ID) == original
            assert (
                next(
                    c
                    for c in scoring.rubric_snapshot(RUBRIC, new_id)["criteria"]
                    if c["id"] == "D3a"
                )["definition"]
                == "TEST DEFINITION"
            )
            data = validate_input(
                {
                    "facts": "A",
                    "task": "B",
                    "answer": "C",
                    "reference": "DO_NOT_LEAK",
                    "criteria": ["D3a"],
                    "rules_version": new_id,
                }
            )
            assert "DO_NOT_LEAK" not in judge_query(data, "D3a")
            assert client.get("/api/config").json()["current_rules_version"] == new_id
    finally:
        server.shutdown()
        server.server_close()
        thread.join(2)
