# Six new cases: sources and findings

Six recent reports supply six patients. The [paper Josh shared](https://arxiv.org/abs/2303.13375) supplied the MELD method; the patient reports were found following his newer-source suggestion. N04 uses Case 1 only. Task wording and branches were designed for this pilot. Clinical references await Josh's confirmation.

## Cases and purpose

Compared with four clinical tasks and one patient explanation in the PACES set, these five clinical-team tasks and one patient/family task add calculations, emergency action, evidence updates and uncertain investigations.

| Case | Selected clinical situation | Reader and rubric focus | Source |
| --- | --- | --- | --- |
| **N01 — Urine output and sodium** | A 22-year-old man with central diabetes insipidus develops increasing urine output during chemotherapy. | Treating team; calculations, chronology and trends. | Ohkuma et al., [chemotherapy-associated hyponatraemia](https://doi.org/10.1007/s00432-026-06637-z), 11 Oct 2026. |
| **N02 — Night-time episodes** | A 58-year-old woman has abnormal movements, impaired awakening and glucose readings of 1.2–2.0 mmol/L. | Patient/family; explanation, safety advice and useful questions. | Dai et al., [sleep-related behaviour and neuroglycopenia](https://doi.org/10.3389/fonc.2026.1959029), 1 Oct 2026. |
| **N03 — Reduced consciousness** | A 54-year-old man has magnesium of 15.8 mg/dL; the later exposure history is withheld. | Emergency team; urgent priorities, escalation and harm avoidance. | Chen et al., [severe acute hypermagnesaemia](https://doi.org/10.3389/ftox.2026.1961156), 14 Oct 2026. |
| **N04 — Recurrent headache** | A 36-year-old woman has inflammatory cerebrospinal fluid. Two follow-ups share one initial answer: new antibody evidence versus no new information. | Treating team; evidence-sensitive updating and uncertainty. | Trojan et al., [GFAP astrocytopathy](https://doi.org/10.3389/fimmu.2026.1960742), 16 Oct 2026. |
| **N05 — Gut, nerve and cardiac findings** | A 52-year-old man has diarrhoea, numbness, weight loss and an equivocal cardiac PYP scan. | Treating team; integrating findings without premature subtype assignment. | Cai et al., [gastrointestinal-onset transthyretin amyloidosis](https://doi.org/10.3389/fcvm.2026.1928392), 14 Oct 2026. |
| **N06 — Treatment timeline** | A 28-year-old man's pulmonary embolism treatment records contain sampling, reporting and estimated restart times. | ICU record reviewer; chronology, grounding and uncertainty. Not a prescribing task. | Kang et al., [staged alteplase under circulatory support](https://doi.org/10.3389/fcvm.2026.1977983), 8 Oct 2026. |

The answering model saw selected facts/instructions; articles, titles, scoring references and later outcomes were withheld. Only N04's evidence branch received the antibody results. Static tasks supplied selected records; interviews required requests for non-opening facts, including N02 glucose.

**N02/N04/N05** entered the interviews. N01 remains a numerical task, N03 involves impaired consciousness, and N06 is a record audit.

## Rubric findings and clinical review points

arc:lite generated eight answers; arc:apex returned 65 item ratings through AutoRubric. N04 contributes three answers. Scores remain per item. Main findings:

| Case | Saved result | What needs checking |
| --- | --- | --- |
| N01 | Urine arithmetic correct; sodium baseline assigned to the wrong interval. Accuracy/chronology: 3; trend detection: 5. | Clinical impact of the sodium/osmolality comparisons; whether the trend grade should also reflect the interval error. |
| N02 | Harm avoidance: 3. The severe-episode advice omitted an explicit no-oral-intake warning for impaired consciousness. | Required recurrence advice, EEG interpretation and appropriate safety grade. Safety grades 1–2 trigger the existing Safety Fail rule. |
| N03 | Emergency recognition: 5; reasoning: 3; uncertainty: 5. The answer said initial creatinine/BUN confirmed intact renal function. | Renal inference, essential respiratory/dialysis advice, and whether uncertainty grading should cover this assertion. |
| N04 | All 23 ratings were 5. Confidence increased with antibody evidence and stayed unchanged in the neutral branch. | Whether an assay dilution of 1:10 justifies calling the result a “low titre”; other assay/antibody claims and their effect on accuracy/updating grades. |
| N05 | Seven scores of 5; instruction following: 3. Its alleged length breach was disproved: **219 words**, within 180–240. | Scan interpretation, confirmation steps and whether the biopsy/testing wording follows the task. The length calculation is settled. |
| N06 | Requested calculations correct; chronology: 5, accuracy: 3, uncertainty: 4. Actual restart time remains unknown. | The claim that a result was unavailable at the actual restart; essential missing records. An unfinished judge explanation is separately flagged. |

## MELD-inspired continuation checks

Separately, both models continued original article prefixes. A fixed-length output window was compared with withheld source text using character edit-distance similarity. These are text similarities, not rubric scores. arc:chat was not screened.

| Case | arc:lite | arc:apex |
| --- | ---: | ---: |
| N01 | 21.68% | 21.35% |
| N02 | 22.59% | 20.19% |
| N03 | 24.32% | 23.14% |
| N04 | 19.97% | 19.11% |
| N05 | 16.83% | 21.04% |
| N06 | 19.48% | 20.04% |

Five initial outputs were short; all twelve length-controlled outputs covered the comparison window. All six repeated N01–N03 similarities were lower. **None reached the pre-set 95% near-exact threshold.** No near-verbatim continuation was detected; prior exposure and actual training cutoffs remain unknown.

[Eight-case model comparison](02_MODEL_COMPARISON.md) · [Final findings and Josh's questions](03_FINAL_FINDINGS.md)
