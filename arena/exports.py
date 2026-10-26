"""Readable clinical summaries and genuinely score-free review exports."""

import json

import evidence
import scoring


def summary(packet, blind=False, decisions=None, rating=None):
    data = packet["data"]
    lines = [
        "# " + (evidence.anonymous_name(packet) if blind else packet["name"]),
        "",
        packet["batch"],
        "",
        "## Case and task",
        "",
        data["facts"],
        "",
        data["task"],
        "",
        "## Information actually received",
        "",
        scoring.transcript(data["interview"]),
        "",
        "## Answer",
        "",
        data["answer"],
        "",
    ]
    if blind:
        lines += [
            "## Independent ratings",
            "",
            "Record D3a before reading examiner-only D5c information.",
            "",
        ]
        rules = packet.get("all_rules", packet["rules"])
        ordered = sorted(rules, key=lambda cid: (cid == "D5c", cid != "D3a", cid))
        for cid in ordered:
            rule = rules[cid]
            lines += ["### " + cid, "", rule.get("definition", rule.get("name", "")), ""]
            for score in ("1", "2", "3", "4", "5"):
                words = rule["anchors"].get(score, "No original descriptor supplied.")
                lines.append(f"- {score}: {words}")
            for key in ("applicability", "notes_vs_patient_directed_explanations"):
                if rule.get(key):
                    lines += ["", rule[key]]
            for key in ("essential_scoring_rules", "relationship_to_D5c"):
                lines += ["- " + line for line in rule.get(key, [])]
            lines += ["", "Grade (1–5 / N/A / Indeterminate): ______", "Reason: ______", ""]
        lines += ["## D5c examiner information — read after D3a", ""]
        for req in data.get("requirements", []):
            lines += [
                f"- {req['id']} ({req['level']}): {req['requirement']}",
                "  Acceptable requests: " + req["acceptable_requests_or_alternatives"],
                "  Deadline: " + req["deadline"],
            ]
        lines += [
            "",
            "Assessment notes and actual requests",
            "",
            scoring.transcript(data["interview"], notes=True),
            "",
            data["interview"].get("availability_context", ""),
        ]
    else:
        lines += ["## Item results", "", "Answering model: " + packet["model"], ""]
        if packet.get("score_context"):
            lines += [packet["score_context"], ""]
        for cid, grades in packet.get("all_scores", packet["scores"]).items():
            lines += [
                f"### {cid}: "
                + ", ".join(str(g.get("label", g.get("score", "—"))) for g in grades),
                "",
            ]
            for g in grades:
                lines += [
                    f"Repeat {g.get('repeat', 1)}: {g.get('reason', g.get('error', 'No result'))}",
                    "",
                ]
        lines += [
            "## Questions for clinical review",
            "",
            packet.get("review_question", ""),
            "",
            "Clinical references and candidate requirements await confirmation.",
            "",
        ]
        if data.get("reference"):
            lines += ["### Provisional reference", "", data["reference"], ""]
    if decisions:
        lines += ["## Recorded clinical decisions", "", "Reviewer: " + decisions["reviewer"], ""]
        for rid, row in decisions["decisions"].items():
            lines += [
                f"- {rid}: {row['status']} · {row['level']}",
                "  Alternatives: " + row["alternatives"],
                "  Deadline: " + row["deadline"],
                "  Reason: " + row["reason"],
            ]
    if rating and not blind:
        lines += [
            "## Saved human ratings",
            "",
            "Reviewer: " + rating["reviewer"],
            "Saved: " + rating["saved_at"],
            "",
        ]
        for cid, row in rating["items"].items():
            lines += [
                f"- {cid}: {row['score']} — {row['note']}",
                f"  Machine results seen before rating: {row['machine_scores_seen']}; "
                f"model identity known: {row['model_identity_seen']}",
            ]
    return "\n".join(lines) + "\n"


def raw_run(run):
    return (
        "AUTORUBRIC — COMPLETE SAVED RUN\n"
        "All saved inputs, visible model responses, attempts, failures and reviews. "
        "No provider-hidden reasoning or API credentials are included.\n\n"
        + json.dumps(run, ensure_ascii=False, indent=2)
        + "\n"
    )
