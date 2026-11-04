"""New written cases keep evidence boundaries and preserve prior study cohorts."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import comparison
import engine

ARENA = Path(__file__).resolve().parents[1]
EXPECTED = {
    "J01",
    "J02",
    "J03",
    "J04",
    "JA01",
    "JA02",
    "JA04",
    "JA05",
    "JA06",
    "JA07",
    "JA08",
    "JA09",
    "JA10",
}


def test_new_templates_load_with_the_retained_rules_and_no_reference_in_generation():
    rows = [
        c
        for c in json.loads((ARENA / "case-library.json").read_text(encoding="utf-8"))["cases"]
        if c.get("library_group") == "supplied"
    ]
    assert {c["case_id"] for c in rows} == EXPECTED
    for c in rows:
        rubric = {item["id"]: item for item in comparison.dataset(c["case_id"])["criteria"]}
        value = engine.validate_input(c)
        messages = json.dumps(engine.generation_messages(value))
        assert c["facts"] in "".join(m["content"] for m in engine.generation_messages(value))
        assert c["reference"] not in messages and c["source"] not in messages
        assert "https://" not in messages and "D5c" not in value["criteria"]
        assert value["evaluation_mode"] == "written"
        assert "future outcome is established" in value["interview"]["decision_point"]
        query = engine.judge_query(value, "D3a")
        assert c["facts"] in query and c["task"] in query
        assert c["reference"] not in query and c["source"] not in query
        assert "no executed question/response opportunity" in query
        assert "Allowed questions:" not in query
        for item in c["criteria"]:
            assert engine.criterion_item(item, value)["anchors"] == rubric[item]["anchors"]


def test_all_new_cases_have_five_model_slots_and_missing_scores_are_not_zero():
    for identifier in EXPECTED:
        record = comparison.dataset(identifier)
        assert record["mode"] == "written-record"
        model_ids = {m["id"] for m in record["models"]}
        assert {"kcl-lite", "kcl-chat", "kcl-apex", "gemma4-free", "nemotron-free"} <= model_ids
        assert model_ids <= {
            "kcl-lite",
            "kcl-chat",
            "kcl-apex",
            "gemma4-free",
            "nemotron-free",
            "qwen38-groq",
        }
        assert record["clinical_status"] == record["requirements_status"] == "awaiting confirmation"
        for model in record["models"]:
            for grade in model["scores"]:
                if grade["status"] != "complete":
                    assert grade["score"] is None and grade["label"] is None


def test_missing_local_new_source_retains_public_new_and_historical_results(tmp_path, monkeypatch):
    monkeypatch.setattr(comparison, "SUPPLIED_SOURCE", tmp_path / "unavailable-local-source.json")
    rows = comparison.dataset()
    assert len(rows["cases"]) == 78
    assert EXPECTED <= {c["id"] for c in rows["cases"]}
    assert {"C01", "N02", "CAND22", "B22", "SR01", "SR10"} <= {c["id"] for c in rows["cases"]}


def test_recorded_scoring_condition_selects_all_results_without_changing_history(tmp_path):
    assert comparison.grading_directory(tmp_path) == tmp_path / "grades"
    selection = tmp_path / "GRADE_SELECTION.json"
    selection.write_text(json.dumps({"relative_directory": "clean_scoring/grades"}))
    assert comparison.grading_directory(tmp_path) == tmp_path / "clean_scoring/grades"
    selection.write_text(json.dumps({"relative_directory": "../other-run/grades"}))
    import pytest

    with pytest.raises(ValueError, match="scoring condition"):
        comparison.grading_directory(tmp_path)
