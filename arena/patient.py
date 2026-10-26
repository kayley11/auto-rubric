"""Six-turn, fixed-fact interviews using the checked research routing rules."""

import hashlib
import json
from copy import deepcopy
from functools import lru_cache
from pathlib import Path

import patient_matching
import routing_base
import scoring
import study


@lru_cache(maxsize=1)
def library():
    return json.loads((study.STUDY_ROOT / "live-cases.json").read_text())


def case(case_id):
    result = next((c for c in library()["cases"] if c["case_id"] == case_id), None)
    if not result:
        raise ValueError("Choose one of the eight prepared interview cases.")
    return deepcopy(result)


def catalogue():
    return [
        {
            "id": c["case_id"],
            "name": next(x["name"] for x in study.dataset()["cases"] if x["id"] == c["case_id"]),
            "opening": c["opening"],
            "common_information": c["common_information"],
            "task": c["final_task"],
        }
        for c in library()["cases"]
    ]


def routing_hash():
    return hashlib.sha256(
        b"".join(
            (Path(__file__).parent / name).read_bytes()
            for name in ("patient_matching.py", "routing_base.py")
        )
    ).hexdigest()


def prepared(
    case_id, answer_model="arc:lite", judge_model="arc:apex", rules_version=scoring.REVISED_ID
):
    c = case(case_id)
    metadata = next(r for r in study.dataset()["cases"] if r["id"] == case_id)
    return {
        "title": c["title"],
        "case_id": case_id,
        "facts": c["common_information"] + "\n\nPatient opening:\n" + c["opening"],
        "task": c["final_task"],
        "history": "",
        "answer": "",
        "reference": c["reference"],
        "reference_status": "draft",
        "source": "Prepared fixed-fact patient interview; later outcomes withheld.",
        "criteria": ["D5c", "D3a"],
        "rules_version": rules_version,
        "evidence_version": scoring.EVIDENCE_ID,
        "requirements": scoring.candidate_requirements(metadata),
        "answer_model": answer_model,
        "judge_model": judge_model,
        "interview": {
            "turns": [],
            "complete": False,
            "max_questions": 6,
            "notes_allowed": True,
            "decision_point": "Final answer after the completed patient interview",
            "synthesis_scope": (
                "Assess synthesis requested by the original task; no extra "
                "clinician-style sentence is required for patient-facing "
                "explanations."
            ),
        },
        "evaluation_mode": "patient",
    }


def parse(text):
    value = text.strip()
    if value.startswith("```"):
        value = value.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return json.loads(value)


def validate_doctor(value, topics):
    if value.get("action") not in {"ask", "finish"}:
        raise ValueError("The clinician returned an invalid action.")
    assessment = value.get("assessment", {})
    if assessment.get("certainty") not in {"uncertain", "working", "confirmed"} or not isinstance(
        assessment.get("summary"), str
    ):
        raise ValueError("The clinician did not return its public assessment.")
    if value["action"] == "ask":
        if not isinstance(value.get("question"), str) or not value["question"].strip():
            raise ValueError("The clinician returned no question.")
        tags = value.get("topics", [])
        if not 1 <= len(tags) <= 2 or any(t not in topics for t in tags):
            raise ValueError("The clinician returned invalid routing topics.")
    return value


def record_input(run):
    state, data = run["interview_state"], run["input"]
    data["interview"]["turns"] = [
        {
            "question": t["question"],
            "reply": t["patient_reply"],
            "records": "\n\n".join(
                f"[{f['channel']}; {f['context']}; period: {f['period']}]\n{f['text']}"
                for f in t["fixed_records"]
            ),
            "notes": json.dumps(t["doctor_output"]["assessment"], ensure_ascii=False, indent=2),
            "feedback": t["feedback"],
        }
        for t in state["turns"]
    ]
    data["interview"]["complete"] = state.get("complete", False)
    data["interview"]["closing_notes"] = (
        json.dumps(state["closing_assessment"], ensure_ascii=False, indent=2)
        if state.get("closing_assessment")
        else ""
    )
    data["interview"]["availability_context"] = scoring.availability_context(
        {
            "case_id": data["case_id"],
            "examiner_only_inventory": run["patient_case_snapshot"]["facts"],
            "turns": state["turns"],
        }
    )


def run_interview(app, run):
    from engine import generation_messages, redact, run_sync, validate_input, word_count_info

    c, protocol = run["patient_case_snapshot"], run["patient_protocol"]
    if protocol["routing_sha256"] != routing_hash():
        raise ValueError("The routing rules changed. Keep this record and start a new interview.")
    state = run.setdefault("interview_state", {"turns": [], "question_proposals": []})
    released = set(c["opening_fact_ids"]) | {
        fid for t in state["turns"] for fid in t["released_fact_ids"]
    }

    def call(kind, model, messages, limit):
        capture = {
            "kind": kind,
            "started_at": app.now(),
            "question_number": len(state["turns"]) + 1,
        }
        try:
            body = {
                "model": model,
                "messages": messages,
                "temperature": 0,
                "reasoning_effort": "low",
                "max_tokens": limit,
            }
            if kind != "interview_final_answer":
                body["response_format"] = {"type": "json_object"}
            raw = run_sync(app.provider.completion(body, capture))
            capture["status"] = "success"
            return raw["choices"][0]["message"]["content"].strip()
        except Exception as exc:
            capture.update(status="error", error=redact(str(exc), app.settings.api_key))
            raise
        finally:
            capture["finished_at"] = app.now()
            run["generation_attempts"].append(capture)
            app.save(run)

    def parsed_doctor(raw):
        try:
            return validate_doctor(parse(raw), protocol["topics"])
        except Exception as exc:
            run["generation_attempts"][-1]["validation_error"] = redact(
                str(exc), app.settings.api_key
            )
            app.save(run)
            raise

    while len(state["turns"]) < 6 and not state.get("complete"):
        if app.stop.is_set():
            run.update(status="stopped", message="Interview paused. Completed turns are saved.")
            app.save(run)
            return
        number = len(state["turns"]) + 1
        run.update(message=f"Interview question {number} of 6…", current_item=None)
        app.save(run)
        history = [
            {
                "role": "system",
                "content": protocol["prompts"]["DOCTOR_SYSTEM"]
                + "\nStandard topic IDs:\n"
                + json.dumps(protocol["topics"]),
            },
            {
                "role": "user",
                "content": c["common_information"]
                + "\nPatient opening:\n"
                + c["opening"]
                + (
                    "\nYou may ask up to six questions. No other patient facts "
                    "have yet been supplied."
                ),
            },
        ]
        for turn in state["turns"]:
            history += [
                {
                    "role": "assistant",
                    "content": json.dumps(turn["doctor_output"], ensure_ascii=False),
                },
                {
                    "role": "user",
                    "content": routing_base.turn_text(turn).split("\n", 1)[1]
                    + "\nContinue only from the information actually obtained.",
                },
            ]
        pending = state.get("pending")
        if not pending:
            raw = call("clinician_question", run["input"]["answer_model"], history, 2048)
            doctor = parsed_doctor(raw)
            pending = {"doctor": doctor, "proposals": [{"kind": "initial", "output": doctor}]}
            state["pending"] = pending
            app.save(run)
        doctor = pending["doctor"]
        if doctor["action"] == "finish":
            state.update(complete=True, closing_assessment=doctor["assessment"])
            state["question_proposals"].append({"turn": number, "proposals": pending["proposals"]})
            state.pop("pending", None)
            break
        patient_facts, records, notes = patient_matching.select_with_context(
            c, doctor, released, routing_base.select_facts, state["turns"]
        )
        repeat = routing_base.repeated_reason(doctor, state["turns"], patient_facts, records)
        if repeat and not pending.get("repair_attempted"):
            pending["proposals"][0]["blocked_reason"] = repeat
            repair = history + [
                {"role": "assistant", "content": json.dumps(doctor, ensure_ascii=False)},
                {
                    "role": "user",
                    "content": "Controller feedback: "
                    + repeat
                    + (
                        " Do not send the same question to the patient again. Ask a "
                        "different useful question based only on the information "
                        "already obtained, or finish with the limitation recorded. No"
                        " new patient facts are being supplied by this feedback."
                    ),
                },
            ]
            raw = call("clinician_repetition_repair", run["input"]["answer_model"], repair, 2048)
            doctor = parsed_doctor(raw)
            pending.update(doctor=doctor, repair_attempted=True)
            pending["proposals"].append({"kind": "one_allowed_repair", "output": doctor})
            app.save(run)
            if doctor["action"] == "ask":
                patient_facts, records, notes = patient_matching.select_with_context(
                    c, doctor, released, routing_base.select_facts, state["turns"]
                )
                repeat = routing_base.repeated_reason(
                    doctor, state["turns"], patient_facts, records
                )
        if doctor["action"] == "finish" or repeat:
            state.update(
                complete=True,
                closing_assessment=doctor["assessment"],
                stop_reason="repetition_limit" if repeat else "model_finish",
            )
            state["question_proposals"].append({"turn": number, "proposals": pending["proposals"]})
            state.pop("pending", None)
            break
        used, fallback = [f["id"] for f in patient_facts], False
        if patient_facts:
            try:
                raw = call(
                    "patient_fact_order",
                    protocol["patient_model"],
                    [
                        {"role": "system", "content": protocol["prompts"]["PATIENT_SYSTEM"]},
                        {
                            "role": "user",
                            "content": json.dumps(
                                {
                                    "current_question": doctor["question"],
                                    "permitted_statements": [
                                        {"id": f["id"], "text": f["patient_text"]}
                                        for f in patient_facts
                                    ],
                                },
                                ensure_ascii=False,
                            ),
                        },
                    ],
                    2048,
                )
                order = parse(raw).get("utterance_order")
                if (
                    not isinstance(order, list)
                    or len(order) != len(used)
                    or set(order) != set(used)
                ):
                    raise ValueError("Invalid patient fact order.")
                used = order
            except Exception as exc:
                fallback = True
                capture = run["generation_attempts"][-1]
                if capture["status"] == "success":
                    capture["validation_error"] = redact(str(exc), app.settings.api_key)
                notes.append(
                    "Patient layout failed; the controller used the unchanged "
                    "fixed statements in source order."
                )
        facts = {f["id"]: f for f in patient_facts}
        new_ids = list(dict.fromkeys(used + [f["id"] for f in records]))
        if not new_ids:
            notes.append(
                "No new recorded information was returned. Do not repeat this"
                " request; change the question or finish. This is not a "
                "negative finding."
            )
        turn = {
            "number": number,
            "question": doctor["question"],
            "topics": doctor["topics"],
            "doctor_output": doctor,
            "visible_fact_ids_before_question": sorted(released),
            "patient_reply": " ".join(facts[fid]["patient_text"] for fid in used),
            "patient_used_fact_ids": used,
            "patient_layout_fallback": fallback,
            "fixed_records": records,
            "released_fact_ids": new_ids,
            "new_fact_ids": new_ids,
            "feedback": " ".join(notes),
        }
        state["turns"].append(turn)
        state["question_proposals"].append({"turn": number, "proposals": pending["proposals"]})
        state.pop("pending", None)
        released.update(new_ids)
        record_input(run)
        app.save(run)
    state["complete"] = True
    record_input(run)
    app.save(run)
    if app.stop.is_set():
        run.update(
            status="stopped", message="Interview saved. Resume to generate the final answer."
        )
        app.save(run)
        return
    if not run["input"]["answer"]:
        run["message"] = "Preparing the final answer from received information…"
        app.save(run)
        data = {
            "facts": run["input"]["facts"],
            "task": run["input"]["task"],
            "history": "\n\n".join(routing_base.turn_text(t) for t in state["turns"]),
        }
        answer = call(
            "interview_final_answer", run["input"]["answer_model"], generation_messages(data), 8192
        )
        run["input"]["answer"] = answer
        run["generated_answer"] = answer
        run["word_count"] = word_count_info(answer, run["input"]["task"])
    run["input"] = validate_input(run["input"])
    run["input_sha256"] = scoring.fingerprint(run["input"])
    run.update(
        status="answer_ready", message="Interview complete. Review the evidence, then score."
    )
    app.save(run)
