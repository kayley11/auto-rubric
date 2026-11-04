"""Read-only, public display copies of the current five-model study.

The local source pointer is ignored by Git. Portable snapshots keep the same
results available when the host is offline. Neither path starts a model job.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import UTC, datetime
from functools import lru_cache
from pathlib import Path

from public_presentation import display_data

ROOT = Path(__file__).resolve().parent
SNAPSHOTS = ROOT / "public/model-comparison"
SOURCE = ROOT / ".data/comparison-source.json"
BMJ_SOURCE = ROOT / ".data/bmj-comparison-source.json"
SUPPLIED_SOURCE = ROOT / ".data/supplied-comparison-source.json"
SERIES_SOURCE = ROOT / ".data/series-comparison-source.json"
QWEN_SOURCE = ROOT / ".data/qwen-comparison-source.json"
CASE_ID = re.compile(
    r"(?:C0[1-5]|N0[1-6]|CAND(?:0[1-9]|1[0-9]|2[0-2])|B(?:0[1-9]|1[0-9]|2[0-2])|J0[1-4]|JA(?:0[124-9]|10)|SR(?:0[1-9]|10))\Z"
)
MODEL_NAMES = {
    "kcl-lite": "arc:lite",
    "kcl-chat": "arc:chat",
    "kcl-apex": "arc:apex",
    "gemma4-free": "Gemma 4 31B",
    "nemotron-free": "Nemotron 3 Ultra",
    "qwen38-groq": "Qwen3.8 27B",
}


def read(path, default=None):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


@lru_cache(maxsize=2048)
def _grade(path, stamp, size):
    value = read(path, {})
    result = value.get("result", {})
    # Never expose attempts, provider envelopes, headers or account metadata.
    return {
        "status": "complete" if value.get("status") == "complete" else "needs_retry",
        "label": result.get("label") if value.get("status") == "complete" else None,
        "score": result.get("score") if value.get("status") == "complete" else None,
        "reason": result.get("reason", "") if value.get("status") == "complete" else "",
    }


def grade(path):
    try:
        stat = path.stat()
        return _grade(str(path), stat.st_mtime_ns, stat.st_size)
    except OSError:
        return {"status": "pending", "label": None, "score": None, "reason": ""}


def source_directory(pointer_file=None):
    pointer = read(pointer_file or SOURCE, {})
    path = Path(pointer.get("run_dir", ""))
    if pointer.get("run_dir") and (path / "protocol.json").is_file():
        return path
    return None


def grading_directory(directory):
    """Use the recorded scoring condition; historical cohorts keep their grades."""
    selected = read(directory / "GRADE_SELECTION.json", {})
    relative = selected.get("relative_directory", "grades")
    if relative not in {"grades", "clean_scoring/grades"}:
        raise ValueError("Unknown saved scoring condition.")
    return directory / relative


def _inputs(directory):
    protocol = read(directory / "protocol.json", {})
    cases = read(directory / "cases.json", [])
    rubric = read(directory / "rubric_snapshot.json", {})
    if (
        not cases
        or len({c["id"] for c in cases}) != len(cases)
        or any(not CASE_ID.fullmatch(c["id"]) for c in cases)
        or len(protocol.get("answer_models", [])) not in {1, 5}
        or protocol.get("planned_final_answers") != len(cases) * len(protocol["answer_models"])
    ):
        raise ValueError("The saved model study source is incomplete.")
    return protocol, cases, rubric


def _updated(directory):
    paths = [directory / "COLLECTION_EVENTS.json", directory / "protocol.json"]
    paths += list((directory / "answers").glob("*/*.json"))
    paths += list(grading_directory(directory).glob("*/*.json"))
    # Additional Qwen runs save their evidence-only grades directly under grades/.
    paths += list((directory / "grades").glob("*/*.json"))
    paths.append(directory / "GRADE_SELECTION.json")
    stamp = max((p.stat().st_mtime for p in paths if p.exists()), default=0)
    return datetime.fromtimestamp(stamp, UTC).isoformat()


def _events(directory):
    latest = {}
    availability = {}
    for event in read(directory / "COLLECTION_EVENTS.json", []):
        if event.get("phase") != "generation":
            continue
        latest[event.get("case"), event.get("model")] = event
        availability[event.get("model")] = event
    return latest, availability


def _status(answer, event):
    if answer.get("status") == "complete":
        return "complete"
    if event.get("status") == "deferred":
        return "rate_limited"
    if event.get("status") in {"failed", "error"}:
        return "needs_retry"
    if answer:
        return "partial"
    return "queued"


def build_case(directory, identifier, *, source="live", inputs=None, grade_directory=None):
    if not CASE_ID.fullmatch(identifier):
        raise ValueError("Unknown case.")
    protocol, cases, rubric = inputs or _inputs(directory)
    case = next((c for c in cases if c["id"] == identifier), None)
    if not case:
        raise ValueError("Unknown case.")
    events, availability = _events(directory)
    selected = read(directory / "GRADE_SELECTION.json", {})
    grade_dir = grade_directory or grading_directory(directory)
    items = {c["id"]: c for c in rubric["criteria"]}
    metadata = read(directory / "MODEL_METADATA.json", {})
    saved_models = metadata.get("models", metadata.get("data", []))
    catalogue = read(ROOT / "public/model-catalogue.json", {})
    current_models = catalogue.get("models", [])
    backends = {m["id"]: m.get("backend_model", "") for m in current_models}
    backends.update({m["id"]: m.get("backend_model", "") for m in saved_models})
    models = []
    for spec in protocol["answer_models"]:
        slug = spec["id"]
        answer = read(directory / "answers" / slug / f"{identifier}.json", {})
        scores = [
            {"item": cid, **grade(grade_dir / slug / f"{identifier}.{cid}.json")}
            for cid in case["criteria"]
        ]
        turns = [
            {
                "number": t["number"],
                "question": t.get("question", ""),
                "assessment": t.get("assessment", {}),
                "returned": [
                    {k: f.get(k) for k in ("id", "channel", "patient_text", "text", "context")}
                    for f in t.get("returned", [])
                ],
                "feedback": t.get("feedback", ""),
            }
            for t in answer.get("turns", [])
        ]
        models.append(
            {
                "id": slug,
                "name": MODEL_NAMES[slug],
                "model_id": spec["model"],
                "backend_model": backends.get(spec["model"], ""),
                "backend_mapping_source": "saved provider catalogue"
                if any(m["id"] == spec["model"] for m in saved_models)
                else "current provider catalogue, 2 Nov 2026",
                "service": spec["service"],
                "answer_status": _status(answer, events.get((identifier, slug), {})),
                "availability": "rate_limited"
                if availability.get(slug, {}).get("status") == "deferred"
                else "",
                "answer": answer.get("final_answer", ""),
                "word_count": answer.get("word_count"),
                "started_at": answer.get("started_at"),
                "finished_at": answer.get("finished_at"),
                "turns": turns,
                "scores": scores,
                "ratings_complete": sum(s["status"] == "complete" for s in scores),
            }
        )
    return display_data(
        {
            "id": identifier,
            "study_id": protocol["id"],
            "source": source,
            "updated_at": _updated(directory),
            "title": case["title"],
            "audience": case["audience"],
            "mode": case["mode"],
            "task_type": case.get("task_type", ""),
            "study_date": protocol.get("created_on", "2026-10-29"),
            "task": case["task"],
            "opening": case.get("opening", ""),
            "initial_facts": case.get("initial_facts", ""),
            "decision_point": selected.get("decision_point", case.get("decision_point", "")),
            "scoring_condition": selected.get("condition", "retained"),
            "reference": case.get("reference", ""),
            "requirements": [
                {k: v for k, v in r.items() if k != "approval"}
                for r in case.get("requirements", [])
            ],
            "clinical_status": "awaiting confirmation",
            "requirements_status": "awaiting confirmation",
            "source_url": case["source"],
            "source_location": case["source_location"],
            "judge": protocol["judge_model"],
            "rule_version": rubric["version"],
            "rules": protocol["rules"],
            "max_questions": protocol["max_questions"],
            "criteria": [
                {
                    k: items[cid][k]
                    for k in (
                        "id",
                        "name",
                        "anchors",
                        "definition",
                        "decision_point_rule",
                        "equivalence_rule",
                        "essential_scoring_rules",
                        "relationship_to_D5c",
                        "notes_vs_patient_directed_explanations",
                        "applicability",
                        "rule_version",
                        "allowed_numeric_labels",
                        "missing_anchors",
                    )
                    if k in items[cid]
                }
                for cid in case["criteria"]
            ],
            "models": models,
        }
    )


def build_index(directory, *, source="live", records=None):
    inputs = _inputs(directory)
    protocol, cases, rubric = inputs
    records = records or [
        build_case(directory, c["id"], source=source, inputs=inputs) for c in cases
    ]
    rows = [
        {
            "id": c["id"],
            "title": c["title"],
            "answers_complete": sum(m["answer_status"] == "complete" for m in c["models"]),
            "ratings_complete": sum(m["ratings_complete"] for m in c["models"]),
            "ratings_planned": len(c["criteria"]) * len(protocol["answer_models"]),
        }
        for c in records
    ]
    return {
        "study_id": protocol["id"],
        "source": source,
        "updated_at": _updated(directory),
        "case_count": len(cases),
        "planned_answers": protocol["planned_final_answers"],
        "answers_complete": sum(c["answers_complete"] for c in rows),
        "planned_ratings": protocol["planned_item_ratings"],
        "ratings_complete": sum(c["ratings_complete"] for c in rows),
        "models": [
            {"id": m["id"], "name": MODEL_NAMES[m["id"]], "model_id": m["model"]}
            for m in protocol["answer_models"]
        ],
        "judge": protocol["judge_model"],
        "rule_version": rubric["version"],
        "clinical_status": "awaiting confirmation",
        "cases": rows,
    }


def combined_index(indices):
    """Collection counts only; cohorts retain their own design and rule metadata."""
    if len(indices) == 1:
        return indices[0]
    return {
        "study_id": "saved-five-model-cohorts",
        "source": "combined",
        "updated_at": max(i["updated_at"] for i in indices),
        "case_count": sum(i["case_count"] for i in indices),
        "planned_answers": sum(i["planned_answers"] for i in indices),
        "answers_complete": sum(i["answers_complete"] for i in indices),
        "planned_ratings": sum(i["planned_ratings"] for i in indices),
        "ratings_complete": sum(i["ratings_complete"] for i in indices),
        "models": indices[0]["models"],
        "judge": indices[0]["judge"],
        "clinical_status": "awaiting confirmation",
        "cohorts": indices,
        "cases": [c for i in indices for c in i["cases"]],
    }


def dataset(identifier=None):
    if identifier is not None and not CASE_ID.fullmatch(identifier):
        raise ValueError("Unknown case.")
    if identifier:
        pointer = (
            SERIES_SOURCE
            if identifier.startswith("SR")
            else SUPPLIED_SOURCE
            if identifier.startswith("J")
            else BMJ_SOURCE
            if identifier.startswith("B")
            else SOURCE
        )
        directory = source_directory(pointer)
        if directory:
            return with_qwen(build_case(directory, identifier))
    else:
        indices = []
        for pointer in (SOURCE, BMJ_SOURCE, SUPPLIED_SOURCE, SERIES_SOURCE):
            directory = source_directory(pointer)
            if directory:
                indices.append(build_index(directory))
        snapshot = read(SNAPSHOTS / "index.json", {})
        # A temporarily unavailable local source must not hide its saved cohort.
        cohorts = snapshot.get("cohorts") or ([snapshot] if snapshot.get("study_id") else [])
        saved = {row["study_id"]: row for row in cohorts}
        saved.update({row["study_id"]: row for row in indices})
        if saved:
            return combined_index(list(saved.values()))
    data = read(SNAPSHOTS / (f"{identifier}.json" if identifier else "index.json"))
    if not data:
        raise ValueError("No saved comparison is available.")
    return with_qwen(data) if identifier else data


def with_qwen(data):
    """Append read-only saved Qwen results without changing the original five runs."""
    pointer = read(QWEN_SOURCE, {})
    if not pointer.get("run_dir"):
        return data
    identifier = data["id"]
    cohort = (
        "series10"
        if identifier.startswith("SR")
        else "supplied13"
        if identifier.startswith("J")
        else "bmj22"
        if identifier.startswith("B")
        else "earlier33"
    )
    directory = Path(pointer["run_dir"]) / "cohorts" / cohort
    if not (directory / "protocol.json").is_file():
        return data
    # Qwen's runner writes its selected evidence-only judgments to grades/;
    # the copied parent selection describes the condition, not its output path.
    extra = build_case(
        directory, identifier, source="additional saved run", grade_directory=directory / "grades"
    )
    # Never place grades from a different task or scoring setup in the same table.
    for key in (
        "task",
        "initial_facts",
        "opening",
        "mode",
        "criteria",
        "reference",
        "requirements",
        "judge",
        "rule_version",
        "scoring_condition",
    ):
        if data.get(key) != extra.get(key):
            return {
                **data,
                "additional_model_notice": (
                    "Qwen results use a different saved setup "
                    "and are not included in this comparison."
                ),
            }
    models = []
    for model in extra["models"]:
        if model["id"] != "qwen38-groq":
            continue
        models.append(
            {
                **model,
                "supplemental": True,
                "study_id": extra["study_id"],
                "judge": extra["judge"],
                "rule_version": extra["rule_version"],
                "scoring_condition": extra["scoring_condition"],
                "comparison_note": (
                    "Same saved case, task and rubric; collected in an additional run."
                ),
            }
        )
    return {
        **data,
        "updated_at": max(data["updated_at"], extra["updated_at"]),
        "models": [m for m in data["models"] if m["id"] != "qwen38-groq"] + models,
    }


def refresh_display_snapshots():
    """Refresh portable display copies; research inputs, grades and raw files stay untouched."""
    index = dataset()
    records = [dataset(row["id"]) for row in index["cases"]]
    for record in records:
        path = SNAPSHOTS / f"{record['id']}.json"
        temporary = path.with_suffix(".tmp")
        temporary.write_text(
            json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        temporary.replace(path)
    # These aggregate counts continue to describe the original five-model batches.
    index["additional_model"] = {
        "id": "qwen38-groq",
        "name": "Qwen3.8 27B",
        "answers_complete": sum(
            m["answer_status"] == "complete"
            for c in records
            for m in c["models"]
            if m["id"] == "qwen38-groq"
        ),
        "ratings_complete": sum(
            m["ratings_complete"] for c in records for m in c["models"] if m["id"] == "qwen38-groq"
        ),
    }
    path = SNAPSHOTS / "index.json"
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)
    return index


def export(directory, destination=SNAPSHOTS, register=False):
    destination.mkdir(parents=True, exist_ok=True)
    inputs = _inputs(directory)
    records = [build_case(directory, c["id"], source="snapshot", inputs=inputs) for c in inputs[1]]
    index = build_index(directory, source="snapshot", records=records)
    for name, value in [(c["id"], c) for c in records]:
        path = destination / f"{name}.json"
        temporary = path.with_suffix(".tmp")
        temporary.write_text(
            json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        temporary.replace(path)
    # Retain every previously exported cohort, without rewriting its case files.
    grouped = {}
    for path in destination.glob("*.json"):
        if CASE_ID.fullmatch(path.stem):
            value = read(path, {})
            if value.get("study_id"):
                grouped.setdefault(value["study_id"], []).append(value)
    summaries = []
    for sid, saved in grouped.items():
        cases = sorted(saved, key=lambda c: c["id"])
        summaries.append(
            {
                "study_id": sid,
                "source": "snapshot",
                "updated_at": max(c["updated_at"] for c in cases),
                "case_count": len(cases),
                "planned_answers": len(cases) * 5,
                "answers_complete": sum(
                    m["answer_status"] == "complete" for c in cases for m in c["models"]
                ),
                "planned_ratings": sum(len(c["criteria"]) * 5 for c in cases),
                "ratings_complete": sum(m["ratings_complete"] for c in cases for m in c["models"]),
                "models": [
                    {k: m[k] for k in ("id", "name", "model_id")} for m in cases[0]["models"]
                ],
                "judge": cases[0]["judge"],
                "rule_version": cases[0]["rule_version"],
                "cases": [
                    {
                        "id": c["id"],
                        "title": c["title"],
                        "answers_complete": sum(
                            m["answer_status"] == "complete" for m in c["models"]
                        ),
                        "ratings_complete": sum(m["ratings_complete"] for m in c["models"]),
                        "ratings_planned": len(c["criteria"]) * 5,
                    }
                    for c in cases
                ],
            }
        )
    path = destination / "index.json"
    temporary = path.with_suffix(".tmp")
    temporary.write_text(
        json.dumps(combined_index(summaries), ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    temporary.replace(path)
    if register:
        if all(c["id"].startswith("SR") for c in inputs[1]):
            pointer = SERIES_SOURCE
        elif all(c["id"].startswith("J") for c in inputs[1]):
            pointer = SUPPLIED_SOURCE
        else:
            pointer = BMJ_SOURCE if all(c["id"].startswith("B") for c in inputs[1]) else SOURCE
        pointer.parent.mkdir(parents=True, exist_ok=True)
        pointer.write_text(
            json.dumps({"run_dir": str(directory.resolve())}) + "\n", encoding="utf-8"
        )
    print(
        f"Exported {len(records)} cases, 5 models, {index['answers_complete']} answers "
        f"and {index['ratings_complete']} saved ratings."
    )
    return index


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-dir", required=True, type=Path)
    parser.add_argument("--register-live", action="store_true")
    args = parser.parse_args()
    export(args.run_dir, register=args.register_live)
