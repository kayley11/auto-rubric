"""Small immutable case records; evaluations continue to keep their own inputs."""

import json
import re
import threading
import uuid
from datetime import UTC, datetime
from pathlib import Path

from scoring import fingerprint, text_field


def submission_details(value=None):
    """Administrative provenance only; never part of a scoring prompt."""
    if not value:
        return {}
    if not isinstance(value, dict):
        raise ValueError("Invalid case submission details.")
    result = {
        key: text_field(value.get(key, ""), key, limit)
        for key, limit in [
            ("contributor_id", 80),
            ("batch_id", 100),
            ("batch_name", 160),
            ("filename", 255),
            ("account_id", 40),
        ]
    }
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,79}", result["contributor_id"]):
        raise ValueError(
            "Enter a Contributor ID using letters, digits, dots, underscores or hyphens."
        )
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", result["batch_id"]):
        raise ValueError("Invalid import batch ID.")
    result["batch_name"] = result["batch_name"] or "Added cases"
    return result


def merge_submissions(record, entries):
    saved = record.setdefault("submissions", [])
    for entry in entries:
        key = (entry.get("batch_id", ""), entry.get("contributor_id", ""))
        if not any((e.get("batch_id", ""), e.get("contributor_id", "")) == key for e in saved):
            saved.append(entry)


class WorkspaceCases:
    def __init__(self, directory):
        self.root = Path(directory) / "_cases"
        self.root.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()

    def save(self, rows, submission=None):
        if not isinstance(rows, list) or not 1 <= len(rows) <= 200:
            raise ValueError("Supply 1–200 cases.")
        # Validate the complete import before saving any row.
        submission = submission_details(submission)
        if submission:
            submission["submitted_at"] = datetime.now(UTC).isoformat()
        clean = []
        for row in rows:
            data = {
                k: text_field(row.get(k, ""), k, limit)
                for k, limit in [
                    ("facts", 50000),
                    ("task", 20000),
                    ("title", 160),
                    ("source", 1000),
                    ("reference", 40000),
                    ("history", 40000),
                    ("case_code", 60),
                    ("case_number", 100),
                ]
            }
            if not data["facts"] or not data["task"]:
                raise ValueError("Every saved case needs facts and a task.")
            if not re.fullmatch(r"[A-Za-z0-9_-]{1,60}", data["case_code"]):
                raise ValueError("Each case needs its generated case code.")
            clean.append(data)
        result = []
        for data in clean:
            key = fingerprint(data)
            path = self.root / (key + ".json")
            with self.lock:
                exists = path.exists()
                record = (
                    json.loads(path.read_text(encoding="utf-8"))
                    if exists
                    else {
                        "id": uuid.uuid4().hex,
                        "input": data,
                        "created_at": datetime.now(UTC).isoformat(),
                        "reference_status": "awaiting confirmation",
                    }
                )
                before = list(record.get("submissions", []))
                if submission:
                    merge_submissions(record, [submission])
                if not exists or before != record.get("submissions", []):
                    temporary = path.with_suffix(".tmp")
                    temporary.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
                    temporary.replace(path)
                result.append(record)
        return result

    def catalogue(self, app):
        records = {}
        for path in self.root.glob("*.json"):
            value = json.loads(path.read_text(encoding="utf-8"))
            data = value["input"]
            key = fingerprint(
                {
                    k: data.get(k, "")
                    for k in ("case_code", "facts", "task", "history", "source", "reference")
                }
            )
            if key in records:
                merge_submissions(records[key], value.get("submissions", []))
            else:
                records[key] = {**value, "runs": []}
        for summary in app.list_runs():
            import re

            if re.search(
                r"ui[-_\s]?validation|deployment[-_\s]?check", summary.get("purpose", ""), re.I
            ) or re.match(r"^Deployment check(?:\s|[—–:-])", summary.get("title", ""), re.I):
                continue
            run = app.load(summary["id"])
            data = run["input"]
            key = fingerprint(
                {
                    k: data.get(k, "")
                    for k in ("case_code", "facts", "task", "history", "source", "reference")
                }
            )
            if key not in records:
                records[key] = {
                    "id": key[:32],
                    "input": {
                        k: data.get(k, "")
                        for k in (
                            "case_code",
                            "case_number",
                            "facts",
                            "task",
                            "title",
                            "source",
                            "reference",
                            "history",
                        )
                    },
                    "created_at": run["created_at"],
                    "reference_status": "awaiting confirmation",
                    "runs": [],
                }
            records[key]["runs"].append(summary)
            if run.get("case_submission"):
                merge_submissions(records[key], [run["case_submission"]])
            elif summary.get("comparison_id"):
                merge_submissions(
                    records[key],
                    [
                        {
                            "contributor_id": "",
                            "batch_id": "earlier-" + summary["comparison_id"],
                            "batch_name": "Earlier comparison · " + run["created_at"][:10],
                            "submitted_at": run["created_at"],
                            "filename": "",
                            "legacy": True,
                        }
                    ],
                )
        for key, record in records.items():
            record["code"] = record["input"].get("case_code") or "LEGACY-" + key[:10].upper()
            if not record.get("submissions"):
                record["submissions"] = [
                    {
                        "contributor_id": "",
                        "batch_id": "earlier-records",
                        "batch_name": "Earlier records",
                        "submitted_at": record["created_at"],
                        "filename": "",
                        "legacy": True,
                    }
                ]
        return sorted(records.values(), key=lambda r: r["created_at"], reverse=True)
