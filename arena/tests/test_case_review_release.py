"""Check the published full-review data and preservation of earlier assessments."""

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "study-data/case-review-before-20261113"


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def test_every_published_case_has_a_complete_item_profile_and_pending_references():
    catalogue = read_json(ROOT / "public/cases/index.json")
    assert catalogue["base_case_count"] == len(catalogue["cases"]) == 135
    assert len({case["id"] for case in catalogue["cases"]}) == 135
    for case in catalogue["cases"]:
        folder = "complex-cases" if case["group"] == "complex-bmj" else "full-rubric-review"
        record = read_json(ROOT / "public" / folder / f"{case['id']}.json")
        assert record["id"] == case["id"]
        allowed = {item["id"]: item["allowed_scores"] for item in record["criteria"]}
        assert len(allowed) == 22 and len(record["models"]) == 6
        assert record["clinical_status"] == "awaiting confirmation"
        assert record["requirements_status"] == "awaiting confirmation"
        for model in record["models"]:
            assert {score["item"] for score in model["scores"]} == set(allowed)
            for score in model["scores"]:
                if score["status"] == "complete":
                    assert score["score"] in allowed[score["item"]]
                else:
                    assert score["score"] is None and score["reason"]


def test_all_updated_data_and_original_files_match_the_sync_manifest():
    manifest = read_json(ARCHIVE / "MANIFEST.json")
    for entry in manifest["files"]:
        current = ROOT.parent / entry["path"]
        assert hashlib.sha256(current.read_bytes()).hexdigest() == entry["current_sha256"]
        if entry["archive"]:
            old = ROOT.parent / entry["archive"]
            assert hashlib.sha256(old.read_bytes()).hexdigest() == entry["previous_sha256"]


def test_previously_saved_answers_and_numerical_grades_are_unchanged():
    answers = grades = 0
    for path in (ARCHIVE / "full-rubric-review").glob("*.json"):
        if path.name == "index.json":
            continue
        before = read_json(path)
        after = read_json(ROOT / "public/full-rubric-review" / path.name)
        models = {model["id"]: model for model in after["models"]}
        for original in before["models"]:
            current = models[original["id"]]
            if original["answer"]:
                answers += 1
                assert current["answer"] == original["answer"]
            items = {score["item"]: score for score in current["scores"]}
            for old_score in original["scores"]:
                if old_score["status"] == "complete":
                    grades += 1
                    new_score = items[old_score["item"]]
                    assert new_score["status"] == "complete"
                    assert new_score["score"] == old_score["score"]
    assert answers == 345 and grades == 6342
