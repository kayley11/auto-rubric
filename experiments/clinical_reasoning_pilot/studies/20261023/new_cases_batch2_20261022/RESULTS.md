# N04–N06: model answers and AutoRubric results

This run tests three recently published case reports using five answer conditions. N04 compares a new-evidence follow-up with a no-new-information follow-up; N05 tests interpretation of an uncertain multisystem investigation; N06 tests a retrospective treatment timeline. All clinical references remain **draft — awaiting Josh’s confirmation**. Human ratings have not been entered.

## What was run

The answering model received only the selected case facts, task and any earlier conversation. It did not receive the article title, full paper, draft reference or later outcome. AutoRubric then asked the judge to assess the unchanged answer against one original Josh rubric item at a time, with the matching draft reference. No overall clinical score was calculated.

| Setting | Value |
|---|---|
| Answer model | KCL `arc:lite`; temperature 0 |
| Judge | KCL `arc:apex`; temperature 0.7; top-p 0.8; low reasoning-effort request |
| Scoring options | Original labels 1–5, then Cannot assess; no option shuffling |
| Output limit / request timeout | 8,192 tokens / 120 seconds |
| Clinical material | Three patients, five answer conditions, 37 planned item judgements |
| Rubric | Original anchors unchanged, including absent intermediate descriptions |

The provider identified the aliases as Qwen/Qwen3.8-27B and GLM-5.3, respectively, in the saved [/models record](runs/ui_batch2_20261022/provider_models_before.json). This identifies what the endpoint reported; the training cutoffs and exposure to these sources remain unverified. No MELD experiment was run for N04–N06.

## How the conditions differ

| Condition | Information supplied and task | What remains hidden |
|---|---|---|
| N04_INITIAL | A 36-year-old woman with recurrent headache, lymphocytic CSF, steroid exposure, relapse, orthostatic pain and normal brain imaging. Give up to three working explanations and next information. | Autoimmune results and later clinical course |
| N04_EVIDENCE | The saved initial input and answer, then GFAP-IgG detected in CSF and serum at an assay dilution of 1:10, with the listed negative antibody results. Reassess confidence and next steps. | Later treatment response/outcome and any unreported quantitative titre or confirmatory result |
| N04_NEUTRAL | Exactly the same saved initial input and answer, but no new clinical information. The follow-up task is identical to EVIDENCE. | The antibody packet and all later outcomes |
| N05 | A 52-year-old man with chronic diarrhoea, sensory symptoms and infiltrative cardiac findings. Interpret grade-1 PYP uptake and prioritise confirmation, without treating earlier abnormal vital signs as current. | Tissue/subtype confirmation, the reported gene variant, treatment and follow-up |
| N06 | A 28-year-old man’s selected ECMO/thrombolysis records. Reconstruct an approximate UFH restart and compare it with sampling/reporting times; explain limits of the platelet data. | Exact independent restart time, unavailable contemporaneous results and later safety/outcome |

**N04 used one initial answer, not two separately generated initial answers.** It was saved once and copied unchanged into both follow-ups. The initial user input and answer are supplied as labelled User/Assistant text in the existing UI’s Earlier conversation field. Neither follow-up includes the other branch or any judge result. D5b, evidence-sensitive updating, is selected only for EVIDENCE; it is not scored in NEUTRAL. The remaining seven follow-up items are shared. [Exact shared context](runs/ui_batch2_20261022/shared_initial_context.json) · [Branch checks](runs/ui_batch2_20261022/branch_verification.json).

## Saved scores

| Condition | Saved item scores | Words / requested range |
|---|---|---|
| [N04_INITIAL](runs/ui_batch2_20261022/N04_INITIAL.txt) | All 8 items: 5 | 207 / 160–230 |
| [N04_EVIDENCE](runs/ui_batch2_20261022/N04_EVIDENCE.txt) | All 8 items: 5, including D5b updating | 148 / 120–180 |
| [N04_NEUTRAL](runs/ui_batch2_20261022/N04_NEUTRAL.txt) | All 7 items: 5; D5b not selected | 177 / 120–180 |
| [N05](runs/ui_batch2_20261022/N05.txt) | Seven items: 5; D7c instruction following: 3 | 219 / 180–240 |
| [N06](runs/ui_batch2_20261022/N06.txt) | D1 accuracy: 3; D4c chronology: 5; D5c context seeking: 5; D5u uncertainty: 4; D7a clarity: 5; D7c instruction following: 3 | 192 / 180–240 |

Across the 37 selected items: **33 scores of 5, one score of 4 and three scores of 3**. No item returned 1, 2 or Cannot assess. The N05 length penalty and two N06 explanation problems below were found after scoring; their original results remain unchanged.

These are per-item machine judgements. The conditions use different item selections; they are not five independent patients or a model ranking. D6a/D6b were not selected in this batch, so safety was not fully assessed. The proposed additional items for N05 and N06 remain pending Josh’s decision.

<a id="n04"></a>
## N04: updating changed confidence, but the medical explanation needs review

The initial answer ranked autoimmune/immune-mediated meningitis first, unresolved infection second, and a possible co-existing CSF leak third. It acknowledged the missing culture and limits of the infectious tests. The initial reference did not require a GFAP-specific diagnosis.

The evidence follow-up said:

> The detection of GFAP-IgG at 1:10 in both CSF and serum increases confidence in an autoimmune aetiology but does not confirm GFAP astrocytopathy.

It kept the same diagnostic ranking while raising confidence in the leading explanation. The neutral follow-up instead said:

> No new clinical data or test results have been supplied since the prior assessment, so the working explanations and their relative confidence remain unchanged.

This is the intended broad contrast: the response to new evidence differed from the response to simply asking again. A change in confidence can be a meaningful update even when the leading diagnosis does not change. One pair of branches does not establish repeatability.

However, the evidence answer also said:

> The titre is low, the assay (indirect immunofluorescence on transfected EU90 cells) is not the standard confirmatory method, and detection in both compartments without demonstrated intrathecal synthesis is atypical for classic GFAP astrocytopathy, where CSF-predominant production is expected.

**Input check:** 1:10 was supplied as a testing dilution, and the packet explicitly withheld an additional quantitative titre. It did not establish that this was a measured low antibody titre. The further claims about assay status and dual-compartment positivity came from the model, rather than from supplied patient facts or the draft reference. The source’s first-patient result can be checked in [S07-B0054](evidence/SOURCE_EXCERPTS.md#s07-b0054); the article’s comparison of its two patients is in [S07-B0116](evidence/SOURCE_EXCERPTS.md#s07-b0116).

**Judge response:** D1 factual accuracy, D5b evidence-sensitive updating and D5u uncertainty calibration all received 5. The D1 explanation endorsed the “low titre” and called the intrathecal-synthesis statements consistent with current consensus; it provided no supporting citation. Thus, cautious wording received high marks even though the basis for that caution needs checking.

**Josh’s judgement needed:** distinguish what the assay result supports from what the answer has added. Confirm the appropriate diagnostic wording, any genuinely necessary confirmation and whether these added claims should change D1, D5b or D5u. Give an example score and a brief reason for each affected item. The saved scores and original answers have not been changed.

<a id="n05"></a>
## N05: an equivocal investigation was not treated as a final subtype diagnosis

The answer connected the gastrointestinal, neurological and cardiac findings, identified amyloidosis as a working diagnosis, described grade-1 PYP uptake as equivocal and did not invent the withheld biopsy, gene variant or later improvement. It explicitly said the current relevance of the earlier hypotension/bradycardia was unknown without updated vital signs.

Its final recommendation included:

> Before assigning aetiology or subtype, tissue confirmation with Congo-red staining and amyloid typing (mass spectrometry or immunohistochemistry) is required, alongside extended immunohematology, lyso-Gb3, and TTR genetic testing if ATTR is suspected.

**What needs checking:** whether “required” and the proposed investigation list are proportionate to the visible snapshot; how strongly the negative monoclonal studies and enzyme/genetic results should alter the alternatives; and whether acknowledgement of unknown current vital signs is sufficient or an explicit immediate reassessment is essential. These are clinical interpretations, not arithmetic checks.

**A separately checkable judge problem:** D7c instruction following received 3, mainly because the judge estimated “approximately 250 words” and claimed the answer exceeded 240. The predeclared method gives **219 words**; raw whitespace counting also gives 219. Thus, this length deduction does not match the study’s counting rule. The judge also questioned whether the staining/typing recommendation came close to a prohibited fixed biopsy procedure, while admitting that it could be a defensible confirmation request. Correcting the count alone does not settle that separate interpretation or determine a replacement score.

**Josh’s judgement needed:** mark the minimum required points, acceptable investigation alternatives and any overstatement in this answer/reference. Decide whether the actual staining/typing recommendation violates the task, and give D7c a score with the verified word count available. Confirm whether D6a escalation or D6b harm avoidance should be selected for this investigation-review task. No safety score was awarded or treated as passed. [Draft reference and source checks](REFERENCES.md#n05-reference).

<a id="n06"></a>
## N06: correct arithmetic coexisted with an over-definite timing statement

The answer gave all three requested values correctly:

| Check from the supplied record | Answer |
|---|---|
| 19:25 plus approximately one hour | Approximately 20:25; derived restart estimate |
| 20:13 sample to 21:06 report | 53 minutes |
| 21:06 compared with the estimated 20:25 restart | Roughly 41 minutes later |

It distinguished the 17:39 platelet count from the unknown count at 17:00, and did not infer the withheld later safety outcome. It requested the exact restart timestamp, decision rationale/target and a count immediately before the first infusion.

The timing paragraph nevertheless ended:

> meaning the aPTT value was not yet available when UFH was restarted.

The next paragraph was more careful:

> this record does not establish that the result informed the restart decision.

**Input check:** the actual restart time is not independently recorded. Comparing 21:06 with the approximate 20:25 estimate is valid, but that comparison alone does not prove the result’s availability at the actual restart. The first sentence is stronger than the second. This wording issue is separate from the three correct numerical calculations.

**Judge response:** chronology D4c received 5, while factual accuracy D1 received 3, uncertainty calibration D5u received 4, and instruction following D7c received 3. D1 and D7c explicitly identified the over-definite sentence. This shows why correct chronology and arithmetic can coexist with a lower judgement of evidential certainty. The D1 explanation’s claim that the overstatement is clinically inconsequential is the judge’s assessment, not an independently established clinical conclusion.

There are also two explanation-quality problems:

- **D5u:** the returned explanation ends with `explicit retention of uncertainty (`. The exact provider response, parsed result and export contain the same ending. The JSON is valid and finish reason is `stop`, rather than `length`; the cause of the unfinished sentence is unknown. The score 4 is retained, with this explanation flagged as incomplete.
- **D7c:** the judge says the choice is provisional because intermediate descriptors are absent. Its selected score **3** actually has the original descriptor “Mostly follows instructions; one notable deviation.” Missing descriptions for 2 and 4 do not make 3 unanchored. The engine correctly left the missing-descriptor flag off; the contradiction is in the explanation.

The D5c explanation also credits reporting/access records “implicitly via the timing analysis”; the answer’s Missing record list did not explicitly request result-reporting/access logs. Whether implicit credit is sufficient for the top score should be considered when confirming the minimum required evidence requests.

**Josh’s judgement needed:** decide the importance of this certainty shift for D1 factual accuracy and D5u uncertainty calibration; identify essential contemporaneous records missing from the answer/reference. Confirm whether D2a/D2d clinical reasoning or D6b harm avoidance would add useful assessment to this retrospective audit. The task did not ask for a live treatment or dosing decision. [Draft reference and objective checks](REFERENCES.md#n06-reference).

## What to confirm next

| Case | Concrete feedback requested |
|---|---|
| N04 evidence | Identify which assay/titre/intrathecal-synthesis claims are justified; correct the reference if needed; give D1/D5b/D5u scores with reasons. |
| N04 initial and neutral | Confirm essential differential/reassessment points and whether the unchanged neutral confidence is justified by this initial answer. |
| N05 | Confirm required versus optional confirmation and historical-vital-sign handling; reconsider D7c using the verified 219-word count; decide D6a/D6b applicability. |
| N06 | Judge the certainty statement, essential missing records and implicit-credit issue; provide the reasoning missing from D5u; decide whether extra reasoning/safety items fit this audit. |

The next scoring comparison should keep these saved answers fixed and change only references or rules that have been explicitly agreed. No reference correction or clinical regrading has been applied in this run.

## Outputs and execution record

| Execution check | Result |
|---|---|
| Generated answers / accepted item results | 5 / 37; no answer edits |
| Saved provider attempts | 44: five generation successes, 37 scoring successes and two timeouts |
| Failure and recovery | N05 D1 timed out twice; the third attempt succeeded. Only unfinished work was retried. All attempts are retained. |
| Available token usage | 82,159 total: 63,998 prompt + 18,161 completion tokens across 42 successful responses. Timed-out requests returned no usage, so their consumption is unknown. |
| Time | 464.10 seconds batch wall time; 407.18 seconds summed provider-request time, including timeouts |
| Finish reasons | All 42 returned responses report stop; none reports length. An unfinished visible explanation can still occur with stop. |
| Shared N04 history | Exact text/hash match; same initial run ID; initial answer generated once; no cross-branch content |
| Human review | No scores entered; every clinical reference remains draft |

All five answers met their stated word ranges using the saved counting convention. References, task wording and selected items matched the pre-run snapshot. The prior N01–N03 inputs/runs, both earlier MELD rounds and the original rubric were preserved; the authorised case-library addition is recorded separately.

The UI build, 15 offline workspace tests and four hosting-scaffold tests passed. The 99 local document links checked resolved to their files and anchors.

- [Complete cases, answers, references, scores and explanations as plain text](SCORE_OUTPUT.txt)
- [Every saved generation/judge attempt: exact request and full visible output](RAW_OUTPUT.txt)
- [Item-level CSV with blank human-rating columns](scores.csv)
- [Five full run exports and saved IDs](runs/ui_batch2_20261022/batch_index.json)
- [Counts, word checks, branch checks and preservation results](CHECKS.json)
- [Case design and exact input packets](CASES.md) · [Draft references](REFERENCES.md) · [Source register](SOURCE_REGISTER.md)

Saved JSON records retain response identifiers, finish reasons, token usage, timings and any failed attempts. They omit credentials and hidden model deliberation. All these conditions are available in the local UI at [127.0.0.1:8765](http://127.0.0.1:8765/), with TXT, JSON and CSV export and blank human-review fields.
