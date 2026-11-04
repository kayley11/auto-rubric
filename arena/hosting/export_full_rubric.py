"""Publish read-only full-rubric results without private paths or transport data."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

ARENA = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ARENA))
from public_presentation import display_data  # noqa: E402 -- Direct CLI entry point.

POINTER = ARENA / ".data/full-rubric-source.json"
DESTINATION = ARENA / "public/full-rubric-review"
SPECS = {
    "kcl-lite": ("arc:lite", "arc:lite", "Qwen3.8-27B", "kcl"),
    "kcl-chat": ("arc:chat", "arc:chat", "Qwen3.8-Flash-Next", "kcl"),
    "kcl-apex": ("arc:apex", "arc:apex", "GLM-5.3", "kcl"),
    "gemma4-free": ("Gemma 4 31B", "google/gemma-4-31b-it:free", "", "openrouter"),
    "nemotron-free": (
        "Nemotron 3 Ultra",
        "nvidia/nemotron-3-ultra-550b-a55b:free",
        "",
        "openrouter",
    ),
    "qwen38-groq": ("Qwen3.8 27B", "qwen/qwen3.8-27b", "", "groq"),
}


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(display_data(value), ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def export(run, destination=DESTINATION):
    run, destination = Path(run), Path(destination)
    checks, validation = read(run / "CHECKS.json"), read(run / "VALIDATION.json")
    assert checks["all_available_answers_processed"] and checks["completed_review_records"] == 345
    assert checks["all_rows_have_a_score_or_reason"] and checks["score_categories_valid"]
    assert validation["secret_values_found"] == []
    rubric = read(run / "rubric.json")
    criteria = [
        {
            k: c[k]
            for k in ("id", "name", "definition", "anchors", "context", "allowed_scores")
            if k in c
        }
        for c in rubric["criteria"]
    ]
    rows = list(csv.DictReader((run / "ALL_ITEM_RESULTS.csv").open()))
    by_subject, issues = defaultdict(list), defaultdict(list)
    for row in rows:
        by_subject[row["subject_key"]].append(row)
    for issue in checks["judge_output_issues"]:
        issues[issue["subject_key"], issue["item"]].append(
            {"type": issue["issue"], "detail": issue["detail"]}
        )
    subjects = defaultdict(dict)
    for subject in read(run / "subjects.json"):
        subjects[subject["case_key"]][subject["answer_model"]] = subject
    index = {
        "id": "full-rubric-completion-78-20261104",
        "label": "Full rubric · 4 Nov 2026",
        "rule_version": rubric["version"],
        "updated_at": checks["updated_at"],
        "case_count": 78,
        "complete_answers": 345,
        "missing_answers": 123,
        "criteria_count": 22,
        "item_statuses": checks["item_statuses"],
        "item_counts": checks["item_counts"],
        "output_flags": dict(Counter(x["issue"] for x in checks["judge_output_issues"])),
        "clinical_status": "awaiting confirmation",
        "requirements_status": "awaiting confirmation",
        "condition_note": "New full-profile review of the same saved answers. The rubric, evidence supplied to the judge and review format differ from some earlier ratings.",
        "cases": [],
    }
    for entry in read(run / "cases.json"):
        c, key = entry["case"], entry["case_key"]
        plan = read(run / "applicability" / f"{key}.json")
        models = []
        for slug, (name, model_id, backend, service) in SPECS.items():
            subject = subjects[key][slug]
            inp = read(run / "inputs" / f"{subject['subject_key']}.json")
            state = inp["state"]
            review_path = run / "reviews" / f"{subject['subject_key']}.json"
            review = read(review_path) if review_path.exists() else {}
            scores = []
            for row in by_subject[subject["subject_key"]]:
                score = {
                    "item": row["item"],
                    "status": "complete" if row["status"] == "scored" else row["status"],
                    "score": int(row["score"]) if row["score"] else None,
                    "label": row["score"] or None,
                    "reason": row["reason"],
                    "evidence_quote": row["evidence_quote"],
                    "quote_check": row["quote_check"],
                    "review_flags": issues[subject["subject_key"], row["item"]],
                    "applicability_reason": row["applicability_reason"],
                }
                if row["item"] == "D5c":
                    score["requirement_checks"] = (
                        review.get("parts", {}).get("d5c", {}).get("requirement_checks", [])
                    )
                scores.append(score)
            turns = [
                {
                    "number": t["number"],
                    "question": t.get("question", ""),
                    "assessment": t.get("assessment", {}),
                    "returned": [
                        {
                            k: f.get(k, "")
                            for k in ("id", "channel", "patient_text", "text", "context")
                        }
                        for f in t.get("returned", [])
                    ],
                    "feedback": t.get("feedback", ""),
                }
                for t in state.get("turns", [])
            ]
            models.append(
                {
                    "id": slug,
                    "name": name,
                    "model_id": model_id,
                    "backend_model": backend,
                    "service": service,
                    "answer_status": "complete"
                    if subject["has_complete_answer"]
                    else "no_complete_answer",
                    "answer": state.get("final_answer", "")
                    if subject["has_complete_answer"]
                    else "",
                    "word_count": state.get("word_count"),
                    "turns": turns,
                    "closing_note": state.get("closing_note"),
                    "scores": scores,
                    "ratings_complete": sum(s["status"] == "complete" for s in scores),
                    "not_applicable_count": sum(s["status"] == "not_applicable" for s in scores),
                    "indeterminate_count": sum(s["status"] == "indeterminate" for s in scores),
                    "linked_observations": review.get("parts", {})
                    .get("main", {})
                    .get("linked_observations", []),
                }
            )
        packet = {
            "id": c["id"],
            "study_id": index["id"],
            "study_date": "2026-11-04",
            "source": "frozen full-rubric review",
            "updated_at": checks["updated_at"],
            "title": c["title"],
            "audience": c["audience"],
            "mode": "written-record" if c["mode"] != "interview" else "interview",
            "task_type": c.get("task_type", ""),
            "task": c["task"],
            "opening": c.get("opening", ""),
            "initial_facts": c.get("initial_facts", ""),
            "reference": c.get("reference", ""),
            "source_url": c.get("source", ""),
            "source_location": c.get("source_location", ""),
            "decision_point": c.get("decision_point", ""),
            "max_questions": 6 if c["mode"] == "interview" else 0,
            "requirements": plan["candidate_requirements"],
            "clinical_status": "awaiting confirmation",
            "requirements_status": "awaiting confirmation",
            "judge": "arc:apex",
            "rule_version": rubric["version"],
            "scoring_condition": "full-profile-review-20261104",
            "condition_note": index["condition_note"],
            "d5c_mode": plan["d5c_mode"],
            "criteria": criteria,
            "models": models,
        }
        write(destination / f"{c['id']}.json", packet)
        index["cases"].append(
            {
                "id": c["id"],
                "title": c["title"],
                "status_counts": dict(Counter(r["status"] for m in models for r in m["scores"])),
            }
        )
    write(destination / "index.json", index)
    (destination / "SUMMARY.md").write_text(
        "\n".join(
            [
                "# Full-rubric review · 4 November 2026",
                "",
                "The original 78 tasks and 345 complete saved answers were fixed. All 22 main rubric items were checked, including all four reasoning-quality items (D2) and all three communication and instruction-following items (D7).",
                "",
                "| Result | Count |",
                "|---|---:|",
                f"| Numerical item ratings | {checks['item_statuses']['scored']} |",
                f"| Not applicable | {checks['item_statuses']['not_applicable']} |",
                f"| Cannot assess from the available evidence | {checks['item_statuses']['indeterminate']} |",
                "| Case × service positions without a complete answer | 123 |",
                "",
                "N/A means that the task does not provide the relevant assessment opportunity. Cannot assess means that necessary assessment evidence is missing. No answer means no complete saved final answer existed for that configuration. Click each cell in Case review for its specific reason.",
                "",
                "## Scoring condition",
                "",
                index["condition_note"],
                "The scoring model is arc:apex (GLM-5.3). Main review uses actually supplied information, the task, saved questions/replies and the unchanged final answer. D5c is reviewed separately with a frozen candidate checklist. Where the source defines only 1, 3 and 5, those are the only numerical categories used.",
                "",
                "## Outputs requiring review",
                "",
                "Three D5c outputs mark an essential requirement as not requested but return a score above the specified maximum of 2: B09 / arc:lite = 3; B10 / Groq Qwen = 4; J01 / arc:chat = 3.",
                "Six requirement identifiers do not match their case checklist. A further 740 judge excerpts could not be matched word for word; this is not a count of clinical hallucinations. Flagged cells carry †, and the original scores and explanations are retained.",
                "",
                "Clinical references, candidate essential requirements and applicability choices are awaiting confirmation. Earlier selected-item results remain available under Earlier selected items. No new clinical answers were generated.",
                "",
            ]
        ),
        encoding="utf-8",
    )
    columns = [
        "case_id",
        "answer_model_label",
        "item",
        "item_name",
        "status",
        "score",
        "old_score",
        "reason",
        "evidence_quote",
        "review_flags",
        "rules_version",
        "clinical_status",
    ]
    with (destination / "ALL_ITEM_RESULTS.csv").open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        writer.writerows([{k: display_data(row[k]) for k in columns} for row in rows])
    return index


def refresh():
    if not POINTER.exists():
        return None
    return export(read(POINTER)["run_dir"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("run", type=Path)
    parser.add_argument("--register", action="store_true")
    args = parser.parse_args()
    result = export(args.run)
    if args.register:
        POINTER.parent.mkdir(parents=True, exist_ok=True)
        POINTER.write_text(
            json.dumps({"run_dir": str(args.run.resolve())}) + "\n", encoding="utf-8"
        )
    print(f"Exported {result['case_count']} cases, 345 answers and 22 items per configuration.")
