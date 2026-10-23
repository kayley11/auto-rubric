# Do the models ask for the same information?

**The three models asked different questions and obtained different information. All three missed the available glucose record during the night-time-episode interview. Some other coverage differences came from the simulator's matching rules.**

## 1. What stayed the same

Each model completed one fresh interview on the same eight case backgrounds, with the same opening, fixed patient facts, information-release rules, six-question limit and final task. No new static answers were generated. Earlier runs are preserved separately.

The candidates were **arc:lite, arc:chat and arc:apex**: provider-reported backends Qwen3.8-27B, Qwen3.8-Flash-Next and GLM-5.3 respectively. Patient statements stayed fixed, ordered by arc:lite. **arc:apex scored every model**, using unchanged rubric anchors.

- **D5c — Context seeking:** assess the actual interview, with the full inventory available to the judge.
- **D3a — Problem representation:** assess the final clinical summary using only information obtained. The complete-case clinical reference was withheld from this grade, so hidden facts were not treated as already known.

Generation used temperature 0 and low reasoning effort; grading used temperature 0.7, top-p 0.8 and ascending score options.

## 2. What information was obtained

Each cell gives **complete groups obtained / groups available; information not fully obtained**. These researcher-prepared groups include opening information and are not a clinical checklist. An incomplete group may contain facts already partly known.

| Case | arc:lite | arc:chat | arc:apex |
| --- | --- | --- | --- |
| [C01 — Swelling and arthritis](case_outputs/C01.txt) | 4/4; complete | 4/4; complete | 4/4; complete |
| [C02 — Gait imbalance](case_outputs/C02.txt) | 5/5; complete | 2/5; earlier speech, visual/urinary episodes and recovery | 5/5; complete |
| [C03 — Bloody diarrhoea](case_outputs/C03.txt) | 5/6; travel | 6/6; complete | 5/6; antibiotic response |
| [C04 — Collapses](case_outputs/C04.txt) | 4/5; living alone | 2/5; prior infarction, pacemaker/check history, living alone | 2/5; prior infarction, pacemaker/check history, living alone |
| [C05 — Seizure explanation](case_outputs/C05.txt) | 1/4; occupation, CT, metabolic exclusion | 1/4; occupation, CT, metabolic exclusion | 3/4; occupation |
| [N02 — Night-time episodes](case_outputs/N02.txt) | 5/10; exact timing, morning recovery, glucose, medicines, daytime examination | 8/10; glucose, daytime examination | 9/10; glucose |
| [N04 — Recurrent headache](case_outputs/N04_INITIAL.txt) | 8/10; initial fever/headache, improvement/length of stay | 7/10; first examination/CT, steroids, improvement/length of stay | 6/10; initial fever/headache, first meningeal examination, readmission MRI/CSF |
| [N05 — Gut and cardiac findings](case_outputs/N05.txt) | 7/10; initial vital signs, cardiac MRI, pyrophosphate scan | 8/10; initial vital signs, cardiac MRI | 7/10; initial vital signs, cardiac MRI, pyrophosphate scan |

Totals were **39/54, 38/54 and 41/54 groups**, using **40, 40 and 47 question–reply turns**, respectively. These are information-return counts, not a model ranking. The matching issues below affect their interpretation.

## 3. What the rubric returned

Each cell is **D5c / D3a**. Scores are reported by item, with no combined total.

| Case | arc:lite | arc:chat | arc:apex |
| --- | --- | --- | --- |
| C01 | 5 / 5 | 5 / 5 | 5 / 5 |
| C02 | 4 / 5 | 5 / 5 | 5 / 5 |
| C03 | 5 / 5 | 5 / 5 | 5 / 5 |
| C04 | 5 / 5 | 5 / 5 | 5 / 5 |
| C05* | 4 / 5 | 4 / 4 | 4 / 5 |
| N02* | 4 / 5 | 4 / 4 | 4 / 5 |
| N04 | 5 / 5 | 5 / 5 | 5 / 5 |
| N05 | 5 / 5 | 5 / 5 | 5 / 5 |

* C05 and N02 retain patient-facing tasks without an explicit one-sentence-summary requirement. Their D3a assessments are exploratory.
* D5c has original descriptions for 1, 3 and 5 only. Its seven scores of 4 are provisional intermediate judgements. D3a has all five descriptions.

## 4. What explains the differences

**N02: a shared omission, with different final responses.** None requested glucose during the interview. arc:chat requested routine blood tests, but the fixed rules require a glucose request to release that record. arc:chat and arc:apex asked about glucose in their final replies, when no further patient response was possible. arc:lite wrote “No glucose measurements are available in your current records”; arc:chat wrote “No glucose measurements were recorded during these episodes”. The inventory contains those measurements: not obtaining them does not establish their absence.

All three received D5c=4. D3a was 5, 4 and 5 when assessed against obtained information. Missing a decisive record did **not** automatically produce a low problem-representation score under this setup.

**C04 and C05: different questions led to different information.** Only arc:lite asked the general medical-history question that retrieved C04's previous infarction and pacemaker history. Only arc:apex retrieved the CT and metabolic-exclusion records in C05. All three left occupation unasked during the interview. C04 nevertheless received D5c=5 from every model; whether the missing cardiac history should lower that score needs clinical/rubric review.

**C02: asked, but not returned.** arc:chat asked “have you had any similar episodes before?” Its tags omitted the previous-episodes category, so earlier neurological history was not returned. An offline routing check confirms that changing that tag would release it. This is not evidence that the model failed to think of asking.

**Some information was returned too broadly.** In C03, arc:chat's family-history question carried a previous-episodes tag and released the patient's earlier shin lesions. N04 exposed report-type and admission-scope mismatches; all three N05 TTR questions returned the broader GLA/enzyme record. These are matching limitations to fix technically, not clinical decisions for Josh. Actual dialogues and scores were not changed. [Exact questions and routing observations](ROUTING_AUDIT.json).

## 5. What Josh needs to decide

Clinical references remain draft. Please give a relevant item level and short reason, or correct a reference point.

- **Essential questions:** how should missing glucose in N02 and cardiac history in C04 affect D5c? Which information is required rather than optional?
- **Meaning of D3a:** should it assess the summary of obtained information, or the final representation of the complete case, including information the model failed to obtain? The current scores answer the former question.
- **Patient explanations and intermediate grades:** is implicit representation sufficient for C05/N02, and how should D5c=4 be applied when no original descriptor exists?

This is one run per model/case, with one stochastic machine judgement per item. The judge is also one candidate model; no independent clinician scores have been collected.

## Full output

The run saved 24 final answers, 48 ratings and 127 question–reply turns. Five answers breached their word limits and were retained unchanged. Reported usage was 481,810 tokens; one timed-out attempt has unknown usage. Provider-reported backend names matched before and after the run.

- [Complete plain-text inputs, conversations, answers, references, grades and visible returns](RAW_OUTPUT.txt).
- [All scores and reasons](ITEM_SCORES.csv) · [Information groups](FACT_COVERAGE.csv) · [Turns and word counts](COMPARISON.csv) · [Token use](TOKEN_USE.csv).
- [Frozen protocol](protocol.json) · [Verification records](CHECKS.json) · [Preserved earlier comparison](../patient_agent_revision_20261023/COMPARISON.md).
