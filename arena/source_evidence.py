"""Read-only joins from a saved case to existing, fingerprinted source drafts.

Article identity is not proof of patient identity or of an adaptation's validity.
Never fetch a paper, call a model, rewrite a draft, or attach source outcomes to
an answering prompt here. The hosted /api/literature guard protects this view.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
CASE_ID = re.compile(r"[A-Za-z0-9_-]{1,60}\Z")
DRAFT_ID = re.compile(r"[a-f0-9]{24}\Z")


def read(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def identities(*values):
    keys = set()
    for value in values:
        if not isinstance(value, str):
            continue
        for doi in re.findall(r"10\.\d{4,9}/[^\s<>\"|]+", value, re.I):
            keys.add("doi:" + doi.rstrip(".,;)").lower())
        for address in re.findall(r"https?://[^\s<>\"|]+", value):
            parsed = urlsplit(address.rstrip(".,;)"))
            if parsed.username or parsed.password:
                continue
            host = (parsed.hostname or "").lower()
            route = parsed.path.rstrip("/")
            if host.endswith("bmj.com") and route.endswith((".full", ".full.pdf")):
                route = re.sub(r"\.full(?:\.pdf)?$", "", route)
            keys.add("url:" + host + route)
    return keys


def case_record(app, identifier, public_root=None):
    if not isinstance(identifier, str) or not CASE_ID.fullmatch(identifier):
        raise ValueError("Invalid saved case ID.")
    for path in sorted(app.cases.root.glob("*.json")):
        record = read(path)
        if record and record.get("id") == identifier:
            data = record["input"]
            return {
                "case_id": data.get("case_code", identifier),
                "title": data.get("title", ""),
                "facts": data.get("facts", ""),
                "task": data.get("task", ""),
                "source": data.get("source", ""),
                "source_location": "",
                "adaptation_note": (
                    "Saved workspace input; confirmed extraction provenance is retained separately."
                ),
                "provenance": record.get("literature_sources", []),
            }
    if public_root is None:
        public_root = ROOT / "dist/client"
        if not (public_root / "cases/index.json").is_file():
            public_root = ROOT / "public"
    public_root = Path(public_root)
    index = read(public_root / "cases/index.json") or {}
    metadata = next((row for row in index.get("cases", []) if row["id"] == identifier), None)
    if metadata is None:
        raise FileNotFoundError(
            "Saved case not found in this workspace or the published case library."
        )
    packet = None
    for folder in ("complex-cases", "full-rubric-review"):
        packet = read(public_root / folder / (identifier + ".json"))
        if packet:
            break
    packet = packet or {}
    facts = [packet.get("initial_facts", "")]
    opening = packet.get("opening", "")
    if opening and opening not in facts[0]:
        facts.append(opening)
    return {
        "case_id": identifier,
        "title": metadata.get("title", ""),
        "facts": "\n\n".join(filter(None, facts)) or metadata.get("summary", ""),
        "task": packet.get("task", ""),
        "source": metadata.get("source", ""),
        "source_location": metadata.get("source_location", ""),
        "adaptation_note": metadata.get("source_note", ""),
        "provenance": [],
    }


def checked_item(item, source, facts):
    keep = (
        "id",
        "text",
        "source_quote",
        "grounding",
        "grounding_method",
        "category",
        "time_label",
        "patient_group",
        "visibility",
        "visibility_reason",
        "edited_from_source",
        "case_excerpt",
        "association_method",
        "association_status",
    )
    result = {key: item[key] for key in keep if key in item}
    result["position"] = None
    position = item.get("position") or {}
    start, end = position.get("start"), position.get("end")
    text = source["text"]
    if (
        item.get("grounding") == "exact"
        and type(start) is int
        and type(end) is int
        and 0 <= start < end <= len(text)
        and text[start:end] == item.get("source_quote")
    ):
        start_utf16 = len(text[:start].encode("utf-16-le")) // 2
        end_utf16 = len(text[:end].encode("utf-16-le")) // 2
        if position.get("start_utf16") == start_utf16 and position.get("end_utf16") == end_utf16:
            result["position"] = {
                key: position[key]
                for key in (
                    "start",
                    "end",
                    "start_utf16",
                    "end_utf16",
                    "page",
                    "section",
                    "block_id",
                )
                if key in position
            }
    if not result["position"]:
        result["grounding"] = "unmatched"

    def normal(value):
        return re.sub(r"\s+", " ", value).strip() if isinstance(value, str) else ""

    quote = normal(result.get("source_quote", ""))
    result["quoted_in_saved_input"] = bool(len(quote) >= 12 and quote in normal(facts))
    result["link_status"] = "awaiting review"
    return result


def source_blocks(source):
    text, cursor, blocks = source["text"], 0, []
    for block in source.get("blocks", []):
        start, end = block.get("start"), block.get("end")
        if (
            type(start) is not int
            or type(end) is not int
            or not cursor <= start < end <= len(text)
            or text[cursor:start].strip()
            or text[start:end] != block.get("text")
            or block.get("start_utf16") != len(text[:start].encode("utf-16-le")) // 2
            or block.get("end_utf16") != len(text[:end].encode("utf-16-le")) // 2
        ):
            break
        blocks.append(
            {
                key: block[key]
                for key in (
                    "id",
                    "text",
                    "start",
                    "end",
                    "start_utf16",
                    "end_utf16",
                    "page",
                    "section",
                )
                if key in block
            }
        )
        cursor = end
    else:
        if blocks and not text[cursor:].strip():
            return blocks, True
    # Keep all words when block metadata is incomplete; never omit a table or
    # invent a PDF page for the fallback. Fact offsets still address this text.
    return [
        {
            "id": "saved-text",
            "text": text,
            "start": 0,
            "end": len(text),
            "start_utf16": 0,
            "end_utf16": len(text.encode("utf-16-le")) // 2,
            "section": "Saved text; paragraph locations unavailable",
        }
    ], False


def case_source_evidence(app, identifier, draft_id="", *, public_root=None):
    if draft_id and not DRAFT_ID.fullmatch(draft_id):
        raise ValueError("Invalid source draft ID.")
    case = case_record(app, identifier, public_root)
    mapping = read(app.literature.root / "case_mappings" / (identifier + ".json")) or {}
    if mapping.get("case_id") != identifier:
        mapping = {}
    keys = identities(case["source"])
    bound = {entry.get("draft_id"): entry for entry in case["provenance"]}
    # A saved HTML record can explicitly bind a URL to its DOI. This also
    # locates PDF versions carrying that DOI without guessing from their title.
    sources = [
        value
        for path in sorted((app.literature.root / "sources").glob("*.json"))
        if (value := read(path))
        and value.get("text_sha256") == hashlib.sha256(value.get("text", "").encode()).hexdigest()
    ]
    doi_keys = {
        key
        for source in sources
        if keys.intersection(identities(source.get("url")))
        for key in identities(source.get("doi"))
        if key.startswith("doi:")
    }
    if len(doi_keys) == 1:
        keys.update(doi_keys)
    candidates, unavailable = [], 0
    paths = [
        *(app.literature.root / "drafts").glob("*.json"),
        *(app.literature.root / "case_passages").glob("*.json"),
    ]
    for path in sorted(paths):
        draft = read(path)
        if (
            not draft
            or not DRAFT_ID.fullmatch(str(draft.get("id", "")))
            or not DRAFT_ID.fullmatch(str(draft.get("source_id", "")))
        ):
            continue
        # An article may contain several patients/tasks. Automatically restored
        # paragraph links belong only to the case they were prepared against.
        if (
            draft.get("origin") == "archived-passages-v1"
            and draft.get("case_id") != case["case_id"]
        ):
            continue
        source = read(app.literature.root / "sources" / (draft["source_id"] + ".json"))
        if not source:
            continue
        explicit = bound.get(draft["id"])
        if (bound and not explicit) or (
            not explicit and not keys.intersection(identities(source.get("url"), source.get("doi")))
        ):
            continue
        fingerprint = hashlib.sha256(source.get("text", "").encode()).hexdigest()
        if (
            fingerprint != source.get("text_sha256")
            or fingerprint != draft.get("source_sha256")
            or (
                draft.get("case_facts_sha256")
                and draft["case_facts_sha256"] != hashlib.sha256(case["facts"].encode()).hexdigest()
            )
            or (
                explicit
                and (
                    explicit.get("source_id") != source["id"]
                    or explicit.get("source_text_sha256") != fingerprint
                )
            )
        ):
            unavailable += 1
            continue
        candidates.append((draft, source, bool(explicit)))
    candidates.sort(
        key=lambda row: (row[2], row[0].get("updated_at", row[0].get("created_at", ""))),
        reverse=True,
    )
    selected = (
        next((row for row in candidates if row[0]["id"] == draft_id), None)
        if draft_id
        else next(iter(candidates), None)
    )
    if draft_id and selected is None:
        raise FileNotFoundError(
            "This draft is not linked to the selected case and saved source version."
        )
    result = {
        "case": {k: v for k, v in case.items() if k != "provenance"},
        "status": "available" if selected else "no_mapping",
        "source": None,
        "items": [],
        "clinical_reference_status": "awaiting confirmation",
        "link_status": "awaiting review",
        "mapping_record": {
            k: mapping[k]
            for k in (
                "status",
                "reason",
                "source_scope",
                "items",
                "literal_input",
                "recorded_locator",
                "lexical_candidates",
            )
            if k in mapping
        },
        "unavailable_source_versions": unavailable,
        "choices": [
            {
                "id": d["id"],
                "source_id": s["id"],
                "kind": s.get("kind", ""),
                "revision": d.get("revision", 0),
                "saved_at": d.get("updated_at", d.get("created_at", "")),
                "source_sha256": s["text_sha256"],
                "confirmed_case_provenance": explicit,
            }
            for d, s, explicit in candidates
        ],
    }
    if selected is None:
        return result
    draft, source, explicit = selected
    result["source"] = {
        key: source[key]
        for key in (
            "id",
            "title",
            "kind",
            "url",
            "doi",
            "text",
            "text_sha256",
            "blocks",
            "quality_notes",
            "retrieval_method",
            "page_count",
            "source_scope",
        )
        if key in source
    }
    result["source"]["blocks"], block_locations_valid = source_blocks(source)
    result["source"]["block_locations_valid"] = block_locations_valid
    if not block_locations_valid:
        result["source"]["quality_notes"] = [
            *source.get("quality_notes", []),
            (
                "Saved paragraph/page metadata could not be verified. The complete "
                "saved text is displayed without original page claims."
            ),
        ]
    result["draft"] = {
        key: draft.get(key) for key in ("id", "revision", "status", "decision_point", "origin")
    }
    result["binding"] = "confirmed_case_provenance" if explicit else "same_article_only"
    result["items"] = [checked_item(item, source, case["facts"]) for item in draft.get("items", [])]
    result["invalid_or_unmatched_items"] = sum(
        item["grounding"] != "exact" for item in result["items"]
    )
    return result
