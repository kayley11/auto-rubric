"""Verify the frozen B03 research output without network or model calls."""

import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "study-data/article-questions-b03-20261114"


def test_b03_archive_preserves_all_captured_bytes_and_call_outputs():
    manifest = json.loads((ROOT / "MANIFEST.json").read_text(encoding="utf-8"))
    archive = ROOT / manifest["archive"]
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == manifest["sha256"]
    with zipfile.ZipFile(archive) as saved:
        assert set(saved.namelist()) == set(manifest["files"])
        assert len(saved.namelist()) == manifest["file_count"] == 22
        for name, expected in manifest["files"].items():
            raw = saved.read(name)
            assert hashlib.sha256(raw).hexdigest() == expected["sha256"]
            assert len(raw) == expected["bytes"]
        assert len([p for p in saved.namelist() if p.startswith("literature/calls/")]) == 4
        assert len([p for p in saved.namelist() if p.startswith("literature/question_calls/")]) == 2


def test_b03_question_boundaries_remain_unconfirmed_and_source_locatable():
    with zipfile.ZipFile(ROOT / "complete-output.zip") as saved:
        source = json.loads(saved.read("SOURCE.json"))
        sets = [
            json.loads(saved.read(name))
            for name in saved.namelist()
            if name.startswith("literature/question_sets/")
        ]
    assert len(sets) == 2
    for record in sets:
        assert record["question_count"] == 7 and record["confirmed_count"] == 0
        assert record["reference_status"] == "awaiting confirmation"
        assert record["source_sha256"] == hashlib.sha256(source["text"].encode()).hexdigest()
        facts = {fact["id"]: fact for fact in record["facts"]}
        for fact in facts.values():
            position = fact["position"]
            assert source["text"][position["start"] : position["end"]] == fact["source_quote"]
        for question in record["questions"]:
            visible, hidden = set(question["visible_fact_ids"]), set(question["hidden_fact_ids"])
            assert not visible & hidden and visible | hidden == set(facts)
            assert set(question["reference_fact_ids"]) <= set(facts)
            assert question["reference_status"] == "awaiting confirmation"
            assert question["association_status"] == "awaiting review"
            assert not any(question["review"].values())
    latest = max(sets, key=lambda record: record["created_at"])
    masked = next(question for question in latest["questions"] if question["id"] == "Q02")
    facts = {fact["id"]: fact for fact in latest["facts"]}
    visible_input = (
        masked["context"]
        + masked["question"]
        + "\n".join(facts[key]["text"] for key in masked["visible_fact_ids"])
    )
    assert "olmesartan" not in visible_input.lower()
    outcome = next(question for question in latest["questions"] if question["id"] == "Q07")
    assert outcome["task_type"] == "report_comprehension"
