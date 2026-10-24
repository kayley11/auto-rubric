"""Exercise rule versions, evidence separation and immutable saves without provider charges."""

# ruff: noqa: E402 -- Standalone local application.

import asyncio
import json
import sys
import time
from copy import deepcopy
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import scoring
import study
from engine import (
    RUBRIC,
    Provider,
    Settings,
    csv_text,
    generation_messages,
    judge_query,
    make_criterion,
    plain_text,
    validate_input,
)
from server import Application


def sample():
    return validate_input(scoring.imported_input("N02", "arc-lite"))


def wait(app, run):
    for _ in range(200):
        if app.active_id is None:
            return app.public_run(run["id"])
        time.sleep(0.01)
    pytest.fail("Offline scoring did not finish")


def test_all_imports_preserve_actual_questions_replies_and_final_answers():
    for old in study.dataset()["interviews"]:
        data = validate_input(scoring.imported_input(old["case_id"], old["model_slug"]))
        assert data["answer"] == old["final_answer"]
        assert data["task"] == old["final_task"]
        assert len(data["interview"]["turns"]) == len(old["turns"])
        for turn, saved in zip(data["interview"]["turns"], old["turns"], strict=True):
            assert turn["question"] == saved["question"]
            assert turn["reply"] == saved["patient_reply"].strip()
            for record in saved["fixed_records"]:
                assert record["text"] in turn["records"]
                assert record.get("context", "") in turn["records"]
        assert data["requirements_status"] == scoring.PENDING
        assert data["reference_status"] == "draft"
        assert "grades" not in data and "scores" not in data


def test_hidden_material_and_notes_are_excluded_from_d3a_and_generation():
    data = sample()
    data["reference"] = "HIDDEN_REFERENCE_SENTINEL"
    data["requirements"][0]["requirement"] = "HIDDEN_CHECKLIST_SENTINEL"
    data["interview"]["reviewer_context"] = "HIDDEN_INVENTORY_SENTINEL"
    data["interview"]["turns"][0]["notes"] = "PRIVATE_TO_ASSESSMENT_NOTES_SENTINEL"
    for visible in (judge_query(data, "D3a"), json.dumps(generation_messages(data))):
        for hidden in (
            "HIDDEN_REFERENCE_SENTINEL",
            "HIDDEN_CHECKLIST_SENTINEL",
            "HIDDEN_INVENTORY_SENTINEL",
            "PRIVATE_TO_ASSESSMENT_NOTES_SENTINEL",
        ):
            assert hidden not in visible
        assert data["interview"]["turns"][0]["question"] in visible
    query = judge_query(data, "D5c")
    assert "HIDDEN_CHECKLIST_SENTINEL" in query
    assert "HIDDEN_INVENTORY_SENTINEL" in query
    assert "PRIVATE_TO_ASSESSMENT_NOTES_SENTINEL" in query
    assert "HIDDEN_REFERENCE_SENTINEL" not in query
    data["interview"]["notes_allowed"] = False
    assert "PRIVATE_TO_ASSESSMENT_NOTES_SENTINEL" not in judge_query(data, "D5c")


def test_proposed_anchors_and_original_intermediate_scores_stay_separate():
    original = make_criterion("D5c")
    revised = make_criterion("D5c", sample())
    assert "No original descriptor" in original.requirement
    assert "No original descriptor" not in revised.requirement
    assert "limits D5c to 2" in revised.requirement
    assert "do not count as making it" in revised.requirement
    assert "simulator fails" in revised.requirement
    assert "not become inadequate" in revised.requirement
    assert "Do not automatically lower D3a" in make_criterion("D3a", sample()).requirement
    snapshot = scoring.rubric_snapshot(RUBRIC, scoring.REVISED_ID)
    for item in RUBRIC["criteria"]:
        revised_item = next(c for c in snapshot["criteria"] if c["id"] == item["id"])
        if item["id"] not in {"D3a", "D5c"}:
            assert revised_item == item


@pytest.mark.parametrize(
    "cid,label,position,status",
    [
        ("D5c", "2", 2, "scored"),
        ("D5c", "4", 4, "scored"),
        ("D3a", "Not applicable", 6, "not_applicable"),
        ("D3a", "Indeterminate", 7, "indeterminate"),
    ],
)
def test_actual_autorubric_adapter_uses_proposed_evidence_and_all_labels(
    monkeypatch, cid, label, position, status
):
    data = sample()
    data["interview"]["reviewer_context"] = "REVIEWER_ONLY_SENTINEL"
    data["reference"] = "REFERENCE_NOT_FOR_NEW_ITEMS"
    payloads = []

    async def post(self, url, **kwargs):
        payloads.append(kwargs["json"])
        return httpx.Response(
            200,
            request=httpx.Request("POST", url),
            json={
                "id": "offline-fixture",
                "object": "chat.completion",
                "created": 0,
                "model": "arc:apex",
                "choices": [
                    {
                        "index": 0,
                        "finish_reason": "stop",
                        "message": {
                            "role": "assistant",
                            "content": json.dumps(
                                {
                                    "selected_option": position,
                                    "selected_label": label,
                                    "explanation": (
                                        "Offline adapter fixture, not a clinical assessment."
                                    ),
                                }
                            ),
                        },
                    }
                ],
                "usage": {"total_tokens": 20},
            },
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", post)
    capture = {}
    result = asyncio.run(
        Provider(Settings("offline", "https://offline.invalid/v1")).grade(data, cid, capture)
    )
    assert result["status"] == status and result["label"] == label
    assert not result["unanchored"]
    payload = json.dumps(payloads[0])
    assert "REFERENCE_NOT_FOR_NEW_ITEMS" not in payload
    assert ("REVIEWER_ONLY_SENTINEL" in payload) == (cid == "D5c")
    assert ("Candidate requirements" in capture["evidence_query"]) == (cid == "D5c")
    assert capture["rules_version"] == scoring.REVISED_ID
    assert "actual request" in capture["evidence_query"]


def test_missing_records_and_incomplete_requirements_do_not_become_low_scores():
    data = sample()
    data["interview"]["turns"] = []
    data["interview"]["complete"] = False
    with pytest.raises(ValueError, match="actual interview"):
        validate_input(data)
    data["interview"]["complete"] = True
    assert validate_input(data)["interview"]["turns"] == []
    data["requirements"][0]["deadline"] = ""
    with pytest.raises(ValueError, match="Complete requirement"):
        validate_input(data)
    data = sample()
    data["requirements"] = []
    with pytest.raises(ValueError, match="candidate information requirement"):
        validate_input(data)


class OfflineProvider:
    def __init__(self):
        self.seen = []
        self.fail = True

    async def generate(self, data, capture):
        return "Offline generated answer."

    async def grade(self, data, cid, capture):
        self.seen.append(deepcopy(data))
        if self.fail and cid == "D3a":
            raise ValueError("Offline timeout")
        return {
            "status": "indeterminate",
            "label": "Indeterminate",
            "score": None,
            "reason": "Offline fixture.",
            "unanchored": False,
        }


def test_saved_version_and_requirements_are_frozen_for_retries_and_exports(tmp_path, monkeypatch):
    provider = OfflineProvider()
    app = Application(tmp_path, Settings("offline", "https://offline.invalid/v1"), provider)
    result = wait(app, app.start("evaluate", sample()))
    snapshot = deepcopy(result["rubric"])
    assert result["status"] == "partial"
    assert result["rubric_version"]["id"] == scoring.REVISED_ID
    assert result["input_sha256"] == scoring.fingerprint(result["input"])
    assert result["settings"]["option_order_by_item"]["D5c"][-2:] == [
        "Not applicable",
        "Indeterminate",
    ]
    # A later author-rule change must not change an existing run's retry.
    monkeypatch.setattr(
        scoring, "rubric_snapshot", lambda *args: pytest.fail("Retry read live rules")
    )
    provider.fail = False
    result = wait(app, app.start("retry", {"rules_version": "original"}, result["id"]))
    assert result["status"] == "complete"
    assert provider.seen[-1]["_rubric_snapshot"] == snapshot
    assert result["rubric"] == snapshot
    assert len(provider.seen) == 3  # the completed non-numeric D5c was not retried
    assert "awaiting Josh" in plain_text(result)
    assert scoring.REVISED_ID in csv_text(result)
    assert "Indeterminate" in plain_text(result)
    assert "CANDIDATE REQUIREMENTS" in plain_text(result)


def test_generation_cannot_silently_switch_rule_version_or_interview(tmp_path):
    app = Application(
        tmp_path, Settings("offline", "https://offline.invalid/v1"), OfflineProvider()
    )
    result = wait(app, app.start("generate", sample()))
    altered = deepcopy(result["input"])
    altered["rules_version"] = "original"
    with pytest.raises(ValueError, match="scoring version"):
        app.start("evaluate", altered, result["id"])
    altered = deepcopy(result["input"])
    altered["requirements"][0]["level"] = "helpful"
    with pytest.raises(ValueError, match="interview evidence"):
        app.start("evaluate", altered, result["id"])
