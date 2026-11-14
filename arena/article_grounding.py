"""Conservative layout alignment with offsets into the unchanged article text.

This is not fuzzy matching. It never skips words, changes values or ignores case.
The returned quotation is always the original source slice. Model wording is kept
separately so layout alignment cannot be mistaken for a verbatim model quotation.
"""

from __future__ import annotations

import re


def _projection(text, pdf):
    chars, offsets = [], []
    i = 0
    while i < len(text):
        if pdf and text.startswith(r"\xad", i):
            i += 4
            continue
        c = text[i]
        if pdf and c == "\u00ad":
            i += 1
            continue
        if c in "’‘":
            c = "'"
        # Typographical word hyphens only: numeric ranges/minus signs retain
        # their exact character and cannot be normalised into another value.
        if (
            c in "–‐‑"
            and i
            and i + 1 < len(text)
            and text[i - 1].isalpha()
            and text[i + 1].isalpha()
        ):
            c = "-"
        chars.append(c)
        offsets.append(i)
        i += 1
    return "".join(chars), offsets


def _pattern(quote, pdf):
    parts = [r"(?<!\w)"] if quote[0].isalnum() else []
    for i, char in enumerate(quote):
        if char.isspace():
            if not i or not quote[i - 1].isspace():
                parts.append(r"\s+")
        else:
            if pdf and i and quote[i - 1].isalpha() and char.isalpha():
                parts.append(r"(?:-[ \t]*\n[ \t]*)?")
            parts.append(re.escape(char))
            if (
                pdf
                and char == "/"
                and i
                and i + 1 < len(quote)
                and quote[i - 1].isalpha()
                and quote[i + 1].isalpha()
            ):
                parts.append(r"(?:[ \t]*\n[ \t]*)?")
            if (
                pdf
                and char == "-"
                and i
                and i + 1 < len(quote)
                and quote[i - 1].isalpha()
                and quote[i + 1].isalpha()
            ):
                parts.append(r"[ \t]*(?:\n[ \t]*)?")
    if quote[-1].isalnum():
        parts.append(r"(?!\w)")
    return "".join(parts)


def layout_match(original, source):
    """Return a unique source interval using explicitly allowed layout changes.

    In-word hyphen breaks, breaks after letter/letter slashes, and soft-hyphen
    artefacts are PDF-only. Unicode
    apostrophe and word-hyphen typography are allowed in either format. Table
    linearisation, citation-number deletion, missing qualifiers, reordered words
    and ambiguous repeated passages intentionally remain unmatched.
    """
    if not original or len(original) > 12000:
        return None
    pdf = source.get("kind") == "pdf"
    text, offsets = _projection(source["text"], pdf)
    quote, _ = _projection(original, pdf)
    if not quote.strip():
        return None
    matches = re.finditer(_pattern(quote, pdf), text)
    first, second = next(matches, None), next(matches, None)
    if first is None or second is not None:
        return None
    start, end = offsets[first.start()], offsets[first.end() - 1] + 1
    actual = source["text"][start:end]
    changes = []
    if pdf and re.search(r"(?<=[A-Za-z])-[ \t]*\n[ \t]*(?=[A-Za-z])", actual):
        changes.append("line-break hyphenation")
    if pdf and re.search(r"(?<=[A-Za-z])/[ \t]*\n[ \t]*(?=[A-Za-z])", actual):
        changes.append("slash line wrapping")
    if pdf and "\u00ad" in actual + original:
        changes.append("soft hyphen")
    if pdf and r"\xad" in actual + original:
        changes.append("escaped soft-hyphen artefact")
    if any(c in actual + original for c in "’‘") and actual != original:
        changes.append("apostrophe typography")
    if any(c in actual + original for c in "–‐‑") and actual != original:
        changes.append("word-hyphen typography")
    if (
        re.sub(r"\s+", " ", actual).strip() != actual
        or re.sub(r"\s+", " ", original).strip() != original
    ):
        changes.append("whitespace")
    return {
        "start": start,
        "end": end,
        "source_quote": actual,
        "method": "unique_pdf_layout_match" if pdf else "unique_typography_match",
        "changes": changes,
    }
