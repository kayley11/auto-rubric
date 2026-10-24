"""Check that the UI study preserves evidence and cannot silently change history."""

# ruff: noqa: E402 -- Import the standalone app from its own directory.

import hashlib
import json
import sys
from pathlib import Path

import pytest

APP = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(APP))

import study
from engine import Settings
from server import Application


def test_all_24_interviews_keep_original_answers_and_grades():
    data = study.dataset()
    assert len(data["cases"]) == 8
    assert len(data["interviews"]) == 24
    assert sum(len(r["turns"]) for r in data["interviews"]) == 131
    pairs = {(r["case_id"], r["model"]) for r in data["interviews"]}
    assert pairs == {(c["id"], m) for c in data["cases"] for m in data["models"]}
    for record in data["interviews"]:
        raw = study.output(f"source-{record['case_id']}-{record['model_slug']}.json")
        assert hashlib.sha256(raw).hexdigest() == record["source_sha256"]
        original = json.loads(raw)
        assert record["final_answer"] == original["final_answer"]
        assert record["turns"] == original["turns"]
        assert record["question_count"] <= 6
        for item in ("D5c", "D3a"):
            assert record["scores"][item]["old_score"] == original["grades"][item]["score"]
            assert record["scores"][item]["old_reason"] == original["grades"][item]["reason"]


def test_request_and_simulator_failures_remain_distinct():
    lite = study.interview("N02", "arc-lite")
    apex = study.interview("N02", "arc-apex")
    assert not any("glucose" in t["question"].lower() for t in lite["turns"])
    assert "glucose" in apex["turns"][5]["question"].lower()
    assert lite["scores"]["D5c"]["new_score"] == 2
    assert lite["scores"]["D3a"]["new_score"] == 5
    n04 = study.interview("N04_INITIAL", "arc-apex")
    blocked = [
        f
        for f in n04["fact_checks"]
        if f["status"] == "available_record_blocked_by_context_matching"
    ]
    assert len(blocked) == 1 and blocked[0]["question_numbers"] == "3"
    assert n04["turns"][2]["question"] == study.dataset()["n04_offline_check"]["saved_question"]


def test_all_saved_outputs_are_verified_and_unknown_paths_rejected():
    for filename, expected in study.dataset()["output_hashes"].items():
        assert hashlib.sha256(study.output(filename)).hexdigest() == expected
    for name in ("../rubric.json", "../../.env", "source-unknown.json"):
        with pytest.raises(FileNotFoundError):
            study.output(name)
    with pytest.raises(FileNotFoundError):
        study.interview("N02", "arc-unknown")


def test_original_and_revised_rules_remain_separate():
    data = study.dataset()
    assert data["original_rules"]["D5c"]["missing_anchors"] == ["2", "4"]
    assert set(data["revised_rules"]["D5c"]["anchors"]) == {"1", "2", "3", "4", "5"}
    assert "examiner_only_inventory" not in json.dumps(study.summary()["interviews"])
    assert "no hidden results" in data["evidence_windows"]["D3a"].lower()


def test_legacy_run_gets_a_visible_version_without_rewriting_file(tmp_path):
    app = Application(tmp_path, Settings("", "https://offline.invalid/v1"), object())
    app.save({"id": "a" * 32, "status": "complete", "input": {"title": "Legacy"}, "grades": {}})
    path = app.path("a" * 32)
    before = path.read_bytes()
    assert app.public_run("a" * 32)["rubric_version"]["id"] == "original"
    assert path.read_bytes() == before
    assert "rubric_version" not in json.loads(before)
