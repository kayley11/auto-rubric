"""Verify the frozen full-rubric archive without a key or neighbouring folders."""

import csv
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "study-data/full-rubric-20261104"


def main():
    manifest = json.loads((ROOT / "ARCHIVE_SHA256.json").read_text(encoding="utf-8"))
    for name, expected in manifest.items():
        path = ROOT / name
        assert path.is_file(), f"Missing archive file: {name}"
        assert hashlib.sha256(path.read_bytes()).hexdigest() == expected, name
    with (ROOT / "ALL_ITEM_RESULTS.csv").open(encoding="utf-8", newline="") as file:
        rows = list(csv.DictReader(file))
    counts = Counter(row["status"] for row in rows)
    assert len({(r["subject_key"], r["item"]) for r in rows}) == len(rows) == 10296
    assert counts == {
        "scored": 6342,
        "not_applicable": 1225,
        "indeterminate": 23,
        "no_complete_answer": 2706,
    }
    assert all(r["score"] or r["reason"] for r in rows)
    print(
        json.dumps(
            {
                "archive_files_verified": len(manifest),
                "item_rows": len(rows),
                "statuses": dict(counts),
                "model_calls": 0,
            }
        )
    )


if __name__ == "__main__":
    main()
