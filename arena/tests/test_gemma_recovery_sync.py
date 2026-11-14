"""Check complete recovery output and preservation across the GitHub handoff."""

import csv
import hashlib
import json
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDY = ROOT / "study-data/gemma-free-recovery-135-20261114"
BEFORE = ROOT / "study-data/gemma-recovery-before-20261114"


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_all_recovered_scores_match_the_public_packets_and_original_formats():
    with (STUDY / "ALL_ITEM_RESULTS.csv").open(encoding="utf-8", newline="") as stream:
        rows = list(csv.DictReader(stream))
    assert len(rows) == 135 * 22
    expected = {(row["case_id"], row["item"]): row for row in rows}
    assert len(expected) == len(rows)
    index = read_json(ROOT / "public/gemma-recovery/index.json")
    assert index["answers_complete"] == index["assessments_complete"] == 135
    counts = Counter()
    formats = Counter()
    turns = 0
    for case in index["cases"]:
        folder = "complex-cases" if case["case_id"].startswith("BN") else "full-rubric-review"
        packet = read_json(ROOT / "public" / folder / f"{case['case_id']}.json")
        gemma = next(model for model in packet["models"] if model["id"] == "gemma4-google")
        assert gemma["answer_status"] == "complete" and gemma["answer"].strip()
        assert gemma["model_id"] == "gemma-4-31b-it"
        assert packet["clinical_status"] == packet["requirements_status"] == "awaiting confirmation"
        formats[packet["mode"]] += 1
        turns += len(gemma["turns"])
        assert packet["max_questions"] == (6 if gemma["turns"] else 0)
        allowed = {item["id"]: item["allowed_scores"] for item in packet["criteria"]}
        assert {score["item"] for score in gemma["scores"]} == set(allowed)
        for score in gemma["scores"]:
            row = expected[(packet["id"], score["item"])]
            assert score["status"] == row["status"] and score["reason"] == row["reason"]
            assert score.get("evidence_quote", "") == row["evidence_quote"]
            counts[score["status"]] += 1
            if score["status"] == "complete":
                assert score["score"] in allowed[score["item"]]
                assert float(row["score"]) == score["score"]
            else:
                assert score["score"] is None and row["score"] == ""
    assert (
        counts
        == index["item_statuses"]
        == {
            "complete": 2553,
            "not_applicable": 247,
            "applicability_pending": 162,
            "indeterminate": 8,
        }
    )
    assert sum(formats.values()) == 135 and turns == 180
    assert sum(case["mode"] == "written-record" for case in index["cases"]) == 105


def test_previous_packets_and_every_other_model_are_preserved():
    manifest = read_json(BEFORE / "MANIFEST.json")
    retained = 0
    for entry in manifest["files"]:
        current = ROOT.parent / entry["path"]
        assert digest(current) == entry["current_sha256"]
        if not entry["archive"]:
            continue
        old = ROOT.parent / entry["archive"]
        assert digest(old) == entry["previous_sha256"]
        retained += 1
        if current.suffix != ".json" or current.stem == "index":
            continue
        before, after = read_json(old), read_json(current)
        for model in before["models"]:
            if model["id"].startswith("gemma"):
                continue
            assert model == next(
                candidate for candidate in after["models"] if candidate["id"] == model["id"]
            )
        for key in ["initial_facts", "opening", "task", "criteria", "requirements", "reference"]:
            assert before.get(key) == after.get(key)
    assert retained == 137


def test_complete_archive_retains_raw_attempts_and_the_original_bn52_profile():
    archive = STUDY / "FULL_OUTPUTS.zip"
    assert digest(archive) == "bc07b038086ade58c7f149d7f0af8b2ca214e8d25ab435f2690f3590a5bcd65a"
    with zipfile.ZipFile(archive) as captured:
        manifest = json.loads(captured.read("PACKAGE_MANIFEST.json"))
        assert len(captured.namelist()) == 3811 and len(manifest["files"]) == 3810
        for name, expected in manifest["files"].items():
            assert hashlib.sha256(captured.read(name)).hexdigest() == expected
        assert "grades/BN52.json" in manifest["files"]
        assert "grades_repaired/BN52.json" in manifest["files"]
        assert any(name.startswith("calls/google/") for name in manifest["files"])
        assert any(name.startswith("calls/google_compat/") for name in manifest["files"])
        assert any(name.startswith("calls/kcl/") for name in manifest["files"])
        assert not any(Path(name).name.startswith(".env") for name in captured.namelist())
