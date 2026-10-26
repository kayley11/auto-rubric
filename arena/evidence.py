"""Read-only study records and shared evidence packets for review and exports."""

import hashlib
import json
from copy import deepcopy
from functools import lru_cache

import scoring
import study


@lru_cache(maxsize=1)
def followup():
    return json.loads((study.STUDY_ROOT / "followup.json").read_text())


def token(source):
    return hashlib.sha256(source.encode()).hexdigest()[:24]


def patient_coverage(run):
    c = run.get("patient_case_snapshot")
    if not c or not run["input"].get("answer"):
        return []
    opening = set(c["opening_fact_ids"])
    turns = run.get("interview_state", {}).get("turns", [])
    rows = []
    for fact in c["facts"]:
        questions = [t["number"] for t in turns if fact["id"] in t["released_fact_ids"]]
        rows.append(
            {
                "id": fact["id"],
                "text": fact["text"],
                "context": fact["context"],
                "questions": questions,
                "status": "Given at start"
                if fact["id"] in opening
                else "Returned"
                if questions
                else "Not obtained",
            }
        )
    return rows


def history_packet(case, model):
    saved = study.interview(case, model)
    metadata = next(c for c in study.dataset()["cases"] if c["id"] == case)
    data = scoring.imported_input(case, model)
    return {
        "id": token(f"history/{case}/{model}"),
        "source_id": f"history/{case}/{model}",
        "batch": "Historical · 23–24 Oct",
        "case_id": case,
        "name": metadata["name"],
        "audience": metadata["audience"],
        "model": saved["model"],
        "data": data,
        "scores": {
            cid: [
                {
                    "repeat": 1,
                    "score": g["new_score"],
                    "label": str(g["new_score"]),
                    "reason": g["new_reason"],
                }
            ]
            for cid, g in saved["scores"].items()
        },
        "inventory": deepcopy(saved["examiner_only_inventory"]),
        "review_question": metadata["review_question"],
        "score_context": (
            "Historical machine grades retain their 24 October inputs. "
            "New review and copied evaluation inputs use clarified source availability."
        ),
        "rules": deepcopy(study.dataset()["revised_rules"]),
        "traces": [],
    }


def followup_packet(identifier):
    row = next((r for r in followup()["records"] if r["id"] == identifier), None)
    if not row:
        raise FileNotFoundError("Follow-up record not found.")
    return {
        **deepcopy(row),
        "id": token("followup/" + identifier),
        "source_id": "followup/" + identifier,
        "batch": "Corrected N04 · 25 Oct"
        if row["arm"] == "fresh"
        else "Saved N04 rescored · 25 Oct",
        "inventory": deepcopy(followup()["case"]["facts"]),
        "rules": deepcopy(study.dataset()["revised_rules"]),
        "review_question": (
            "Does a general CSF-results request satisfy infection "
            "seeking? Which readmission and infection requests are "
            "essential?"
        ),
    }


def run_packet(run):
    from engine import criterion_item

    data = deepcopy(run["input"])
    data.setdefault(
        "interview", {"turns": [], "decision_point": "Saved answer", "closing_notes": ""}
    )
    all_rules = {
        cid: criterion_item(cid, {**data, "_rubric_snapshot": run["rubric"]})
        for cid in data["criteria"]
    }
    return {
        "id": token("run/" + run["id"] + "/" + scoring.fingerprint(data)),
        "source_id": "run/" + run["id"],
        "batch": "Saved evaluation",
        "case_id": data.get("case_id", ""),
        "name": data["title"],
        "audience": "As specified in the task",
        "model": data["answer_model"],
        "data": data,
        "scores": {
            cid: [{"repeat": 1, **g}]
            for cid, g in run.get("grades", {}).items()
            if cid in {"D3a", "D5c"}
        },
        "all_scores": {cid: [{"repeat": 1, **g}] for cid, g in run.get("grades", {}).items()},
        "inventory": deepcopy(run.get("patient_case_snapshot", {}).get("facts", [])),
        "rules": {cid: r for cid, r in all_rules.items() if cid in {"D3a", "D5c"}},
        "all_rules": all_rules,
        "review_question": (
            "Confirm the case reference and information requirements, "
            "then rate the received evidence and actual requests "
            "separately."
        ),
        "traces": [],
    }


def packets(app=None):
    records = [history_packet(r["case_id"], r["model_slug"]) for r in study.dataset()["interviews"]]
    records += [followup_packet(r["id"]) for r in followup()["records"]]
    if app:
        for summary in app.list_runs():
            run = app.load(summary["id"])
            if (
                run.get("status") not in {"generating", "scoring", "interviewing"}
                and run["input"].get("answer")
                and {"D3a", "D5c"} & set(run["input"].get("criteria", []))
            ):
                records.append(run_packet(run))
    return records


def get_packet(identifier, app=None):
    found = next((r for r in packets(app) if r["id"] == identifier), None)
    if not found:
        raise FileNotFoundError("Review record not found.")
    return found


def clinical_profile(packet):
    return {
        "case_id": packet["case_id"],
        "name": packet["name"],
        "batch": packet["batch"],
        "source_id": packet["source_id"],
        "requirements": deepcopy(packet["data"].get("requirements", [])),
        "reference": packet["data"].get("reference", ""),
        "facts": packet["data"]["facts"],
        "task": packet["data"]["task"],
        "inventory": packet["inventory"],
        "review_question": packet["review_question"],
    }


def blind_packet(packet, criterion="D3a"):
    """Explicit allowlist: no model identity, machine results, audit verdicts or source title."""
    data = packet["data"]
    turns = deepcopy(data["interview"]["turns"])
    if criterion == "D3a":
        for turn in turns:
            turn.pop("notes", None)
    result = {
        "id": packet["id"],
        "case_id": packet["case_id"],
        "name": anonymous_name(packet),
        "batch": packet["batch"],
        "audience": packet["audience"],
        "criterion": criterion,
        "facts": data["facts"],
        "task": data["task"],
        "history": data.get("history", ""),
        "answer": data["answer"],
        "turns": turns,
        "rule": packet["rules"].get(criterion),
        "decision_point": data["interview"]["decision_point"],
        "rules_version": data.get("rules_version", "original"),
        "evidence_version": data.get("evidence_version", scoring.LEGACY_EVIDENCE_ID),
        "available_items": [cid for cid in ("D3a", "D5c") if cid in packet["rules"]],
    }
    if criterion == "D5c":
        result.update(
            requirements=data.get("requirements", []),
            inventory=packet["inventory"],
            availability=data["interview"].get("availability_context", ""),
            closing_notes=data["interview"].get("closing_notes", ""),
            final_questions=scoring.final_questions(data["answer"]),
        )
    return result


def anonymous_name(packet):
    return next(
        (c["name"] for c in study.dataset()["cases"] if c["id"] == packet["case_id"]),
        "Clinical case",
    )


def review_catalogue(app):
    records = [p for p in packets(app) if not p["source_id"].startswith("followup/n04-old-")]
    groups = {}
    for p in records:
        groups.setdefault((p["batch"], p["case_id"]), []).append(p["id"])
    queue = [
        {
            "id": p["id"],
            "case_id": p["case_id"],
            "name": anonymous_name(p),
            "batch": p["batch"],
            "response": "Answer "
            + chr(65 + sorted(groups[p["batch"], p["case_id"]]).index(p["id"])),
            "items": [cid for cid in ("D3a", "D5c") if cid in p["rules"]],
        }
        for p in records
    ]
    return sorted(queue, key=lambda row: (row["batch"], row["case_id"], row["response"]))


def output(name):
    expected = followup()["output_hashes"].get(name)
    if not expected:
        raise FileNotFoundError("Follow-up output not found.")
    raw = (study.STUDY_ROOT / name).read_bytes()
    if hashlib.sha256(raw).hexdigest() != expected:
        raise ValueError("The follow-up output failed its integrity check.")
    return raw
