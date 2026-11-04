# Full-rubric results on the website

Published version 30: https://auto-rubric.kayley1026lzt.chatgpt.site/#cases

Version 31 additionally supplies an initial blind-review page for all 345 public review-queue records. The 1,063-route snapshot was checked after publication; later evidence still follows the saved-rating gate. The item scores and frozen research outputs are unchanged. See [correction checks](snapshot-correction-checks.json) and [publication](snapshot-correction-deployment.json).

Case review defaults to **Full rubric · 4 Nov 2026**. **Earlier selected items** opens the original scoring condition. Each numerical score, N/A, evidence-insufficient result and missing-answer cell opens its saved explanation. Flags retain the original score and identify the output problem. The evidence dialog includes the unchanged answer, rubric anchors, candidate requirement checks, plain text and JSON; the case pane remains available on the right.

The exported packets contain 78 tasks, 345 complete answers, 6,342 numerical ratings, 1,225 N/A items, 23 indeterminate items and 2,706 item positions without a complete answer. The latter represent 123 case × service positions. Clinical references and information requirements remain **awaiting confirmation**.

Checks completed:

- All 10,296 public item positions checked against the saved result table; 345 answer texts matched their frozen inputs.
- All 78 published case packets and the public CSV matched the local publication files byte for byte.
- 11 Python data/comparison checks, 42 selected interface/hosting checks and 16 publication-worker checks passed; the production build passed.
- Browser checks covered current/historical switching, a flagged B09 D5c result, N/A, C01 evidence insufficiency, plain-text output and the pinned case pane.
- No configured credentials were found in the publication source. All 2,213 historical source files retained their original hashes. No clinical answers or grades were generated during publication.

Details: [data checks](data-checks.json), [public checks](published-checks.json), [deployment](deployment.json), [live evidence screenshot](published-score.png).

GitHub integration: 1,072 Python tests, 52 JavaScript checks, the build and Ruff checks passed in an isolated checkout. [Validation](github-validation.json) and [upload scan](github-upload-checks.json) record the scope. The [frozen archive](../../study-data/full-rubric-20261104/README.md) includes its own byte manifest and a credential-free verification command.

The first hosted Windows run exposed a CP1252/UTF-8 mismatch when saving workspace JSON. The follow-up explicitly writes UTF-8 and adds a simulated-CP1252 regression test; all 1,073 local Python tests passed. [Compatibility check](windows-utf8-validation.json). Hosted outcomes are recorded by GitHub Actions on the corresponding commit. Research records and numerical scores were not rewritten.

Only display copies were added. The full local research output remains in the separate `full_rubric_completion_78_20261104` run. New evaluations retain their configured scoring version; publishing these saved grades does not change that setting.
