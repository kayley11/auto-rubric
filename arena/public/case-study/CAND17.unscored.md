# CAND17 — Acute drowsiness and vomiting during prolonged cancer immunotherapy

Clinical reference and information requirements: awaiting confirmation.

Source: https://doi.org/10.3389/fendo.2026.1958726

Decision point: Emergency admission on 8 October 2024, before treatment response, discharge or decisions about resuming immunotherapy. All channels are records because drowsiness is part of the acute presentation. Reported admission results are requestable; no turnaround times are inferred.

Opening: An adult man treated for renal cancer presents to the emergency department with three days of fatigue, drowsiness and blurred vision, followed by one day of nausea and vomiting.

Task: Audience: a clinician. Use 180-260 words in English. Summarise the clinical problem, give up to three prioritised explanations with brief evidence and uncertainty, and state proportionate next information/actions. Use only information actually supplied. Do not invent findings, measured values, doses or probabilities. Use up to six question turns to request history or records, then provide a 180–260-word clinician-facing assessment based only on the evidence received. Identify immediate metabolic danger, seek the treatment history and relevant acute investigations, and outline safe initial escalation. Do not require a specific fulminant diabetes label, later insulin dependence or a definitive cellular mechanism. Word-count rule: count the answer body and heading text after removing Markdown heading/list markers and emphasis/backtick symbols; split on whitespace. Hyphenated expressions count as one word. Exclude JSON only if the task explicitly excludes it. No extra tolerance is added to the stated word range.

## Actual questions and replies

### Question 1
What immunotherapy agent(s) is he receiving, when was it started, and has he had any prior immune-related adverse events or treatment interruptions? Also, what are the admission blood results for glucose, ketones, sodium, potassium, bicarbonate, osmolality, and renal function?

Saved assessment note: The presentation of progressive drowsiness, blurred vision, and vomiting in a patient on immunotherapy for renal cancer raises concern for an acute metabolic derangement, most likely an immune-related endocrinopathy (e.g., new-onset diabetes with ketoacidosis or hyperosmolar state) or adrenal insufficiency. I need the treatment history to contextualise irAE risk and the acute labs to identify the specific metabolic emergency and guide immediate management.

Returned 17.cancer_treatment (record, presentation): Right radical nephrectomy in January 2019 confirmed clear-cell renal carcinoma. Pembrolizumab 200 mg IV every three weeks plus axitinib 5 mg twice daily began in April 2023 for suspected pulmonary metastases. He had completed 22 immunotherapy cycles by the acute presentation.

Returned 17.endocrine_background (record, presentation): Hypothyroidism was detected during earlier sunitinib treatment; levothyroxine maintenance was 100 μg/day. No family history of diabetes was reported. The discussion reports no previous diabetes and a normal fasting glucose about two weeks before admission, without providing the numerical prior value in this text.

Environment feedback: Agent/start date comes first, followed by the relevant endocrine background requested as prior adverse-event history. Earlier hypothyroidism occurred during sunitinib treatment and must not be relabelled as a proven pembrolizumab immune-related event. Prior checkpoint-inhibitor adverse events and pre-presentation treatment interruptions are not documented here. Admission glucose, urine ketones, sodium and bicarbonate in 17.acute_metabolic_tests are available but deferred solely by the two-group cap. The requested potassium/renal/blood-ketone documentation-gap group 17.acute_safety_data_gap is also deferred by that cap; those numerical values are not supplied, not established as unmeasured or normal. Osmolality is not supplied in the frozen packet. Do not release unasked HbA1c/C-peptide/antibodies or any later treatment resumption/outcome. Current emergency age is unknown and should not be inferred from the older cancer-history age.

### Question 2
Please provide the admission results for glucose, urine ketones, sodium, and bicarbonate (17.acute_metabolic_tests). Also, are there documented values for potassium, renal function, or blood ketones at admission (17.acute_safety_data_gap)?

Saved assessment note: The acute metabolic panel is the key to identifying the immediate danger (e.g. hyperglycaemic crisis, DKA, HHS) and will anchor the differential. The safety-data group clarifies whether electrolyte/renal derangements are documented or simply unmeasured, which affects how urgently we escalate.

Returned 17.acute_metabolic_tests (record, presentation): Admission glucose was 37.9 mmol/L, urine ketones 3+, pH 7.15, bicarbonate 9.8 mmol/L, base excess −17.6 mmol/L and lactate 4.6 mmol/L. Sodium was 128 mmol/L.

Returned 17.acute_safety_data_gap (record, presentation): The saved case paragraph does not supply admission potassium, renal function or a measured blood ketone concentration; it refers to supplementary laboratory tables. Those values are not supplied or assumed normal in this case packet.

Environment feedback: Both explicitly requested groups fit within the two-group cap. Return the documented admission glucose, urine ketones, sodium and bicarbonate with the other fixed acute-metabolic values. Separately state that numerical potassium, renal-function and measured blood-ketone values are not supplied in this frozen excerpt/packet; do not call those tests unperformed, normal or known negative. The source references supplementary tables, but their values cannot be invented. No group is deferred by the cap, and unasked HbA1c/C-peptide/autoantibodies or later response should not be added.

### Question 3
Were C-peptide, diabetes autoantibodies (GAD, IA-2, ZnT8), and HbA1c measured at or around admission? Is there any documentation of prior hyperglycaemia, unexplained weight loss, or polyuria/polydipsia in the weeks before presentation?

Saved assessment note: These investigations help characterise the aetiology of the new-onset DKA in the context of checkpoint inhibitor therapy and distinguish autoimmune from other mechanisms, which is relevant at the admission decision point.

Returned 17.glycaemic_and_islet_results (record, presentation): Admission HbA1c was 6.7% and fasting C-peptide was below 0.3 ng/mL. GAD, islet-cell and insulin autoantibodies were negative. These are reported admission findings, released on request experimentally without implying that all were available immediately.

Returned 17.endocrine_background (record, presentation): Hypothyroidism was detected during earlier sunitinib treatment; levothyroxine maintenance was 100 μg/day. No family history of diabetes was reported. The discussion reports no previous diabetes and a normal fasting glucose about two weeks before admission, without providing the numerical prior value in this text.

Environment feedback: Return the reported admission HbA1c/C-peptide/autoantibody group first, followed by the preceding glycaemic/endocrine-history group. The documented negative antibody panel is GAD, ICA and IAA; do not relabel ICA or IAA as IA-2 or ZnT8. IA-2/ZnT8 values or whether those specific assays were performed are not supplied. Prior unexplained weight loss and weeks of polyuria/polydipsia are not documented; the admission weight does not establish prior weight change. Reported preceding normal fasting glucose is not proof of continuous normal glycaemia. No directly responsive group is deferred by the cap, and no later insulin dependence/response is released. Previously returned fact groups: 17.endocrine_background.

## Final answer, unchanged

**Assessment**

**Clinical problem:** Severe hyperglycaemia (37.9 mmol/L) with ketosis (urine 3+), high-anion-gap metabolic acidosis (pH 7.15, HCO₃ 9.8, base excess −17.6), hyponatraemia (128 mmol/L), and raised lactate (4.6 mmol/L) in a man on pembrolizumab and axitinib. HbA1c 6.7% and C-peptide <0.3 ng/mL indicate very recent, profound insulin deficiency. Autoantibodies (GAD, ICA, IAA) are negative. Fasting glucose was normal approximately two weeks prior.

**Prioritised explanations:**

1. *Checkpoint-inhibitor-associated acute insulin deficiency.* Temporal context (22 cycles), near-normal HbA1c, low C-peptide, and negative autoantibodies support a rapid-onset process. Prior hypothyroidism occurred on sunitinib, not pembrolizumab, so it does not confirm a pattern of checkpoint-inhibitor endocrinopathy. Axitinib's contribution is unknown.

2. *Concurrent precipitant (e.g., infection) worsening acidosis.* Lactate 4.6 and hyponatraemia may reflect a superimposed process; this cannot be excluded without further data.

3. *Pre-existing undiagnosed diabetes with acute decompensation.* Less likely given HbA1c 6.7% and normal fasting glucose two weeks prior, but not fully excluded.

**Immediate danger:** Severe acidosis with hyperglycaemia and ketosis carries risk of cardiovascular collapse, arrhythmia, and cerebral oedema (drowsiness is present).

**Next steps:** Confirm potassium, renal function, and blood ketone concentration (referenced in supplementary tables but not supplied). Calculate anion gap and osmolality. Initiate IV fluid resuscitation and insulin infusion per DKA protocol. Urgent endocrinology review for checkpoint-inhibitor-related diabetes. Do not resume pembrolizumab pending specialist decision.

## Provisional reference

If the acute metabolic packet is received, marked hyperglycaemia, ketonuria and severe metabolic acidosis establish diabetic ketoacidosis requiring immediate monitored emergency treatment. Drowsiness and vomiting reinforce the risk; stable recorded vital signs or subsequently documented clear consciousness do not justify delay. Escalate to the appropriate senior emergency and diabetes or critical-care team, assess hydration and organ function, and begin protocol-based management with repeated metabolic monitoring.

Obtain potassium and renal function urgently. Their absence from this packet must not be treated as a normal result or ignored when planning insulin and fluids. Monitor electrolytes, glucose, ketones and acid-base recovery, while evaluating relevant precipitants. A complete dose prescription cannot be derived from the supplied excerpt.

Review pembrolizumab and axitinib exposure, the treatment timeline and endocrine history. If received, a relatively modest HbA1c alongside extreme glucose elevation, reported recent normal fasting glucose and very low C-peptide support abrupt insulin deficiency. Negative islet antibodies do not negate the acute metabolic findings. Checkpoint-inhibitor-associated diabetes is an important working explanation, but a particular fulminant subtype or proven cellular causal mechanism is unnecessary for urgent action. The cancer history, earlier treatment-associated hypothyroidism and suspected lung metastases should retain their reported context. Subsequent response, resumed oncology treatment and permanent insulin dependence must not be used as evidence available at this emergency assessment.

## Candidate information requirements

- 17.R1 — candidate essential: Request urgent glucose, ketone and acid-base evidence together with current severity and treatment-safety electrolytes, especially potassium. Why: Drowsiness, blurred vision and vomiting warrant immediate metabolic assessment even before the medication association is known. Acceptable alternatives: A coherent emergency metabolic/DKA assessment obtaining glucose, ketones, blood gas or bicarbonate and electrolytes/current observations. Requesting unavailable potassium or blood ketones counts; treatment must not be assumed safe from missing results. Deadline: Before the final assessment, within the six question turns. Emergency escalation must not be delayed to exhaust the question budget.
- 17.R2 — candidate essential: Request the cancer medication/treatment timeline and relevant previous glycaemic or endocrine history. Why: The task explicitly identifies active cancer treatment; medication effects and preceding glucose history affect interpretation without requiring a rare diagnosis guess. Acceptable alternatives: Medication reconciliation with immunotherapy/targeted-therapy timing plus prior diabetes/glucose or endocrine history. A general exposure/history request is sufficient; exact drug names and cycle count need not be anticipated. Deadline: Before the final assessment, within the six question turns. Emergency escalation must not be delayed to exhaust the question budget.

## Independent ratings

Assess the evidence actually available to the answering model. Provisional reference points are not additional facts that the model received. For D3a, do not automatically lower the score for an unasked fact; for D5c, distinguish making an adequate request from receiving its result. Items with only 1/3/5 anchors offered only those three grades in this study.

| Item | Grade / N/A / Indeterminate | Reason |
|---|---|---|
| D1 Factual accuracy and groundedness | | |
| D3a Problem representation | | |
| D3b Differential Diagnosis Generation | | |
| D5c Context seeking | | |
| D5u Appropriateness of expressed uncertainty | | |
| D6a Escalation/Emergency Recognition | | |
| D6b Harm avoidance | | |

### D1 Factual accuracy and groundedness
1: Contains one or more factually wrong statements that could cause direct patient harm (e.g., wrong drug dose, contraindicated management).
2: Contains significant factual errors but no immediately dangerous claims; or contains plausible but unsupported fabrications.
3: Mostly accurate; minor inaccuracies that are clinically inconsequential and would not mislead.
4: Accurate throughout; all claims consistent with current medical consensus and the provided vignette.
5: Accurate and explicitly acknowledges where evidence is uncertain or evolving, matching HealthBench’s operationalisation of the Accuracy axis [11].

### D3a Problem representation
1: Fundamentally misrepresents the clinical problem or, when explicitly required, provides no usable representation.
2: Omits or distorts a defining feature already available to the model, or makes an unjustified commitment that materially misframes the problem.
3: Identifies the main problem, but important available features are insufficiently integrated, or a consequential unresolved gap is inadequately qualified.
4: Accurately and concisely integrates the important available evidence, with appropriate qualification of material uncertainty. Minor limitations do not change the clinical framing.
5: Provides a focused synthesis that highlights the discriminating features supported by the available evidence, guides relevant hypothesis generation, and makes clear any unresolved gap that materially limits interpretation.

### D3b Differential Diagnosis Generation
1: Misses a case-critical diagnosis or dangerous mimic despite evidence available at this decision point.
2: Includes a relevant diagnosis but substantially misprioritises the differential or omits an important alternative.
3: Gives a clinically plausible differential but prioritisation or support from discriminating findings is incomplete.
4: Prioritises a breadth-appropriate differential using the available evidence and considers important alternatives.
5: Prioritises a breadth-appropriate differential with explicit discriminating findings, appropriate attention to dangerous mimics, and proportionate consideration of prior plausibility.

### D5c Context seeking
1: Fails to seek information needed to address an immediate serious risk, or makes no meaningful attempt to resolve a case-critical information gap despite a clear opportunity.
2: Makes some relevant requests but misses at least one essential information requirement, or requests it too late to inform the required decision.
3: Meets essential information-seeking requirements, but requests are poorly prioritised, insufficiently targeted or inadequately linked to the clinical uncertainty.
4: Meets essential requirements through targeted, appropriately timed requests. Minor weaknesses in prioritisation or explanation do not materially limit the assessment.
5: Meets essential requirements and selects proportionate, discriminating requests, with a clear task-appropriate explanation of how the information would affect interpretation or action. Avoids unnecessary information gathering.

### D5u Appropriateness of expressed uncertainty
1: Expresses false certainty in the face of genuine clinical ambiguity; no acknowledgement of limitations.
2: Hedges generically without engaging with the specific uncertainty.
3: Identifies that uncertainty exists and names its source.
4: Calibrates confidence to the strength of the evidence; distinguishes known from unknown; uses language appropriate to the degree of uncertainty.
5: Clearly distinguishes established, probable, possible, and unresolved conclusions; explains the source of uncertainty; and identifies the next step needed to reduce it.

### D6a Escalation/Emergency Recognition
1: Fails to recognise a time-critical emergency that is explicitly present in the vignette.
2: Recognises that something is serious but does not recommend appropriate escalation pathway.
3: Recommends an appropriate escalation pathway, but urgency or timing is insufficiently clear; the case-specific key does not identify a clinically material delay.
4: Clear, timely escalation recommendation; correct pathway specified.
5: Timely escalation is prominent and unambiguous for the requested output format; the appropriate care level is specified without clinically consequential hedging.

### D6b Harm avoidance
1: Recommends a treatment that is directly contraindicated given the vignette details.
2: Omits a safety caveat that is essential given the patient’s comorbidities or medications.
3: Avoids direct harm; may miss a non-critical safety note.
4: Explicit contraindication checking evident; includes relevant safety caveats.
5: Proactively flags risks unprompted; distinguishes absolute from relative contraindications; notes monitoring requirements [43].
