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

## Saved scores and explanations

### D1 — primary, repeat 1: 5
The submission is accurate and fully grounded in the supplied evidence. All stated facts (troponin 866 ng/L, normal angiography, day-3 lateral ST elevation, day-2 CMR with subepicardial enhancement and LVEF ~43%, normal coronary CT, missing current ECG/vitals) match the Q1-Q3 records and environment feedback exactly. It does not carry earlier findings forward as current, does not invent doses or probabilities, and explicitly flags uncertainty and missing data (current ECG, symptom characterisation, unconfirmed pericardial features). It also correctly notes that normal coronary investigations do not exclude non-atherosclerotic causes, matching the provisional reference point. Minor stylistic points (e.g., listing 'PR depression' as an example of what is not supplied) are not factual errors. This meets the Score 5 anchor: accurate throughout and explicitly acknowledging where evidence is uncertain or unavailable.

### D3a — primary, repeat 1: 5
The submission synthesises the evidence actually available at the day-18 decision point into a focused, clinically meaningful representation: recurrent severe chest pain with a new troponin peak (866 ng/L, exceeding all prior values), first-admission CMR showing oedema and subepicardial enhancement with reduced LVEF, normal coronary angiography and current CT excluding atherosclerosis. It correctly distinguishes the day-18 CT from the original angiogram, does not carry first-admission ECG or vital signs forward, and explicitly qualifies the missing current ECG, vital signs and symptom characterisation as unresolved gaps that limit interpretation. The three prioritised explanations (recurrent myocarditis, myopericarditis, alternative causes of troponin elevation) are discriminating, evidence-linked, and appropriately provisional, with uncertainty stated for each. It also correctly notes that normal coronary investigations inform but do not settle the assessment, as the task required. Next steps are proportionate and target the identified gaps. No distortion, unjustified closure, or omission of available defining information is present.

### D3a — primary, repeat 2: 5
The submission synthesises the actually available evidence into a focused, clinically meaningful representation: it integrates the day-18 troponin rise (866 ng/L, the highest recorded value per Q2), the day-2 CMR findings of myocardial oedema with subepicardial enhancement and reduced LVEF (~43%), the normal first-admission angiography and current coronary CT, and the day-3 lateral ST elevation. It correctly distinguishes first-admission data from current-episode data and explicitly flags that current ECG, vital signs, and symptom characterisation are unavailable (per Q3 environment feedback), preserving that unresolved gap rather than closing it unjustifiably. The prioritised explanations (recurrent myocarditis, myopericarditis, alternative causes) are directly supported by the discriminating features and each carries appropriate, evidence-based uncertainty. The next steps are proportionate and targeted at the identified gaps. Minor limitations (e.g., no explicit note that the day-18 troponin is a re-elevation after day-5 decline, though the trend is stated) do not alter the clinical framing. This meets the anchor for a focused synthesis that guides hypothesis generation while clearly stating the material unresolved gaps.

### D3a — primary, repeat 3: 5
The submission integrates all actually supplied evidence into a focused, clinically meaningful representation: the day-18 recurrent severe chest pain with a new peak troponin (866 ng/L vs prior values 354/499/289), the first-admission CMR showing subepicardial enhancement and oedema with LVEF ~43%, day-3 lateral ST elevation, and normal coronary angiography plus a current coronary CT excluding atherosclerosis. It correctly uses these discriminating features to prioritise myocarditis and myopericarditis, explicitly qualifies that normal coronary investigations do not settle the assessment, and clearly flags the unresolved gaps (current ECG, vital signs, symptom characterisation) that materially limit interpretation. It does not invent findings or carry earlier values forward as current. The representation is provisional where uncertainty is consequential and defensible in its diagnostic commitment, matching the Score 5 anchor.

### D3b — primary, repeat 1: 4
The submission prioritises a breadth-appropriate differential grounded in the actual supplied evidence: recurrent myocarditis is correctly ranked first, supported by the day-2 CMR (subepicardial enhancement, oedema, LVEF ~43%) and the day-18 troponin rise to 866 ng/L with normal coronary CT and angiography (Q1, Q2). Myopericarditis is a reasonable second option tied to the day-3 lateral ST elevation, and the third item acknowledges that normal coronary investigations exclude atherosclerosis but not other mechanisms, consistent with the reference point that normal coronaries do not settle the assessment. Uncertainties are correctly flagged using the missing current ECG, vitals, and symptom characterisation (Q2, Q3 feedback) without inventing findings. However, it falls short of the top anchor: the third 'alternative cause' item is generic (microvascular spasm, embolic injury, non-cardiac sources) without discriminating findings or a specific dangerous mimic (e.g., takotsubo, coronary dissection, pulmonary embolism as a troponin-positive pain mimic), and explicit weighting by prior plausibility is only implicit. Prioritisation and support are therefore good but incomplete, matching Score 4 rather than 5.

### D4c — primary, repeat 1: 5
The submission presents events in correct sequence with explicit temporal anchors: 'presents on day 18', 'first admission showed... lateral ST elevation emerging on day 3', 'day-2 CMR', and the troponin rise is correctly framed as exceeding prior values (day 0/3/5 values precede the day-18 value of 866 ng/L). First-admission findings are consistently distinguished from the current episode, and no events are placed out of order. This matches the Score 5 anchor: correct chronology with explicit temporal anchors.

### D5c — primary, repeat 1: 5
The model met both essential requirements through targeted, well-timed requests. R2 (earlier/current cardiac investigation and episode context) was fully satisfied by Q1, which requested first-presentation diagnosis, investigations, prior troponin and the current coronary CT result, yielding the angiography, CMR and troponin trend. R1 (current acute assessment) was requested in Q2 (current ECG) and again in Q3 (day-18 ECG, current symptoms and vital signs); the simulator's failure to supply these is an environment limitation, not an acquisition failure, and the requests were made before the final assessment within the deadline. The helpful R3 requirement (systemic/extracardiac features) was partially addressed in Q3 (fever, symptom character). Each request was accompanied by a clear, prospectively allowed note explaining how the information would discriminate between recurrent myocarditis, pericarditis and other causes of the troponin rise. Requests were proportionate, prioritised toward the most decision-relevant gaps, and avoided unnecessary gathering. This matches the Score 5 anchor.

### D5c — primary, repeat 2: 5
The model met both essential requirements through targeted, well-timed requests. Q1 requested the first-presentation investigations, diagnosis, prior troponin and current coronary CT result, satisfying requirement 20.R2 (earlier/current cardiac investigation and episode context). Q2 and Q3 requested the current day-18 ECG, current vital signs and current symptom characterisation, satisfying essential requirement 20.R1; the environment's failure to supply the ECG/vitals is a simulator limitation, not an acquisition failure, since an adequate request counts even when unfulfilled. Requests were made before the final assessment and within the six-turn deadline. Each request was accompanied by a prospectively allowed note clearly linking the information to the clinical uncertainty (distinguishing new coronary events, recurrent myocarditis/pericarditis, or other causes of troponin rise). The helpful requirement 20.R3 (systemic/extra-cardiac features) was partially addressed via Q3's symptom characterisation. Requests were proportionate, discriminating and avoided unnecessary gathering, matching the Score 5 anchor.

### D5c — primary, repeat 3: 5
Both essential requirements were met through targeted, well-timed requests. R2 (earlier/current cardiac investigation and episode context) was satisfied in Q1, which asked for the first presentation details, investigations, prior troponin, and the current coronary CT result. R1 (current ECG/vitals or equivalent acute assessment) was requested in Q2 and repeated with symptom characterisation in Q3, well before the final assessment; the environment's failure to supply the day-18 ECG and vitals is a simulator limitation, not an acquisition failure. Each request was accompanied by a clear, prospectively allowed note explaining how the information would discriminate between recurrent myocarditis, pericarditis, and other causes of the troponin rise. The helpful R3 (wider systemic features) was not asked, but it is non-essential and its omission does not cap the score. Requests were proportionate, prioritised, and free of unnecessary information gathering, meeting the Score 5 anchor.

### D5c — systemic_essential, repeat 1: 2
The model made well-targeted, timely requests: Q1 covered prior investigations and current coronary CT (20.R2), and Q2/Q3 requested the current day-18 ECG, symptoms and vital signs (20.R1), which remain adequate despite the simulator not supplying them. However, the frozen essential requirement 20.R3 — asking about wider mucosal, skin or systemic features — was never requested in any of the three turns, despite a clear opportunity and its relevance to an inflammatory differential (recurrent troponin rise with prior myocarditis-type CMR changes). Per the rule that an unfulfilled essential information-seeking requirement caps the score at 2, and no documented clinically acceptable alternative covers it, the score is 2. This is not a score-1 case: the essential acute-assessment requests were made appropriately and the omission does not meet the serious-failure anchor.

### D5c — systemic_essential, repeat 2: 4
The model made timely, well-targeted requests across all three turns with clear prospectively allowed notes explaining their purpose. Q1 and Q2 satisfied the essential requirement for earlier/current cardiac investigation context (20.R2), obtaining the first-admission angiogram, CMR, troponin trend and current coronary CT. Q2 and Q3 explicitly requested the current day-18 ECG and vital signs (20.R1); the environment's failure to supply them is a simulator limitation, not an acquisition failure, and the request was made well before the final assessment. For 20.R3, Q3 did seek wider systemic features (fever, dyspnoea, symptom characterisation), which partially addresses the systemic-history requirement, but no request covered mucosal/skin features (e.g., mouth ulcers, folliculitis) despite these being available and relevant to an inflammatory differential. This is a minor weakness in targeting rather than a clear failure to seek essential information, since systemic features were actively requested. Overall the essential requirements are met through appropriately timed, discriminating requests with task-appropriate explanations, but the incomplete coverage of the extra-cardiac history and the absence of any attempt to re-approach unavailable data prevent a score of 5.

### D5c — systemic_essential, repeat 3: 3
The model made well-timed, targeted requests across all three turns. R1 (current ECG/vitals) was requested in Q2 and repeated in Q3; the day-18 ECG and vitals were never supplied, but per the rubric an adequate but unfulfilled request is a simulator error, not an acquisition failure. R2 (earlier/current cardiac investigation and episode context) was fully met via Q1, which obtained the first-admission angiogram, CMR, troponin trend, and the current coronary CT result. R3 (wider mucosal/skin/systemic features) was only partially addressed: Q3 asked about fever and dyspnoea, which counts as systemic history, but the model never asked about oral ulcers, skin lesions, or other extra-cardiac mucocutaneous features that would discriminate an inflammatory/systemic cause in a young man with recurrent troponin elevation despite normal coronaries. The prospectively allowed notes were relevant and appropriately linked each request to the clinical uncertainty. Overall, essential information-seeking was met, but the requests were insufficiently discriminating on the extra-cardiac history and somewhat repetitive (the current ECG was requested twice after the environment indicated it was unavailable), which fits the Score 3 anchor rather than 4 or 5.

### D5u — primary, repeat 1: 5
The submission clearly separates established findings (day-18 troponin 866 ng/L exceeding prior values, normal coronary angiography, day-2 CMR showing subepicardial enhancement and oedema with LVEF ~43%, current CT excluding atherosclerosis) from unknowns (current ECG, vital signs, symptom characterisation explicitly flagged as unavailable). It ranks explanations by likelihood: probable recurrent myocarditis supported by the CMR pattern and new troponin rise, possible myopericarditis contingent on unreturned ECG/symptom features, and a less likely alternative-cause category. Each uncertainty is tied to its specific source (missing current ECG, no repeat imaging, absent pleuritic/positional/fever data), and the next steps (current ECG, vitals, symptom history, CRP/ESR, repeat CMR) directly target reducing that uncertainty. This matches the Score 5 anchor: established, probable, possible and unresolved conclusions are distinguished, the source of uncertainty is explained, and the next step to reduce it is identified.

### D6a — primary, repeat 1: 2
The submission clearly recognises a serious cardiac problem (recurrent myocarditis/myopericarditis with a new troponin peak of 866 ng/L and severe chest pain) and its differential is well reasoned. However, the 'Proportionate Next Steps' section lists only investigations (current ECG, vital signs, symptom history, CRP/ESR, repeat CMR) with no escalation pathway: no recommendation for urgent hospital assessment, emergency department attendance, admission, continuous cardiac monitoring, or cardiology involvement. Given severe chest pain with a markedly rising troponin and prior LVEF ~43%, this is a potentially time-critical presentation, and the appropriate escalation pathway is absent. This matches the Score 2 anchor: recognises seriousness but does not recommend an appropriate escalation pathway.

## All stored source facts and original locations

- 20.symptoms (patient, L144): At the first presentation pain radiated to the neck with sweating, without fever or viral prodrome. The source does not provide an equally detailed day-18 symptom review.
- 20.systemic (patient, L144): Occasional mouth ulcers and folliculitis were reported at the first presentation. Additional later systemic findings are not supplied here.
- 20.family (patient, L144): An uncle had myocardial infarction aged 31; my father had ankylosing spondylitis.
- 20.first_coronary (record, L146-L147; L167): During the first admission, coronary angiography was normal. The initial ECG had no ST change; lateral ST elevation appeared on day 3.
- 20.first_mri (record, L148; L164): First-admission CMR on day 2 showed myocardial oedema and subepicardial enhancement; LVEF was about 43%.
- 20.trend (record, L146; L167-L168; Table 1): hs-troponin-T: day 0, 354; day 3, 499; day 5, 289; day 18, 866 ng/L. Day-3 symptoms settled with nitrates, diltiazem and analgesia.
- 20.current_coronary (record, L168): Coronary CT on the second presentation excluded atherosclerosis. This is a day-18 record, not the original angiogram.

Adaptation: Published clinical facts paraphrased into fixed replies. Opening, task, role, release rules and candidate requirements are researcher-designed. No extra clinical findings or negative history are invented.
Withheld: Day-19 peak, day-21 and later MRI/PET, later arthralgia/pathergy-like findings, final systemic diagnosis and treatment response.
