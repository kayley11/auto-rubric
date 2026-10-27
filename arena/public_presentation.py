"""Name-free public display copies; historical source files are never rewritten."""

import re


def display_text(value):
    replacements = [
        (r"_pending_Josh\b", "_awaiting_confirmation"),
        (r"josh-proposed-", "proposed-"),
        (
            r"(?:awaiting|await|pending|subject to)\s+Josh['’]s\s+(?:confirmation|review)",
            "awaiting confirmation",
        ),
        (r"Josh['’]s proposed D3a\s*/\s*D5c", "Proposed D3a / D5c · awaiting confirmation"),
        (r"Josh['’]s (?:clinical reasoning )?rubric", "Clinical reasoning rubric"),
        (r"Josh['’]s proposed (rules|anchors|revision|version)", r"proposed \1"),
        (r"Josh['’]s proposal", "proposed rules"),
        (r"(?:need|needs|requires?) Josh['’]s review", "awaiting confirmation"),
        (r"(?:remain|remains) for Josh\b", "are awaiting confirmation"),
        (r"Josh['’]s review", "confirmation"),
        (r"\bJosh(?:['’]s)?\b", "awaiting confirmation"),
        (r"Adapted from [^,;\n]+ et al\.,", "Adapted from the source report,"),
    ]
    for pattern, replacement in replacements:
        value = re.sub(pattern, replacement, value, flags=re.IGNORECASE)
    return re.sub("Josh", "confirmation", value, flags=re.IGNORECASE)


def display_data(value, key=""):
    if isinstance(value, str):
        if key == "reviewer" and value:
            return (
                value
                if re.fullmatch(r"(?:R\d+|reviewer[-_][a-z0-9_-]+)", value, re.I)
                else "Reviewer"
            )
        if re.fullmatch(r"author|authors|prepared_by|confirmed_by", key, re.I) and value:
            return "Not displayed"
        # Requests still use the immutable version identifiers used in saved results.
        if key == "id" or key.endswith(("_id", "_version")):
            return value
        return display_text(value)
    if isinstance(value, list):
        return [display_data(item, key) for item in value]
    if isinstance(value, dict):
        return {display_text(k): display_data(v, k) for k, v in value.items()}
    return value
