# Full-rubric review of 78 saved tasks

The original tasks and answers were fixed. All 22 main rubric items were checked for the 345 complete saved answers. The review returned 6,342 numerical scores, 1,225 task-inapplicable items and 23 indeterminate items. A further 123 case × service positions had no complete answer, so all 22 items have a missing-answer reason. Clinical references and candidate information requirements are **awaiting confirmation**.

- [Findings and review flags](FINDINGS.md)
- [Every case and answering configuration](RESULTS_BY_CASE.md)
- [Every unscored item and reason](UNSCORED.md)
- [All item rows](ALL_ITEM_RESULTS.csv)
- [Seven-domain summaries](SEVEN_DOMAIN_PROFILES.csv)
- [Complete plain-text inputs and visible outputs](RAW_OUTPUT.txt)
- [Raw call records](calls/), [frozen inputs](inputs/) and [saved judgements](reviews/)
- [Research checks](CHECKS.json), [independent validation](VALIDATION.json) and [source-file hashes](ARCHIVE_SHA256.json)

This is a new full-profile scoring condition, with D5c reviewed separately. It is not the separate zero-shot answer-generation condition. It retains every original score and explanation, including flagged outputs. The six service positions include two providers of the same declared Qwen model family. Gemma has no complete saved answer in this frozen dataset.

The 1,692 manifest-listed files are byte-identical copies of the run, including prompts, visible model responses, failures, token usage and execution-script snapshots. Temporary process IDs and Python caches are omitted. Original machine paths remain in historical provenance records; they are not runtime requirements for viewing the results. The original execution scripts document the historical environment and are not a fresh-checkout reproduction command.

From the repository root, verify all copied bytes and result counts without credentials or model calls:

```bash
python3 arena/scripts/verify-full-rubric-archive.py
```

The [website publication checks](../../validation/20261104-full-rubric/README.md) record version 30 and the live data checks. Case review defaults to this full review; earlier selected-item grades remain separately available. Original research and existing repository records were not overwritten by this archive.
