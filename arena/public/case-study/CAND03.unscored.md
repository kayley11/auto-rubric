# CAND03 — New symptoms during long-stable osilodrostat treatment

Clinical reference and information requirements: awaiting confirmation.

Source: https://doi.org/10.3389/fendo.2026.1962865

Decision point: Early hospital assessment of the symptomatic episode after documented telephone advice and a 20-mg oral hydrocortisone dose, before release of the episode’s endocrine test packet or subsequent response.

Opening: A woman receiving long-term treatment for Cushing’s disease has new nausea, abdominal pain, muscle pain, fatigue and low home blood pressure. Symptoms persisted after telephone advice, and she is now being assessed in hospital.

Task: Audience: a clinician. Use 180-260 words in English. Summarise the clinical problem, give up to three prioritised explanations with brief evidence and uncertainty, and state proportionate next information/actions. Use only information actually supplied. Do not invent findings, measured values, doses or probabilities. After at most six information-request turns, write a clinician-facing final assessment of 180–260 words. The record system is the information source; the clinical team is the audience. Assess the immediate risk and the possible medication relationship. Explain whether a long-stable dose changes the assessment, what contemporary evidence is needed and how the documented actions affect interpretation. Do not assume the biochemical sample preceded hydrocortisone. Word-count rule: count the answer body and heading text after removing Markdown heading/list markers and emphasis/backtick symbols; split on whitespace. Hyphenated expressions count as one word. Exclude JSON only if the task explicitly excludes it. No extra tolerance is added to the stated word range.

## Actual questions and replies

### Question 1
What is her long-term treatment for Cushing's disease (e.g., surgery, medical therapy), and what is her current daily glucocorticoid replacement regimen if any?

Saved assessment note: Establishing the treatment modality and baseline steroid replacement is essential to determine whether HPA-axis suppression and glucocorticoid dependence are present, which frames the entire risk assessment for acute adrenal insufficiency.

Returned 03.background (record, presentation): The patient was 52 at the earlier diagnostic presentation, when ACTH-dependent Cushing’s syndrome and a pituitary origin were supported. Transsphenoidal surgery did not achieve biochemical remission; hypertension persisted and she declined immediate reoperation. The earlier work-up also diagnosed diabetes and insulin resistance. This age is not assigned to the current episode.

Returned 03.previous_drugs (record, presentation): Ketoconazole was ultimately stopped because hepatotoxicity recurred. Metyrapone was later used for 36 weeks and stopped because its study ended, despite biochemical control and good adherence. Osilodrostat was then begun at 2 mg twice daily.

Environment feedback: After the two-group reply limit, 03.stable_course (ongoing cortisol-lowering treatment before this episode) and 03.actions_before_hospital (the documented interruption and one-off pre-hospital glucocorticoid action) are deferred rather than unavailable. The frozen decision-point packet does not specify an established ongoing daily glucocorticoid replacement regimen; this should not be interpreted as proof that none was used. Later replacement adjustment and response are outside the decision point.

### Question 2
What is the documented interruption of osilodrostat (timing, duration, reason), and was she on any concurrent daily glucocorticoid replacement at the time of the episode?

Saved assessment note: The record confirms a documented interruption of her cortisol-lowering therapy and a one-off pre-hospital glucocorticoid action, but the specific details are deferred. Clarifying the interruption window and whether glucocorticoid replacement was in use is essential to determine whether the presentation reflects adrenal insufficiency from a replacement gap, a rebound effect, or another mechanism.

Returned 03.actions_before_hospital (record, presentation): She was advised to stop osilodrostat, take hydrocortisone 20 mg orally and attend the next morning. She took the advised actions, but symptoms persisted and hospital assessment followed. The source does not specify the interval between hydrocortisone and the subsequent cortisol sample.

Returned 03.stable_course (record, presentation): The symptoms began two years after osilodrostat initiation while she was receiving a stable total dose of 4 mg daily, without recent dose escalation. Earlier treatment had produced substantial biochemical and clinical improvement.

Environment feedback: The stored action group documents the interruption and one-off oral hydrocortisone action; the stable-course group provides the relative treatment timing before this episode. The exact calendar date, total duration of the interruption and an established concurrent daily glucocorticoid replacement regimen are not specified at the frozen decision point. A one-off hydrocortisone dose must not be described as a daily replacement regimen, and unspecified daily therapy must not be treated as proof that none was used. No additional directly requested stored group is deferred by the limit; later replacement adjustment remains hidden.

### Question 3
What were the initial hospital findings on examination (vital signs, clinical signs), and were any blood tests performed at admission with results available at this decision point?

Saved assessment note: I need the immediate clinical and laboratory picture to assess the severity of the episode and to distinguish adrenal insufficiency from other causes of her symptoms. The stable 4 mg osilodrostat dose for two years without escalation makes a drug-related cortisol drop less straightforward, so objective data are needed to interpret the one-off hydrocortisone action and the persistent symptoms.

Returned 03.episode_endocrine (record, presentation): The episode’s Table 1B reports 08:00 cortisol 0.38 micrograms/dL (reference 4.82–19.5), ACTH 66.3 pg/mL (6.0–56.0) and DHEA-S 0.09 micromol/L (0.51–5.56). The narrative places confirmation during hospitalisation, without giving sample timing relative to the prior hydrocortisone dose.

Environment feedback: Initial hospital vital signs and examination findings are not supplied in the frozen packet. The stored home observations are not hospital observations and are not substituted. The endocrine results supplied were documented during hospitalisation; exact admission-time collection/reporting and the interval from the earlier hydrocortisone dose are unspecified. Other admission blood panels, including glucose/electrolytes, are not supplied. Missing results do not establish that testing was not performed. No further directly requested stored group is deferred by the two-group limit.

### Question 4
What were her home blood pressure readings during the episode, and were there any repeat glucocorticoid doses administered before hospital admission?

Saved assessment note: Home BP values help gauge severity of the hypotensive episode; repeat dosing would alter the interpretation of the 08:00 cortisol relative to the single 20 mg dose.

Returned 03.home_observations (record, presentation): At symptom onset she reported nausea, abdominal pain, myalgia and fatigue. Home blood pressure was 98/67 mmHg, with heart rate over 100 beats per minute. No hospital vital-sign values are supplied in this source packet.

Returned 03.actions_before_hospital (record, presentation): She was advised to stop osilodrostat, take hydrocortisone 20 mg orally and attend the next morning. She took the advised actions, but symptoms persisted and hospital assessment followed. The source does not specify the interval between hydrocortisone and the subsequent cortisol sample.

Environment feedback: Both directly requested stored groups are supplied in question order. The source documents the one pre-hospital glucocorticoid action in the action group, but additional pre-admission glucocorticoid doses, additional home blood-pressure readings and their exact times are not specified. This is not proof that repeat doses were absent. No further matching group is deferred by the two-group limit; later inpatient adjustment/response remains hidden. Previously returned fact groups: 03.actions_before_hospital.

## Final answer, unchanged

**Clinical Problem**
A woman with ACTH-dependent Cushing's disease on osilodrostat 4 mg daily (stable 2 years) presents with nausea, abdominal pain, myalgia, fatigue, home BP 98/67 mmHg, and tachycardia. Symptoms persisted after a single 20 mg oral hydrocortisone dose and osilodrostat interruption. Hospitalised 08:00 cortisol 0.38 µg/dL (ref 4.82–19.5), ACTH 66.3 pg/mL (ref 6.0–56.0), DHEA-S 0.09 µmol/L (ref 0.51–5.56). The interval between hydrocortisone and sample collection is unspecified.

**Prioritised Explanations**

1. Osilodrostat-mediated HPA-axis suppression with inadequate replacement. The very low cortisol, elevated ACTH, and suppressed DHEA-S support a cortisol-synthesis blockade. The one-off 20 mg hydrocortisone may be insufficient if the axis remains suppressed. Uncertainty: sample timing relative to the hydrocortisone dose is unknown, so the cortisol may reflect partial exogenous effect or true nadir.

2. Absence of established daily glucocorticoid replacement. If no concurrent replacement existed, abrupt osilodrostat cessation without adequate coverage could precipitate acute insufficiency. The record does not confirm whether a daily regimen was in place; absence of documentation is not proof of absence.

3. Alternative pathology. Less likely given the biochemical pattern but not excluded without electrolytes, glucose, or inflammatory markers.

**Immediate Risk and Medication Relationship**
Hypotension, tachycardia, and very low cortisol raise concern for evolving adrenal crisis. The stable 2-year dose does not reduce risk; prolonged suppression increases likelihood of a non-recoverable axis. The documented hydrocortisone dose and osilodrostat interruption are appropriate but do not exclude ongoing insufficiency.

**Next Actions**
- Confirm whether a daily glucocorticoid replacement regimen preceded the episode.
- Obtain electrolytes, glucose, and repeat cortisol/ACTH with documented timing relative to exogenous glucocorticoid.
- Initiate adequate replacement and monitor response.

## Provisional reference

A stable osilodrostat dose for two years does not exclude a new clinically important cortisol-lowering adverse effect. Integrate symptoms, home haemodynamics and the actual interruption/hydrocortisone sequence. Interpret the very low episode cortisol only once requested, while acknowledging unspecified sample timing after rescue steroid. Avoid assuming current normal glucose/electrolytes or copying the earlier age into this episode. Recognise the need for prompt clinical assessment without requiring a prediction of prolonged insufficiency or later relapse. Specific escalation and treatment recommendations await clinical confirmation; the source’s telephone regimen is historical evidence, not a compulsory management template.

## Candidate information requirements

- 03.R1 — candidate essential: Request the current cortisol-lowering regimen, recent dose changes/adherence and actions already taken. Why: New symptoms during endocrine treatment require the actual exposure and any rescue steroid history, including whether treatment preceded testing. Acceptable alternatives: Medication reconciliation covering the current cortisol-lowering drug/dose and any interruption or hydrocortisone already taken. Equivalent broad medication and treatment-timing requests count. Deadline: Before the final assessment, within the six question turns.
- 03.R2 — candidate essential: Request immediate clinical severity and contemporary cortisol/metabolic assessment, or request an equivalent urgent assessment. Why: Persistent gastrointestinal symptoms, fatigue and low blood pressure raise an immediate safety question irrespective of how long the dose has been stable. Acceptable alternatives: Current haemodynamic assessment plus cortisol and relevant glucose/electrolyte testing, or an appropriate urgent adrenal-risk assessment. Requesting unavailable observations counts; the request need not await a named diagnosis. Deadline: Before the final assessment, within the six question turns.
- 03.R3 — candidate helpful: Review prior treatment control and endocrine history. Why: The task asks how the new episode relates to a long-stable course and previous disease; historical response informs that comparison without excluding a new adverse effect. Acceptable alternatives: Earlier cortisol/control records, prior endocrine treatment history or a clinically equivalent longitudinal review. Deadline: Before the final assessment, within the six question turns.

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
