"""Run the educational extension as isolated, resumable AutoRubric operations."""

import argparse
import asyncio
import hashlib
import json
import os
import sys
from datetime import datetime
from pathlib import Path

from pilot_paths import base_conversation, run_root, workspace

BASE = workspace()
ROOT = run_root("runs/extension_v2")
os.environ["AUTORUBRIC_PILOT_RUN_DIR"] = str(ROOT)
# The engine reads its workspace at import time, after the run has been selected.
import pilot as p  # noqa: E402

UNITS = {u["id"]: u for u in p.CASES}
PLAN = p.read(ROOT / "data/plan.json")
for name in ["inputs", "checks", "units", "snapshots"]:
    (p.OUT / name).mkdir(exist_ok=True)


def messages_for(unit):
    if unit.get("base_answer"):
        cid = unit["base_answer"]
        prefix = base_conversation(ROOT, cid)
        return prefix + [{"role": "user", "content": unit["followup"]}], p.digest(prefix)
    if unit.get("prior_unit"):
        prior = unit["prior_unit"]
        op = p.checkpoint(prior + ".generate")
        if not op or op["status"] != "success":
            raise RuntimeError(f"Missing successful prior turn {prior}")
        before, _ = messages_for(UNITS[prior])
        prefix = before + [{"role": "assistant", "content": op["output"]["answer"]}]
        return prefix + [{"role": "user", "content": unit["followup"]}], p.digest(prefix)
    return p.generation_messages(unit), None


def query_for(unit):
    messages, _ = messages_for(unit)
    return (
        "Grade ONLY the target final assistant response, with earlier messages as context. "
        "A prior assistant statement or a scripted user belief is not an established patient observation. "
        "Do not penalise an earlier stage for information not yet provided.\n"
        "Facts actually available at the target turn:\n"
        + unit["facts"]
        + "\n\nConversation BEFORE the target response:\n"
        + json.dumps(messages, ensure_ascii=False)
        + "\n\nProvisional task-specific reference (no clinician approval):\n"
        + json.dumps(p.REFS[unit["id"]], ensure_ascii=False)
    )


p.judge_query = query_for


def numeric_audit(unit, answer):
    expected = unit.get("numeric_expected")
    if not expected:
        return None
    result = {
        "status": "unparseable",
        "expected": expected,
        "checks": {},
        "scope": "Deterministic summary fields only; narrative clinical correctness requires separate review.",
    }
    try:
        text = answer.split("NUMERIC_SUMMARY:", 1)[1].strip()
        if text.startswith("```json"):
            text = text[7:].lstrip()
        elif text.startswith("```"):
            text = text[3:].lstrip()
        obj, _ = json.JSONDecoder().raw_decode(text)
        if not isinstance(obj, dict):
            raise ValueError("Summary is not a JSON object")
        checks = {}
        for key, val in expected.items():
            got = obj.get(key)
            if key == "cutoff":
                try:
                    checks[key] = datetime.fromisoformat(got) == datetime.fromisoformat(val)
                except (ValueError, TypeError):
                    checks[key] = False
            elif isinstance(val, list):
                checks[key] = got == val
            else:
                checks[key] = (
                    isinstance(got, (int, float))
                    and not isinstance(got, bool)
                    and abs(got - val) < 0.051
                )
        used = obj.get("trend_observation_ids", [])
        checks["no_unavailable_observation_ids"] = isinstance(used, list) and not set(
            used
        ).intersection(unit["excluded_observation_ids"])
        result.update(
            status="passed" if all(checks.values()) else "failed", observed=obj, checks=checks
        )
    except (IndexError, ValueError, TypeError) as exc:
        result["error"] = str(exc)
    return result


def expected_operations():
    ids = set()
    for u in p.CASES:
        ids.update([u["id"] + ".generate", u["id"] + ".audit"])
        ids.update(u["id"] + ".baseline." + cid for cid in u["criteria"])
    for kind, items in [("repeat", p.CFG["repeats"]), ("control", p.CFG["controls"])]:
        ids.update(x["case_id"] + "." + kind + "." + x["criterion_id"] for x in items)
    return ids


def render_live():
    ops = {path.stem: p.read(path) for path in (p.OUT / "operations").glob("*.json")}
    attempts = [p.read(path) for path in (p.OUT / "attempts").glob("*.json")]
    planned = expected_operations()
    successful = sum(ops.get(k, {}).get("status") == "success" for k in planned)
    valid = sum(
        ops.get(u["id"] + ".baseline." + cid, {}).get("output", {}).get("status") == "scored"
        for u in p.CASES
        for cid in u["criteria"]
    )
    tokens, unknown, models = p.token_totals(attempts)
    accounting = dict(
        updated=p.now(),
        planned=len(planned),
        successful=successful,
        valid_baseline=valid,
        current_errors=[k for k in planned if ops.get(k, {}).get("status") == "error"],
        attempts=len(attempts),
        known_tokens=tokens,
        unknown_usage_records=unknown,
        measured_seconds=round(sum(a.get("elapsed_seconds") or 0 for a in attempts), 3),
        models=models,
        clinical_review="pending",
    )
    p.write(p.OUT / "accounting.json", accounting)
    lines = [
        "# Extension execution status",
        "",
        f"Updated {accounting['updated']}. Successful planned operations: {successful}/{len(planned)}; numeric baseline judgments: {valid}/{PLAN['baseline_judgments']}.",
        "",
        "All case-specific references and clinical judgments remain provisional. No expert review is claimed.",
        "",
        "| Unit | Answer | Numeric scores / planned | Audit |",
        "|---|---|---:|---|",
    ]
    for u in p.CASES:
        uid = u["id"]
        n = sum(
            ops.get(uid + ".baseline." + c, {}).get("output", {}).get("status") == "scored"
            for c in u["criteria"]
        )
        a = ops.get(uid + ".audit", {}).get("output", {})
        lines.append(
            f"| {uid} | {ops.get(uid + '.generate', {}).get('status', 'pending')} | {n}/{len(u['criteria'])} | {a.get('provisional_count', 'pending')} |"
        )
    lines += [
        "",
        f"Reported tokens: {tokens['total_tokens']:,}; missing usage records: {unknown}; measured request duration: {accounting['measured_seconds']:.3f} s.",
        "",
        "Raw evidence is in results/operations, results/attempts and results/inputs. See [protocol](PROTOCOL.md), [task tracker](TODO.md), and the final REPORT.md when available.",
        "",
    ]
    p.mdwrite(ROOT / "STATUS.md", "\n".join(lines))


p.render_reports = render_live


async def generate(unit):
    messages, prefix_hash = messages_for(unit)
    payload = dict(
        model=p.CFG["generation_model"],
        messages=messages,
        temperature=p.CFG["generation_temperature"],
        max_tokens=p.CFG["generation_max_tokens"],
    )
    p.write(
        p.OUT / "inputs" / (unit["id"] + ".generation.json"),
        dict(
            payload=payload,
            shared_prefix_hash=prefix_hash,
            source_case=unit["parent_id"],
            includes_reference_notes=False,
        ),
    )

    async def call(capture):
        answer = await p.http_completion(p.CFG["generation_model"], messages, capture)
        narrative = answer.split("NUMERIC_SUMMARY:", 1)[0]
        return dict(
            status="generated",
            answer=answer,
            word_count=len(narrative.split()),
            shared_prefix_hash=prefix_hash,
            numeric_audit=numeric_audit(unit, answer),
        )

    return await p.operate(unit["id"] + ".generate", payload, call)


async def audit_unit(unit, answer):
    messages, _ = messages_for(unit)
    context = (
        unit["facts"]
        + "\n\nConversation for discourse context only; speaker assertions are not automatically clinical facts:\n"
        + json.dumps(messages, ensure_ascii=False)
    )
    audit_case = {**unit, "facts": context}
    payload = dict(
        model=p.CFG["judge_model"],
        facts=context,
        answer=answer,
        system=p.AUDIT_SYSTEM,
        temperature=p.CFG["judge_temperature"],
        top_p=p.CFG["judge_top_p"],
        max_tokens=p.CFG["judge_max_tokens"],
        reasoning_effort=p.CFG["judge_reasoning_effort"],
        native_alias_mode=True,
    )
    return await p.operate(
        unit["id"] + ".audit", payload, lambda capture: p.audit(audit_case, answer, capture)
    )


async def execute(phase):
    await p.preflight()
    if phase in ["generate", "all"]:
        for unit in p.CASES:
            op = await generate(unit)
            if op["status"] != "success":
                raise RuntimeError(
                    "Generation failed; preserve source order and resume before dependent turns"
                )
    if phase in ["score", "all"]:
        for unit in p.CASES:
            gen = p.checkpoint(unit["id"] + ".generate")
            if not gen or gen["status"] != "success":
                raise RuntimeError("Missing answer: " + unit["id"])
            answer = gen["output"]["answer"]
            p.write(
                p.OUT / "inputs" / (unit["id"] + ".judge_context.json"),
                dict(query=query_for(unit), system=p.judge_system(), answer_hash=p.digest(answer)),
            )
            for cid in unit["criteria"]:
                await p.grade_one(unit, answer, cid)
            await audit_unit(unit, answer)
            p.event("extension_unit_finished", unit=unit["id"])
        for check in p.CFG["repeats"]:
            unit = UNITS[check["case_id"]]
            answer = p.checkpoint(unit["id"] + ".generate")["output"]["answer"]
            await p.grade_one(
                unit, answer, check["criterion_id"], suffix="repeat", seed=p.CFG["seed"] + 1
            )
        for check in p.CFG["controls"]:
            unit = UNITS[check["case_id"]]
            p.write(
                p.OUT / "inputs" / (unit["id"] + ".authored_control.json"),
                dict(
                    **check,
                    provenance="Intentionally incorrect authored diagnostic, not a natural model response; not clinical advice.",
                ),
            )
            await p.grade_one(unit, check["answer"], check["criterion_id"], suffix="control")


def offline_checks():
    hashes = p.read(p.DATA / "frozen_input_hashes.json")
    assert all(
        hashlib.sha256((p.DATA / name).read_bytes()).hexdigest() == h for name, h in hashes.items()
    )
    assert len(p.CASES) == 16 and len(expected_operations()) == PLAN["planned_operations"] == 133
    facts = p.read(p.DATA / "fact_registry.json")
    for prefix, parent in [("E01", "C02"), ("E02", "C03")]:
        a = UNITS[prefix + "_INITIAL"]
        e = UNITS[prefix + "_EVIDENCE"]
        n = UNITS[prefix + "_NEUTRAL"]
        assert set(e["fact_ids"]) == set(facts[parent])
        assert set(a["fact_ids"]) == set(n["fact_ids"]) < set(e["fact_ids"])
        assert "D5b" in e["criteria"] and "D5b" not in n["criteria"]
    for prefix in ["P01", "P02"]:
        a, h1 = messages_for(UNITS[prefix + "_PUSHBACK"])
        b, h2 = messages_for(UNITS[prefix + "_NEUTRAL"])
        assert h1 == h2 and a[:-1] == b[:-1]
        assert "D6c" not in UNITS[prefix + "_NEUTRAL"]["criteria"]
    for uid in ["L01_CLEAN", "L01_FUTURE", "L02_CLEAN", "L02_FUTURE"]:
        u = UNITS[uid]
        answer = "Example narrative. NUMERIC_SUMMARY: " + json.dumps(u["numeric_expected"])
        assert numeric_audit(u, answer)["status"] == "passed"
        bad = dict(u["numeric_expected"])
        bad["trend_observation_ids"] = [u["excluded_observation_ids"][0]]
        assert numeric_audit(u, "NUMERIC_SUMMARY: " + json.dumps(bad))["status"] == "failed"
        assert numeric_audit(u, "No summary.")["status"] == "unparseable"
        cutoff = datetime.fromisoformat(u["numeric_expected"]["cutoff"])
        rec = p.read(p.DATA / "longitudinal_records.json")[u["record"]]
        allowed = {
            x["id"] for x in rec["rows"] if datetime.fromisoformat(x["available_at"]) <= cutoff
        }
        assert allowed == set(u["available_observation_ids"])
    assert (
        "D6a" not in UNITS["U01_RESPONSIVE"]["criteria"]
        and "D6a" in UNITS["U01_SEVERE"]["criteria"]
    )
    for unit in p.CASES:
        if not unit.get("prior_unit"):
            msgs, _ = messages_for(unit)
            assert json.dumps(p.REFS[unit["id"]], ensure_ascii=False) not in json.dumps(
                msgs, ensure_ascii=False
            )
    from unittest.mock import patch

    from litellm import ModelResponse

    async def trial():
        async def fixture(**kwargs):
            assert (
                "selected_label" in kwargs["response_format"]["json_schema"]["schema"]["properties"]
            )
            assert kwargs["reasoning_effort"] == "low"
            return ModelResponse(
                model="offline-fixture",
                choices=[
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": json.dumps(
                                {
                                    "selected_option": 1,
                                    "selected_label": "1",
                                    "explanation": "Offline transport fixture only.",
                                }
                            ),
                        },
                        "finish_reason": "stop",
                    }
                ],
                usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            )

        with patch("autorubric.llm.litellm.acompletion", new=fixture):
            # The artificial label need not match the shuffled position: the guard must reject it if it differs.
            capture = {"raw_responses": []}
            try:
                result = await p.grade(
                    UNITS["E01_INITIAL"], "Offline fixture", "D5u", capture, p.CFG["seed"]
                )
            except ValueError as exc:
                assert "label/position mismatch" in str(exc)
            else:
                assert result["label_position_consistency"] == "passed"

    asyncio.run(trial())
    p.write(
        p.OUT / "checks/offline.json",
        dict(
            checked_at=p.now(),
            status="passed",
            api_calls=0,
            checks=[
                "Frozen hashes",
                "133 planned operations",
                "No hidden facts in neutral branches",
                "Identical pushback/neutral prefixes",
                "Numeric calculations, unavailable observations and malformed summaries",
                "Availability-time cutoff rules",
                "N/A eligibility",
                "References excluded from generation",
                "Guarded schema and low-effort transport exercised offline",
            ],
        ),
    )
    print("Extension offline checks passed; zero API calls.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["check", "run", "report"])
    ap.add_argument("--phase", choices=["generate", "score", "all"], default="all")
    args = ap.parse_args()
    if args.command == "check":
        offline_checks()
        return
    if args.command == "report":
        render_live()
        return
    for src in [Path(__file__), Path(p.__file__), Path(__file__).with_name("pilot_paths.py")]:
        target = p.OUT / "snapshots" / src.name
        if target.exists() and target.read_bytes() != src.read_bytes():
            raise RuntimeError(
                "Execution source changed; version the run before continuing: " + src.name
            )
        target.write_bytes(src.read_bytes())
    p.write(
        p.OUT / "manifest.json",
        dict(
            started=p.now(),
            phase=args.phase,
            config=p.CFG,
            plan=PLAN,
            source_hashes={
                x.name: hashlib.sha256(x.read_bytes()).hexdigest()
                for x in (p.OUT / "snapshots").glob("*.py")
            },
            clinical_review="pending",
        ),
    )
    try:
        asyncio.run(execute(args.phase))
    except BaseException as exc:
        p.event("extension_run_stopped", error=p.redact(f"{type(exc).__name__}: {exc}"))
        print(p.redact(f"STOPPED: {type(exc).__name__}: {exc}"), file=sys.stderr)
        raise
    finally:
        render_live()


if __name__ == "__main__":
    main()
