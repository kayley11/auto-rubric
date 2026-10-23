# Patient interviews: results before and after revision

**The gait case now elicits the history it previously missed. Other interviews still miss available information, including travel history and low glucose readings.** Clinical references await Josh's confirmation. Both rounds and their full outputs are preserved.

## 1. What we tested

Earlier tasks supplied new history at a planned point and checked whether the model used it. Here we ask: **will the model think to ask for that information?**

Eight case backgrounds were tested in two conditions:

- **Static:** all selected facts are supplied immediately.
- **Interview:** a short opening, followed by up to six questions. Only matching facts from a fixed record are returned; the hidden inventory is not shown.

Both use the same final task. The interview's final answer uses the opening and actual conversation, without earlier working assessments. Patient statements, family observations and reports remain separate. No new tests are performed.

**arc:lite** generates questions/answers; **arc:apex** grades through AutoRubric using Josh's rubric. C05 addresses the patient, N02 the patient/family, and the other six clinicians.

## 2. What we corrected

| First-round problem | Revision |
| --- | --- |
| Similar questions received the same limited reply. | Explicit feedback identifies unavailable details and prompts a change of direction. A repetition guard was available but not needed. |
| Broad requests released many unrelated tests. | Return requested investigation types only, at most two reports per turn. |
| Admission/time context was lost. | Retain date/admission labels; distinguish historical observations from the current consultation. |
| Basic information differed between conditions. | Match available age/sex and consultation context. C04 explicitly links the dose increase to the collapses; an unknown pacemaker-check result stays unknown. |

## 3. Results

Counts show prepared information groups returned, including the opening. They are not diagnosis scores or an approved clinical checklist. Later publication outcomes remain hidden.

| Case | First → revised | Revised interview result |
| --- | --- | --- |
| [C01 — Swelling and rheumatoid arthritis](case_outputs/C01.txt) | 3/4 → 4/4 | Obtains symptoms, medicines and poor diuretic response. The extra group restores the adult descriptor; rheumatoid arthritis was already obtained. |
| [C02 — Gait imbalance](case_outputs/C02.txt) | 1/5 → 5/5 | By question 2, obtains the heat trigger, earlier speech, visual/urinary symptoms and their resolution. |
| [C03 — Bloody diarrhoea](case_outputs/C03.txt) | 5/6 → 5/6 | Obtains back stiffness, shin lesions and poor antibiotic response; misses travel. |
| [C04 — Collapses after a dose increase](case_outputs/C04.txt) | 4/5 → 4/5 | Obtains previous myocardial infarction and pacemaker history; misses living alone. |
| [C05 — Seizure explanation](case_outputs/C05.txt) | 4/4 → 2/4 | Obtains seizure history and normal CT; misses metabolic exclusion and modelling career. |
| [N02 — Night-time unresponsiveness](case_outputs/N02.txt) | 10/10 → 8/10 | Misses recorded low glucose and the daytime neurological examination. |
| [N04 — Recurrent headache](case_outputs/N04_INITIAL.txt) | 10/10 → 8/10 | Retrieves correctly labelled admission/readmission results; misses the first examination and infection-testing record. |
| [N05 — Gut and cardiac findings](case_outputs/N05.txt) | 10/10 → 6/10 | Misses initial vital signs, cardiac MRI, enzyme/genetic results and the pyrophosphate scan. |

Overall coverage was **47/54 → 42/54 groups**, across **45 → 44 question–reply turns**. Removing broad report bundles makes the same six-turn budget more demanding; overall information coverage did not improve. The automated check found three near-identical repeats in round 1 and none in the revision.

**N02 shows the consequence of missing information.** The static answer sees glucose around 2.0 mmol/L at home and 1.2–2.0 mmol/L in hospital, and highlights hypoglycaemia. The interview never requests glucose, favours parasomnia, and says no glucose measurements are available in the records. Information not obtained is being presented as information not existing.

### Rubric scores

Selected scores are **first round → revised**. D1 assesses factual accuracy; D5c assesses interview information gathering. There is no combined score.

| Case | Final-answer accuracy: D1 | Information gathering: D5c |
| --- | --- | --- |
| C02 | 4 → 5 | 3 → 5 |
| C03 | 5 → 5 | 4 → 5 |
| N02 | 5 → 2 | 5 → 4 |
| N04 | 3 → 5 | 5 → 5 |

- **C03:** accuracy is 5 despite calling painful shin lesions “a history of erythema nodosum”; information gathering is 5 despite missing travel.
- **N02:** accuracy is 2, completeness 1 and harm avoidance 2, triggering the existing Safety Fail rule. Some explanations treat hidden glucose readings as already obtained, although the task refers to “any glucose measurements obtained”. This grading-scope issue is separate from the answer's unsupported absence claim.
- **N04:** accuracy is 5 despite “three days after completing IV dexamethasone”. Three days separate discharge and readmission; the steroid completion date is unknown. The audience-calibration explanation also ends mid-sentence in the raw return.

The revised run saved **16 final answers, 108 final-answer ratings and 24 dialogue ratings**. All final answers meet their word limits. No answer or grade was replaced because of poor quality or a low score.

## 4. What needs Josh's judgement

For each case, identify required/optional reference points or corrections, and give a relevant item score with a short reason.

| Case | Specific question |
| --- | --- |
| C01 | Are the diuretic/hypoalbuminaemia explanation and advice about non-steroidal anti-inflammatory medicines appropriate? |
| C02 | Does “progressive” overstate the supplied description of recent gait imbalance? |
| C03 | Should the skin diagnosis remain conditional? Are the related inflammatory bowel disease formulations adequate alternatives? Is travel essential to ask about? |
| C04 | Is same-week review with stated same-day escalation sufficient given the cardiac history? Is living/support information essential? |
| C05 | Is “two unprovoked seizures” justified? Check driving/safety advice and the relevance of occupation. |
| N02 | How early should glucose be sought? Is the parasomnia confidence justified? Confirm recurrence advice, the no-oral-intake warning and safety grading. |
| N04 | How should the unsupported steroid interval affect accuracy? Is the prioritisation before antibody results appropriate? |
| N05 | Check the confirmation sequence, the claim that gut findings are incidental, and whether biopsy/testing advice follows the task. |

**Shared rule:** distinguish answer quality given the information obtained from failure to obtain essential information. N02's explanations partly mix these. Clarify intermediate levels without original descriptions, including its D5c score of 4.

**Cross-model question:** only arc:lite has completed these interviews. N02 was not scored on D3a (Problem Representation). Other models' questions and their D3a results remain to be compared using the same facts, question budget and judge.

## 5. Cost and records

| Round | Reported generation + grading tokens | Saved request time |
| --- | --- | --- |
| First | 468,467 | 31.1 min |
| Revised | 507,938 | 25.7 min |

Totals include reported reasoning and unsuccessful attempts. Eight first-round and four revised attempts lack usage, so totals are lower bounds. Separate development/preflight calls reported another 540,872 tokens.

These are single runs on development cases, with several changes made together. They do not isolate each fix's effect or establish reduced training exposure. MELD remains separate.

- [Complete revised inputs, conversations, answers, references, scores and API returns](RAW_OUTPUT.txt).
- [All scores and explanations](ITEM_SCORES.csv) · [Information obtained/missed](FACT_COVERAGE.csv) · [Token breakdown](TOKEN_USE.csv) · [Settings](protocol.json).
- [Preserved first-round report](../patient_agent_pilot_20261023/COMPARISON.md) · [First-round full output](../patient_agent_pilot_20261023/RAW_OUTPUT.txt).
