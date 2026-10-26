"""Fixed-record base routing from the preserved interview controller.

Original source SHA-256:
0cf0e0c361d77a6f385d522a702d41bd2d60f8429217cb8cd06bf2b12c07281e.
Admission, history and specific
report repairs are applied by patient_matching.py. No clinical facts are created.
"""

import re
from difflib import SequenceMatcher

RECORD_TOPICS = set(
    [
        "examination",
        "vital_signs",
        "routine_laboratory",
        "glucose",
        "microbiology",
        "csf",
        "ct_imaging",
        "mri_imaging",
        "echocardiography",
        "eeg",
        "monoclonal_testing",
        "enzyme_genetics",
        "nuclear_imaging",
        "gastrointestinal_records",
        "device_check",
    ]
)

RECORD_TERMS = {
    "examination": r"exam|neurolog|physical|signs|assessment",
    "vital_signs": r"vital|blood pressure|pulse|heart rate|observations",
    "routine_laboratory": r"blood|lab|biochem|metabolic|renal|creatinine|troponin|bnp",
    "glucose": r"glucose|sugar|hypoglyc",
    "microbiology": r"infect|culture|pcr|serolog|borrelia",
    "csf": r"csf|cerebrospinal|lumbar|puncture|spinal fluid",
    "ct_imaging": r"\bct\b|scan|imaging|computed",
    "mri_imaging": r"\bmri\b|scan|imaging|magnetic",
    "echocardiography": r"echo|ultrasound|heart imaging|cardiac imaging",
    "eeg": r"eeg|electroenceph|brain wave",
    "monoclonal_testing": r"monoclonal|immunofix|light.chain|protein|paraprotein",
    "enzyme_genetics": r"enzyme|genetic|galactosidase|gla|lyso",
    "nuclear_imaging": r"pyp|scintig|nuclear|tracer|pyrophosphate",
    "gastrointestinal_records": (
        r"endoscop|colonoscop|histolog|biops|"
        r"gastrointestinal|stomach|bowel"
    ),
    "device_check": r"pacemaker|device|interrogat",
}

EXPLICIT_RECORD_TERMS = {
    "ct_imaging": r"\bct\b|computed tomograph",
    "mri_imaging": r"\bmri\b|magnetic resonance",
    "csf": r"\bcsf\b|cerebrospinal|lumbar puncture|spinal tap",
    "eeg": r"\beeg\b|electroenceph",
    "glucose": r"glucose|blood sugar",
    "vital_signs": r"blood pressure|vital signs|pulse readings|heart rate",
    "echocardiography": r"echocardiogra|echocardiogram|\becho\b",
    "microbiology": r"culture|\bpcr\b|serolog",
    "monoclonal_testing": r"monoclonal|immunofix|free.light.chain|paraprotein",
    "enzyme_genetics": r"enzyme|genetic|galactosidase|\bgla\b|lyso",
    "nuclear_imaging": r"\bpyp\b|scintig|nuclear medicine|pyrophosphate",
    "gastrointestinal_records": r"colonoscop|endoscop|histolog",
    "device_check": r"pacemaker|device check|interrogation",
}


def scope_period(d):
    q = d["question"]
    # An explicit admission in the question is authoritative even if the JSON tag says any.
    earlier = bool(re.search(r"(previous|first|initial|earlier) admission", q, re.I))
    later = bool(re.search(r"readmission|14 march|(current|this|latest) admission", q, re.I))
    if earlier and not later:
        return "initial"
    if later and not earlier:
        return "readmission"
    p = d.get("record_period", "any")
    if p not in ["any", "initial", "previous", "readmission", "current"]:
        return "any"
    # The explicit natural-language question, not an invisible tag, must request the scope.
    words = {
        "initial": r"initial|first|earlier|original",
        "previous": r"previous|earlier|night|overnight|past",
        "readmission": r"readmi|return|second admission|14 march",
        "current": r"current|now|today|latest|daytime|updated|recent",
    }
    return p if p == "any" or re.search(words[p], d["question"], re.I) else "any"


def select_facts(c, d, released):
    """Select new fixed facts only; bound each report category and retain context."""
    topics = list(dict.fromkeys(d["topics"]))
    # Tags assist routing; a tag omission must not hide a report explicitly asked for.
    for topic, pattern in EXPLICIT_RECORD_TERMS.items():
        if re.search(pattern, d["question"], re.I) and topic not in topics:
            topics.append(topic)
    if (
        re.search(r"medicines|medication|treatment|drug|dose", d["question"], re.I)
        and "medications" not in topics
    ):
        topics.append("medications")
    patient = [
        f
        for f in c["facts"]
        if f["channel"] == "patient" and f["topic"] in topics and f["id"] not in released
    ]
    record = []
    groups = []
    notes = []
    period = scope_period(d)
    for topic in topics:
        if topic == "tests":
            notes.append(
                "A broad tests request releases no results. Please specify "
                "the type of existing examination or investigation."
            )
            continue
        candidates = [
            f
            for f in c["facts"]
            if f["channel"] != "patient"
            and (f["topic"] == topic or topic in f.get("also_topics", []))
            and f["id"] not in released
        ]
        if topic in RECORD_TOPICS:
            if not re.search(RECORD_TERMS[topic], d["question"], re.I):
                notes.append(
                    "No "
                    + topic
                    + " report returned: the actual question did not request that report type."
                )
                continue
            if period != "any":
                effective = period
                if c["case_id"] == "N04_INITIAL" and period in ["current", "previous"]:
                    effective = "readmission" if period == "current" else "initial"
                if c["case_id"] == "N05" and period == "previous":
                    effective = "initial"
                candidates = [f for f in candidates if f["period"] in [effective, "any"]]
            # Region-specific requests must not receive another region's MRI report.
            if topic == "mri_imaging":
                if re.search(r"brain|head", d["question"], re.I) and not re.search(
                    r"spin|back", d["question"], re.I
                ):
                    candidates = [f for f in candidates if "spinal MRI" not in f["text"]]
                if re.search(r"spin|back", d["question"], re.I) and not re.search(
                    r"brain|head|cardiac|heart", d["question"], re.I
                ):
                    candidates = [
                        f
                        for f in candidates
                        if "Brain MRI" not in f["text"] and "Cardiac MRI" not in f["text"]
                    ]
            if candidates and len(groups) < 2:
                group = candidates[0]["release_group"]
                chosen = [
                    f for f in c["facts"] if f["release_group"] == group and f["id"] not in released
                ]
                record.extend(chosen)
                groups.append(group)
                notes.append(
                    "One existing "
                    + topic
                    + (
                        " report group returned with its clinical context. A later "
                        "question can request another existing report."
                    )
                )
        else:
            # History questions can elicit fixed collateral, not unrelated investigations.
            record.extend(candidates)
    return patient, record, notes


def repeated_reason(d, turns, patient, records):
    if d["action"] != "ask":
        return ""
    new = {f["id"] for f in patient + records}
    if new:
        return ""

    def norm(s):
        return " ".join(re.findall(r"[a-z0-9]+", s.lower()))

    for t in turns:
        if (
            set(t["topics"]) == set(d["topics"])
            and SequenceMatcher(None, norm(t["question"]), norm(d["question"])).ratio() >= 0.86
        ):
            return (
                "This repeats an earlier question without any additional "
                "recorded information to return."
            )
    if sum(set(t["topics"]) == set(d["topics"]) and not t["new_fact_ids"] for t in turns) >= 2:
        return "Two earlier questions in this same scope returned no new recorded information."
    return ""


def turn_text(turn, include_checkpoint=False):
    parts = [f"Clinician: {turn['question']}"]
    if include_checkpoint:
        a = turn["doctor_output"]["assessment"]
        parts.append(
            "Recorded clinician checkpoint BEFORE the patient reply (not patient-facing): "
            + a["summary"]
            + " [certainty: "
            + a["certainty"]
            + "]"
        )
    if turn.get("patient_reply"):
        parts.append("Patient: " + turn["patient_reply"])
    elif not turn["fixed_records"]:
        parts.append(
            "Simulator: No additional recorded detail is available for "
            "this question. This is not a negative finding or proof that "
            "a test was never performed."
        )
    for fact in turn["fixed_records"]:
        label = (
            "Fixed collateral record"
            if fact["channel"] == "collateral"
            else "Fixed clinical record"
        )
        parts.append(label + " [" + fact["context"] + "]: " + fact["text"])
    if turn.get("feedback"):
        parts.append("Controller: " + turn["feedback"])
    return "\n".join(parts)
