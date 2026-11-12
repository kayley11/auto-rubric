# Scoring evidence and Recogito validation

Clinical references and information requirements: **awaiting confirmation**. Automatic quotation links: **awaiting review**.

## What changed

Saved score details now connect the judge reason, quoted answer text and the exact saved rubric definition/grade anchors. Recogito supports automatic quotation highlights and manual reviewer selections. Notes are stored in the protected workspace as separate immutable revisions. No answer generation or rubric scoring was run for this update.

The feature is included in the deployed website's version 43: [AutoRubric](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases/JA09). The GitHub integration retains the repository's existing main-branch fixes and earlier results.

## Saved cases checked

[C01](../../public/full-rubric-review/C01.json), [B03](../../public/full-rubric-review/B03.json) and [JA09](../../public/full-rubric-review/JA09.json) are identical in the tested website and this repository. Across their 330 saved item records, 182 quoted passages had unique literal matches and 122 had no literal match. These are quotation-location counts, not clinical accuracy or completeness measures.

- C01: a literal quotation can be highlighted, annotated and reopened. An elided quotation is marked as not located verbatim.
- B03: the saved temporal statement is located without changing its wording or earlier grade.
- JA09: the live website shows a literal quotation and an unmatched paraphrase separately. A UI_TEST note was saved and recovered; it remains awaiting review and makes no clinical judgement.

## Evidence

- [All checked quotation links and saved item grades](three-case-link-checks.json)
- [Browser checks](browser-checks.json) and [live screenshot](live-evidence-link.png)
- [Original feature checks](final-checks.json) and [protected backend checks](backend-refresh-checks.json)
- [Deployment and local record-preservation checks](publication-checks.json)
- Fresh-checkout test and upload-scan results are recorded in `github-validation.json` and `github-upload-checks.json`.

Private notes, article sources, login configuration, API keys and deployment archives remain on the host computer. Existing case/result files and complete historical outputs are retained. The optional unpublished layout draft is outside this update.

Fresh-checkout validation passed: 198 workspace Python tests, 57 JavaScript tests, the 4 Sites packaging checks, the frontend build and both repository-wide Ruff checks. All 4,036 pre-existing result/archive files remain byte-identical. No clinical case, score, reference or historical output was changed.
