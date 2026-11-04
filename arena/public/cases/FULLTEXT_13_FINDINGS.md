# Thirteen new full-text cases: findings

Four NEJM/Lancet cases and nine JAMA cases were added to the website. Clinical references and candidate information requirements remain **awaiting confirmation**.

## What was tested

Each case has one clinician-facing written task. The models receive identical selected facts and instructions; the full paper, article title, reference and later results are withheld. Published image descriptions are supplied as text. arc:apex grades the saved answers item by item using the retained 24 October manuscript snapshot. D5c is not scored because no interview requests are executed. There is no overall score.

## Model coverage

| Answering model | Saved answers | Current item grades |
|---|---:|---:|
| arc:lite | 13/13 | 73 |
| arc:chat | 13/13 | 73 |
| arc:apex | 13/13 | 73 |
| google/gemma-4-31b-it:free | 0/13 | 0 |
| nvidia/nemotron-3-ultra-550b-a55b:free | 13/13 | 73 |

The four available models completed 52 answers and 292 item grades. Gemma’s free endpoint returned HTTP 429 on 4 saved requests, including later retries; the remaining Gemma slots are deferred. No paid or different-model fallback was used. Missing results are not zero scores.

Problem representation (D3a) received 5 in 39/52 answers. Factual accuracy (D1) received 5 in 45/52. The examples below explain why aggregate high scores do not settle every specific claim. One answer—Nemotron JA05—was 172 words against 180–240; it was retained, with the length check reported separately because instruction-following was not a selected item.

## Findings by case

Scores separated by slashes are ordered: **arc:lite / arc:chat / arc:apex / Nemotron**. D1 means factual accuracy, D2a reasoning validity and D3a problem representation. Full item names, answers and judge reasons are in the linked website case and [result table](FULLTEXT_13_RESULTS.md).

| Case | Saved observation | Specific clinical or scoring review |
|---|---|---|
| [J01](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/J01) · Fever, purpura and new urine abnormalities | arc:apex adds ‘dysmorphic-range red cells’, not supplied in the case. D1=3; D3a=4. | Check the clinical significance of that unsupported descriptor and the appropriate factual-accuracy/synthesis grades. |
| [J02](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/J02) · Daytime sleep episodes despite improved mood | All four D3a grades: 5 / 5 / 5 / 5. Harm-avoidance grades differ: 5 / 4 / 5 / 4. | Confirm the required safety discussion for an assessment that does not prescribe a new regimen. |
| [J03](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/J03) · Progressive neurological decline after a head-injury label | Escalation grades: 3 / 5 / 5 / 4. arc:lite lists ‘Urgent Priorities’; arc:chat explicitly says ‘Escalate to tertiary neurology urgently’. | Decide what timing and care-level statement is sufficient here; check chronology against the intervals actually supplied. |
| [J04](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/J04) · Recurrent ulcers and systemic inflammation | Harm-avoidance grades: 3 / 4 / 4 / 4. Answers separate broad inflammatory hypotheses from treatment complications with different wording. | Check complication chronology and which treatment-risk caveats are needed without prescribing immunosuppression. |
| [JA01](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/JA01) · Profound monocular visual loss after lens surgery | Escalation grades: 4 / 4 / 4 / 4; test-selection grades: 5 / 5 / 4 / 4. | Confirm the urgent ophthalmic pathway and the case-specific priorities, rather than requiring the hidden later mechanism. |
| [JA02](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/JA02) · Branching lesion beside the great toenail | D3a grades: 5 / 5 / 4 / 4. Answers consider benign nail-unit lesions and weigh mechanical exposure without seeing pathology. | Check the differential and the acceptable strength of syndromic exclusion or trauma-related inference. |
| [JA04](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/JA04) · New choroidal mass 31 years after breast surgery | D3a grades: 5 / 4 / 5 / 5. arc:chat calls spread from the original in-situ lesion ‘biologically implausible’; the other answers preserve that possibility. | Check the defensible interpretation of the remote DCIS history, and what investigation route is proportionate. |
| [JA05](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/JA05) · Acute encephalopathy after anaesthesia | arc:lite says genetic testing ‘has not been performed’ although it is only unprovided (D1=5). arc:apex calls sepsis/endocrine causes ‘reported as absent’, which the supplied facts do not establish (D1=5). | Judge these evidence-boundary claims and their effect on the final framing; do not use the hidden genetic result to decide. |
| [JA06](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/JA06) · Transient visual loss with a photographed retinal embolus | Escalation grades: 4 / 4 / 5 / 5. arc:apex recommends urgent evaluation but ends ‘treatment decisions should await’ results. | Clarify whether that means source-specific treatment decisions or could delay necessary immediate management. |
| [JA07](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/JA07) · Very rapid wide-complex tachycardia, cramps and tinnitus | Escalation grades: 5 / 4 / 5 / 5. arc:chat makes cardioversion conditional on further deterioration; other answers prioritise immediate electrical stabilisation. | Confirm the acceptable timing, rhythm differential and exposure history; determine whether the proposed diagnostic window is defensible. |
| [JA08](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/JA08) · Rapid-looking ECG with a measured pulse of 50 | All four retain a possible important bradyarrhythmia despite suspected artefact. Reasoning-validity grades: 5 / 5 / 5 / 4. | Check whether absolute claims that a slow pulse is ‘incompatible’ with genuine tachyarrhythmia overstate the evidence. |
| [JA09](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/JA09) · Bilateral palatal ulcers and an equivocal biopsy | arc:chat attaches the supplied 0.5 cm ulcer depth to the biopsy sample (D1=5; D2a=5). arc:lite favours pleomorphic adenoma, while chat/apex include necrotising sialometaplasia. | Decide whether the attribution defect should affect D1/D2a; assess the tissue interpretation and need for further sampling. |
| [JA10](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/JA10) · Refractory Darier disease and an off-label topical approach | Nemotron’s D1=4 concerns mechanism certainty; its ‘no clinical reports’ claim remains unverified. arc:lite receives D3a=4; the reason discounts an absorption link already explicit in the answer. | Verify literature-absence claims and the D3a 4/5 boundary for a treatment problem, including whether the explanation fairly reflects the answer. |

## Input correction and interpretation

Input checking found that extra decision-window metadata mentioned some undisclosed future events, including later renal deterioration in J01 and a planned antidepressant switch in J02. That metadata had not been supplied to the answering models. We stopped further grading under that condition and rescored all 52 unchanged answers using only the supplied facts and task to establish the decision point. Other selected items retain their provisional references; D3a does not receive them. The website and current score table use this evidence-only condition for every answer.

All 164 completed initial item grades and their attempts remain saved. 44 paired labels differ after rescoring. Input correction and judge sampling variation both contribute, so this is not an isolated estimate of the correction’s effect.

## Feedback needed

Confirm the case-specific reference points and the concrete excerpts above. For D3c, establish what prioritisation, cost/yield and patient context are expected in these short or urgent tasks. For D6b, confirm which risks, contraindications and monitoring details are required when the task does not request a regimen. Then provide grades or corrections for the disputed examples. Candidate essential requests still need clinical confirmation for future interviews; they did not cap these written-task scores.

These are one-answer, single-judge comparisons. They do not establish a stable model ranking or test memorisation. The saved text supports checking the specific judgements without relying on a hidden final diagnosis.

[Full score matrix](FULLTEXT_13_RESULTS.md) · [All saved visible outputs, exact requests, failed attempts and usage](FULLTEXT_13_RAW_OUTPUT.txt) · [Scores and reasons as CSV](FULLTEXT_13_SCORES.csv) · [Design](FULLTEXT_13_DESIGN.md)
