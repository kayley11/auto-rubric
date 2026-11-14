# Gemma 4 31B results — 14 November 2026

All 135 research tasks now have a complete Gemma output and a saved 22-item automated assessment. Gemma produced the answers through Google's free API; arc:apex / GLM-5.3 assessed them using the saved Full rubric and scoring context.

There are 2,553 numerical item grades, 247 not-applicable positions, 162 applicability decisions awaiting confirmation and 8 indeterminate assessments. No Gemma answer or automatic scoring operation remains unfinished.

| File | Contents |
|---|---|
| [FINDINGS.md](FINDINGS.md) | Method, coverage, technical checks and per-case status |
| [ALL_ITEM_RESULTS.csv](ALL_ITEM_RESULTS.csv) | All 2,970 item positions, scores, reasons and statuses |
| [RESULTS_BY_CASE.csv](RESULTS_BY_CASE.csv) | One row per case, including original format and API transport |
| [FULL_VISIBLE_OUTPUTS.md](FULL_VISIBLE_OUTPUTS.md) | Readable case inputs, answers and item-level assessments |
| [FULL_OUTPUTS.zip](FULL_OUTPUTS.zip) | Exact requests, received responses, attempts, fixed inputs, answers, all grading returns and validation evidence |
| [VALIDATION.json](VALIDATION.json) | Input, output, preservation and credential checks |
| [SITE_PUBLICATION.json](SITE_PUBLICATION.json) | Published version and website verification |

[Open the website](https://auto-rubric.kayley1026lzt.chatgpt.site/#cases). Choose a case, then click a score in **Gemma 4 31B · Google** to read its answer, rubric and saved judge reason.

Earlier answers, grades and raw records are retained. BN52's placeholder grading return is retained alongside its identical-input repair; its other valid item grades were unchanged. Clinical references and candidate information requirements remain **awaiting confirmation**.

The full archive includes researcher-only source and scoring snapshots. The public website contains the display copies. API keys and login passwords are excluded.

The run was prepared on 13 November and completed on 14 November. The ZIP contains the original grading return and the append-only BN52 repair. Its [file manifest](PACKAGE_MANIFEST.json) records SHA-256 hashes for all 3,810 captured files. The [execution notes](EXECUTION_NOTES_20261114.json) distinguish the scheduling actually used from the later queue-source improvement.

The previous website packets are preserved in [gemma-recovery-before-20261114](../gemma-recovery-before-20261114/MANIFEST.json). GitHub sync checks are in [validation](../../validation/20261114-gemma-recovery/README.md).
