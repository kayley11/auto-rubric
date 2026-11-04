"""Evidence boundaries and version consistency for the BMJ written cohort."""

import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import comparison
import engine
import scoring

ARENA = Path(__file__).resolve().parents[1]


def library():
    return [
        c
        for c in json.loads((ARENA / "case-library.json").read_text(encoding="utf-8"))["cases"]
        if c.get("library_group") == "bmj"
    ]


def test_all_bmj_cases_load_without_hidden_outcomes_or_sources_in_generation():
    rows = library()
    assert len(rows) == 22
    for c in rows:
        value = engine.validate_input(c)
        text = json.dumps(engine.generation_messages(value))
        assert c["source"] not in text and c["reference"] not in text
        assert "https://" not in text
        assert "D5c" not in value["criteria"]
        assert value["evaluation_mode"] == "written"
    assert "D3a" not in next(c for c in rows if c["case_id"] == "B18")["criteria"]


def test_loaded_bmj_tasks_retain_the_manuscript_anchors_and_blinded_synthesis():
    original = hashlib.sha256(engine.RUBRIC_BYTES).hexdigest()
    c = engine.validate_input(library()[0])
    assert c["rules_version"] == scoring.MANUSCRIPT_ID
    assert engine.criterion_item("D3d", c)["name"] == "Causal Reasoning Appropriateness"
    assert [o.label for o in engine.make_criterion("D4c", c).options] == [
        "1",
        "3",
        "5",
        "Not applicable",
        "Indeterminate",
    ]
    query = engine.judge_query(c, "D3a")
    assert c["reference"] not in query and c["source"] not in query
    assert hashlib.sha256(engine.RUBRIC_BYTES).hexdigest() == original


def test_bmj_ids_and_original_cohort_remain_accessible():
    for cid in ["C01", "CAND22", "B01", "B22"]:
        value = comparison.dataset(cid)
        model_ids = {m["id"] for m in value["models"]}
        assert {"kcl-lite", "kcl-chat", "kcl-apex", "gemma4-free", "nemotron-free"} <= model_ids
        assert model_ids <= {
            "kcl-lite",
            "kcl-chat",
            "kcl-apex",
            "gemma4-free",
            "nemotron-free",
            "qwen38-groq",
        }
        assert value["clinical_status"] == value["requirements_status"] == "awaiting confirmation"
    value = comparison.dataset()
    assert {c["id"] for c in value["cases"]} >= {
        c["case_id"]
        for c in json.loads((ARENA / "case-library.json").read_text(encoding="utf-8"))["cases"]
        if c.get("library_group") == "bmj"
    }
    assert len({c["id"] for c in value["cases"]}) >= 55
    assert len(value["cohorts"]) >= 2
    assert comparison.dataset("B18")["criteria"][0]["id"] == "D1"


def test_catalogue_cards_have_the_fields_needed_to_open_every_new_case():
    catalogue = json.loads((ARENA / "public/cases/index.json").read_text(encoding="utf-8"))
    cards = [c for c in catalogue["cases"] if c["group"] == "bmj"]
    assert len(cards) == 22
    for card in cards:
        assert card["criteria"] and card["templates"] and card["evidence"]
        assert all(set(["id", "name"]) <= set(item) for item in card["criteria"])
        assert (ARENA / "public/cases" / f"{card['id']}.json").is_file()
