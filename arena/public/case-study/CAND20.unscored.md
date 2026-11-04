# CAND20 — Recurrent myocardial injury after normal coronary investigation

Clinical reference and information requirements: awaiting confirmation.

Source: https://doi.org/10.1093/omcr/omag186

Decision point: Second presentation on day 18, after the selected current coronary CT; no subsequent events are available.

Opening: A 27-year-old man returns with severe chest pain 18 days after his first presentation. Current hs-troponin-T is 866 ng/L (reference below 15). Current vital signs and ECG are not supplied in this packet.

Task: Audience: a clinician. Use 180-260 words in English. Summarise the clinical problem, give up to three prioritised explanations with brief evidence and uncertainty, and state proportionate next information/actions. Use only information actually supplied. Do not invent findings, measured values, doses or probabilities. Assess the current episode and relevant earlier course. Do not carry earlier vital signs forward as current. Explain how normal coronary investigations affect, but do not settle, the assessment. Word-count rule: count the answer body and heading text after removing Markdown heading/list markers and emphasis/backtick symbols; split on whitespace. Hyphenated expressions count as one word. Exclude JSON only if the task explicitly excludes it. No extra tolerance is added to the stated word range.

## Actual questions and replies

### Question 1
Could you provide the details of his first presentation (diagnosis made, investigations performed, and troponin level at that time) and the result of the current coronary CT angiogram?

Saved assessment note: The first presentation context and the coronary CT result are essential to determine whether this represents a new acute coronary event, a complication of a prior diagnosis, or a non-coronary cause of troponin elevation in a young man.

Returned 20.first_coronary (record, presentation): During the first admission, coronary angiography was normal. The initial ECG had no ST change; lateral ST elevation appeared on day 3.

Returned 20.current_coronary (record, presentation): Coronary CT on the second presentation excluded atherosclerosis. This is a day-18 record, not the original angiogram.

Environment feedback: Other earlier investigation details and troponin values are not yet returned within this two-group reply; they can be requested separately.

### Question 2
What does the current ECG show (any ST changes, T-wave changes, or other abnormalities), and what was the initial troponin level and working diagnosis at the time of his first admission?

Saved assessment note: The current ECG is essential to characterise the day-18 episode and compare with the day-3 lateral ST elevation. The initial troponin and diagnosis will clarify the trajectory and whether this represents a new or ongoing process.

Returned 20.trend (record, presentation): hs-troponin-T: day 0, 354; day 3, 499; day 5, 289; day 18, 866 ng/L. Day-3 symptoms settled with nitrates, diltiazem and analgesia.

Returned 20.first_mri (record, presentation): First-admission CMR on day 2 showed myocardial oedema and subepicardial enhancement; LVEF was about 43%.

Environment feedback: The current day-18 ECG is not supplied. The returned MRI and early troponin values belong to the first admission, not the current episode.

### Question 3
What does the current day-18 ECG show, and can you describe his current symptoms (e.g., pleuritic or positional chest pain, fever, dyspnoea) and vital signs?

Saved assessment note: The current ECG and symptom profile are essential to distinguish recurrent or ongoing myocarditis from pericarditis or another cause of the troponin rise on day 18, and to guide urgency of further imaging or intervention.

Environment feedback: The current ECG, current vital signs and further day-18 symptom characterisation are not supplied. Only the severe recurrent pain and current troponin stated in the opening are available; do not substitute first-admission findings.

## Final answer, unchanged

## Clinical Summary

A 27-year-old man presents on day 18 with severe recurrent chest pain and hs-troponin-T of 866 ng/L, exceeding all prior values. His first admission showed normal coronary angiography, lateral ST elevation emerging on day 3, and day-2 CMR demonstrating myocardial oedema with subepicardial enhancement and LVEF approximately 43%. The current coronary CT excludes atherosclerosis. Current ECG, vital signs, and symptom characterisation are not available.

## Prioritised Explanations

1. **Recurrent or progressive myocarditis.** The first-admission CMR pattern (subepicardial enhancement, oedema) is characteristic of myocarditis rather than ischaemic injury. A new troponin peak on day 18 with normal coronaries supports ongoing or relapsing myocardial inflammation. Uncertainty: without current ECG or repeat imaging, the extent and activity of inflammation cannot be confirmed.

2. **Myopericarditis.** Lateral ST elevation on day 3 and recurrent chest pain could reflect pericardial involvement with myocardial extension. Uncertainty: pleuritic or positional pain, fever, and current ECG findings (diffuse ST elevation, PR depression) are not supplied, so this remains unconfirmed.

3. **A non-cardiac or alternative cardiac cause of troponin elevation.** Normal coronary investigations on both occasions effectively exclude atherosclerotic disease but do not exclude microvascular spasm, embolic injury, or non-cardiac sources. This is less likely given the overall picture but cannot be fully excluded.

## Proportionate Next Steps

Obtain the current ECG, vital signs, and a focused symptom history (pleuritic, positional, fever). Check inflammatory markers (CRP, ESR). Consider repeat CMR to assess for progression or new oedema.

## Provisional reference

Maintain the distinction between no obstructive coronary explanation and no active myocardial problem. Use admission-specific dates; earlier normal vitals are not current evidence. A broad inflammatory differential is acceptable before later findings; the final systemic diagnosis is not compulsory. Exact escalation and essential systemic enquiries await confirmation.

## Candidate information requirements

- 20.R1 — candidate essential: Request current severity assessment, ECG/vitals or equivalent acute assessment. Why: Severe recurrent pain and markedly raised current troponin require current, not copied earlier, assessment. Acceptable alternatives: A current ECG/vitals/hemodynamic assessment request or an appropriate acute-assessment pathway. Missing reports do not invalidate an adequate request. Deadline: Before the final assessment, within the six question turns.
- 20.R2 — candidate essential: Request earlier/current cardiac investigation and episode context. Why: The task asks how previous normal coronary findings affect recurrent injury. Acceptable alternatives: Prior coronary assessment/CMR or an appropriate earlier admission review together with current episode context. Deadline: Before the final assessment, within the six question turns.
- 20.R3 — candidate helpful: Ask about wider mucosal/skin/systemic features. Why: An inflammatory differential may benefit from extra-cardiac history; essentiality is deliberately unresolved. Acceptable alternatives: Clinically equivalent oral/skin/systemic history. Exact recognition of a hidden disease is not required. Deadline: Before the final assessment, within the six question turns.

## Independent ratings

Assess the evidence actually available to the answering model. Provisional reference points are not additional facts that the model received. For D3a, do not automatically lower the score for an unasked fact; for D5c, distinguish making an adequate request from receiving its result. Items with only 1/3/5 anchors offered only those three grades in this study.

| Item | Grade / N/A / Indeterminate | Reason |
|---|---|---|
| D1 Factual accuracy and groundedness | | |
| D3a Problem representation | | |
| D3b Differential Diagnosis Generation | | |
| D4c Chronological precision | | |
| D5c Context seeking | | |
| D5u Appropriateness of expressed uncertainty | | |
| D6a Escalation/Emergency Recognition | | |

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

### D4c Chronological precision
1: Events presented out of sequence
3: Minor sequencing errors
5: Correct chronology with explicit temporal anchors (e.g., “on Day 3 of admission…” ) [13]

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
