"""Append-only, workspace-scoped notes on immutable answer/rubric snapshots."""

import hashlib
import json
import re
import threading
import uuid
from datetime import UTC, datetime
from pathlib import Path


def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


CONTEXT_FIELDS = (
    "answer_key",
    "answer_sha256",
    "case_id",
    "item_id",
    "reason_sha256",
    "rubric_sha256",
    "rubric_version",
)


class EvidenceAnnotations:
    def __init__(self, root):
        self.root = Path(root)
        self.lock = threading.RLock()

    def read(self, key):
        if not re.fullmatch(r"[a-f0-9]{64}", key):
            raise ValueError("Invalid evidence snapshot ID.")
        with self.lock:
            versions = [
                json.loads(p.read_text(encoding="utf-8")) for p in (self.root / key).glob("*.json")
            ]
        versions.sort(key=lambda v: v["created_at"])
        latest = {}
        for record in versions:
            aid = record["annotation_id"]
            record["revision_count"] = latest.get(aid, {}).get("revision_count", 0) + 1
            latest[aid] = record
        return {
            "context_id": key,
            "annotations": list(latest.values()),
            "saved_revisions": len(versions),
            "clinical_reference_status": "awaiting confirmation",
        }

    def save(self, body, account="local-workspace"):
        context = body.get("context", {})
        if not isinstance(context, dict) or set(context) != set(CONTEXT_FIELDS):
            raise ValueError("Supply the exact answer, rubric and reason snapshot identifiers.")
        if any(not isinstance(v, str) or not v or len(v) > 240 for v in context.values()):
            raise ValueError("Invalid evidence snapshot metadata.")
        for field in ("answer_sha256", "reason_sha256", "rubric_sha256"):
            if not re.fullmatch(r"[a-f0-9]{64}", context[field]):
                raise ValueError("Invalid source fingerprint.")
        texts = {}
        for field, limit in (("answer", 200000), ("reason", 50000), ("rubric_text", 80000)):
            value = body.get(field)
            if not isinstance(value, str) or len(value) > limit:
                raise ValueError("The annotation source is missing or too long.")
            texts[field] = value
        if any(
            digest(texts[field]) != context[hash_field]
            for field, hash_field in (
                ("answer", "answer_sha256"),
                ("reason", "reason_sha256"),
                ("rubric_text", "rubric_sha256"),
            )
        ):
            raise ValueError("The source changed. Reopen this saved answer before adding a note.")
        key = digest(json.dumps(context, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
        aid = body.get("annotation_id", "")
        if not isinstance(aid, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", aid):
            raise ValueError("Invalid annotation ID.")
        reviewer = (
            body.get("reviewer", "").strip() if isinstance(body.get("reviewer", ""), str) else ""
        )
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,79}", reviewer):
            raise ValueError(
                "Enter a reviewer ID using letters, digits, dots, underscores or hyphens."
            )
        note = body.get("note", "")
        if not isinstance(note, str) or not note.strip() or len(note) > 6000:
            raise ValueError("Add a short note explaining this evidence link.")
        status = body.get("status", "awaiting_review")
        if status not in {"awaiting_review", "checked", "rejected"}:
            raise ValueError("Choose an evidence-link review status.")
        origin = body.get("origin")
        if origin not in {"automatic", "manual"}:
            raise ValueError("Specify whether the link was suggested or selected manually.")
        selectors = body.get("selectors")
        if not isinstance(selectors, list) or not 1 <= len(selectors) <= 8:
            raise ValueError("Select a passage in the saved answer.")
        # Recogito uses browser UTF-16 positions, not Python code-point positions.
        encoded = texts["answer"].encode("utf-16-le")
        cleaned = []
        for selector in selectors:
            if not isinstance(selector, dict):
                raise ValueError("Invalid answer-text selector.")
            start, end, quote = selector.get("start"), selector.get("end"), selector.get("quote")
            if (
                type(start) is not int
                or type(end) is not int
                or not 0 <= start < end <= len(encoded) // 2
            ):
                raise ValueError("Invalid answer-text location.")
            try:
                actual = encoded[start * 2 : end * 2].decode("utf-16-le")
            except UnicodeDecodeError as exc:
                raise ValueError("The selection splits a Unicode character.") from exc
            if not isinstance(quote, str) or actual != quote:
                raise ValueError("The quoted passage does not match this saved answer.")
            cleaned.append({"start": start, "end": end, "quote": actual})
        record = {
            "id": uuid.uuid4().hex,
            "annotation_id": aid,
            "context_id": key,
            "context": context,
            "created_at": datetime.now(UTC).isoformat(),
            "account_id": account,
            "reviewer": reviewer,
            "note": note.strip(),
            "status": status,
            "origin": origin,
            "selectors": cleaned,
            "clinical_reference_status": "awaiting confirmation",
            "does_not_change_score": True,
        }
        with self.lock:
            directory = self.root / key
            directory.mkdir(parents=True, exist_ok=True)
            # A new immutable revision; do not overwrite results, old notes or rubric snapshots.
            with (directory / (record["id"] + ".json")).open("x", encoding="utf-8") as stream:
                stream.write(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
        return self.read(key)
