"""Exact positions do not automatically validate an adapted clinical claim."""

from article_sources import assemble
from source_backfill import make_draft, paragraph_links, sha


def source():
    text, blocks = assemble(
        [
            {"id": "case", "tag": "h2", "text": "Case presentation"},
            {
                "id": "p-4",
                "tag": "p",
                "text": (
                    "🙂 The patient developed diarrhoea after hospital discharge. Treatment "
                    "and medication records were incomplete."
                ),
            },
            {
                "id": "p-4a",
                "tag": "p",
                "text": (
                    "Initial laboratory investigations and the original medication chart "
                    "were reviewed at the stated clinical assessment point."
                ),
            },
            {"id": "later", "tag": "h2", "text": "Outcome and follow-up"},
            {
                "id": "p-5",
                "tag": "p",
                "text": (
                    "Diarrhoea resolved after the medication was withdrawn. Subsequent "
                    "follow-up documented recovery."
                ),
            },
        ]
    )
    return {
        "id": "1" * 24,
        "title": "Saved article",
        "text": text,
        "blocks": blocks,
        "text_sha256": sha(text),
    }


def test_literal_input_has_exact_unicode_positions_without_claiming_clinical_confirmation():
    s = source()
    facts = "The patient developed diarrhoea after hospital discharge."
    items = paragraph_links(s, facts)
    literal = next(i for i in items if i["association_method"] == "literal_input")
    p = literal["position"]
    assert s["text"][p["start"] : p["end"]] == facts
    assert p["start_utf16"] == len(s["text"][: p["start"]].encode("utf-16-le")) // 2
    assert literal["visibility"] == "visible"
    assert literal["association_status"] == "awaiting confirmation"


def test_adapted_wording_and_recorded_locators_stay_unconfirmed():
    s = source()
    items = paragraph_links(
        s,
        "Hospital discharge was followed by diarrhoea with incomplete medication records.",
        "Case presentation p-4",
    )
    located = next(i for i in items if i["association_method"] == "recorded_locator")
    assert located["position"]["block_id"] == "p-4"
    assert located["visibility"] == "uncertain"
    assert located["source_quote"] in s["text"]
    assert located["association_status"] == "awaiting confirmation"


def test_later_passages_are_not_promoted_to_model_visible():
    s = source()
    items = paragraph_links(
        s, "The patient had diarrhoea and incomplete medication records.", "outcome p-5"
    )
    later = next(i for i in items if i["position"]["block_id"] == "p-5")
    assert later["visibility"] == "hidden"


def test_links_are_case_bound_and_do_not_change_source_or_case_input():
    s = source()
    before = s["text"]
    case = {
        "case_id": "B01",
        "facts": "The patient developed diarrhoea after hospital discharge.",
        "task": "Assess only supplied evidence.",
    }
    first = make_draft(case, s, "2026-11-15T00:00:00+00:00")
    second = make_draft({**case, "case_id": "B02"}, s, "2026-11-15T00:00:00+00:00")
    assert first["id"] != second["id"]
    assert first["case_id"] == "B01"
    assert first["case_facts_sha256"] == sha(case["facts"])
    assert first["model_calls"] == 0
    assert s["text"] == before
