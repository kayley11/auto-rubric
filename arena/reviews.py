"""Small append-only local stores for clinical decisions and independent ratings."""

import json
import re
import threading
import uuid
from copy import deepcopy
from datetime import UTC, datetime
from pathlib import Path

import evidence
import scoring


def text(value, name, maximum=10000):
    return scoring.text_field(value, name, maximum)


class Reviews:
    def __init__(self, root):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self._append_lock = threading.RLock()

    def latest(self, kind, target):
        records = self.history(kind, target)
        return records[-1] if records else None

    def history(self, kind, target):
        records = [json.loads(p.read_text(encoding="utf-8")) for p in self.root.glob("*.json")]
        matching = [r for r in records if r["kind"] == kind and r["target"] == target]
        return sorted(matching, key=lambda r: (r.get("sequence", 0), r["saved_at"]))

    def append(self, kind, target, value):
        with self._append_lock:
            previous = self.history(kind, target)
            sequence = max((r.get("sequence", 0) for r in previous), default=0) + 1
            record = {
                **value,
                "id": uuid.uuid4().hex,
                "kind": kind,
                "target": target,
                # A coarse clock can give multiple saves the same timestamp.
                # Order new records explicitly; do not alter old files or times.
                "sequence": sequence,
                "saved_at": datetime.now(UTC).isoformat(),
            }
            path = self.root / (record["id"] + ".json")
            temporary = path.with_suffix(".tmp")
            temporary.write_text(
                json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )
            temporary.replace(path)
            return record

    def profile_key(self, packet):
        data = packet["data"]
        requirements = [
            {k: v for k, v in r.items() if k != "approval"} for r in data.get("requirements", [])
        ]
        return scoring.fingerprint(
            {
                "case": packet["case_id"],
                "requirements": requirements,
                "reference": data.get("reference", ""),
                "inventory": packet["inventory"],
            }
        )

    def requirements(self, packet):
        key = self.profile_key(packet)
        return {
            "profile_id": key,
            "profile": evidence.clinical_profile(packet),
            "review": self.latest("requirements", key),
        }

    def save_requirements(self, packet, body):
        reviewer = text(body.get("reviewer", ""), "Reviewer", 150)
        if not reviewer:
            raise ValueError("Enter a reviewer ID.")
        decisions = body.get("decisions", {})
        if not isinstance(decisions, dict):
            raise ValueError("Invalid clinical decisions.")
        clean = {}
        for req in packet["data"].get("requirements", []):
            row = decisions.get(req["id"], {})
            level = row.get("level", req["level"])
            status = row.get("status", "pending")
            if level not in {"essential", "helpful", "not_needed"} or status not in {
                "pending",
                "confirmed",
                "needs_changes",
            }:
                raise ValueError("Use a recognised requirement level and review status.")
            clean[req["id"]] = {
                "level": level,
                "status": status,
                "alternatives": text(
                    row.get("alternatives", req["acceptable_requests_or_alternatives"]),
                    "Alternatives",
                    5000,
                ),
                "deadline": text(row.get("deadline", req["deadline"]), "Deadline", 2000),
                "reason": text(row.get("reason", ""), "Reason"),
            }
            if status != "pending" and not clean[req["id"]]["reason"]:
                raise ValueError("Add a reason for each recorded decision.")
            if (
                status == "confirmed"
                and level != "not_needed"
                and (not clean[req["id"]]["alternatives"] or not clean[req["id"]]["deadline"])
            ):
                raise ValueError(
                    "A confirmed requirement needs acceptable requests and a deadline."
                )
            for field in ("alternatives", "deadline"):
                if re.search(
                    r"\barc\s*:|\b(?:apex|lite|chat)\s+Q[1-6]\b", clean[req["id"]][field], re.I
                ):
                    raise ValueError(
                        "Keep requirement wording independent of model identity or "
                        "earlier audit conclusions."
                    )
        return self.append(
            "requirements",
            self.profile_key(packet),
            dict(
                reviewer=reviewer,
                source_profile=evidence.clinical_profile(packet),
                decisions=clean,
                reference_note=text(body.get("reference_note", ""), "Reference comment"),
                reference_status=body.get("reference_status", "pending")
                if body.get("reference_status", "pending")
                in {"pending", "checked", "needs_changes"}
                else "pending",
            ),
        )

    def rating(self, packet):
        return self.latest("rating", packet["id"])

    def save_rating(self, packet, body):
        reviewer = text(body.get("reviewer", ""), "Reviewer", 150)
        if not reviewer:
            raise ValueError("Enter a reviewer ID.")
        previous = self.rating(packet) or {}
        items = deepcopy(previous.get("items", {}))
        submitted = body.get("items", {})
        if not isinstance(submitted, dict) or not submitted:
            raise ValueError("Enter a rating.")
        for cid, row in submitted.items():
            if cid not in packet["rules"]:
                raise ValueError("Criterion is outside this review.")
            if cid == "D5c" and "D3a" in packet["rules"] and "D3a" not in items:
                raise ValueError("Save D3a before opening examiner-only D5c evidence.")
            if cid == "D3a" and "D5c" in items:
                raise ValueError(
                    "The initial synthesis rating is preserved after examiner evidence was opened."
                )
            score = row.get("score")
            if score not in ["1", "2", "3", "4", "5", "N/A", "Indeterminate"]:
                raise ValueError("Choose 1–5, N/A or Indeterminate.")
            note = text(row.get("note", ""), "Rating reason")
            if not note:
                raise ValueError("Add a short reason for the rating.")
            items[cid] = {
                "score": score,
                "note": note,
                "machine_scores_seen": bool(
                    previous.get("revealed")
                    or previous.get("machine_scores_seen")
                    or body.get("machine_scores_seen")
                ),
                "model_identity_seen": bool(
                    previous.get("model_identity_seen") or body.get("model_identity_seen")
                ),
            }
        return self.append(
            "rating",
            packet["id"],
            dict(
                reviewer=reviewer,
                items=items,
                source_fingerprint=scoring.fingerprint(packet["data"]),
                machine_scores_seen=bool(
                    previous.get("revealed")
                    or previous.get("machine_scores_seen")
                    or body.get("machine_scores_seen")
                ),
                model_identity_seen=bool(
                    previous.get("model_identity_seen") or body.get("model_identity_seen")
                ),
                revealed=bool(previous.get("revealed")),
            ),
        )

    def reveal(self, packet):
        record = self.rating(packet)
        if not record or any(cid not in record["items"] for cid in packet["rules"]):
            raise ValueError(
                "Save independent ratings for the selected items before revealing results."
            )
        self.append(
            "rating",
            packet["id"],
            {**record, "revealed": True, "machine_scores_seen": True, "model_identity_seen": True},
        )
        return {
            "model": packet["model"],
            "scores": packet["scores"],
            "rating": record,
            "score_context": packet.get("score_context", ""),
        }
