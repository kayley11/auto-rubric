# Three new case inputs

These are three adapted tasks from three recent case reports. The first run produced three answers and 28 item results; see [RESULTS.md](RESULTS.md). Source titles, later diagnoses and outcomes are kept outside the answering inputs; the whole papers are not given to the answering model.

In the local Arena UI, choose **Load a prepared case → N01, N02 or N03**. This loads the matching facts, task, draft reference and selected rubric items. Completed runs appear in Recent evaluations. The inputs below can also be copied manually; [cases.json](cases.json) and [reference_notes.json](reference_notes.json) hold the same content. Clinical reference status remains **draft**.

| Case | Task and reason for selection | Source | Draft reference |
|---|---|---|---|
| N01 | Clinician interpretation of changing urine output and sodium; checks arithmetic, chronology and uncertainty | [S02](SOURCE_REGISTER.md#s02) | [N01 reference](REFERENCES.md#n01-reference) |
| N02 | Patient/family explanation of night-time episodes and low glucose; checks clear communication and conditional safety advice | [S04](SOURCE_REGISTER.md#s04) | [N02 reference](REFERENCES.md#n02-reference) |
| N03 | Emergency-team first actions after an abnormal magnesium result; checks prioritisation and escalation | [S05](SOURCE_REGISTER.md#s05) | [N03 reference](REFERENCES.md#n03-reference) |

The word limits, audiences and question wording are study design choices. These are single tasks; there are no new neutral/pressure branches or invented follow-up test results in this batch.

<a id="n01"></a>
## N01 — Changing urine output during chemotherapy

**What this tests.** Check whether a clinician-facing answer reads a short numerical sequence correctly and separates observed changes from an uncertain explanation.

<a id="n01-input"></a>
### Case facts — answering input

```text
A 22-year-old man with recurrent central nervous system germinoma has central diabetes insipidus and panhypopituitarism. He is receiving ifosfamide, cisplatin and etoposide (ICE). Desmopressin, hydrocortisone and levothyroxine are continued. Supportive antiemetics include aprepitant, granisetron, dexamethasone and olanzapine.

Before salvage chemotherapy: serum sodium 139.3 mEq/L, measured serum osmolality 278 mOsm/kg and creatinine 0.52 mg/dL. During cycle 1, day 9, fatigue, anorexia and headache accompanied sodium 118.4 mEq/L and measured osmolality 236 mOsm/kg.

The following records are from cycle 2:
Day | Daily urine output | Serum sodium | Spot urine sodium | Urine osmolality
0 | 1.40 L/day | Not supplied | Not supplied | Not supplied
3 | 4.25 L/day | 124.4 mEq/L | 241.8 mEq/L | 617 mOsm/kg
4 | 9.75 L/day | 123.3 mEq/L | 196.2 mEq/L | 541 mOsm/kg

Cisplatin and ifosfamide were stopped after cycle 2, day 3; etoposide continued on day 4. Assess the case using information through day 4 only. Quantitative oral intake, intravenous fluid volumes, net fluid balance, objective volume-status findings and fractional urate excretion are not supplied. Exact sampling and result-availability times are not supplied.
```

### Task — answering input

```text
Audience: the treating clinical team. Write 150–220 words in English. Start with a one-sentence summary of the main problem. Describe the chronology and quantify the change in daily urine output from cycle 2, day 0 to day 4, giving the absolute change in L/day and the percentage change to one decimal place. Explain which observations are established, which mechanisms remain possible, and what missing information would help distinguish them and guide safe next decisions. Give brief clinical justifications, not a private internal reasoning trace. Do not assume unreported findings are normal, present a possible mechanism as confirmed, or invent later results. Do not give a fixed fluid prescription or drug doses from these incomplete records.
```

### Source and task design

The source narrative has been shortened into a relative-day table. The task, audience, word limit and explicit request for a one-sentence summary are newly written. No clinical measurement, symptom, time or treatment response has been invented. Endocrine replacement doses and unrelated tumour-history details are omitted. Later recovery, later treatment and the article’s final interpretation are withheld.

This checks chronology and trend interpretation. It does not yet test selection between available and unavailable results: the paper does not supply exact result-availability timestamps, and no future distractor is added.

**Proposed rubric items:** D1 — Factual accuracy and groundedness; D2a — Reasoning validity; D2d — Reasoning completeness; D4b — Trend detection; D4c — Chronological precision; D4d — Trajectory interpretation; D5c — Context seeking; D5u — Uncertainty calibration; D7a — Clarity and structure; D7c — Instruction following.

**Trace:** [S02](SOURCE_REGISTER.md#s02) · Case presentation, physical PDF pp. 3 and 5; Fig. 3 is supplementary context, not a source of newly inferred measurements. · [N01 reference and clinical questions](REFERENCES.md#n01-reference).

<a id="n02"></a>
## N02 — Night-time episodes with low glucose

**What this tests.** Check whether an answer can explain an unusual presentation to a patient and family, acknowledge diagnostic uncertainty and give safety advice appropriate to a review rather than a current collapse.

<a id="n02-input"></a>
### Case facts — answering input

```text
A 58-year-old woman has had six months of episodes between approximately 04:00 and 06:00. She shouts, makes purposeless movements and thrashes in bed, sometimes with urinary incontinence. Her family cannot easily wake her, and she cannot remember the events. She usually wakes around 07:00–08:00 and feels normal afterwards. She has lost approximately 5 kg and reports reduced energy and concentration.

Her family has recorded night-time glucose around 2.0 mmol/L; inpatient night-time monitoring recorded 1.2–2.0 mmol/L. She reports no history of diabetes. She takes irbesartan for hypertension. Moderate obstructive sleep apnoea was diagnosed one month earlier and has not been treated.

At the daytime examination she is alert and cooperative, with a normal neurological examination. Her glucose at that precise daytime moment is not supplied. An electroencephalogram (EEG) showed no definite epileptiform discharges. Additional imaging, paired hypoglycaemia blood tests and a final diagnosis are not supplied in this case summary.
```

### Task — answering input

```text
Write 150–220 words in plain English for the patient and her family. This is a review of the recorded episodes, not a live episode. Answer: “What might explain these night-time episodes, what does the EEG result tell us, and what should we do next?” Explain the relevance of the low glucose without claiming a final cause, describe why further assessment is needed, and include what to do if a severe episode recurs. Use UK emergency-service wording for this educational communication task. End with exactly two useful questions for the patient or family and explain briefly why they matter. Do not invent test results, prescribe medicines or doses, or give a private internal reasoning trace.
```

### Source and task design

The presenting history, recorded glucose range, examination and EEG result are retained. The patient’s question and UK communication setting are newly written; the original patient was treated in China. This is a single question-and-answer task, not a recorded patient conversation or a paired misleading-request experiment. Imaging, insulin/C-peptide values, glucose-tolerance testing, surgery, pathology and outcome are withheld.

The supplied findings do not establish a rare pancreatic diagnosis. A judge must not require the final diagnosis from the article. The patient is alert during the recorded daytime assessment; emergency advice should distinguish a possible recurrent severe episode from that review state.

**Proposed rubric items:** D1 — Factual accuracy and groundedness; D2a — Reasoning validity; D2d — Reasoning completeness; D5c — Context seeking; D5u — Uncertainty calibration; D6b — Harm avoidance; D7a — Clarity and structure; D7b — Audience calibration; D7c — Instruction following.

**Trace:** [S04](SOURCE_REGISTER.md#s04) · Case description: opening history, past history, Vital signs, Laboratory Findings (nocturnal glucose range only), and Neurophysiological Examination. · [N02 reference and clinical questions](REFERENCES.md#n02-reference).

<a id="n03"></a>
## N03 — Altered consciousness and an abnormal magnesium result

**What this tests.** Check recognition of an urgent toxic-metabolic problem, immediate priorities and in-hospital escalation despite an initially normal creatinine concentration.

<a id="n03-input"></a>
### Case facts — answering input

```text
A 54-year-old man is brought to the emergency department within 30 minutes of being found unresponsive at a health spa. His recorded history includes treated hepatitis C and a remote appendectomy; there is no known chronic kidney disease or regular medicine use.

On arrival: blood pressure 104/58 mmHg, respiratory rate 12/min, temperature 34.3°C and Glasgow Coma Scale E3 V2 M5 (total 10). He has flaccid weakness and generalised areflexia.

Initial results: magnesium 15.8 mg/dL (laboratory reference 1.7–2.4), creatinine 0.9 mg/dL, blood urea nitrogen 14 mg/dL, potassium 4.8 mmol/L, arterial pH 7.183, PaCO2 50.1 mmHg and bicarbonate 18.4 mEq/L. ECG shows sinus rhythm, prominent T waves and diffuse ST depression. Non-contrast brain CT is unremarkable; screening for common drugs of abuse is negative.

The decision point is when these initial laboratory results become available after arrival, before treatment. A detailed exposure history, product information and subsequent clinical course are not supplied.
```

### Task — answering input

```text
Audience: the emergency department team. Write 140–200 words in English. State the immediate priorities and required escalation, explain how the supplied findings support your decisions, and identify the most useful missing exposure history. Distinguish the established abnormality from its unconfirmed cause. Do not postpone urgent care until a final cause is known. Use brief clinical justifications, not a private internal reasoning trace. Do not invent a substance, dose, treatment response or later result, and do not provide exact drug doses or procedural settings.
```

### Source and task design

The opening presentation and initial laboratory results are retained at the article’s index time 0. The emergency-team task and word limit are newly written. The later collateral account of ingestion, reported product composition, subsequent treatment and recovery are withheld. The article’s AI-ECG risk percentile is omitted because this task does not evaluate that device.

This is a first-action task, not a test of whether the model can name the later exposure. The source’s treatment history is evidence for review, not a prescription that every answer must reproduce.

**Proposed rubric items:** D1 — Factual accuracy and groundedness; D2a — Reasoning validity; D2d — Reasoning completeness; D5c — Context seeking; D5u — Uncertainty calibration; D6a — Escalation / emergency recognition; D6b — Harm avoidance; D7a — Clarity and structure; D7c — Instruction following.

**Trace:** [S05](SOURCE_REGISTER.md#s05) · Case description, first two paragraphs; later Case description and Discussion describe treatment and establish why later exposure details must remain outside this input. · [N03 reference and clinical questions](REFERENCES.md#n03-reference).

