"""Import the checked N04 follow-up and eight fixed interview cases, without rerunning them."""

import argparse
import ast
import hashlib
import json
import re
from pathlib import Path


def build(source, destination):
    source, destination = Path(source).resolve(), Path(destination).resolve()
    run = source / "runs/n04_followup_corrected_20261025"
    hashes = {}

    def read(path):
        raw = path.read_bytes()
        if re.search(rb"\bsk-[A-Za-z0-9_-]{12,}", raw):
            raise ValueError("Possible credential found; import stopped.")
        hashes[str(path.relative_to(source))] = hashlib.sha256(raw).hexdigest()
        return raw

    def obj(path):
        return json.loads(read(path))

    cohort = obj(run / "mri_scope/cohort_inputs.json")
    results = [r for r in obj(run / "RESULTS.json") if r["used_in_primary_comparison"]]
    assert len(results) == 42
    protocol = obj(run / "protocol.json")
    case = protocol["cases"][0]
    states = {}
    for model in protocol["answer_models"]:
        if model == "arc:lite":
            path = run / "mri_scope/arc-lite/outputs/N04_INITIAL.json"
        elif model == "arc:chat":
            path = run / "repaired/arc-chat/outputs/N04_INITIAL.json"
        else:
            path = run / "arc-apex/outputs/N04_INITIAL.json"
        states[model] = obj(path)
    records = []
    question_map = {
        ("old", "arc:lite"): [[1, 2, 3], [4], [3]],
        ("old", "arc:chat"): [[1, 2, 3, 6], [4, 5], [1]],
        ("old", "arc:apex"): [[1, 2, 6], [5], [3]],
        ("fresh", "arc:lite"): [[1, 2, 3], [5, 6], [3]],
        ("fresh", "arc:chat"): [[1, 2, 3], [4, 5], [1]],
        ("fresh", "arc:apex"): [[2, 3, 5], [1], [4]],
    }
    observations = {
        ("old", "arc:lite"): "No readmission report or targeted infection request.",
        ("old", "arc:chat"): "Readmission reports requested; no targeted infection request.",
        (
            "old",
            "arc:apex",
        ): "Infection request made; old routing blocked its return. No readmission report request.",
        (
            "fresh",
            "arc:lite",
        ): (
            "Readmission MRI obtained. Whether the prior-CSF request "
            "satisfies infection seeking remains disputed."
        ),
        (
            "fresh",
            "arc:chat",
        ): "Readmission examination and repeat CSF obtained; no targeted infection request.",
        (
            "fresh",
            "arc:apex",
        ): (
            "First-admission microbiology obtained; ended after five "
            "questions without a readmission report request."
        ),
    }
    for arm in ("old", "fresh"):
        for model in protocol["answer_models"]:
            data = cohort[arm][model]
            grades = {}
            for item in ("D5c", "D3a"):
                rows = sorted(
                    (r for r in results if (r["arm"], r["model"], r["item"]) == (arm, model, item)),
                    key=lambda r: r["repeat"],
                )
                assert len(rows) == 3
                grades[item] = [
                    {k: r[k] for k in ("repeat", "score", "label", "reason", "input_sha256")}
                    for r in rows
                ]
            identifier = f"n04-{arm}-{model.replace(':', '-')}"
            traces = []
            for req, numbers in zip(data["requirements"], question_map[arm, model], strict=True):
                disputed = (
                    req["id"] == "N04.infection"
                    and (arm, model) != ("fresh", "arc:apex")
                    and (arm, model) != ("old", "arc:apex")
                )
                technical = (
                    "Asked; old controller did not return the selected record"
                    if (arm, model, req["id"]) == ("old", "arc:apex", "N04.infection")
                    else "See actual requests and returned records"
                )
                traces.append(
                    {
                        "requirement_id": req["id"],
                        "questions": numbers,
                        "clinical_equivalence": "Awaiting clinical confirmation"
                        if disputed
                        else "Candidate requirement; awaiting confirmation",
                        "technical_observation": technical,
                    }
                )
            records.append(
                dict(
                    id=identifier,
                    case_id="N04_INITIAL",
                    name="Headache on readmission",
                    arm=arm,
                    model=model,
                    audience="Clinician",
                    data=data,
                    scores=grades,
                    traces=traces,
                    observation=observations[arm, model],
                    source_sha256=data["interview_source"]["source_sha256"],
                )
            )
    controls = []
    for key in ("N02_unavailable", "C03_chat"):
        rows = sorted((r for r in results if r["arm"] == key), key=lambda r: r["repeat"])
        controls.append(
            dict(
                id=key,
                name="Glucose requested; report unavailable"
                if key == "N02_unavailable"
                else "Duration and investigation results unavailable",
                scores=rows,
                data=cohort["controls"][key],
            )
        )
    latest = dict(
        id="n04-20261025",
        date="2026-10-25",
        title="N04 · corrected interviews",
        rules_version="josh-proposed-20261024",
        evidence_version="availability-clarified-20261025",
        judge="arc:apex",
        models=protocol["answer_models"],
        records=records,
        controls=controls,
        reference_status="Draft — awaiting clinical confirmation",
        case=case,
        source_hashes=hashes.copy(),
        findings=obj(run / "CHECKS_AND_USAGE.json"),
    )
    legacy = source / "patient_agent_models_matching_n04_dates_20261023"
    original_protocol = obj(legacy / "protocol.json")
    controller = read(legacy / "frozen_interview.py").decode()
    constants = {}
    for node in ast.parse(controller).body:
        if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name):
            name = node.targets[0].id
            if name in ("DOCTOR_SYSTEM", "PATIENT_SYSTEM"):
                constants[name] = ast.literal_eval(node.value)
    live = dict(
        version="fixed-cases-routing-20261025",
        maximum_questions=6,
        patient_model="arc:lite",
        topics=original_protocol["topics"],
        prompts=constants,
        cases=original_protocol["cases"],
        source_hashes=hashes.copy(),
    )
    outputs = {
        "followup-output.txt": read(run / "RAW_OUTPUT.txt"),
        "followup-findings.md": read(run / "FINDINGS.md"),
        "followup-scores.csv": read(run / "SCORES.csv"),
    }
    latest["output_hashes"] = {
        name: hashlib.sha256(raw).hexdigest() for name, raw in outputs.items()
    }
    latest["source_hashes"] = hashes.copy()
    live["source_hashes"] = hashes.copy()
    destination.mkdir(parents=True, exist_ok=True)
    for name, raw in outputs.items():
        (destination / name).write_bytes(raw)
    for name, value in (("followup.json", latest), ("live-cases.json", live)):
        (destination / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    for path, digest in hashes.items():
        assert hashlib.sha256((source / path).read_bytes()).hexdigest() == digest
    return {
        "records": len(records),
        "item_judgements": len(results),
        "live_cases": len(live["cases"]),
        "verified_sources": len(hashes),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument(
        "--output", type=Path, default=Path(__file__).resolve().parents[1] / "study-data"
    )
    args = parser.parse_args()
    print(json.dumps(build(args.source, args.output), indent=2))
