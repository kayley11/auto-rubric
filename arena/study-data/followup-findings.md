# N04 follow-up: requests, returned records and scoring

N04 concerns a 36-year-old woman readmitted with recurrent orthostatic headache three days after discharge. We generated new interviews after repairing record returns. The case, prompts, six-question limit and `arc:apex` judge stayed the same; patient statements and reports retained their fixed wording. Old and new interviews used the same input-building method and Josh’s proposed anchors. **Clinical references and essential-information requirements await Josh’s confirmation.**

## 1. What was corrected

- Admission-specific CT/CSF and infection records retain their context, including unambiguous “that admission” references.
- Time expressions, earlier episodes, current symptoms, inpatient treatment and discharge prescriptions are matched separately.
- An MRI request mentioning low CSF pressure no longer releases unsolicited CSF laboratory results.
- D5c distinguishes **unavailable selected material** from **a matching selected record missed by the controller**. Adequate requests count in both situations.
- The missed “Apex Q3…” audit aside was removed. Essential labels, general alternatives, deadlines and author anchors are unchanged.

Further routing faults found during the new interviews were corrected through saved-prefix continuations. Every earlier output is preserved. The final cohort contains three trajectories for one case.

## 2. What the models did and how they scored

**D5c assesses information requests; D3a assesses synthesis of received evidence.** Each cell contains three grades for the same fixed input. Both saved and new interviews were rescored with the same judge, anchors and candidate checklist.

| Answering model | D5c: saved | D5c: new | D3a: saved | D3a: new |
|---|---|---|---|---|
| arc:lite | 2, 2, 2 | 2, 2, 5 | 5, 5, 5 | 5, 5, 5 |
| arc:chat | 2, 2, 2 | 2, 2, 2 | 5, 5, 5 | 5, 5, 5 |
| arc:apex | 2, 2, 2 | 2, 2, 2 | 5, 5, 5 | 5, 5, 5 |

- **lite** requested the readmission MRI. It did not explicitly request PCR/culture/serology. Its general prior-CSF question received 2, 2 and 5: two repeats treated infection seeking as unmet; the third accepted CSF results as equivalent.
- **chat** requested readmission examination and repeat CSF, but no targeted infection investigation. **apex** obtained first-admission infection results, but ended after five questions without requesting a readmission examination/CSF/MRI report.
- Removing the unsolicited CSF report from lite’s MRI reply changed its next question and removed the readmission CSF values from its final answer. Both continuations remain saved.

The [request table](REQUESTS.csv) lists every question and return; the [score table](SCORES.csv) includes explanations and marks the final comparison records.

**A concrete input error:** an earlier diagnostic judgement gave chat 5, treating its Q3 as infection seeking because of the “Apex Q3” aside. Chat’s Q3 asked about discharge diagnosis and earlier positional headache. Removing only that aside produced 2 in the matched judgement. [Both outputs are saved](ASIDE_COMPARISON.json). Rules must describe general requirements; requests must be established from each actual transcript.

## 3. Unavailable information is a separate check

These controls reuse saved requests; they do not generate new interviews or change clinical requirements.

| Saved-input check | New D5c repeats |
|---|---|
| N02: actual glucose request, report unavailable | 4, 5, 5 |
| C03: requested duration and investigation results unavailable | 4, 3, 4 |

The previous audit found nine unsupported simulator-error attributions: glucose was deliberately unavailable in N02 controls; precise duration, stool-test and endoscopy results were absent from C03’s packet. [The audit](PREVIOUS_EXPLANATION_AUDIT.json) preserves the original wording and corrected classification.

All six new control explanations identified source unavailability without affirmatively calling it a simulator error. [The six checks](AVAILABILITY_REVIEW.json) retain the supporting excerpts. C03’s 4, 3, 4 reflects disagreement over repeated questioning and omitted helpful back/skin history; N02’s 4, 5, 5 reflects the helpful food/fasting enquiry’s timing. Neither grade difference was attributed to failure to obtain an unavailable report.

Availability classification and numeric grades are checked separately.

One new N02 explanation incorrectly allows a final food/fasting question to meet a **before-assessment** deadline. [This factual mismatch is flagged](DEADLINE_EXPLANATION_AUDIT.json); the original grade remains. The 4/5 boundary is a separate judgement.

## 4. What still needs clinical judgement

1. **N04 essentials and alternatives:** are both current/readmission evidence and infection investigations essential here? Does asking for a general CSF result satisfy the infection requirement, or is a more targeted infection/PCR/culture/serology request needed? This choice can change whether D5c is capped at 2.
2. **N04 synthesis:** how should unsupported precision about steroid cessation, and the distinction between the original headache and the later orthostatic component, affect D3a? The selected record says nine inpatient days of dexamethasone; it does not establish the last-dose date or a taper. Please identify the affected sentence and an appropriate anchor, if any.
3. **C03 targeting:** how should omitted back/skin history affect the 3/4/5 boundary when it is currently labelled helpful? N02’s glucose necessity, equivalents and timing also remain candidate assumptions.

Request occurrence and record availability have been checked technically. The questions above concern clinical necessity, equivalence and grading.

## Evidence

[Complete plain-text output](RAW_OUTPUT.txt) contains inputs, visible responses, failures, diagnostic passes and continuations. Original answers and explanations remain unchanged.

The final comparison uses 42 grades; six superseded fresh-lite grades and four diagnostic grades remain saved. All 1,915 monitored historical files are unchanged. Reported use including diagnostics: 379,581 tokens, 37.4 minutes; timeout/interruption usage can be missing. Checks passed: 931 Python tests, four packaging tests, 24 live imports and 131 saved-turn replays. [Checks and resource use](CHECKS_AND_USAGE.json).
