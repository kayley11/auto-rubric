"""Build the public case catalogue from saved research, without making model calls.

Usage: python hosting/export_cases.py --pilot /path/to/Josh_AutoRubric_Pilot
Only the derived catalogue and prepared-case list are written. Historical runs stay intact.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ARENA = Path(__file__).resolve().parents[1]
GROUPS = [
    {"id": "book", "label": "Book cases", "count": 5},
    {"id": "earlier", "label": "Earlier reports", "count": 6},
    {"id": "recent", "label": "Recent reports", "count": 22},
]
N_PURPOSES = {
    "N01": "Check calculations and distinguish recorded trends from an unconfirmed mechanism.",
    "N02": "Explain night-time episodes to a patient and family, including uncertainty and recurrence advice.",
    "N03": "Prioritise emergency action while the exposure causing an abnormal result remains unknown.",
    "N04": "Compare updating after new antibody evidence with a follow-up that supplies no new facts.",
    "N05": "Integrate gut, nerve and cardiac findings without assigning an unconfirmed subtype.",
    "N06": "Distinguish recorded, estimated and result-availability times in a treatment review.",
}
N_LOCATIONS = {
    "N01": "Case presentation, PDF pp. 3 and 5; records through cycle 2, day 4.",
    "N02": "Case description, opening presentation; later imaging, pathology and outcome withheld.",
    "N03": "Case description, first two paragraphs; later exposure and response withheld.",
    "N04": "Case 1 only; source blocks S07-B0052–B0054.",
    "N05": "Source blocks S08-B0062–B0064, B0068 and B0070.",
    "N06": "Source blocks S09-B0050, B0063, B0065–B0068, B0070, B0082, B0086 and B0094–B0097.",
}
N_TYPES = {
    "N01": "Clinical record review and calculation",
    "N02": "Patient and family explanation",
    "N03": "Emergency clinical assessment",
    "N04": "Clinical assessment with two follow-up branches",
    "N05": "Clinical investigation review",
    "N06": "ICU treatment-timeline review",
}


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def reference_text(value):
    if isinstance(value, str):
        return value
    return "\n\n".join(
        key.replace("_", " ").capitalize() + ":\n" + "\n".join("- " + x for x in value[key])
        for key in (
            "working_hypotheses",
            "required_points",
            "essential_safety",
            "supporting_points",
        )
        if value.get(key)
    )


def write_evidence(target, entry, conditions):
    """Publish visible answers/reasons and anchors, not provider envelopes or private reasoning."""
    words = [
        f"# {entry['id']} — {entry['title']}",
        "",
        f"Source: {entry['source']}",
        f"Location: {entry['source_location']}",
        f"Audience: {entry['audience']}",
        "Clinical reference and information requirements: awaiting confirmation.",
        "Saved conditions are labelled separately; no overall score is calculated.",
    ]
    for condition in conditions:
        words += [
            "",
            "## " + condition["label"],
            "",
            "Rules: " + condition["rules"],
            "Answering model: arc:lite. Judge: arc:apex.",
            "",
            "### Case facts supplied",
            "",
            condition["facts"],
            "",
            "### Task supplied",
            "",
            condition["task"],
        ]
        if condition.get("history"):
            words += ["", "### Conversation supplied", "", condition["history"]]
        words += [
            "",
            "### Saved answer — unchanged",
            "",
            condition["answer"],
            "",
            "### Provisional scoring reference",
            "",
            condition["reference"],
            "",
            "### Saved item results",
            "",
        ]
        for score in condition["scores"]:
            words += [
                f"#### {score['item']} — {score['name']}: {score['score']}",
                "",
                score["reason"],
                "",
                "Anchors used:",
            ]
            words += [f"- {k}: {v}" for k, v in score["anchors"].items()]
    body = "\n".join(words) + "\n"
    (target / f"{entry['id']}.md").write_text(body, encoding="utf-8")
    plain = re.sub(r"^#{1,6}\s+", "", body, flags=re.M)
    (target / f"{entry['id']}.txt").write_text(plain, encoding="utf-8")
    dump(target / f"{entry['id']}.json", {**entry, "conditions": conditions})


def export(pilot):
    target = ARENA / "public/cases"
    target.mkdir(parents=True, exist_ok=True)
    library = read(ARENA / "case-library.json")
    book_run = pilot / "runs/apex_v1_5"
    book = read(book_run / "data/cases.json")
    refs = read(book_run / "data/reference_notes.json")
    applicability = read(book_run / "data/applicability.json")
    book_rules = {r["id"]: r for r in read(book_run / "data/rubric_source.json")["criteria"]}
    book_scores = read(book_run / "results/baseline_scores.json")
    entries, book_templates = [], []

    for case in book:
        cid = case["id"]
        selected = [s for s in book_scores if s["case_id"] == cid]
        template = {
            "case_id": cid,
            "base_case_id": cid,
            "title": cid + " — " + case["topic"],
            "facts": case["facts"],
            "task": case["task"],
            "history": "",
            "answer": "",
            "criteria": [s["criterion_id"] for s in selected],
            "source": "Cases for PACES, 3rd edition; "
            + case["source_locator"]
            + "; "
            + case["source_url"],
            "reference": reference_text(refs[cid]),
            "reference_status": "draft",
            "answer_model": "arc:lite",
            "judge_model": "arc:apex",
            "library_group": "book",
        }
        assert all(applicability[cid][i]["status"] == "applicable" for i in template["criteria"])
        book_templates.append(template)
        entry = {
            "id": cid,
            "title": case["topic"],
            "group": "book",
            "audience": "Patient" if cid == "C05" else "Clinician",
            "task_type": "Patient explanation" if cid == "C05" else "Clinical assessment",
            "summary": case["facts"],
            "purpose": case["rationale"],
            "source": case["source_url"],
            "source_label": "Cases for PACES, 3rd edition",
            "source_location": case["source_locator"],
            "source_note": "Paraphrased from the checked third-party transcription; edition/source verification remains pending.",
            "templates": [{"id": cid, "label": "Original written task"}],
            "evidence": [
                {
                    "label": "Original written answer and scores",
                    "url": f"/cases/{cid}.md",
                    "download": True,
                },
                {"label": "Plain-text output", "url": f"/cases/{cid}.txt", "download": True},
                {
                    "label": "Three-model interviews",
                    "url": f"#study/{cid}/lite",
                    "detail": "Separate staged condition; historical and revised D3a / D5c results.",
                },
            ],
            "notes": "The original written task gives all retained facts at the start. The interview condition releases facts in response to requests.",
            "criteria": [{"id": i, "name": book_rules[i]["name"]} for i in template["criteria"]],
        }
        answer = read(book_run / f"results/operations/{cid}.generate.json")["output"]["answer"]
        scores = [
            {
                "item": s["criterion_id"],
                "name": book_rules[s["criterion_id"]]["name"],
                "score": s["raw_score"],
                "reason": s["reason"],
                "anchors": book_rules[s["criterion_id"]]["anchors"],
            }
            for s in selected
        ]
        write_evidence(
            target,
            entry,
            [
                {
                    "label": "Original written pilot · 27 September",
                    "rules": "Original PDF rubric; saved item-specific selection.",
                    "facts": case["facts"],
                    "task": case["task"],
                    "answer": answer,
                    "reference": template["reference"],
                    "scores": scores,
                }
            ],
        )
        entries.append(entry)

    # N04's three branches remain three templates belonging to one base case.
    existing = [c for c in library["cases"] if not re.fullmatch(r"C0[1-5]", c["case_id"])]
    library["cases"] = book_templates + existing
    for case in existing:
        case["library_group"] = "recent" if case["case_id"].startswith("CAND") else "earlier"
        case["base_case_id"] = "N04" if case["case_id"].startswith("N04_") else case["case_id"]
    by_id = {c["case_id"]: c for c in library["cases"]}
    for n in range(1, 7):
        cid = f"N{n:02d}"
        ids = ["N04_INITIAL", "N04_EVIDENCE", "N04_NEUTRAL"] if cid == "N04" else [cid]
        first = by_id[ids[0]]
        conditions = []
        for ident in ids:
            directory = (
                "new_cases_20261022/runs/ui_batch_20261022"
                if n <= 3
                else "new_cases_batch2_20261022/runs/ui_batch2_20261022"
            )
            saved = read(pilot / directory / f"{ident}.json")
            inp = saved["input"]
            rules = {r["id"]: r for r in saved["rubric"]["criteria"]}
            scores = [
                {
                    "item": i,
                    "name": rules[i]["name"],
                    "score": g.get("score", g["status"]),
                    "reason": g["reason"],
                    "anchors": rules[i]["anchors"],
                }
                for i, g in saved["grades"].items()
            ]
            label = {
                "N04_INITIAL": "Initial assessment",
                "N04_EVIDENCE": "New antibody evidence",
                "N04_NEUTRAL": "No new information",
            }.get(ident, "Written assessment")
            conditions.append(
                {
                    "id": ident,
                    "label": label + " · 22 October",
                    "rules": "Original PDF rubric; saved item-specific selection.",
                    "facts": inp["facts"],
                    "task": inp["task"],
                    "history": inp.get("history", ""),
                    "answer": saved["generated_answer"],
                    "reference": inp.get("reference", ""),
                    "scores": scores,
                }
            )
        doi = re.search(r"https://doi.org/[^;\s]+", first["source"]).group()
        evidence = [
            {"label": "Written answers and scores", "url": f"/cases/{cid}.md", "download": True},
            {"label": "Plain-text output", "url": f"/cases/{cid}.txt", "download": True},
        ]
        if cid in ("N02", "N04", "N05"):
            route = "N04_INITIAL" if cid == "N04" else cid
            evidence.append(
                {
                    "label": "Three-model interviews",
                    "url": f"#study/{route}/lite",
                    "detail": "Separate staged condition; historical and revised D3a / D5c results.",
                }
            )
        if cid == "N04":
            evidence.append(
                {
                    "label": "Corrected-record follow-up",
                    "url": "#study/followup",
                    "detail": "Later N04 simulator revision, retained separately.",
                }
            )
        title = re.sub(r"^N\d\d\s*[—–-]\s*", "", first["title"])
        entry = {
            "id": cid,
            "title": title,
            "group": "earlier",
            "audience": "Patient and family" if cid == "N02" else "Clinical team",
            "task_type": N_TYPES[cid],
            "summary": first["facts"].split("\n\n")[0],
            "purpose": N_PURPOSES[cid],
            "source": doi,
            "source_label": "Published case report · October 2026",
            "source_location": N_LOCATIONS[cid],
            "source_note": "One reported patient per base case; task wording and audience adapted for this study.",
            "templates": [
                {
                    "id": ident,
                    "label": {
                        "N04_INITIAL": "Initial assessment",
                        "N04_EVIDENCE": "New-evidence follow-up",
                        "N04_NEUTRAL": "No-new-information follow-up",
                    }.get(ident, "Written task"),
                }
                for ident in ids
            ],
            "evidence": evidence,
            "notes": "The two follow-ups share one saved initial answer; they are not additional patients."
            if cid == "N04"
            else "MELD continuation checks were run separately from clinical scoring; they do not label a case as unseen.",
            "criteria": [
                {
                    "id": i,
                    "name": next(
                        s["name"] for c in conditions for s in c["scores"] if s["item"] == i
                    ),
                }
                for i in dict.fromkeys(s["item"] for c in conditions for s in c["scores"])
            ],
        }
        write_evidence(target, entry, conditions)
        entries.append(entry)

    for row in read(ARENA / "public/case-study/index.json")["cases"]:
        record = read(ARENA / f"public/case-study/{row['id']}.json")
        locations = list(dict.fromkeys(f["source_location"] for f in record["facts"]))
        entries.append(
            {
                "id": row["id"],
                "title": row["title"],
                "group": "recent",
                "audience": "Clinician",
                "task_type": "Staged information requests and clinical assessment",
                "summary": record["opening"],
                "purpose": record["purpose"],
                "source": record["source"],
                "source_label": "Published case report · October 2026",
                "source_location": "Saved source blocks: " + "; ".join(locations),
                "source_note": "Source-checked facts; later diagnoses/outcomes withheld from the answering model.",
                "templates": [{"id": row["id"], "label": "Written snapshot"}],
                "evidence": [
                    {
                        "label": "Saved interview and all scores",
                        "url": f"#study/cases/{row['id']}",
                        "detail": "Selected manuscript anchors, 24 Oct snapshot; arc:lite answers / arc:apex judge.",
                    },
                    {
                        "label": "Full case and results",
                        "url": f"/case-study/{row['id']}.md",
                        "download": True,
                    },
                    {
                        "label": "Unscored review copy",
                        "url": f"/case-study/{row['id']}.unscored.md",
                        "download": True,
                    },
                ],
                "notes": "The prepared written snapshot includes all stored facts at the decision point. The saved interview includes only facts actually returned. No new MELD run was made for CAND01–CAND22.",
                "criteria": [{"id": s["item"], "name": s["name"]} for s in record["scores"]],
            }
        )

    assert len(entries) == len({c["id"] for c in entries}) == 33
    assert len(library["cases"]) == len({c["case_id"] for c in library["cases"]}) == 35
    assert len({c["base_case_id"] for c in library["cases"]}) == 33
    library.update(updated_on="2026-10-29", base_case_count=33, template_count=35)
    dump(ARENA / "case-library.json", library)
    dump(
        target / "index.json",
        {
            "updated_on": "2026-10-29",
            "base_case_count": 33,
            "template_count": 35,
            "clinical_status": "awaiting confirmation",
            "groups": GROUPS,
            "cases": entries,
        },
    )
    words = [
        "# Case library",
        "",
        "33 base cases: 5 book cases, 6 earlier report cases and 22 recent report cases.",
        "35 written templates: N04 has one initial task and two follow-ups. These are not three patients.",
        "Clinical references and candidate information requirements: awaiting confirmation.",
        "Saved written, interactive and revised-scoring conditions retain their own outputs and rules.",
        "",
        "| Case | Presentation | Audience | Source | Saved evidence |",
        "|---|---|---|---|---|",
    ]
    for c in entries:
        words.append(
            f"| [{c['id']}](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/{c['id']}) | {c['title']} | {c['audience']} | [Source]({c['source']}) | {c['task_type']} |"
        )
    (target / "ALL_CASES.md").write_text("\n".join(words) + "\n", encoding="utf-8")
    print(
        "Exported 33 base cases, 35 templates and 11 original evidence packets. Historical runs were read only."
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--pilot", type=Path, required=True)
    export(parser.parse_args().pilot.resolve())
