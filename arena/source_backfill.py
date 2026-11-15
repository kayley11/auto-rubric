"""Deterministic candidate links to immutable, already saved article passages.

No model calls or clinical judgements are made here. A literal source interval
verifies where the quotation occurs, not whether it supports an adapted claim.
"""

from __future__ import annotations

import hashlib
import math
import re
from collections import Counter

VERSION = "archived-passages-v1"
STOP = set(
    (
        "a an the and or of in on at by to for from with without as is are was "
        "were be been has have had this that these those it its their his her "
        "they he she patient patients case report reported woman man year years"
        " old aged adult young initial admission assessment presentation "
        "clinical information available supplied known unknown not no before "
        "after during following further findings history also only than then "
        "which when including relevant current previous possible results "
        "symptoms examination treatment investigation investigations records "
        "review decision point role channel opening record system"
    ).split()
)


def sha(value):
    return hashlib.sha256(value.encode()).hexdigest()


def tokens(text):
    return {x for x in re.findall(r"[a-z][a-z0-9-]{2,}", text.lower()) if x not in STOP}


def position(source, block, start=None, end=None):
    start = block["start"] if start is None else start
    end = block["end"] if end is None else end
    return {
        "start": start,
        "end": end,
        "start_utf16": len(source["text"][:start].encode("utf-16-le")) // 2,
        "end_utf16": len(source["text"][:end].encode("utf-16-le")) // 2,
        "block_id": block["id"],
        "page": block.get("page"),
        "section": block.get("section", "Saved article text"),
    }


def paragraph_links(source, facts, location=""):
    """Link exact input strings, recorded locators, then lexical candidates.

    Candidate relevance is always awaiting confirmation. Unmentioned facts are
    never declared model-visible, and a later section is never used as input.
    """
    blocks = [
        b
        for b in source["blocks"]
        if len(b["text"]) >= 35
        and not re.search(
            (
                "references|bibliography|acknowledg|author contribution|conflict of "
                "interest|funding|copyright|related articles|supplementary "
                "material|data availability"
            ),
            b.get("section", ""),
            re.I,
        )
    ]
    frequencies = Counter(t for b in blocks for t in tokens(b["text"]))
    weight = {t: math.log(1 + (len(blocks) + 1) / n) for t, n in frequencies.items()}
    units = [
        s.strip() for s in re.split(r"\n+|(?<=[.!?])\s+(?=[A-Z])", facts) if len(s.strip()) >= 35
    ]
    chosen = {}

    def add(block, method, excerpt="", start=None, end=None):
        p = position(source, block, start, end)
        key = (p["start"], p["end"])
        if key in chosen:
            return
        quote = source["text"][p["start"] : p["end"]]
        section = p.get("section", "")
        later = bool(
            re.search(
                r"discussion|conclusion|outcome|follow.?up|learning point|abstract|summary",
                section,
                re.I,
            )
        )
        visible = method == "literal_input" and quote in facts
        chosen[key] = {
            "text": quote,
            "source_quote": quote,
            "position": p,
            "grounding": "exact",
            "grounding_method": "archived_exact_passage",
            "category": "context",
            "visibility": "visible" if visible else "hidden" if later else "uncertain",
            "visibility_reason": "Literal passage in the saved case opening."
            if visible
            else (
                "Later/interpretative source section; source review only. Confirm "
                "timing for this case."
            )
            if later
            else (
                "Source location is verified; availability at the saved decision point "
                "needs confirmation."
            ),
            "case_excerpt": excerpt,
            "association_method": method,
            "association_status": "awaiting confirmation",
            "patient_group": "Awaiting confirmation",
            "time_label": "Check the saved task and source timeline",
        }

    # A complete input sentence can be linked without semantic inference.
    for unit in units:
        start = source["text"].find(unit)
        if start >= 0 and source["text"].find(unit, start + 1) < 0:
            block = next(
                (b for b in blocks if b["start"] <= start and b["end"] >= start + len(unit)), None
            )
            if block:
                add(block, "literal_input", unit, start, start + len(unit))

    # Preserve actual saved paragraph IDs; do not infer p-4 from list position.
    locators = set(re.findall(r"\b(?:[A-Za-z_]+-)?B\d{4}\b|\bp-\d+\b", location))
    for prefix, left, right in re.findall(r"\b(B)(\d{4})\s*[-–—]\s*B(\d{4})", location):
        if 0 <= int(right) - int(left) <= 100:
            locators.update(f"{prefix}{n:04}" for n in range(int(left), int(right) + 1))
    for left, right in re.findall(r"\bp-(\d+)\s*[-–—]\s*p-(\d+)", location):
        if 0 <= int(right) - int(left) <= 100:
            locators.update(f"p-{n}" for n in range(int(left), int(right) + 1))
    for block in blocks:
        bid = str(block["id"])
        if bid in locators or any(bid.endswith("-" + token) for token in locators):
            add(block, "recorded_locator")

    # Lexical overlap locates review candidates, not validated claim support.
    for unit in units:
        query = tokens(unit)
        if len(query) < 3:
            continue
        ranked = []
        for block in blocks:
            common = query & tokens(block["text"])
            if len(common) < 3:
                continue
            score = sum(weight.get(t, 0) for t in common) / max(
                1, sum(weight.get(t, 0) for t in query)
            )
            if score >= 0.28:
                ranked.append((score, len(common), block))
        for _, _, block in sorted(ranked, key=lambda x: (x[0], x[1]), reverse=True)[:2]:
            add(block, "lexical_candidate", unit)

    items = sorted(chosen.values(), key=lambda x: (x["position"]["start"], x["position"]["end"]))[
        :50
    ]
    for n, item in enumerate(items, 1):
        item["id"] = f"P{n:03}"
    return items


def make_draft(case, source, timestamp):
    items = paragraph_links(source, case["facts"], case.get("source_location", ""))
    return {
        "id": sha(
            VERSION
            + "\n"
            + case["case_id"]
            + "\n"
            + source["text_sha256"]
            + "\n"
            + sha(case["facts"])
        )[:24],
        "case_id": case["case_id"],
        "origin": VERSION,
        "source_id": source["id"],
        "source_sha256": source["text_sha256"],
        "case_facts_sha256": sha(case["facts"]),
        "article_title": source["title"],
        "created_at": timestamp,
        "status": "source_review_only",
        "revision": 0,
        "decision_point": (
            "Use the original saved task. Paragraph relevance and timing remain "
            "awaiting confirmation."
        ),
        "items": items,
        "task": case.get("task", ""),
        "visible_context": "",
        "extraction_version": VERSION,
        "grounding_version": "exact-saved-interval-v1",
        "visibility_policy_version": "review-only-candidates-v1",
        "clinical_reference_status": "awaiting confirmation",
        "model_calls": 0,
    }
