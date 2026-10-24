"""Read-only access to a portable snapshot of the 24 saved interviews."""

import json
from functools import lru_cache
from pathlib import Path

STUDY_ROOT = Path(__file__).resolve().parent / "study-data"
ORIGINAL_VERSION = {
    "id": "original",
    "label": "Original rubric",
    "scope": "Josh’s original clinical reasoning rubric",
}


@lru_cache(maxsize=1)
def dataset():
    return json.loads((STUDY_ROOT / "interviews.json").read_text(encoding="utf-8"))


def summary():
    data = dataset()
    return {
        **{
            k: v
            for k, v in data.items()
            if k not in {"interviews", "source_hashes", "output_hashes"}
        },
        "interviews": [
            {
                k: r[k]
                for k in (
                    "case_id",
                    "model",
                    "model_slug",
                    "question_count",
                    "scores",
                    "request_observation",
                )
            }
            for r in data["interviews"]
        ],
    }


def interview(case, model_slug):
    for row in dataset()["interviews"]:
        if row["case_id"] == case and row["model_slug"] == model_slug:
            return row
    raise FileNotFoundError("Saved interview not found.")


def output(name):
    # Only named, hash-verified snapshot outputs can be downloaded.
    import hashlib

    expected = dataset()["output_hashes"].get(name)
    if not expected:
        raise FileNotFoundError("Saved output not found.")
    raw = (STUDY_ROOT / name).read_bytes()
    if hashlib.sha256(raw).hexdigest() != expected:
        raise ValueError("The saved output failed its integrity check.")
    return raw
