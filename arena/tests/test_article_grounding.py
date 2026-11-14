# ruff: noqa: E402 -- Import the standalone arena modules independently.
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from article_grounding import layout_match
from article_sources import assemble
from literature import normalise_extractions


def source(text, kind="pdf"):
    canonical, blocks = assemble([{"text": "🧪 " + text + " Supporting context. " * 20, "page": 1}])
    return {"kind": kind, "text": canonical, "blocks": blocks}


def unit(text):
    return SimpleNamespace(
        extraction_class="case_fact",
        extraction_text=text,
        char_interval=None,
        attributes={},
        alignment_status=None,
    )


@pytest.mark.parametrize(
    "quote,original",
    [
        ("There was no parkinsonism.", "There was no parkin-\nsonism."),
        ("The postoperative state improved.", "The post-\noperative state improved."),
        ("The post-operative state improved.", "The post-\noperative state improved."),
        ("A 2-year history.", "A 2-\u00adyear history."),
        (r"Spon\xadtaneous speech increased.", "Spon-\ntaneous speech increased."),
        ("Mini-Mental score 5/30.", "Mini–Mental score 5/30."),
        ("The patient's score remained 5/30.", "The patient’s score remained 5/30."),
        ("Creatinine was 1.42 mg/dL.", "Creatinine was 1.42 mg/\ndL."),
        ("Rate 71 beats/min.", "Rate 71 beats/\nmin."),
        ("Volume 56 mL/m².", "Volume 56 mL/\nm²."),
    ],
)
def test_layout_alignment_keeps_original_text_and_offsets(quote, original):
    s = source(original)
    item = normalise_extractions(SimpleNamespace(extractions=[unit(quote)]), s)[0]
    assert item["grounding"] == "exact"
    assert item["source_quote"] == original
    assert item["text"] == quote.replace("\u00ad", "").replace(r"\xad", "")
    assert item["layout_cleaned"]
    assert item["model_extraction_text"] == quote
    pos = item["position"]
    assert s["text"][pos["start"] : pos["end"]] == original
    assert pos["start_utf16"] == pos["start"] + 1


@pytest.mark.parametrize(
    "quote,original",
    [
        ("Dose was 26 μg/day.", "Dose was 25 μg/day."),
        ("There was rigidity.", "There was no rigidity."),
        ("Range 18-72.", "Range 18–72."),
        ("NPI was 12.", "NPI was 0."),
        ("inventory (NPI) and scale.", "inventory (NPI)5 and scale."),
        ("Clinically observed improvement.", "clinically observed improvement."),
        ("MMSE: Preoperative 5.", "MMSE\nPreoperative\n5"),
        ("No prior history.", "There was prior history."),
        ("Score 5/30.", "Score 5/\n30."),
    ],
)
def test_alignment_does_not_repair_content(quote, original):
    assert layout_match(quote, source(original)) is None


def test_ambiguous_quote_is_not_grounded():
    s = source("No parkin-\nsonism. No parkin-\nsonism.")
    assert layout_match("No parkinsonism.", s) is None


def test_html_only_allows_typography_not_pdf_word_joining():
    assert layout_match("No parkinsonism.", source("No parkin-\nsonism.", "html")) is None
    result = layout_match("The patient's score.", source("The patient’s score.", "html"))
    assert result["method"] == "unique_typography_match"
