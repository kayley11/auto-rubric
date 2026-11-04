"""Authorised, immutable rubric revisions. Saving never rewrites an old run."""

import json
import re
import uuid
from copy import deepcopy
from datetime import UTC, datetime
from pathlib import Path


class WorkspaceRules:
    def __init__(self, root):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def records(self):
        return sorted(
            (json.loads(p.read_text(encoding="utf-8")) for p in self.root.glob("revision-*.json")),
            key=lambda r: r["created_at"],
        )

    def record(self, identifier):
        if not re.fullmatch(r"workspace-[a-f0-9]{32}", identifier):
            return None
        path = self.root / ("revision-" + identifier + ".json")
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None

    def active(self):
        path = self.root / "active.json"
        return json.loads(path.read_text(encoding="utf-8"))["id"] if path.exists() else None

    def save(self, body, original, actor, *, load_snapshot):
        from scoring import text_field

        base = text_field(body.get("base_version", ""), "Base version", 100)
        snapshot = deepcopy(load_snapshot(base))
        label = text_field(body.get("label", ""), "Version label", 150)
        reason = text_field(body.get("reason", ""), "Change reason", 10000)
        changes = body.get("changes")
        if not label or not reason or not isinstance(changes, dict) or not changes:
            raise ValueError("Enter a version label, a reason and at least one changed criterion.")
        items = {c["id"]: c for c in snapshot["criteria"]}
        for cid, patch in changes.items():
            if cid not in items or not isinstance(patch, dict):
                raise ValueError("Choose an existing rubric item.")
            item = items[cid]
            item["definition"] = text_field(
                patch.get("definition", item["definition"]), "Definition", 15000
            )
            if not item["definition"]:
                raise ValueError("A criterion needs a definition.")
            anchors = patch.get("anchors", item["anchors"])
            if not isinstance(anchors, dict) or set(anchors) - set("12345"):
                raise ValueError("Use score anchors 1–5.")
            item["anchors"] = {
                n: text_field(anchors.get(n, ""), "Score anchor", 8000) for n in "12345"
            }
            item["missing_anchors"] = [int(n) for n in "12345" if not item["anchors"][n]]
            for key in ("applicability", "notes_vs_patient_directed_explanations"):
                if key in patch:
                    item[key] = text_field(patch[key], key, 10000)
            for key in ("essential_scoring_rules", "relationship_to_D5c"):
                if key in patch:
                    lines = patch[key]
                    if not isinstance(lines, list) or len(lines) > 30:
                        raise ValueError("Scoring rules must be a list of at most 30 statements.")
                    item[key] = [text_field(v, key, 8000) for v in lines]
        identifier = "workspace-" + uuid.uuid4().hex
        record = {
            "id": identifier,
            "label": label,
            "base_version": base,
            "status": "awaiting confirmation",
            "scope": "Authorised workspace revision; historical results retained.",
            "created_at": datetime.now(UTC).isoformat(),
            "actor": actor,
            "reason": reason,
            "changed_items": list(changes),
            "rubric": snapshot,
        }
        path = self.root / ("revision-" + identifier + ".json")
        path.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
        if body.get("make_default") is True:
            temp = self.root / "active.tmp"
            temp.write_text(json.dumps({"id": identifier}) + "\n")
            temp.replace(self.root / "active.json")
        return record
