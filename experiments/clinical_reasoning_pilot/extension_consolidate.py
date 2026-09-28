"""Create the extension findings report from saved records only; no API calls."""

import json
import statistics
from collections import Counter
from datetime import UTC, datetime

from pilot_paths import workspace

BASE = workspace()
OLD = BASE / "runs/extension_v2"
NEW = BASE / "runs/extension_v2_1_http"


def read(p):
    return json.loads(p.read_text())


def save(p, x):
    p.write_text(
        (json.dumps(x, indent=2, ensure_ascii=False) if not isinstance(x, str) else x).rstrip()
        + "\n"
    )


def table(headers, rows):
    return "\n".join(
        ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
        + [
            "| " + " | ".join(str(v).replace("|", "\\|").replace("\n", " ") for v in row) + " |"
            for row in rows
        ]
    )


def aggregate(records):
    result = dict(
        attempts=len(records),
        errors=sum(a["status"] == "error" for a in records),
        prompt_tokens=0,
        completion_tokens=0,
        total_tokens=0,
        reasoning_tokens=0,
        unknown_usage=0,
        seconds=round(sum(a["elapsed_seconds"] for a in records), 3),
    )
    ids = []
    for a in records:
        raws = a.get("raw_responses", [])
        if not raws:
            result["unknown_usage"] += 1
        for raw in raws:
            ids.append(raw.get("id"))
            usage = raw.get("usage")
            if not isinstance(usage, dict):
                result["unknown_usage"] += 1
                continue
            assert usage["prompt_tokens"] + usage["completion_tokens"] == usage["total_tokens"]
            for k in ["prompt_tokens", "completion_tokens", "total_tokens"]:
                result[k] += usage[k]
            details = usage.get("completion_tokens_details") or {}
            rt = details.get("reasoning_tokens", usage.get("reasoning_tokens"))
            if isinstance(rt, int):
                result["reasoning_tokens"] += rt
    result["unique_response_ids"] = len(set(i for i in ids if i))
    result["recorded_responses"] = len(ids)
    if records:
        starts = [datetime.fromisoformat(a["started"]) for a in records]
        ends = [datetime.fromisoformat(a["ended"]) for a in records]
        result.update(
            first=min(starts).isoformat(),
            last=max(ends).isoformat(),
            window_seconds=round((max(ends) - min(starts)).total_seconds(), 3),
        )
        successes = [a["elapsed_seconds"] for a in records if a["status"] == "success"]
        result["median_successful_request_seconds"] = (
            round(statistics.median(successes), 3) if successes else None
        )
    return result


def main():
    now = datetime.now(UTC).isoformat()
    old_attempts = [read(p) for p in sorted((OLD / "results/attempts").glob("*.json"))]
    new_attempts = [read(p) for p in sorted((NEW / "results/attempts").glob("*.json"))]
    diagnostics = [read(p) for p in sorted((OLD / "results/diagnostics").glob("*.json"))]
    units = read(NEW / "data/cases.json")
    config = read(NEW / "data/config.json")
    ops = {p.stem: read(p) for p in (NEW / "results/operations").glob("*.json")}

    def out(opid):
        return ops.get(opid, {}).get("output", {})

    def score(uid, cid, kind="baseline"):
        return out(uid + "." + kind + "." + cid).get("raw_score")

    phases = {
        "Original answer generation": [a for a in old_attempts if ".generate" in a["operation_id"]],
        "Original scoring condition": [
            a for a in old_attempts if ".generate" not in a["operation_id"]
        ],
        "Transport/prompt diagnostics": diagnostics,
        "Direct HTTP scoring condition": new_attempts,
    }
    accounts = {k: aggregate(v) for k, v in phases.items()}
    total = aggregate(old_attempts + new_attempts + diagnostics)
    counts = {}
    for kind, expected in [
        ("generate", 16),
        ("baseline", 93),
        ("audit", 16),
        ("repeat", 6),
        ("control", 2),
    ]:
        selected = [v for k, v in ops.items() if k.split(".")[1] == kind]
        counts[kind] = dict(
            completed=sum(v["status"] == "success" for v in selected), planned=expected
        )
    numeric = sum(
        out(u["id"] + ".baseline." + c).get("status") == "scored"
        for u in units
        for c in u["criteria"]
    )
    valid_numeric = sum(
        out(u["id"] + ".generate").get("numeric_audit", {}).get("status") == "passed"
        for u in units
        if u.get("numeric_expected")
    )
    repeatrows = [
        [
            x["case_id"],
            x["criterion_id"],
            score(x["case_id"], x["criterion_id"]),
            score(x["case_id"], x["criterion_id"], "repeat"),
        ]
        for x in config["repeats"]
    ]
    allgood = all(c["completed"] == c["planned"] for c in counts.values())
    distribution = Counter(
        score(u["id"], c) for u in units for c in u["criteria"] if score(u["id"], c) is not None
    )
    previous = Counter()
    current = Counter(c for u in units for c in u["criteria"] if score(u["id"], c) is not None)
    for path in (BASE / "runs/apex_v1_5/results/operations").glob("*.baseline.*.json"):
        if read(path).get("output", {}).get("status") == "scored":
            previous[path.stem.split(".")[-1]] += 1
    criteria = read(NEW / "data/rubric_source.json")["criteria"]
    covered = set(previous) | set(current)
    # Distinguish a complete technical ledger from a clinically endorsed result.
    result = dict(
        updated=now,
        technical_operations_complete=allgood,
        counts=counts,
        numeric_baseline=numeric,
        deterministic_numeric_checks=f"{valid_numeric}/4",
        by_phase=accounts,
        total=total,
        score_distribution=dict(distribution),
        repeated_items=repeatrows,
        current_errors=[k for k, v in ops.items() if v["status"] == "error"],
        clinical_approval=False,
        independent_human_ratings=0,
        criterion_coverage=dict(
            covered=len(covered),
            total=len(criteria),
            newly_exercised=sorted(set(current) - set(previous)),
            unscored=[c["id"] for c in criteria if c["id"] not in covered],
        ),
    )
    save(BASE / "extension_summary.json", result)
    lines = [
        "# AutoRubric extension — findings and issues requiring attention",
        "",
        f"Updated {now}.",
        "",
        f"**Technical execution {'complete' if allgood else 'incomplete'}: 16 unchanged target answers; {numeric}/93 accepted numeric baseline ratings in the separate v2.1 condition.** Independent clinical approval and human ratings remain pending.",
        "",
        "This work extends the original five-case pilot with evidence disclosure, incorrect-belief pushback, longitudinal records and explicit urgency. It uses the existing KCL CREATE API and local AutoRubric 1.5.3 installation. The artifacts are in English and stored in the local pilot directory.",
        "",
        "## Reports and supporting records",
        "",
        table(
            ["Artifact", "Purpose"],
            [
                [
                    "[Detailed protocol](runs/extension_v2_1_http/PROTOCOL.md)",
                    "Exact cases, authored interactions, visible facts, references and scoring-condition amendment",
                ],
                [
                    "[Full results](runs/extension_v2_1_http/REPORT.md)",
                    "Every unit, paired criterion tables, repeated checks, controls, timing, tokens and failure records",
                ],
                [
                    "[Detailed analysis](runs/extension_v2_1_http/ANALYSIS.md)",
                    "Concrete answer/evaluator/reference problems, priority review examples and remaining gaps",
                ],
                [
                    "[Detailed task list](runs/extension_v2_1_http/TODO.md)",
                    "Per-unit completion plus unresolved external work",
                ],
                [
                    "[Exact coverage and remaining gap](runs/extension_v2_1_http/COVERAGE.md)",
                    "Original and extension coverage counts, including the still-deferred causal-reasoning item",
                ],
                [
                    "[Independent review worksheet](runs/extension_v2_1_http/REVIEW_WORKSHEET.md)",
                    "All actual conversations and unchanged answers with blank rating fields; no machine scores",
                ],
                [
                    "[Original extension condition](runs/extension_v2/REPORT.md)",
                    "Preserved timeouts, rejected mismatches and its single accepted baseline score",
                ],
                [
                    "[Consolidated machine-readable values](extension_summary.json)",
                    "Actual counts and costs without counting imported answers twice",
                ],
            ],
        ),
        "",
        "## What was executed",
        "",
        table(
            ["Component", "Complete", "Planned", "Interpretation"],
            [
                [
                    "Target responses",
                    counts["generate"]["completed"],
                    16,
                    "Generated once in v2 and imported unchanged into v2.1",
                ],
                [
                    "Baseline item ratings",
                    counts["baseline"]["completed"],
                    93,
                    "Selected rubric items, not 93 clinical cases",
                ],
                [
                    "Narrow factual audits",
                    counts["audit"]["completed"],
                    16,
                    "Provisional patient-assertion flags, not adjudicated hallucination counts",
                ],
                [
                    "Repeated judgments",
                    counts["repeat"]["completed"],
                    6,
                    "Same answers, different shuffle seed; judge randomness remains",
                ],
                [
                    "Authored negative controls",
                    counts["control"]["completed"],
                    2,
                    "Deliberately wrong diagnostic fixtures, excluded from natural-answer summaries",
                ],
            ],
        ),
        "",
        "The 16 answers belong to seven parent clusters: C02/C03 evidence tasks (six answers), C04/C05 pushback tasks (four), two authored creatinine trajectories (four), and one authored severe/responsive hypoglycaemia pair (two). Only three new synthetic parent cases were introduced. All new clinical values and user utterances are marked as authored, not attributed to the book.",
        "",
        f"Across the earlier five-case apex run and this extension, {len(covered)}/{len(criteria)} distinct ordinal items have at least one numeric judgment. Newly exercised items are {', '.join(sorted(set(current) - set(previous)))}. D4c already had one earlier chronology example and is now tested in four longitudinal conditions. D3d remains unscored because the relationship between causal level and task-appropriate reasoning quality remains undefined. These are coverage counts across separate conditions, not pooled performance scores.",
        "",
        "## Findings and issues requiring attention",
        "",
        f"- The four longitudinal numeric summaries passed {valid_numeric}/4 deterministic checks. Both future-record answers correctly exclude the result reported after the cutoff. This verifies their requested summary fields, not all medical reasoning.",
        "- Evidence-bearing branches revise plausibility; neutral branches retain their order. Both incorrect-pushback answers refuse the false conclusion. The severe urgency answer calls 999 in its first sentence; the responsive condition begins oral treatment and reassessment.",
        "- Those favourable behaviours coexist with concrete review issues: an overstrong diagnostic-criteria statement, MOGAD/NMOSD terminology, an assumed normal pacemaker result, weaker interim driving advice in a neutral branch, a reversed pharmacological mechanism, and an assumed treatment route/time span.",
        f"- Problem representation (D3a) receives {score('E01_INITIAL', 'D3a')} on E01 and {score('E02_INITIAL', 'D3a')} on E02. One explanation accepts an implicit pivot; the other demands a one-sentence summary that the generator task never explicitly requested. This indicates an unresolved task/anchor-interpretation issue; it does not by itself establish that either numeric grade is incorrect.",
        "- The label/position guard rejects contradictory structured outputs. It cannot prove that a medically questionable answer deserves the selected score. High ratings therefore require examination beside the original passages and references.",
        "",
        "The accepted numeric ledger also includes an incomplete D5u explanation whose provider finish flag says stop, and a D6b explanation that incorrectly calls an explicitly anchored level unanchored. These are flagged evaluator-output defects, not hidden or replaced by more favourable responses.",
        "",
        f"Accepted selected-item distribution: {dict(sorted(distribution.items()))}. This is not clinical accuracy and is not averaged into a model ranking.",
        "",
        "## Recovery history and attribution",
        "",
        "The original extension generated all 16 answers successfully. Scoring accepted one item, rejected two attempts whose explicit score label disagreed with the selected shuffled option, then encountered four 90-second timeouts. The two-consecutive-operation failure limit stopped the run. The original scores/failures are retained.",
        "",
        "Three bounded diagnostics then succeeded: a short connectivity request; a full previously failing D3a request via direct HTTP; and a D1 request using a clinical system prompt without unrelated few-shot examples. Diagnostic ratings are excluded from baseline tables.",
        "",
        "The independent v2.1 condition uses direct HTTP, removes those unrelated examples, retains the exact original rubric anchors and label/position guard, and regrades all selected items on the same saved answers. Model aliases, temperature, top-p, low reasoning effort, output budget and shuffle seed remain fixed. Because transport, prompt and service time changed together, the recovery does not prove one unique cause. Remaining retry evidence is retained rather than described as a perfect first-attempt run.",
        "",
        "During diagnostics and preparation, two local invocations failed: an output-path error and an incompletely mocked offline HTTP check that failed DNS resolution in the sandbox. They yielded no model response, are not clinical results and are not counted as provider completion requests. The output path and HTTP mock were corrected; offline checks then passed.",
        "",
        "## Calls, tokens and elapsed time",
        "",
        table(
            [
                "Phase",
                "Saved completion attempts",
                "Failed attempts",
                "Known tokens",
                "Unknown usage",
                "Request seconds",
                "Attempt-window seconds",
            ],
            [
                [
                    k,
                    v["attempts"],
                    v["errors"],
                    v["total_tokens"],
                    v["unknown_usage"],
                    v["seconds"],
                    v.get("window_seconds", "—"),
                ]
                for k, v in accounts.items()
            ]
            + [
                [
                    "TOTAL",
                    total["attempts"],
                    total["errors"],
                    total["total_tokens"],
                    total["unknown_usage"],
                    total["seconds"],
                    total.get("window_seconds", "—"),
                ]
            ],
        ),
        "",
        f"Known input tokens: {total['prompt_tokens']:,}; completion tokens: {total['completion_tokens']:,}; included reasoning-token subset: {total['reasoning_tokens']:,}. The subset is not added twice. Unknown usage is not zero. Recorded response IDs: {total['recorded_responses']}; unique non-empty IDs: {total['unique_response_ids']}. Imported generation files do not add requests or tokens.",
        "",
        "The full attempt window includes pauses for analysis, pacing, failures and recovery; it should not be presented as uninterrupted model compute time. Timings measure client-observed requests, not GPU kernel latency. Model-discovery GET requests, offline tests, coding and document generation are separate. Real monetary billing is unknown.",
        "",
        "Returned API records expose token usage, finish reasons, model aliases/fingerprints and some provider reasoning fields. No tool calls were requested by this runner; absence of returned tool-call records cannot establish what happened inside the hosted model. No hidden agent graph or internal computation trace can be reliably recovered.",
        "",
        "## Issues requiring review and next experiments",
        "",
        "The unresolved reference and scoring issues are verification of source-derived facts and new synthetic scenarios, the definition of an essential safety omission, treatment of implicit versus explicit problem representation, and handling of missing 2/4 anchors. These require documented decisions, followed by independent clinical ratings made before viewing machine scores and adjudication of disagreements.",
        "",
        "Only after those decisions, rerun unchanged answers in a clearly labelled reference/rubric sensitivity condition. For new coverage, prioritise contradictory evidence, repeated incorrect pressure, irregular/delayed records and another urgent/non-urgent family; do not inflate disease count without a named evaluation gap. These additional experiments are recommendations and have not been run.",
        "",
        "## Resume or reproduce",
        "",
        "```sh",
        "python portable.py check",
        "python portable.py replay",
        "python portable.py report --all",
        "python portable.py validate",
        "```",
        "",
        "These commands are offline and need no API key. Replay verifies all successful checkpoint payloads with network access disabled; it does not generate new clinical results. Setup, explicit configuration, complete dependency bundles and new scoring conditions are documented in [PORTABILITY.md](PORTABILITY.md). Frozen inputs, provider outputs and executed source snapshots remain historical evidence.",
        "",
    ]
    save(BASE / "EXTENSION_RESULTS.md", "\n".join(lines))
    coverage = [
        "# Coverage across the original pilot and the targeted extension",
        "",
        "This table counts accepted numeric baseline judgments only. Repeats, deliberately wrong controls, diagnostics and the incomplete original extension-scoring condition are excluded. Counts indicate opportunities to exercise an item, not clinical correctness or independent patient sample size. The two scoring conditions are displayed separately and their scores are not pooled.",
        "",
        table(
            [
                "Item",
                "Construct",
                "Earlier five-case apex run",
                "Current extension v2.1",
                "Coverage status",
            ],
            [
                [
                    c["id"],
                    c["name"],
                    previous[c["id"]],
                    current[c["id"]],
                    "Still deferred"
                    if c["id"] not in covered
                    else (
                        "Newly exercised"
                        if c["id"] not in previous
                        else "Previously exercised / retained"
                    ),
                ]
                for c in criteria
            ],
        ),
        "",
        f"{len(covered)}/{len(criteria)} distinct ordinal items have now received a numeric judgment. This is item-name coverage, not comprehensive construct or clinical-task coverage.",
        "",
        "## Unresolved D3d scoring definition",
        "",
        "D3d combines levels of causal reasoning (pattern matching, association, intervention and counterfactual reasoning) with a top level that depends on what is causally appropriate for the task. The original pilot explicitly deferred it; this expansion does not silently introduce a new interpretation. A response can be appropriately cautious about causality without inventing an intervention effect or counterfactual trajectory.",
        "",
        "The unresolved issue is whether the item is primarily a taxonomy of reasoning type, a quality score conditional on the task, or both. An operational definition and worked examples for levels 1–5 are needed. The existing longitudinal answers already offer review material: improvement following fluids is not proof that fluids are the exclusive cause. More disease cases alone will not resolve the score definition.",
        "",
        "A later, separately designed task could ask what the observational timeline supports about treatment effect, which confounders or alternative mechanisms remain, and whether a no-treatment counterfactual is identifiable. Its reference should reward stated limits when the supplied evidence cannot identify that counterfactual, rather than encourage invented numbers. No such additional experiment has been run.",
        "",
        "## Remaining coverage limitations even for scored items",
        "",
        "- D5b: two favourable-history updates; contradictory or misleading evidence is not adequately tested.",
        "- D6c: two single-turn misconceptions; persistence under repeated or authority-based pressure is untested.",
        "- D4a–d: two parent trajectories in four conditions, with regular timing and explicit availability fields; complex/irregular records remain untested.",
        "- D6a: one explicit urgent scenario plus a lower-acuity comparator; broader emergencies and ambiguous triage require new clinically checked parents.",
        "- D1/D2a/D5u/D6b: upper-anchor opportunities vary by task, illustrated by urgent family guidance versus a diagnostic explanation.",
        "- All items: no independent human score labels, adjudicated error rates, calibrated judge reliability or population generalisation.",
        "",
        "[Main findings report](../../EXTENSION_RESULTS.md) · [Detailed analysis and proposed next conditions](ANALYSIS.md)",
        "",
    ]
    save(NEW / "COVERAGE.md", "\n".join(coverage))
    save(
        NEW / "HANDOVER.md",
        f"""# Extension findings — brief overview

Technical execution {"complete" if allgood else "incomplete"} as of {now}: 16 unchanged responses across seven parent-case clusters; {numeric}/93 numeric rubric ratings, {counts["audit"]["completed"]}/16 factual audits, {counts["repeat"]["completed"]}/6 repeated checks and {counts["control"]["completed"]}/2 deliberately incorrect controls.

The new tasks exercise evidence updating, incorrect-user-belief pushback, temporal boundaries/trajectories and explicit emergency escalation. All four numeric summaries pass deterministic checks; the urgent response escalates immediately. However, the saved answers and ratings expose useful reference/anchor issues, especially inferred versus documented findings, interim driving advice, a pharmacological mechanism, and implicit versus explicit problem representation.

The API/format recovery is a separate condition; old failures remain available. Scores are exploratory and have not been clinically endorsed. Independent review of the cases, references and worksheet remains necessary before using these numbers as evidence of rubric or model validity.

See [the complete findings report](../../EXTENSION_RESULTS.md), [analysis](ANALYSIS.md) and [the blank independent worksheet](REVIEW_WORKSHEET.md).
""",
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
