"""Copy the frozen interview study into the UI; never alter or rerun its sources."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
from pathlib import Path

CASES = {
    "C01": (
        "Swelling and urine changes",
        "Clinician",
        "Are the proposed laboratory requests essential, and which alternatives are sufficient?",
    ),
    "C02": (
        "Gait imbalance and earlier neurological episodes",
        "Clinician",
        "Which history and confirmation requests are essential rather than helpful?",
    ),
    "C03": (
        "Persistent bloody diarrhoea",
        "Clinician",
        "Which travel, back and skin enquiries are essential? What broad requests count?",
    ),
    "C04": (
        "Collapses after a medicine change",
        "Clinician",
        "Is cardiac history essential, and what general history request is sufficient?",
    ),
    "C05": (
        "Explaining two seizures",
        "Patient",
        "Can final questions satisfy D5c? Does the unsupported ‘unprovoked’ wording "
        "materially affect D3a?",
    ),
    "N02": (
        "Night-time episodes",
        "Patient and family",
        "Is episode-related glucose essential? Is requesting it at question 6 timely enough?",
    ),
    "N04_INITIAL": (
        "Headache on readmission",
        "Clinician",
        "Are readmission records and infection investigations both essential? "
        "Which requests are equivalent?",
    ),
    "N05": (
        "Multisystem findings",
        "Clinician",
        "Which confirmation routes are clinically acceptable alternatives at this decision point?",
    ),
}

# Short researcher observations from checked requests, in lite/chat/apex order.
OBSERVATIONS = {
    "C01": ["Renal tests asked; unavailable"] * 3,
    "C02": ["Earlier episodes obtained"] * 3,
    "C03": [
        "Travel not requested",
        "Back/skin history not obtained",
        "Back/skin history not obtained",
    ],
    "C04": [
        "Cardiac history obtained",
        "Cardiac history not requested",
        "Cardiac history not requested",
    ],
    "C05": ["Priorities asked at the end", "Priorities asked at Q6", "Priorities asked at the end"],
    "N02": ["Glucose not requested", "Glucose not requested", "Glucose requested at Q6"],
    "N04_INITIAL": [
        "Current reports / infection not requested",
        "Infection evidence not requested",
        "Current reports not requested; infection reply blocked",
    ],
    "N05": ["TTR asked; unavailable", "PYP result obtained at Q6", "TTR asked; unavailable"],
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def build(source, output):
    source, output = Path(source).resolve(), Path(output).resolve()
    if output == source or source in output.parents:
        raise ValueError("The UI snapshot must be outside the original study directory.")
    audit_dir = source / "runs/information_audit_20261024"
    scores_dir = source / "runs/josh_rules_rescore_20261024"
    provenance = {}

    def read(path):
        raw = path.read_bytes()
        if re.search(rb"\bsk-[A-Za-z0-9_-]{12,}", raw):
            raise ValueError("A source contains a possible credential; nothing was imported.")
        provenance[str(path.relative_to(source))] = digest(raw)
        return raw

    audit = json.loads(read(audit_dir / "AUDIT.json"))
    results = json.loads(read(scores_dir / "RESULTS.json"))
    requirements = json.loads(read(scores_dir / "candidate_requirements.json"))
    author_rules = json.loads(read(scores_dir / "author_rules.json"))
    facts = list(csv.DictReader(read(audit_dir / "FACT_CHECKS.csv").decode().splitlines()))
    turns = list(csv.DictReader(read(audit_dir / "TURN_CHECKS.csv").decode().splitlines()))
    original = json.loads(
        (Path(__file__).resolve().parents[1] / "rubric.json").read_text(encoding="utf-8")
    )
    grade_index = {(r["case"], r["model"], r["item"]): r for r in results["primary"]}
    copied = {}
    records = []
    for record in audit["records"]:
        case, model = record["case_id"], record["model"]
        raw = read(source / record["source_state"])
        if digest(raw) != record["source_sha256"]:
            raise ValueError(f"The frozen interview changed: {case}, {model}")
        state = json.loads(raw)
        if state["final_answer"] != record["final_answer"]:
            raise ValueError(f"Answer mismatch: {case}, {model}")
        slug = model.replace(":", "-")
        copied[f"source-{case}-{slug}.json"] = raw
        grades = {}
        for item in ("D5c", "D3a"):
            grade = grade_index[case, model, item]
            if grade["old_score"] != state["grades"][item]["score"]:
                raise ValueError(f"Historical score mismatch: {case}, {model}, {item}")
            grades[item] = {
                k: grade[k] for k in ("old_score", "new_score", "old_reason", "new_reason")
            }
            grades[item]["old_unanchored"] = state["grades"][item].get("unanchored", False)
        records.append(
            {
                **record,
                "model_slug": slug,
                "scores": grades,
                "fact_checks": [r for r in facts if (r["case"], r["model"]) == (case, model)],
                "turn_checks": [r for r in turns if (r["case"], r["model"]) == (case, model)],
                "question_count": state["question_turns"],
                "request_observation": OBSERVATIONS[case][
                    ["arc:lite", "arc:chat", "arc:apex"].index(model)
                ],
                "source_download": f"/api/study/source/{case}/{slug}",
            }
        )
    expected = {(case, model) for case in CASES for model in ("arc:lite", "arc:chat", "arc:apex")}
    if {(r["case_id"], r["model"]) for r in records} != expected or len(records) != 24:
        raise ValueError("Expected exactly eight cases × three models.")
    for case in CASES:
        copied[f"case-{case}.txt"] = read(scores_dir / "case_outputs" / f"{case}.txt")
    copied["all-output.txt"] = read(scores_dir / "RAW_OUTPUT.txt")
    copied["scores.csv"] = read(scores_dir / "SCORES.csv")
    dataset = {
        "schema_version": 1,
        "title": "Eight cases. Three models.",
        "date": "2026-10-24",
        "models": ["arc:lite", "arc:chat", "arc:apex"],
        "judge": "arc:apex",
        "max_turns": 6,
        "conditions": (
            "The same case information, release rules and six-question limit; a fixed arc:apex "
            "judge. Interviews and final answers were not regenerated for rescoring."
        ),
        "comparison_note": (
            "Regrading changed the anchors, explicit candidate requirements and evidence "
            "windows together. Score changes do not show a change in model behaviour."
        ),
        "essentiality_status": (
            "Researcher-proposed requirements — awaiting Josh’s clinical review."
        ),
        "original_rules": {r["id"]: r for r in original["criteria"] if r["id"] in ("D3a", "D5c")},
        "revised_rules": {item: author_rules[item] for item in ("D3a", "D5c")},
        "evidence_windows": {
            "D5c": (
                "Actual requests and public assessment notes, the selected fact inventory and "
                "candidate requirements. Adequate requests count even if results are unavailable "
                "or the simulator fails to return them. Explicit final questions are included "
                "as declared; they have no replies."
            ),
            "D3a": (
                "Only information actually received, the original task and the unchanged final "
                "answer. No hidden results, full-case reference or candidate checklist. "
                "Patient-facing synthesis in C05/N02 was an exploratory study assumption."
            ),
        },
        "cases": [
            {
                "id": case,
                "name": name,
                "audience": audience,
                "review_question": question,
                "requirements": requirements[case],
            }
            for case, (name, audience, question) in CASES.items()
        ],
        "interviews": records,
        "conditional_results": results["conditional"],
        "clarified_timing": results["clarified_timing"],
        "n04_offline_check": audit["n04_offline_check"],
        "source_hashes": provenance,
        "output_hashes": {name: digest(raw) for name, raw in copied.items()},
    }
    # Read and validate every input before writing the self-contained UI copy.
    output.mkdir(parents=True, exist_ok=True)
    for name, raw in copied.items():
        (output / name).write_bytes(raw)
    (output / "interviews.json").write_text(
        json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    for path, expected_hash in provenance.items():
        if digest((source / path).read_bytes()) != expected_hash:
            raise ValueError(f"Source changed during import: {path}")
    return {
        "cases": 8,
        "interviews": len(records),
        "turns": sum(len(r["turns"]) for r in records),
        "verified_source_files": len(provenance),
        "copied_outputs": len(copied),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument(
        "--output", type=Path, default=Path(__file__).resolve().parents[1] / "study-data"
    )
    args = parser.parse_args()
    print(json.dumps(build(args.source, args.output), indent=2))
