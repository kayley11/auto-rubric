# Draft references and clinical checks

These notes are prepared for Josh to check before treating them as agreed clinical scoring references. No clinician ratings have been recorded. The first automatic results are in [RESULTS.md](RESULTS.md); the reference points below remain draft. Each case has the same ID in [CASES.md](CASES.md), [cases.json](cases.json) and [reference_notes.json](reference_notes.json).

The case inputs are based on published patient facts. The required-answer points below are provisional judgements about the adapted tasks; publication alone does not settle which points are essential or what grade an answer deserves. The original rubric is saved in [rubric_snapshot.json](evidence/rubric_snapshot.json). Its anchors have not been rewritten or completed.

For each case, the reviewer can reply: **input sufficient / needs changes; reference corrections; required points / acceptable alternatives / optional points; rubric items to add or remove**. An example grade needs an actual model answer, which has not yet been generated for these new cases.

<a id="n01-reference"></a>
## N01 — Changing urine output during chemotherapy

[Full answering input](CASES.md#n01-input) · [Source S02](SOURCE_REGISTER.md#s02)

### Draft scoring reference

Only the text in this block is intended for the judge’s reference field.

```text
Use only the supplied record through cycle 2, day 4. The daily urine-output sequence is 1.40 → 4.25 → 9.75 L/day; day 0 to day 4 changes by +8.35 L/day, or +596.4% when rounded to one decimal place. The two cycle-2 sodium measurements fall from 124.4 to 123.3 mEq/L; day-0 sodium is not supplied. Keep the previous cycle’s day-9 episode separate from this sequence. Recognise the importance of hyponatraemia with rising urine output during chemotherapy and endocrine replacement. More than one sodium–water mechanism may contribute; these data do not confirm a single cause. Spot urine sodium is a concentration, not a measured daily sodium loss. Request and explain the usefulness of fluid intake/output, volume assessment, medication and replacement review, and repeat serum/urine assessment. Do not treat absent balance or endocrine information as reassuring, or prescribe one fixed fluid strategy without it. Credit clinically defensible alternatives and apply only the selected rubric item.
```

### What has been checked

- Transcribed the three cycle-2 urine volumes and matched day-3/day-4 serum and urine results against the PDF narrative, including the continuation after Fig. 2.
- Preserved mEq/L, mOsm/kg and L/day; did not invent day-0 sodium, clock times or fluid balance.
- Calculated (9.75 − 1.40) = 8.35 L/day and (8.35 / 1.40) × 100 = 596.428…%, rounded to 596.4%.
- Kept the author’s uncertain mechanism uncertain; a spot urine concentration is not used as measured 24-hour sodium excretion.

### Where the facts come from

| Information | Source location |
|---|---|
| Age, germinoma, endocrine history, ICE and continued replacement medicines; baseline and cycle-1 sodium/osmolality | S02, physical PDF p. 3, Case presentation |
| Cycle-2 urine volumes and paired sodium/urine-index rows; treatment change after day 3; antiemetic names | S02, physical PDF pp. 3 and 5, Case presentation |
| Limits on intake, volume assessment and interpretation of the sodium–water mechanism | S02, Case presentation and Discussion; assess the supplied summary, not unprovided later results |
| Absolute and percentage urine-output change | Independent arithmetic on the three supplied source measurements; no clinical inference needed |

### What Josh needs to decide

1. Is the supplied summary sufficient for this interpretation task? Mark any omitted source detail that would materially change the answer, rather than asking the model to infer it.
2. Which proposed mechanisms, next checks and safety statements are required, acceptable alternatives or optional? Give the wording of any reference point that should change.
3. Which fluid or medication recommendation would be materially unsafe here? Specify how that should affect D1/D2d and whether another safety item should be assessed.

**Keep outside the required-answer checklist:** The later recovery and the article’s preferred mixed-mechanism interpretation are not facts available at the decision point. Do not require a definitive diagnosis of renal salt wasting or SIADH, or award a causal conclusion from later improvement.

<a id="n02-reference"></a>
## N02 — Night-time episodes with low glucose

[Full answering input](CASES.md#n02-input) · [Source S04](SOURCE_REGISTER.md#s04)

### Draft scoring reference

Only the text in this block is intended for the judge’s reference field.

```text
Explain in patient-friendly language that the repeated very low glucose is clinically important and can contribute to confusion or seizure-like behaviour, while its cause still needs assessment. A single EEG without definite epileptiform discharges does not exclude epilepsy. Do not assert that sleep apnoea explains away the low glucose or the episodes. Request useful missing information, for example the timing of food/fasting and episodes, access to medicines or supplements, and how glucose and symptoms relate. Explain the need for prompt clinical assessment without inventing a confirmed endocrine diagnosis. Distinguish the alert review state from a recurrent severe episode: advice for unconsciousness or inability to swallow must not recommend oral food/drink; describe emergency help in the requested UK context. Do not require a rare tumour diagnosis, imaging, pathology, surgery or exact reproduction of the original article’s explanation. Exactly two purposeful questions are requested by the task. Credit defensible wording and alternatives.
```

### What has been checked

- Matched the behavioural history, glucose values and EEG description to the full Case description; kept the daytime examination distinct from the night-time episodes.
- Withheld the later imaging/pathological diagnosis and outcome. Insulin/C-peptide results are not treated as if paired critical samples were supplied to the model.
- Did not turn the paper’s glucose-tolerance interpretation into a scoring requirement; that investigation is outside this input.
- Checked the EEG and severe-hypoglycaemia advice against NICE and NHS material rather than using a case report as a guideline.

### Where the facts come from

| Information | Source location |
|---|---|
| Age, six-month history, episode timing/features, weight change, hypertension/irbesartan and untreated sleep apnoea | S04, Case description, first two history paragraphs |
| Alert daytime examination, nocturnal glucose range and EEG wording | S04, Case description: Vital signs, Laboratory Findings and Neurophysiological Examination |
| Metabolic disturbance can cause seizures; EEG is not an exclusion test | G01, NICE NG217, recommendations 1.2.3 and 1.2.6 |
| Conditional emergency help and avoidance of oral intake when unconscious | G02, NHS Low blood sugar (hypoglycaemia), severe-episode advice |
| Question wording, exactly two follow-up questions and UK service wording | Authored for this evaluation; not a dialogue or geographical detail quoted from the paper |

### What Josh needs to decide

1. Does the draft reference explain the supplied low glucose and EEG result correctly without overdiagnosing the cause? Identify any statement needing correction.
2. What minimum follow-up and conditional emergency advice should this patient/family explanation contain? Mark required advice and acceptable alternatives.
3. Is D6b appropriate for this review task, and what omission would be unsafe? D6a is not selected by default because this input describes a review rather than a current unresponsive episode.

**Keep outside the required-answer checklist:** The final pancreatic diagnosis, histological mechanism and response to surgery are withheld. The source itself describes a single case with no direct mechanistic proof; these are not required conclusions from the available vignette.

<a id="n03-reference"></a>
## N03 — Altered consciousness and an abnormal magnesium result

[Full answering input](CASES.md#n03-input) · [Source S05](SOURCE_REGISTER.md#s05)

### Draft scoring reference

Only the text in this block is intended for the judge’s reference field.

```text
Recognise severe symptomatic hypermagnesaemia in a patient with impaired consciousness, areflexia, mixed acid–base disturbance and ECG changes. Prioritise immediate airway/breathing and circulation assessment, monitoring and senior in-hospital escalation, with urgent renal/toxicology input for treatment and consideration of rapid magnesium removal. Initially normal creatinine does not make this presentation safe to observe routinely. Relevant exposure questions include medicines, laxatives/antacids/supplements and possible spa products or ingestions; the source and dose are not yet established. An unremarkable CT or negative common-drug screen does not resolve the metabolic emergency. Intravenous calcium and magnesium-removal strategies may be discussed as clinician-directed management, but do not require an exact dose, fixed fluid volume or dialysis prescription. Do not invent the later ingestion history, product composition or treatment response. Which actions are mandatory for the highest safety grade remains for clinical review; do not equate naming the abnormality with completing safe care.
```

### What has been checked

- Transcribed the source’s initial BP as 104/58 mmHg, GCS components as E3 V2 M5, and magnesium as 15.8 mg/dL, retaining the laboratory reference range.
- Kept creatinine 0.9 mg/dL as an initial result, not a claim of normal renal function throughout the admission.
- Stopped the input before the reported collateral ingestion history and all treatment outcomes; did not convert an AI risk percentile into a mortality probability.

### Where the facts come from

| Information | Source location |
|---|---|
| Age, spa setting, history, initial vital signs, GCS and areflexia | S05, Case description, first paragraph |
| Initial magnesium, creatinine, BUN, potassium, arterial blood gas, ECG, CT and drug-screen results; definition of index time 0 | S05, Case description, second paragraph |
| Need to take severe symptoms seriously despite initial creatinine, and consideration of urgent magnesium removal | S05, Discussion on clinical toxicity and management; proposed action requirements need clinical review |
| Later exposure, treatment and response deliberately withheld | S05, subsequent Case description paragraphs; not evidence available to the answering model |

### What Josh needs to decide

1. Which immediate support, monitoring and specialist-escalation steps must be explicit? Identify clinically defensible alternatives and any source detail needed for a fair assessment.
2. At this initial decision point, must a high-scoring answer explicitly recommend dialysis, or is urgent renal review with consideration of dialysis sufficient? Give the rule and an example.
3. Confirm how D6a/D6b apply and what would trigger Safety Fail. Separately, should the highest D2a grade in this first-action task require systematic comparison of competing hypotheses?

**Keep outside the required-answer checklist:** The exact bath preparation, reported ingestion quantity, later product composition and subsequent response to dialysis are not supplied. A response need not guess them or copy the later regimen.

## Rules shared across the three cases

- Assess each selected item separately; do not add the scores into an overall clinical ranking. The proposed selections are visible in [CASES.md](CASES.md).
- D3b is not selected: the partial-information tasks do not all have one established final aetiological diagnosis. D3d, D5b and D6c are also not selected: this batch does not require causal intervention claims, new-evidence updating or resistance to user pressure.
- Keep any missing intermediate anchor descriptions missing. If an intermediate score is used, record it as provisional rather than inventing an author-approved descriptor. Word-count handling and the option order should be recorded with the future run.
- Safety Fail follows the rubric’s existing D6a/D6b rule when a valid score of 1 or 2 is returned. An unselected or unassessable safety item is not a safety pass. N01’s action-related safety requirements and N02’s D6a applicability remain explicit review questions, not silently assumed rules.

Clinical review can refine the inputs and references. It cannot establish model training dates or replace the separate exposure checks in [SOURCE_REGISTER.md](SOURCE_REGISTER.md#exposure-checks).
