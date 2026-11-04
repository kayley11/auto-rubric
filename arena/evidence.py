"""Read-only study records and shared evidence packets for review and exports."""

import hashlib
import json
import re
from copy import deepcopy
from functools import lru_cache

import comparison
import scoring
import study


@lru_cache(maxsize=1)
def followup():
    return json.loads((study.STUDY_ROOT / "followup.json").read_text(encoding="utf-8"))


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
        "technical_check": bool(
            re.fullmatch(
                r"ui[-_\s]?validation|deployment[-_\s]?(?:check|validation)|interface[-_\s]?check",
                run.get("purpose", ""),
                re.I,
            )
            or re.match(r"^Deployment check(?:\s|[—–:-])", data.get("title", ""), re.I)
        ),
        "batch": "Submitted cases · " + data["comparison_id"][:8]
        if data.get("comparison_id")
        else "Saved evaluation",
        "case_id": data.get("case_code") or data.get("case_id") or data.get("case_number", ""),
        "name": data["title"],
        "audience": "As specified in the task",
        "model": (
            "Provided answer · model not specified"
            if run.get("answer_source") == "pasted" and not data.get("interview_source")
            else data["answer_model"]
        ),
        "data": data,
        "scores": {cid: [{"repeat": 1, **g}] for cid, g in run.get("grades", {}).items()},
        "all_scores": {cid: [{"repeat": 1, **g}] for cid, g in run.get("grades", {}).items()},
        "inventory": deepcopy(run.get("patient_case_snapshot", {}).get("facts", [])),
        "rules": all_rules,
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
                and run["input"].get("criteria")
            ):
                records.append(run_packet(run))
    return records


def get_packet(identifier, app=None):
    found = next((r for r in packets(app) if r["id"] == identifier), None)
    if not found:
        found = next((r for r in published_packets() if r["id"] == identifier), None)
    if not found:
        raise FileNotFoundError("Review record not found.")
    return found


@lru_cache(maxsize=100)
def _published_packets(path, stamp, size):
    c = json.loads(path.read_text(encoding="utf-8"))
    result = []
    for m in c["models"]:
        if not m.get("answer"):
            continue
        rules = {r["id"]: r for r in c["criteria"]}
        facts = "\n\n".join(v for v in [c.get("initial_facts", ""), c.get("opening", "")] if v)
        source_id = f"published/{c['id']}/{m['id']}/{m.get('study_id', c['study_id'])}"
        data = {
            "facts": facts,
            "task": c["task"],
            "history": "",
            "answer": m["answer"],
            "reference": c.get("reference", ""),
            "requirements": c.get("requirements", []),
            "rules_version": m.get("rule_version", c["rule_version"]),
            "criteria": list(rules),
            "judge_model": m.get("judge", c["judge"]),
            "interview": {"turns": [], "decision_point": "Saved final answer", "closing_notes": ""},
        }
        # Preserve actual earlier dialogue as evidence, without exposing hidden inventory.
        for t in m.get("turns", []):
            returned = t.get("returned", [])
            data["interview"]["turns"].append(
                {
                    "number": t["number"],
                    "question": t["question"],
                    "notes": json.dumps(t.get("assessment", {})),
                    "reply": "\n".join(
                        f.get("patient_text") or f.get("text", "")
                        for f in returned
                        if f.get("channel") == "patient"
                    ),
                    "records": "\n".join(
                        (f.get("context", "") + ": " if f.get("context") else "")
                        + (f.get("text") or f.get("patient_text", ""))
                        for f in returned
                        if f.get("channel") != "patient"
                    ),
                }
            )
        scores = {
            s["item"]: [
                {
                    "repeat": 1,
                    "score": s.get("score"),
                    "label": s.get("label"),
                    "status": s["status"],
                    "reason": s.get("reason", ""),
                }
            ]
            for s in m.get("scores", [])
        }
        result.append(
            {
                "id": token(source_id),
                "source_id": source_id,
                "batch": "Published case library",
                "case_id": c["id"],
                "name": c["title"],
                "audience": c.get("audience", "As specified"),
                "model": m["model_id"],
                "data": data,
                "rules": rules,
                "all_rules": rules,
                "scores": scores,
                "all_scores": scores,
                "inventory": [],
                "review_question": "Rate the saved answer against its selected rubric items.",
                "traces": [],
            }
        )
    return result


def published_packets():
    result = []
    for path in comparison.SNAPSHOTS.glob("*.json"):
        if not comparison.CASE_ID.fullmatch(path.stem):
            continue
        stat = path.stat()
        result.extend(_published_packets(path, stat.st_mtime_ns, stat.st_size))
    return result


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
        "available_items": review_order(packet),
        "item_names": {cid: r.get("name", cid) for cid, r in packet["rules"].items()},
    }
    if packet["source_id"].startswith("run/"):
        # Opaque key only: lets the browser record prior score exposure without
        # disclosing the answering model or any automatic result.
        result["run_id"] = packet["source_id"].split("/", 1)[1]
    if criterion == "D5c":
        result.update(
            requirements=data.get("requirements", []),
            inventory=packet["inventory"],
            availability=data["interview"].get("availability_context", ""),
            closing_notes=data["interview"].get("closing_notes", ""),
            final_questions=scoring.final_questions(data["answer"]),
        )
    if criterion != "D3a":
        result["reference"] = data.get("reference", "")
    return result


def review_order(packet):
    return (
        (["D3a"] if "D3a" in packet["rules"] else [])
        + [cid for cid in packet["rules"] if cid not in {"D3a", "D5c"}]
        + (["D5c"] if "D5c" in packet["rules"] else [])
    )


def anonymous_name(packet):
    return next(
        (c["name"] for c in study.dataset()["cases"] if c["id"] == packet["case_id"]),
        "Submitted case " + packet["case_id"] if packet["case_id"] else "Clinical case",
    )


def review_catalogue(app, advanced=False):
    records = [
        p
        for p in packets(app)
        if not p["source_id"].startswith("followup/n04-old-")
        and not p.get("technical_check")
        and (advanced or p["source_id"].startswith("run/"))
    ]
    if not advanced:
        records += published_packets()
    groups = {}
    for p in records:
        groups.setdefault((p["batch"], p["case_id"]), []).append(p["id"])
    queue = [
        {
            "id": p["id"],
            "case_id": p["case_id"],
            "name": anonymous_name(p),
            "batch": p["batch"],
            "summary": " ".join(p["data"]["facts"].split())[:180]
            if p["source_id"].startswith("run/")
            else "",
            "response": "Answer "
            + chr(65 + sorted(groups[p["batch"], p["case_id"]]).index(p["id"])),
            "items": review_order(p),
            "item_names": {cid: r.get("name", cid) for cid, r in p["rules"].items()},
        }
        for p in records
    ]
    return sorted(queue, key=lambda row: (row["batch"], row["case_id"], row["response"]))


def decision_catalogue(app):
    """One entry per clinical reference/checklist, shared across model answers."""
    profiles = {}
    for p in packets(app) + published_packets():
        if p.get("technical_check") or p["source_id"].startswith("followup/n04-old-"):
            continue
        key = app.reviews.profile_key(p)
        profiles.setdefault(
            key,
            {
                "id": p["id"],
                "case_id": p["case_id"],
                "name": p["name"],
                "response": p["batch"],
                "rules_version": p["data"].get("rules_version", "original"),
            },
        )
    return sorted(profiles.values(), key=lambda r: (r["case_id"], r["name"]))


def output(name):
    expected = followup()["output_hashes"].get(name)
    if not expected:
        raise FileNotFoundError("Follow-up output not found.")
    raw = (study.STUDY_ROOT / name).read_bytes()
    if hashlib.sha256(raw).hexdigest() != expected:
        raise ValueError("The follow-up output failed its integrity check.")
    return raw
