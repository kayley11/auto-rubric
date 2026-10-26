"""Targeted, deterministic question matching; never adds or rewrites case facts."""

import re


def has(pattern, text):
    return bool(re.search(pattern, text, re.I))


def clauses(question):
    # Separate requests, while keeping investigation lists and their local episode.
    parts = re.split(
        (
            "[?;]|\\band\\s+(?=(?:on|during|in|at)\\s+(?:this|the|your|first|initial|p"
            "revious|current|readmission)|readmission|re-admission|(?:first|initial"
            "|previous|current|second)[ -]admission|(?:have|has|do|did|are|were|is|"
            "was|could|can|what)\\b)"
        ),
        question,
        flags=re.I,
    )
    return [part.strip(" ,") for part in parts if part.strip(" ,")]


def own_clauses(question):
    return [
        part
        for part in clauses(question)
        if not has(
            r"\bfamily\b|\brelatives?\b(?!\s+to\b)|\bparents?\b|\bsiblings?\b|"
            r"\bbrother\b|\bsister\b|\bmother\b|\bfather\b",
            part,
        )
    ]


def past_request(text):
    return has(
        r"\b(previous|earlier|prior|past|before|ever|used to)\b|came and went|come and go", text
    ) and has(
        (
            "episode|symptom|problem|history|trouble|disturbance|similar|condition|"
            "illness|vision|speech|urinar|neurolog|weakness|numbness"
        ),
        text,
    )


def corrected_history(c, d, released, original):
    parts = own_clauses(d["question"])
    text = " ".join(parts)
    topics = list(d["topics"]) if text else []
    # A skin-only or past-only question must not acquire current bowel/gait facts
    # merely because the model attached a broad presenting-symptoms tag.
    current_parts = [
        part
        for part in parts
        if not past_request(part) or has(r"current|right now|at present|today", part)
    ]
    current = " ".join(current_parts)
    current_pattern = (
        r"unstead|gait|walking|balance|symptom"
        if c["case_id"] == "C02"
        else (
            "diarrh|bowel|stool|back|abdom|blood|cramp|urgenc|other symptoms|associ"
            "ated symptoms|anything else"
        )
    )
    if "presenting_symptoms" in topics and not has(current_pattern, current):
        topics.remove("presenting_symptoms")
    if (
        c["case_id"] == "C02"
        and "timecourse" in topics
        and not has(
            (
                "unstead|gait|walking|balance|hot|heat|trigger|aggravat|when|how long|s"
                "tart|began|begin|worsen|change|better|worse"
            ),
            current,
        )
    ):
        topics.remove("timecourse")
    if "previous_episodes" in topics:
        topics.remove("previous_episodes")
    if c["case_id"] == "C02":
        if any(past_request(part) for part in parts):
            topics.append("previous_episodes")
    else:
        # Earlier bowel episodes or family history do not establish personal skin history.
        skin = has(r"skin|rash|shin|lesion|nodule|erythema", text)
        current_only = has(r"right now|currently|at present", text) and not past_request(text)
        broad_past = past_request(text) and has(
            (
                "other.*(?:symptoms?|problems?|conditions?|illness)|(?:medical|health) "
                "history|past (?:medical|health) problems"
            ),
            text,
        )
        if (skin and not current_only) or broad_past:
            topics.append("previous_episodes")
        if has(r"travel|abroad|overseas|holiday|foreign", text):
            topics.append("exposures")
        elif "exposures" in topics:
            topics.remove("exposures")
        if has(r"antibiotic|medicin|medication|treatment|treated|taken anything", text):
            topics.append("medications")
        elif "medications" in topics:
            topics.remove("medications")
    q = dict(d, question=text, topics=list(dict.fromkeys(topics)))
    patient, records, notes = original(c, q, released)
    if c["case_id"] == "C03":
        broad_current = has(
            (
                "other (?:current |associated )?symptoms?|associated symptoms?|anything"
                " else|how.*(?:feel|health)|tell me (?:more |about )?(?:all )?(?:your )"
                "?symptoms"
            ),
            current,
        )
        if not broad_current and not has(r"back|spine|stiff", current):
            patient = [f for f in patient if f["id"] != "C03_F05"]
        if not broad_current and not has(r"fever|temperature|weight", current):
            patient = [f for f in patient if f["id"] != "C03_F07"]
            records = [f for f in records if f["id"] != "C03_F07"]
    if not text:
        notes.append(
            "No selected family-history details are available for this question; th"
            "is is not a negative family history."
        )
    return patient, records, notes


def period_for(part, whole):
    earlier_pattern = (
        "(first|initial|previous|earlier|original|prior|last|former)[ -](?:hosp"
        "ital[ -])?(?:admission|stay|hospitali[sz]ation)|first hospital|before "
        "discharge|\\b11(?:th)? march\\b|\\bmarch 11\\b|2026-03-11"
    )
    earlier = has(earlier_pattern, part)
    later = has(
        (
            "readmission|re-admission|14 march|(current|this|latest|second)[ -]admi"
            "ssion|\\bnow\\b|\\btoday\\b|\\bcurrent(?:ly)?\\b|\\bat present\\b"
        ),
        part,
    )
    if earlier and later:
        return "ambiguous"
    if earlier:
        return "initial"
    if later:
        return "readmission"
    # Inherit an episode only when the entire question mentions exactly one.
    earlier = has(earlier_pattern, whole)
    later = has(
        (
            "readmission|re-admission|14 march|(current|this|latest|second)[ -]admi"
            "ssion|\\bnow\\b|\\btoday\\b|\\bcurrent(?:ly)?\\b|\\bat present\\b"
        ),
        whole,
    )
    return "initial" if earlier and not later else "readmission" if later and not earlier else "any"


def record_topics(part):
    topics = []
    patterns = {
        "examination": (
            "examin|physical assessment|neurological findings|recorded signs|clinic"
            "al assessment findings"
        ),
        "ct_imaging": r"\bct\b|computed tomograph",
        "mri_imaging": r"\bmri\b|magnetic resonance",
        "microbiology": (
            "\\bpcr\\b|culture|serolog|microbiolog|infection tests?|infectious workup"
            "|specific infections identified"
        ),
        "medications": r"treatment|medicin|medication|dexamethasone|steroid|drug",
    }
    for topic, pattern in patterns.items():
        if has(pattern, part):
            topics.append(topic)
    csf = has(r"\bcsf\b|cerebrospinal|lumbar puncture|spinal tap|spinal fluid", part)
    cells = has(
        (
            "cell count|cells|pleocyt|protein|csf (?:analysis|results?|findings)|lu"
            "mbar puncture (?:results?|findings)"
        ),
        part,
    )
    # Sample name alone in a PCR/culture request is not a cell-count request.
    imaging_rationale = bool({"ct_imaging", "mri_imaging"} & set(topics)) and has(
        r"(?:low )?csf (?:pressure|leak)|intracranial hypotension", part
    )
    direct_csf = cells or has(r"lumbar puncture|spinal tap|csf report|opening pressure", part)
    if csf and (cells or "microbiology" not in topics) and (not imaging_rationale or direct_csf):
        topics.append("csf")
    return topics


def corrected_n04(c, d, released):
    patient, records, notes, used_types = [], [], [], set()
    chosen_ids = set(released)
    report_count = 0
    parts = [
        part.strip()
        for clause in own_clauses(d["question"])
        for part in re.split(
            r"\band\s+(?=(?:the\s+)?(?:current|initial|previous|first|last|prior|readmission)\b)",
            clause,
            flags=re.I,
        )
    ]
    for part in parts:
        period = period_for(part, d["question"])
        topics = record_topics(part)
        if period == "ambiguous":
            notes.append(
                "This request combines admissions without separating the findings; plea"
                "se specify the admission for the report requested."
            )
            continue
        if period == "any" and topics and has(r"admission|hospitali[sz]ation|hospital stay", part):
            notes.append(
                "The admission in this request is unclear; please specify first admissi"
                "on or readmission. No report from another admission is substituted."
            )
            continue
        # Personal history and course facts are matched to what was actually asked.
        ids = []
        reason = has(
            (
                "what.*(?:reason|being treated)|what.*admitted for|reason for|"
                "why.*(?:admi|hospital)|what "
                "(?:symptoms|led).*admi|what was.*admission"
            ),
            part,
        )
        response_request = has(r"help|respond|improv|reliev|recover", part)
        past_symptoms = reason or (
            not topics
            and not response_request
            and (
                (past_request(part) and has(r"symptom|fever|headache|episode", part))
                or (period == "initial" and has(r"symptom|fever|headache|presentation", part))
            )
        )
        if past_symptoms and period != "readmission":
            ids.append("N04_INITIAL_F01")
        if (
            has(r"symptom|headache|pain|photophob|tremor|dizz", part)
            and not topics
            and not past_symptoms
            and period != "initial"
        ):
            ids.extend(["N04_INITIAL_F09", "N04_INITIAL_F10"])
        if has(
            (
                "past medical history|known (?:medical )?conditions|existing (?:medical"
                " )?conditions|other medical|medical history"
            ),
            part,
        ):
            ids.append("N04_INITIAL_F02")
        if (
            has(
                r"improv|recover|respond|response|did.*help|"
                r"when (?:were you|was she|was he) discharged|"
                r"how long (?:were you|was she|was he) in hospital|"
                r"what happened.*admission",
                part,
            )
            and period != "readmission"
        ):
            ids.append("N04_INITIAL_F08")
        for fid in ids:
            if fid in chosen_ids:
                continue
            fact = next(f for f in c["facts"] if f["id"] == fid)
            (patient if fact["channel"] == "patient" else records).append(fact)
            chosen_ids.add(fid)
        for topic in topics:
            if topic == "medications" and has(
                r"(?:at|on|after|since) (?:the |your )?discharg|sent home|since returning home",
                part,
            ):
                notes.append(
                    "No discharge prescription or post-discharge medication record is "
                    "included in the selected materials. Inpatient treatment is not "
                    "substituted for this request."
                )
                continue
            if topic in used_types or report_count >= 2:
                notes.append(
                    "One report per investigation type and at most two reports per turn are"
                    " returned; another report can be requested next turn."
                )
                continue
            candidates = [
                f for f in c["facts"] if f["topic"] == topic and f["id"] not in chosen_ids
            ]
            if period != "any":
                candidates = [f for f in candidates if f["period"] in [period, "any"]]
            elif len({f["period"] for f in candidates}) > 1:
                notes.append(
                    "More than one admission has this report type; please specify first adm"
                    "ission or readmission."
                )
                continue
            if topic == "mri_imaging":
                brain = has(r"brain|head", part)
                spine = has(r"spin|back", part)
                if brain and not spine:
                    candidates = [f for f in candidates if "Brain MRI" in f["text"]]
                if spine and not brain:
                    candidates = [f for f in candidates if "Spinal MRI" in f["text"]]
            if topic == "csf" and period == "initial":
                repeat = has(r"repeat|follow.up|subsequent|second|later", part)
                candidates = [
                    f
                    for f in candidates
                    if f["id"] == ("N04_INITIAL_F07" if repeat else "N04_INITIAL_F04")
                ]
            if not candidates:
                continue
            fact = candidates[0]
            records.append(fact)
            chosen_ids.add(fact["id"])
            used_types.add(topic)
            report_count += 1
            notes.append(
                "Matched "
                + topic
                + " to its requested admission; retained the original context label."
            )
    return patient, records, notes


def corrected_n05(c, d, released, original):
    patient, records, notes = original(c, d, released)
    q = d["question"]
    ttr = has(r"\bttr\b|transthyretin", q)
    gla = has(r"\bgla\b|galactosidase|fabry|lyso.?gb3", q)
    if ttr and not gla:
        records = [f for f in records if f["id"] != "N05_F11"]
        notes = [note for note in notes if "enzyme_genetics report" not in note]
        notes.append(
            "No selected TTR result is available at this decision point. This is no"
            "t evidence of a negative result or of testing never being performed."
        )
    if (
        has(r"\bmri\b|magnetic resonance", q)
        and has(r"brain|spinal|spine", q)
        and not has(r"cardiac|heart", q)
    ):
        records = [f for f in records if f["id"] != "N05_F09"]
        notes = [note for note in notes if "mri_imaging report" not in note]
    return patient, records, notes


def referenced_question(question, history):
    """Resolve a singular admission reference only from an unambiguous prior question."""
    if not has(r"\bthat (?:first |initial |previous )?admission\b", question):
        return question, None
    if period_for(question, question) != "any":
        return question, None
    for previous in reversed(history):
        prior = previous["question"]
        period = period_for(prior, prior)
        if period in ("initial", "readmission"):
            label = "the first admission" if period == "initial" else "the readmission"
            return re.sub(r"\bthat admission\b", label, question, flags=re.I), period
        # Do not skip an intervening question that mentions both episodes.
        if period == "ambiguous":
            break
    return question, None


def select_with_context(c, d, released, original, history=()):
    routed = dict(d)
    resolution = None
    if c["case_id"] == "N04_INITIAL":
        routed["question"], resolution = referenced_question(d["question"], history)
        patient, records, notes = corrected_n04(c, routed, released)
        # A request for imaging is specific to a record category, even without a modality.
        # Return only when the requested admission has exactly one selected modality.
        if has(r"\b(?:imaging|scans?)\b", routed["question"]) and not has(
            r"\bct\b|\bmri\b|magnetic|computed", routed["question"]
        ):
            period = period_for(routed["question"], routed["question"])
            choices = [
                f
                for f in c["facts"]
                if f["topic"] in ("ct_imaging", "mri_imaging")
                and f["id"] not in released
                and f["period"] == period
            ]
            if period in ("initial", "readmission") and len(choices) == 1 and len(records) < 2:
                records.append(choices[0])
                notes.append(
                    "The requested admission has one selected imaging report; returned it w"
                    "ith its modality and admission context."
                )
        if resolution:
            notes.append(
                'Resolved "that admission" from the preceding explicit admission contex'
                "t; the original question is unchanged."
            )
    elif c["case_id"] in ("C02", "C03"):
        patient, records, notes = corrected_history(c, routed, released, original)
    elif c["case_id"] == "N05":
        patient, records, notes = corrected_n05(c, routed, released, original)
    else:
        patient, records, notes = original(c, routed, released)
    # A named but absent report is unavailable, rather than a request for all tests.
    specific = has(
        (
            "polysomnograph|sleep study|urine.*(?:protein|dipstick)|albumin|kidney "
            "function|renal function|\\b(?:eeg|mri|ct|pcr|glucose|blood sugar)\\b"
        ),
        d["question"],
    )
    if specific:
        notes = [n for n in notes if not n.startswith("A broad tests request")]
        if not patient and not records:
            notes.append(
                "The specifically requested report or detail is not available in the se"
                "lected materials for this scope. This is not a negative result or evid"
                "ence that testing was never performed."
            )
    return patient, records, notes


def install(legacy, history=None):
    original = legacy.select_facts

    def select(c, d, released):
        return select_with_context(c, d, released, original, history() if history else ())

    legacy.select_facts = select
    return original
