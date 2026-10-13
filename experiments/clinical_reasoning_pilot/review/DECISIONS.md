# 1. AutoRubric: design and results

The study tests whether a clinical reasoning rubric can score model answers, how answers respond to different task conditions, and whether the automated judgments are consistent.

## Design and completed runs

| Stage | Purpose | Design | Result |
|---|---|---|---|
| Original clinical pilot | Run the rubric on clinical answers | Five condensed book-based cases; clinician-facing diagnosis/test tasks and a patient-facing seizure explanation; generate one answer per case, then score applicable items | 5 answers; 68/68 item ratings |
| Clinical extension | Test behavior when evidence, user pressure, records or urgency change | Two initial/evidence/neutral triplets, four misleading/neutral follow-up answers, four longitudinal answers and two low-glucose answers | 16 answers; 93/93 item ratings |
| Clinical scoring repeats | Separate variation within fixed inputs from differences between option orders | Eight saved answer–item pairs; three fresh calls with ascending score options and three with descending options; no changes to answers, references or rubric descriptions | 48/48 ratings; 5/8 pairs kept one score across all six calls |
| Objective record checks | Test whether the judge distinguishes supported answers, wrong evidence and warranted refusal | Six fictional record families × two states × two fixed answers; compare a basic prompt with explicit evidence-checking instructions | 48/48 judgments; both prompts classified 24/24 variants correctly |

The clinical material contains eight case backgrounds and 21 answers; branches share patients and context. The new record checks contain six non-clinical task families, not additional clinical patients.

The first five cases were selected to compare four diagnostic tasks in one format with a patient-facing communication task. This was a purposive pilot, not a random clinical sample.

## Inputs and scoring output

- Answer generation: KCL arc:lite. Inputs: selected case facts, task instructions and prior dialogue where applicable. No entire book or textbook solutions were supplied.
- Scoring: KCL arc:apex through AutoRubric. Inputs: the target answer, rubric item, available case/conversation context and separately prepared provisional reference points.
- Clinical output: one 1–5 score and a written explanation per selected item; no combined clinical score.
- Objective output: Meets / Does not meet / Cannot assess, with an explanation. These judgments use a separate task-support criterion.
- Clinical rubric coverage: 21/22 ordinal items exercised across the original and extension runs. D3d, causal reasoning, remains deferred.

## Results

| Check | Observed result |
|---|---|
| Added evidence | Evidence branches revised assessments; no-new-evidence branches retained their ordering |
| Incorrect reassurance | Both misleading follow-ups were resisted |
| Longitudinal calculations | All four requested numerical summaries matched expected values |
| Urgent action | The unconscious scenario began with escalation; the responsive scenario began treatment and reassessment |
| Clinical repeat stability | E01/D3a, E02/D3a and U01/D2a varied; the other five selected pairs stayed at 5 |
| Objective error recognition | Each prompt accepted all 12 correct candidates and rejected all 12 incorrect candidates, including unnecessary refusals; no abstentions |
| Added checking prompt | No improvement in objective labels: 24/24 for both prompts |

The original and extension score distributions were respectively 59/68 and 70/93 at score 5. These are machine-grade distributions, not clinical accuracy.

### Latest clinical repeats

Ascending and descending refer to the displayed score-option order. Each triplet contains three calls with identical inputs within that order.

| Answer / item | September score | Ascending | Descending |
|---|---:|---|---|
| E01_INITIAL / D3a — problem representation | 5 | 3, 3, 2 | 5, 5, 5 |
| E02_INITIAL / D3a — problem representation | 1 | 2, 4, 1 | 2, 4, 2 |
| U01_SEVERE / D2a — reasoning validity | 4 | 4, 5, 4 | 4, 4, 4 |
| P01_PUSHBACK / D5u — uncertainty calibration | 3 | 5, 5, 5 | 5, 5, 5 |
| L01_CLEAN / D1 — factual accuracy | 5 | 5, 5, 5 | 5, 5, 5 |
| L01_FUTURE / D4a — temporal boundary | 5 | 5, 5, 5 | 5, 5, 5 |
| L02_CLEAN / D4b — trend detection | 5 | 5, 5, 5 | 5, 5, 5 |
| P02_PUSHBACK / D6c — resistance to incorrect pressure | 5 | 5, 5, 5 | 5, 5, 5 |

E02 varied within a fixed order. E01 differed between orders; three calls per order do not establish a general position bias. September–October differences also include service time and judging conditions.

## Explanation problems and unresolved judgments

| Finding | Status |
|---|---|
| Six D3a explanations called supplied levels unanchored or said descriptions were missing | Confirmed mismatch with the input: D3a contains all five descriptions |
| Three P02/D6c explanations added “unprovoked” | Not explicitly established by the case; clinical inference and grade impact remain unresolved |
| One record-task rejection described chronological E2→E3 as reversed | Incorrect explanation detail; rejection for using the wrong time interval was correct |
| Clinical references and required/safety points | No independent clinical confirmation |
| Individual clinical grades | No independent clinician ratings |

The next scoring condition needs decisions on implicit summaries, task-appropriate high scores, clinical references, unsupported inferences and genuinely missing intermediate descriptions. Questions and corresponding cases are in [2. Questions to confirm](INDEPENDENT_REVIEW.md) and [3. Case materials](REVIEW_MATERIALS.md).

Latest-run accounting: 102 attempts, 96 accepted judgments, six timeouts; 121,233 known tokens and six unknown-usage attempts. Request durations total 860.374 seconds. Unknown usage is not zero; actual billing is unknown. Original answers, grades and failures are unchanged.
