# Case review: full rubric and optional research records

Case review now shows the full 22-item assessment only. The **Earlier selected items** switch is removed. Audit notices, batch updates and their output links sit inside the closed-by-default **Research history & complete outputs** disclosure below the case browser. Scoring notes are also optional disclosures. A failed full-review request offers Retry; it never substitutes historical partial grades.

## Files synchronised

The source matches the published Cases and CaseModelResults components. Only the styles for this change were added; unrelated article-extraction changes were not included.

The catalogue and its supporting public result files now match the published **135 cases: 78 earlier tasks and 57 complex BMJ cases**. Every case has a 22-item profile. This synchronises saved output; it makes no new generation or scoring calls.

[Data manifest and original files](../../study-data/case-review-before-20261113/MANIFEST.json) preserve the previous versions of all 83 updated data files. Existing successful answers and numerical grades are unchanged. Newly available answers, completed omissions and audited applicability labels come from the already published result snapshot. Original full research archives remain in the repository.

## Verification

The repository build, 201 Python tests and 57 JavaScript tests passed, including four Sites packaging tests. Ruff and formatting checks passed. Preservation checks cover every pre-existing public/result archive file, including all 345 previous complete answers and 6,342 numerical grades. See [GitHub validation](github-validation.json).

[Original publication checks](VALIDATION.json) and screenshots record C01 and BN13, opening a score and its linked evidence, reading the collapsed audit report, and recovery from a deliberately missing preview-only result file. No real workspace data was changed by that failure check. [Publication receipt](deployment.json) records successful Site version 44.

Clinical references and candidate requirements remain **awaiting confirmation**. Automatic evidence links remain **awaiting review**. Private accounts, credentials, annotations, preview data and deployment archives are excluded.
