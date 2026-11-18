"""Small append-only local stores for clinical decisions and independent ratings."""

import json
import re

from sqlite_store import connect as connect_store
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
        self.reviewer = None
        self.database = self.root / "_reviews.sqlite3"
        with self.connect() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.execute("CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY,kind TEXT,"
                       "target TEXT,reviewer TEXT,sequence INTEGER,saved_at TEXT,payload TEXT)")
            db.execute("CREATE INDEX IF NOT EXISTS review_lookup ON records(kind,target,reviewer)")
            for path in self.root.glob("*.json"):
                value = json.loads(path.read_text(encoding="utf-8"))
                db.execute("INSERT OR IGNORE INTO records VALUES(?,?,?,?,?,?,?)",
                           (value["id"], value["kind"], value["target"], value.get("account_id", "legacy:"+value.get("reviewer", "")),
                            value.get("sequence", 0), value["saved_at"], json.dumps(value)))

    def connect(self):
        return connect_store(self.database, timeout=10)

    def scoped(self, reviewer):
        view = object.__new__(Reviews)
        view.__dict__ = {**self.__dict__, "reviewer": reviewer}
        return view

    def latest(self, kind, target):
        records = self.history(kind, target)
        return records[-1] if records else None

    def history(self, kind, target):
        query = "SELECT payload FROM records WHERE kind=? AND target=?"
        args = [kind, target]
        if kind in {"rating", "run_rating"} and self.reviewer:
            query += " AND reviewer=?"
            args.append(self.reviewer)
        query += " ORDER BY sequence,saved_at,id"
        with self.connect() as db:
            return [json.loads(row[0]) for row in db.execute(query, args)]

    def ratings_by_target(self):
        query = "SELECT target,payload FROM records WHERE kind='rating'"
        args = []
        if self.reviewer:
            query += " AND reviewer=?"
            args.append(self.reviewer)
        query += " ORDER BY sequence DESC,saved_at DESC"
        result = {}
        with self.connect() as db:
            for target, payload in db.execute(query, args):
                result.setdefault(target, json.loads(payload))
        return result

    def append(self, kind, target, value):
        if kind in {"rating", "run_rating"} and self.reviewer:
            display = value.get("reviewer", "")
            if display != self.reviewer and not (self.reviewer == "workspace" and display.startswith("workspace/")):
                raise PermissionError("A rating can only be saved for the signed-in reviewer.")
            value = {**value, "account_id":self.reviewer}
        with self._append_lock, self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            if "_expected_previous" in value:
                query = "SELECT id FROM records WHERE kind=? AND target=?"
                args = [kind, target]
                if self.reviewer:
                    query += " AND reviewer=?"
                    args.append(self.reviewer)
                current = db.execute(query+" ORDER BY sequence DESC,saved_at DESC LIMIT 1", args).fetchone()
                expected = value.get("_expected_previous")
                if (current[0] if current else None) != expected:
                    raise ValueError("Another tab updated this rating. Reload before saving again.")
                value = {k:v for k,v in value.items() if k != "_expected_previous"}
            sequence = db.execute("SELECT COALESCE(MAX(sequence),0)+1 FROM records WHERE kind=? AND target=?",
                                  (kind, target)).fetchone()[0]
            record = {**value, "id":uuid.uuid4().hex, "kind":kind, "target":target,
                      "sequence":sequence, "saved_at":datetime.now(UTC).isoformat()}
            path = self.root / (record["id"]+".json")
            temporary = path.with_suffix(".tmp")
            encoded = json.dumps(record, ensure_ascii=False, indent=2)+"\n"
            temporary.write_text(encoded, encoding="utf-8")
            temporary.replace(path)
            db.execute("INSERT INTO records VALUES(?,?,?,?,?,?,?)", (record["id"],kind,target,
                       record.get("account_id", record.get("reviewer", "")),sequence,record["saved_at"],encoded))
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
            if cid != "D3a" and "D3a" in packet["rules"] and "D3a" not in items:
                raise ValueError("Save D3a before opening examiner-only D5c evidence.")
            if cid == "D3a" and any(k != "D3a" for k in items):
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
                _expected_previous=previous.get("id"),
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
            "judge_model": packet["data"].get("judge_model", "arc:apex"),
            "rules_version": packet["data"].get("rules_version", "original"),
            "case_id": packet["case_id"],
            "name": packet["name"],
            "criteria": {cid: rule.get("name", cid) for cid, rule in packet["rules"].items()},
            "scores": packet["scores"],
            "rating": record,
            "score_context": packet.get("score_context", ""),
        }
