# Three-model interviews after matching fixes

The known history, report-type and admission-matching errors were corrected. **Seven of 48 final item scores changed. Information obtained often changed without a change in score.**

## 1. Setup

“Before” is the [earlier three-model interview round](../patient_agent_models_20261023/COMPARISON.md). Each of **arc:lite, arc:chat and arc:apex** completed a fresh interview on the same eight cases, with a **maximum of six question–reply turns**. Case facts, openings, prompts, final tasks, rubric descriptions and parameters stayed unchanged. Clinical references remain drafts for Josh to check.

Patient replies used fixed facts; arc:lite could only order permitted statements. **arc:apex graded every model** through AutoRubric 1.5.3:

- **D5c — Context seeking:** the interview and saved assessment notes; the judge could see the complete inventory.
- **D3a — Problem representation:** the final answer against obtained information only; the complete-case reference was withheld.

Further checks identified extra C03/N04 matching problems. These cases were repeated for all three models; N04 was repeated again for date references. The final table uses the latest technical revision for each case. **All nine intermediate interviews are retained.** [Result sources](BEFORE_AFTER_INFORMATION.csv).

## 2. Matching repairs

| Case | What changed |
| --- | --- |
| C02 — Gait imbalance | Personal past-history questions retrieve earlier neurological episodes despite missing/wrong tags. Family-history questions do not retrieve the patient's own history. |
| C03 — Bloody diarrhoea | Family history does not release personal shin lesions. Travel/antibiotic requests are recognised. Narrow bowel questions do not release back stiffness or unrelated symptom details. |
| N04 — Recurrent headache | Report type and admission are matched separately. PCR alone does not retrieve CSF cell counts. Current medication is separated from previous treatment. The 11 March discharge date identifies the first admission. Unclear admission requests receive clarification. |
| N05 — Gut/cardiac findings | TTR requests do not return the unrelated GLA/enzyme record. Brain/spine MRI requests do not return cardiac MRI. Unavailable results are not reported as negative. |

[Offline checks](../patient_agent_models_matching_n04_dates_20261023/MATCHING_CHECKS.json) include the exact historical questions and nearby positive/negative examples.

## 3. Information obtained

Cells show **complete groups returned before → after**. The available number is beside each case. Groups include opening facts and are not a clinician-approved checklist. Old counts include the original matching errors; removing unwanted information can lower the count.

| Case · available groups | arc:lite | arc:chat | arc:apex |
| --- | --- | --- | --- |
| [C01 — Swelling and arthritis](case_outputs/C01.txt) · 4 | 4 → 4 | 4 → 4 | 4 → 4 |
| [C02 — Gait imbalance](case_outputs/C02.txt) · 5 | 5 → 5 | 2 → 5 | 5 → 5 |
| [C03 — Bloody diarrhoea](case_outputs/C03.txt) · 6 | 5 → 4 | 6 → 4 | 5 → 4 |
| [C04 — Collapses](case_outputs/C04.txt) · 5 | 4 → 4 | 2 → 2 | 2 → 2 |
| [C05 — Seizure explanation](case_outputs/C05.txt) · 4 | 1 → 2 | 1 → 4 | 3 → 3 |
| [N02 — Night-time episodes](case_outputs/N02.txt) · 10 | 5 → 7 | 8 → 8 | 9 → 9 |
| [N04 — Recurrent headache](case_outputs/N04_INITIAL.txt) · 10 | 8 → 5 | 7 → 6 | 6 → 6 |
| [N05 — Gut/cardiac findings](case_outputs/N05.txt) · 10 | 7 → 6 | 8 → 7 | 7 → 6 |

- **C02:** arc:chat obtained the earlier speech, visual/urinary episodes and recovery. Its old question also retrieves these in the repaired replay: the original omission was a matching failure, not proof it never thought to ask.
- **C03:** none obtained shin-lesion history. arc:chat/apex also missed back stiffness; arc:lite missed travel. Broad associated-symptom questions can elicit several facts, so counts do not mean each fact was separately requested.
- **N04:** arc:chat obtained readmission CSF at 178 cells/µL, separately from initial CSF at 183. arc:lite/apex did not obtain readmission CSF. The initial examination/CT group remained incomplete for all three.
- **N05:** removing the unrequested GLA/enzyme record explains each one-group reduction. arc:lite/apex asked about TTR and received no selected TTR result; arc:chat did not request genetic testing.
- **Unchanged cases also varied:** arc:chat obtained all four C05 groups. N02 arc:apex requested glucose in question six; arc:lite/chat did not. Its count stayed 9/10, but the missing group changed from glucose to daytime examination.

**Remaining technical limit:** N04 arc:apex asked for infection tests “on that admission”. The matcher requested an explicit admission rather than resolving the reference from earlier dialogue. This is an asked-but-not-returned record, not evidence that the model failed to consider infection testing.

Fresh interviews varied even where rules were unchanged. The counts alone therefore cannot isolate the matching repair's effect.

## 4. Rubric scores

Final ratings were **38 scores of 5 and 10 scores of 4**. These seven changed; the other 41 stayed the same:

| Case | Model | Item | Before → after |
| --- | --- | --- | --- |
| C02 | arc:lite | D5c | 4 → 5 |
| C03 | arc:lite, arc:apex | D5c | 5 → 4 each |
| C05 | arc:lite, arc:apex | D3a | 5 → 4 each |
| C05 | arc:chat | D5c and D3a | 4 → 5 each |

C04 still received D5c=5 from every model despite arc:chat/apex missing cardiac history. N02 received D5c=4 from all three, although only arc:apex obtained glucose. [All paired scores and full reasons](BEFORE_AFTER_SCORES.csv).

## 5. What Josh needs to decide

1. **Required information:** which C03 back/skin history, C04 cardiac history and N02 glucose information is essential? Correct the draft references and give a D5c level with a short reason for relevant omissions.
2. **D5c explanations:** must reasons be spoken to the patient, or can saved assessment notes count? C03 arc:chat received 5, citing “Timecourse and associated symptoms will help narrow the differential” from an assessment note. arc:lite received 4, with its judge explicitly rejecting assessment-only explanations. Apply one rule to these [C03 examples](case_outputs/C03.txt). Also clarify intermediate levels: D5c has original descriptions for 1, 3 and 5 only.
3. **D3a scope:** should it represent obtained information, or also penalise failure to obtain essential facts? Confirm applicability to patient-facing C05/N02, whose tasks do not explicitly require a separate summary sentence.

## Complete output

The final comparison contains **24 answers, 48 ratings and 131 question–reply turns**. C03 arc:apex exceeded its 350-word limit at 356 words and was retained unchanged. All new calls, including nine intermediate interviews, reported **711,045 tokens**; four timed-out attempts have unknown usage.

- [Complete plain-text conversations, answers, references, scores, reasons and visible returns — before, intermediate and final](RAW_OUTPUT.txt).
- [Information, omissions, turns and word counts](BEFORE_AFTER_INFORMATION.csv) · [Scores and reasons](BEFORE_AFTER_SCORES.csv) · [Comparison data and usage](BEFORE_AFTER.json).
- [Final matching code](../patient_agent_models_matching_n04_dates_20261023/matching.py.txt) · [Verification](FINAL_CHECKS.json).
