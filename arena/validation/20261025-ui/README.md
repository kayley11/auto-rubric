# Website update — 25 October 2026

The local workspace now connects the latest results, their evidence and the review process. Existing experimental records are retained.

## What changed

| Area | What is available |
| --- | --- |
| Latest results | The 25 October N04 saved/fresh comparison, all three repeated D3a/D5c grades and their original explanations. The 23–24 October eight-case comparison remains selectable. |
| Evidence | Candidate requirement, actual question, returned patient information or clinical record, and saved judgement can be inspected together. Question links open the corresponding reply. Admission context is retained. |
| Clinical decisions | Essential/helpful/not-needed, acceptable alternatives, deadline, reviewer and reason are saved separately. Copying a reviewed checklist creates a new evaluation; historical inputs stay unchanged. |
| Independent review | Model names, machine grades and explanations are hidden. D3a is saved before examiner-only D5c material opens; both ratings are saved before revealing results. Previous score/model exposure is recorded. |
| Patient interviews | Eight prepared cases, a choice of clinician and judge, original/proposed rules and up to six questions. The controller returns fixed statements and separately labelled records. Completed turns survive stop/resume. Final answers, obtained/missing facts and D3a/D5c results are saved. |
| Exports | A readable review summary, a blank sheet without machine results or model identity, and complete raw output. Saved human ratings and clinical decisions accompany summary exports; live-run raw exports retain their review history. |

## Verification

- **949 Python tests passed**, including 68 local-workspace tests. These cover all eight interview cases, evidence separation, review gates, decision copying, export contents and stop/resume.
- Frontend build, four Sites packaging tests, lint, formatting and whitespace checks passed.
- Browser checks covered batch switching, question links, clinical-decision saving/copying, independent rating/reveal, the live interview and evidence coverage. No browser errors were recorded.
- Form tests used the name **UI validation (test)** in a separate local validation directory. No clinical decisions or human grades were entered in the main workspace.
- All **11 pre-existing local runs**, the committed historical study snapshot, **34 historical output files** and **three follow-up output files** passed preservation/integrity checks.

The 26 October sync check passed **950 tests**, including 69 workspace tests. GitHub's Windows/Python 3.11 check exposed a locale-dependent decoding error; case imports and review files now explicitly use UTF-8. A regression test simulates a cp1252 default and verifies unchanged case text and a Unicode reviewer-name round trip. Archived experiment outputs are unchanged.

## Real interface run

N04 was run through the patient-interview interface with **arc:lite** as clinician and **arc:apex** as judge. It completed six questions and one final answer, followed by **D5c = 2** and **D3a = 5**. The D5c explanation identified missing readmission-report and targeted infection requests. The D3a explanation credited the synthesis of information actually obtained.

The first question attempt returned malformed JSON. Its response and error were retained. Explicit JSON output was then enforced, and the saved run completed after retry. Nine generation attempts and two scoring calls reported **28,211 tokens** and **44.46 seconds** of API time, including the failed format attempt.

This run is labelled **UI validation** in Recent evaluations and is separate from the saved cross-model study. Its ID is `09d7e92b432f4539ac111c26f9f5f0c2`; open it to inspect or export the complete record.

- [Complete N04 validation record](new-patient-interview-n04.json): starting information, fixed-fact case snapshot, prompts, actual requests and replies, public notes, final answer, original responses, errors, grading payloads and usage.
- [Complete raw output as plain text](new-patient-interview-n04-raw.txt).
- [Verification and output hashes](verification.json).
- [N04 comparison: complete research output](../../study-data/followup-output.txt), [scores and explanations](../../study-data/followup-scores.csv) and [findings](../../study-data/followup-findings.md). These are separate from the interface validation run.

The eight fixed-fact inventories match the [previously published study snapshot](../../study-data/interviews.json). The validation adds a model-generated interview and grades using the same N04 inventory; it adds no new private patient record. Test-only human reviews and local credentials are excluded from the shared files.

## Clinical review still needed

References and essential-information requirements remain candidates awaiting Josh. In particular, whether a general CSF request satisfies N04 infection seeking remains unresolved: the saved repeated grades of **2, 2, 5** are displayed unchanged. The interface records a reviewer’s decision; it does not decide clinical equivalence or replace an expert grade.

Screenshots: [latest results](01-latest-study.png) · [independent review](02-independent-review.png) · [live interview](03-live-interview.png).
