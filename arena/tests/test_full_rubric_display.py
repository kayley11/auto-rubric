"""Audit the public result packet, including missingness and source boundaries."""

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public/full-rubric-review"


def test_full_review_keeps_every_case_model_item_and_unscored_reason():
    index = json.loads((ROOT / "index.json").read_text(encoding="utf-8"))
    counts = Counter()
    for row in index["cases"]:
        raw = (ROOT / f"{row['id']}.json").read_text(encoding="utf-8")
        packet = json.loads(raw)
        assert len(packet["criteria"]) == 22 and len(packet["models"]) == 6
        allowed = {c["id"]: c["allowed_scores"] for c in packet["criteria"]}
        for model in packet["models"]:
            assert {s["item"] for s in model["scores"]} == set(allowed)
            for score in model["scores"]:
                counts[score["status"]] += 1
                if score["status"] == "complete":
                    assert score["score"] in allowed[score["item"]]
                else:
                    assert score["score"] is None and score["reason"]
        assert packet["clinical_status"] == packet["requirements_status"] == "awaiting confirmation"
        assert not any(
            s in raw
            for s in (
                "/Users/",
                "source_answer_sha256",
                '"Authorization"',
                '"api_key"',
                '"doctor_output"',
            )
        )
    assert len(index["cases"]) == 78
    assert counts == {
        "complete": 6342,
        "not_applicable": 1225,
        "indeterminate": 23,
        "no_complete_answer": 2706,
    }


def test_new_packet_preserves_scope_exclusion_and_flags_without_changing_scores():
    n06 = json.loads((ROOT / "N06.json").read_text(encoding="utf-8"))
    for model in n06["models"]:
        score = next(s for s in model["scores"] if s["item"] == "D3a")
        assert score["status"] in {"not_applicable", "no_complete_answer"}
        assert score["score"] is None
    b09 = json.loads((ROOT / "B09.json").read_text(encoding="utf-8"))
    lite = next(m for m in b09["models"] if m["id"] == "kcl-lite")
    score = next(s for s in lite["scores"] if s["item"] == "D5c")
    assert score["score"] == 3
    assert any(f["type"] == "essential_rule_conflict" for f in score["review_flags"])
    assert score["requirement_checks"]


def test_missing_gemma_answers_do_not_gain_numerical_scores():
    index = json.loads((ROOT / "index.json").read_text(encoding="utf-8"))
    for row in index["cases"]:
        packet = json.loads((ROOT / f"{row['id']}.json").read_text(encoding="utf-8"))
        gemma = next(m for m in packet["models"] if m["id"] == "gemma4-free")
        assert not gemma["answer"] and gemma["answer_status"] == "no_complete_answer"
        assert all(
            s["status"] == "no_complete_answer" and s["score"] is None for s in gemma["scores"]
        )
