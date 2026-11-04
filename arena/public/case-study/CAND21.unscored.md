# CAND21 — Progressive breathlessness despite repeated treatment for a COPD exacerbation

Clinical reference and information requirements: awaiting confirmation.

Source: https://doi.org/10.1093/omcr/omag190

Decision point: Early admission, while requiring 2 L/min nasal-cannula oxygen and before day-3 BAL or later antibody results, ventilation, transfer and ECMO. The early CT and admission laboratory/examination packet are requestable experimental releases; no unsupplied result-return times are asserted.

Opening: A 65-year-old woman with COPD has one month of worsening breathlessness after cough and wheeze. She has not improved with outpatient treatment and now needs supplemental oxygen at admission.

Task: Audience: a clinician. Use 180-260 words in English. Summarise the clinical problem, give up to three prioritised explanations with brief evidence and uncertainty, and state proportionate next information/actions. Use only information actually supplied. Do not invent findings, measured values, doses or probabilities. Use up to six question turns to request history or records, then provide a 180–260-word clinician-facing assessment based only on the evidence received. Obtain exposure and treatment history, assess the respiratory risk and develop a proportionate differential. This is the early communicative phase; do not use the later ventilated course or later discordant specialist tests as if already known. Word-count rule: count the answer body and heading text after removing Markdown heading/list markers and emphasis/backtick symbols; split on whitespace. Hyphenated expressions count as one word. Exclude JSON only if the task explicitly excludes it. No extra tolerance is added to the stated word range.

## Actual questions and replies

### Question 1
What outpatient treatments (antibiotics, oral steroids, nebulisers) were tried over the past month, and what is her baseline COPD status—smoking history, prior exacerbations, and current inhaled regimen?

Saved assessment note: Establishing the treatment response and baseline severity helps distinguish a refractory COPD exacerbation from a superimposed process and calibrates the differential.

Returned 21.outpatient_treatment (patient, presentation): For presumed COPD exacerbation I received two courses of steroids; the second was combined with ten days of doxycycline. I did not improve clinically.

Returned 21.smoking_and_vaping (patient, presentation): I smoke tobacco daily. I recently resumed vaping after having stopped seven years earlier.

Environment feedback: Outpatient steroid/antibiotic treatment and response answer the first request; smoking/vaping history is the next responsive part of the baseline-COPD request. Outpatient nebuliser use, baseline COPD severity or pulmonary function, prior exacerbation frequency and current inhaled regimen are not supplied. Do not describe those treatments or events as absent or not performed. No further directly responsive stored group is deferred by the cap: the background group contains only diagnoses and does not supply these requested baseline details. Later inpatient nebulisers, day-3 BAL, antibody results and subsequent support are outside the early communicative packet and must not be substituted.

### Question 2
Have you had any recent travel, occupational or environmental exposures (dust, mould, birds, chemicals), or been in contact with anyone who was unwell? Also, have you noticed any fever, night sweats, weight loss, haemoptysis, or leg swelling over this month?

Saved assessment note: Exposure history and constitutional symptoms are needed to broaden the differential beyond a simple COPD exacerbation and to flag possible infection, malignancy, or thromboembolic causes before the admission records are reviewed.

Returned 21.other_exposures (patient, presentation): No relevant occupational or environmental exposure, medication-related pulmonary risk factor, diabetes or other known cause of immunocompromise was reported. Details beyond those documented categories are not supplied.

Returned 21.respiratory_course (patient, presentation): My breathing has worsened over about a month. It began with cough and wheeze; later I developed fever, chills and general weakness.

Environment feedback: The exposure group answers the broad occupational/environmental component first, and the symptom-course group then supplies the recorded fever/chills/weakness history. The general reported lack of relevant occupational/environmental exposure must not be expanded into separately confirmed negative histories for every listed dust/mould/bird/chemical exposure. Recent travel, sick contacts, night sweats, weight loss, haemoptysis and leg swelling are not supplied; none can be asserted absent. No further directly responsive inventory group is deferred by the cap. Do not add later BAL/antibody, ventilation or outcome findings.

### Question 3
What are the admission examination findings (vital signs, auscultation, oxygen saturation on room air) and what does the early chest CT show?

Saved assessment note: Admission examination and early CT are the highest-yield remaining data to distinguish infectious consolidation, ground-glass or interstitial patterns, and to gauge severity at this decision point.

Returned 21.admission_respiratory_status (record, presentation): At admission she had hypoxaemic respiratory failure requiring 2 L/min oxygen by nasal cannula. Examination found diffuse basal crackles, minimal late expiratory wheeze and poor air movement. No numerical saturation or arterial blood gas is supplied in the saved presentation paragraph.

Returned 21.early_investigations (record, presentation): White-cell count was reported as 18,000 and procalcitonin negative. COVID-19 and influenza tests were negative. Early chest CT showed extensive bilateral ground-glass opacities. The later serological results and BAL are outside this early packet.

Environment feedback: The respiratory-examination/oxygen-support group answers the first request; the early-investigation group supplies CT findings second. Numerical admission vital signs, measured room-air saturation and an arterial blood gas are not supplied in this packet. Do not derive a room-air saturation from the documented 2 L/min oxygen requirement or invent normal vitals. The early CT finding is nonspecific; do not add later imaging, BAL/antibody findings or post-mortem results. No further requested available group is deferred by the cap.

### Question 4
When did you resume vaping relative to the start of your breathing problems, how often do you use it, and what product (e-liquid, nicotine concentration, brand)? Also, do you have any history of autoimmune or connective-tissue disease, or any prior lung disease other than COPD?

Saved assessment note: Vaping timing and product details are critical to assess for e-cigarette or vaping product use-associated lung injury, which fits the bilateral GGO pattern, fever, and failure of antibiotics/steroids. Autoimmune history would broaden the differential toward interstitial or vasculitic lung disease.

Returned 21.smoking_and_vaping (patient, presentation): I smoke tobacco daily. I recently resumed vaping after having stopped seven years earlier.

Returned 21.background (record, presentation): The recorded background includes COPD and gastro-oesophageal reflux disease.

Environment feedback: Return the documented vaping/smoking chronology first and the recorded medical-background group second. The source says recent vaping resumption after quitting seven years earlier, but does not specify the interval relative to symptom onset, use frequency, brand, e-liquid or nicotine concentration. The brief COPD/background record is not a comprehensive exclusion of autoimmune/connective-tissue or other lung disease; those requested specific histories are not supplied. No further directly responsive group is deferred by the cap. Do not substitute later autoimmune serology, GM-CSF antibodies, BAL or pathology for an unrecorded history. Previously returned fact groups: 21.smoking_and_vaping.

### Question 5
What is your current inhaled regimen and how severe is your COPD (e.g., FEV1 or GOLD stage if known)? Also, have you started any new medications, supplements, or herbal products in the past two to three months?

Saved assessment note: Baseline COPD severity and inhaled regimen help gauge how much of the bilateral ground-glass pattern is attributable to a new process versus underlying disease. New medications or supplements are a remaining exposure category not yet addressed.

Returned 21.outpatient_treatment (patient, presentation): For presumed COPD exacerbation I received two courses of steroids; the second was combined with ten days of doxycycline. I did not improve clinically.

Returned 21.other_exposures (patient, presentation): No relevant occupational or environmental exposure, medication-related pulmonary risk factor, diabetes or other known cause of immunocompromise was reported. Details beyond those documented categories are not supplied.

Environment feedback: Current inhaler regimen, FEV1 and GOLD stage are not supplied; the known COPD label is not a severity assessment. For the subsequent broad recent-medication request, return the documented outpatient steroid/doxycycline courses followed by the limited pulmonary medication-risk history. Neither group is a complete medication reconciliation. The general report of no medication-related pulmonary risk factor does not establish no other new medicine, supplement or herbal exposure in the past two to three months. Inhaled/nebulised maintenance therapy and supplement/herbal details remain unknown, not confirmed absent. No directly responsive group is deferred by the cap, and later inpatient drug treatment must not be substituted. Previously returned fact groups: 21.outpatient_treatment, 21.other_exposures.

## Final answer, unchanged

**Clinical Problem**

A 65-year-old woman with COPD presents with one month of progressive dyspnoea, cough, wheeze, fever and chills, unresponsive to two steroid courses and doxycycline. She requires 2 L/min nasal-cannula oxygen at admission. Examination shows diffuse basal crackles, poor air movement and minimal late expiratory wheeze. WBC is 18,000; procalcitonin is negative; respiratory viral tests are negative. Early CT shows extensive bilateral ground-glass opacities.

**Differential**

- Eosinophilic or hypersensitivity pneumonitis – Bilateral GGOs with fever, unresponsiveness to antibiotics and steroids, and recent vaping resumption raise this possibility. However, the interval between vaping resumption and symptom onset is unknown, and no eosinophil count or specific exposure history is supplied.
- Atypical or opportunistic infection – Leukocytosis with negative procalcitonin and negative common viral tests is discordant; an atypical bacterial, fungal or viral aetiology cannot be excluded. No travel, sick-contact or immunocompromise history is documented.
- COPD exacerbation with superimposed process – Basal crackles and poor air movement are consistent with her known COPD, but the degree of bilateral GGO and failure to respond to steroids argue against a simple exacerbation.

**Next steps**

Obtain room-air saturation and arterial blood gas, peripheral eosinophil count, and a full medication and supplement reconciliation. Consider bronchoscopy with BAL for cytology, culture and cell differential. Review vaping product details and timing relative to symptom onset.

## Provisional reference

This is progressive respiratory illness with an oxygen requirement despite treatment for presumed COPD exacerbation. Hypoxaemic respiratory failure warrants active inpatient assessment, oxygen and repeated monitoring, with prompt respiratory or critical-care escalation if support needs increase. Establish current saturation, work of breathing, haemodynamics and blood gas where indicated; numerical values not supplied in the packet must not be invented.

Clarify smoking and the recent return to vaping, other inhalational or occupational exposures, medication risks and the timing of outpatient therapy. If received, failure to improve after two steroid courses and doxycycline, basal crackles and extensive bilateral ground-glass change argue for reassessing the initial label. Infection, inhalational injury, inflammatory or interstitial disease and other diffuse alveolar processes remain possibilities, alongside relevant cardiopulmonary alternatives. Negative viral tests or procalcitonin alone do not eliminate every infection.

Vaping exposure supplies a plausible clue but does not prove causation. The early CT pattern is not diagnostic of a specific proteinosis or injury mechanism. Target subsequent investigations to unresolved alternatives and clinical stability, including specialist consideration of lavage or serology where appropriate. At this decision point those tests have not returned. Do not import a later elevated antibody, inconclusive lavage, post-mortem result, response to treatment or death into the initial synthesis. Even the retrospective report leaves the relative contributors to acute lung injury unresolved.

## Candidate information requirements

- 21.R1 — candidate essential: Request smoking/vaping and other relevant inhalational, occupational or medication exposures with timing. Why: Progressive unexplained respiratory symptoms and a task focused on exposure require an actual exposure history; no particular final diagnosis is needed. Acceptable alternatives: General smoking/vaping, environmental/occupational and medication pulmonary-risk questions. Exact device, chemical or dose details absent from the source are not required. Deadline: Before the final assessment, within the six question turns. Emergency escalation must not be delayed to exhaust the question budget.
- 21.R2 — candidate essential: Clarify the clinical course and prior treatment response. Why: A month of progression despite presumed COPD treatment challenges simple continuation of the initial label. Acceptable alternatives: Symptoms, duration and previous steroid/antibiotic courses with response; equivalent review of outpatient records counts. Deadline: Before the final assessment, within the six question turns. Emergency escalation must not be delayed to exhaust the question budget.
- 21.R3 — candidate essential: Seek current oxygenation/severity and chest or infection investigations. Why: Supplemental oxygen at admission makes respiratory status and the pattern of lung disease immediately consequential. Acceptable alternatives: Current observations/oxygen requirement plus chest imaging and focused infection evidence, or an equivalent urgent respiratory assessment. An unavailable requested saturation or blood gas remains a valid request; exhaustive serology is not essential. Deadline: Before the final assessment, within the six question turns. Emergency escalation must not be delayed to exhaust the question budget.

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
| D3d Causal Reasoning Appropriateness | | |

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

### D3d Causal Reasoning Appropriateness
1: Makes a materially incorrect or unsupported causal claim that distorts the conclusion or proposed action.
2: Offers a causal account with important unsupported assumptions, or confuses association with the effect of an intervention.
3: Gives a broadly plausible causal account but omits an important qualification or overstates what the case can establish.
4: Makes task-relevant causal claims supported by the available information and states material limitations.
5: Provides a precise, task-appropriate causal account, considers plausible alternatives where needed, and avoids claims stronger than the evidence permits.
