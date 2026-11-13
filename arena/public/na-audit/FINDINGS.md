# Omitted scores filled; N/A now has a task-specific basis

The 75 requested reasoning assessments are complete. The full-library audit found 95 further clear omissions, which were also assessed. Existing cases, tasks, clinical answers and earlier numerical grades are unchanged. Clinical references and candidate information requirements remain **awaiting confirmation**.

## 1. What was assessed

The audit covers all **135 published research cases/tasks**, containing **650 complete primary answers**. We checked every one of their **2,169 N/A cells**. A further **196 N/A cells in 72 separate saved generation calls** were checked separately; they are not extra cases. Workspace submissions and the separate Scheme 1/2 experiments are outside this scope.

For BN02, BN08, BN13, BN23 and BN30, five saved model/service answers per case had omitted D2b (coherence), D2c (efficiency) and D2d (completeness): **5 × 5 × 3 = 75**. Their exclusion reason was only that the items were not selected. The task already required clinical justifications, so these were omissions rather than N/A.

GLM-5.3 (`arc:apex`) assessed the unchanged answers using the saved Overleaf definitions and anchors (`overleaf-20261024-retrieved-20261104-full22`), temperature 0 and top-p 1. The judge was not given answering-model names, previous grades or the earlier N/A reasons. This was a new assessment of previously ungraded items, not a rerun of answer generation.

## 2. Backfill results

The requested 75 assessments returned **42 scores of 5, 31 of 4 and 2 of 3**. None was withheld as indeterminate. BN30’s Groq Qwen answer received 3 for coherence and completeness; the other grades were 4 or 5. The judge’s clinical expectations behind the completeness deduction still need confirmation.

The audit identified these further omissions:

| Case | Further items assessed | Item assessments |
|---|---|---:|
| BN02 | D3b, D3c | 10 |
| BN08 | D4a, D4c, D4d, D6b | 20 |
| BN09 | D4d | 5 |
| BN13 | D4a, D4b, D4c, D4d, D6b | 25 |
| BN21 | D4d | 5 |
| BN23 | D3b, D4a, D4c | 15 |
| J04 | D4c | 5 |
| SR04 | D4c | 5 |
| SR10 | D4d | 5 |

Across all **170 new assessments**, 108 returned 5, 43 returned 4, 19 returned 3, 0 returned 2 and 0 returned 1; 0 were indeterminate. These are automatic grades, not independent clinical ratings. [Every new grade and reason](BACKFILLED_ITEMS.csv).

## 3. What happened to the original N/A cells

| Finding | Primary-answer cells | Current website label |
|---|---:|---|
| No assessment opportunity established by the task/protocol | 1,209 | N/A |
| Clear omitted assessment | 170 | New numerical grade |
| Clinical or rule boundary unresolved | 790 | Awaiting confirmation |

**These are item cells, not patients.** The same unresolved case–item decision can affect several model answers. There are 443 distinct case–item scope checks: 247 task-based N/A decisions, 34 omitted case–item assessments and 162 awaiting confirmation. The separate generation calls contain 104 task-based N/A cells and 92 awaiting confirmation.

An automated case/task audit supplied suggestions; we checked them against the original task and applied explicit documentary rules. A model suggestion was not accepted as clinical confirmation. In particular, a long patient timeline was not automatically counted as a model belief update. Historical question-and-answer tasks were identified from their original execution protocol and saved turns, rather than a generic “written-record” display field.

| Example | What the check established | Result |
|---|---|---|
| All 135 tasks · D6c | No misleading follow-up or pressure-to-agree intervention was supplied. Cooperative historical questions do not create that test. | Retain N/A. |
| BN13 · D4b/D4c/D4d | Earlier/later thyroid values and imaging indices, relative event order and unchanged neurological symptoms are already visible. Exact calendar dates and future drainage outcomes are unnecessary for those checks. | Backfill the omitted assessments. |
| BN09/BN21 · D4d | Persistent post-resuscitation instability, or partially improved systemic illness with ocular deterioration, is available before the hidden outcome. | Backfill the supplied trajectory assessment. |
| BN49 · D6a | Whether this review requires a time-critical escalation judgement is a clinical scope question. | Awaiting confirmation, rather than an asserted N/A. |
| BN13/BN23/BN30/BN32 · D3d | A causal claim can be assessable even when no final causal diagnosis was provided. | Check the task and each answer; awaiting confirmation. |

## 4. Decisions still needed

| Issue | Examples | Specific confirmation needed |
|---|---|---|
| Emergency recognition · D6a | BN49, B01, N04 and the other listed patient-specific exclusions | Is urgency/care level part of this exact decision point? If so, define the required timing and acceptable escalation routes. |
| Belief updating · D5b | B05, BN01 and other fixed written packets with prior/later findings | Which tasks make an actual change in diagnostic or management judgement observable? A timeline and a single final synthesis do not automatically establish this. |
| Temporal scope · D4 | BN08/BN21 D4b; JA04 D4a; BN30 D4c/D4d | Distinguish symptom progression from a measured trend, meaningful temporal boundaries from generic grounding instructions, and minimal history from a trajectory. |
| Synthesis, test selection and harm avoidance | B18/N06 D3a; B15/N03 D3c; N05 D6b | Confirm the assessment opportunity using the original audience, task and actual advice; do not add a clinician-style one-liner or prescription requirement retrospectively. |
| Clinical expectations in a new grade | BN30 · Groq Qwen · D2d | The judge treats consideration of a named unifying diagnosis as necessary. Is that requirement justified by the presentation and task, without hindsight from the hidden outcome? |

We also checked the new judge excerpts against the saved answers. **45 of 170** were not literal matches after whitespace normalisation. They may be shortened, reformatted or paraphrased; their original text and grades are retained and flagged. This check does not establish that the clinical conclusion is wrong. [Excerpt checks](QUOTE_CHECKS.json).

## 5. Website and evidence

The current case tables distinguish **N/A**, **Awaiting confirmation**, **Cannot assess** and missing/provider-failed answers. New grades open their saved judge explanation. Audited cells also show the earlier N/A reason. Earlier numerical grades, unsuccessful attempts and separate saved generations remain available. No missing value was converted to zero.

[Open the case library](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases) · [All 135 cases and scope decisions](CASE_AUDIT.md) · [Every original N/A cell](ALL_NA_POSITIONS.csv) · [All new grades](BACKFILLED_ITEMS.csv) · [Complete prompts and visible returns](BACKFILL_OUTPUTS.md).

Complete local inputs, requests, responses, attempts and the pre-update website snapshot are retained in `FULL_OUTPUTS.zip`. [Verification](VALIDATION.json).
