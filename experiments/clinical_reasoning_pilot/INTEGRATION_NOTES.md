# Public module: scope and verification

Prepared 2026-09-28. The three repository-integration issues are addressed locally.
The experiment remains the focus: its [findings](FINDINGS.md), 93 selected item
scores, limitations and next questions are the main entry points. This work made
no new model requests and did not revise the recorded clinical judgments.

## The three changes

| Issue | Change | Why this is sufficient |
| --- | --- | --- |
| All experiments were ignored | The root ignore rule now permits only `experiments/clinical_reasoning_pilot/`. The module ignores clinical input/run directories and generated results except the two selected exports. | Git can include this module while other local experiments and private records remain excluded. |
| Existing scripts did not fit repository checks; new tests were not discovered | Formatted the eight existing scripts, removed unused imports/variables and made small lint fixes. Added this module's test directory to `pytest.ini`. | The current CI already runs Ruff and root pytest, so it needs no additional workflow or job. |
| The full bundle contained material unsuitable for an unfiltered public copy | Included the runner, findings, numeric exports and authored test fixtures. Kept source-derived inputs, preparation scripts and raw outputs in the original local workspace. | Readers can inspect results and exercise software behavior without treating an incomplete public copy as the full experiment archive. |

The 543 findings in the earlier scan were largely formatting and long lines,
including 433 E501 findings. Long prompt/report strings use the same narrowly
scoped E501 exception as the repository's existing runner scripts. Their wording
was preserved so a style change would not silently alter a scoring prompt.
Other lint checks remain enabled. One import deliberately follows run-directory
selection because the imported engine reads that setting during import; it has
a local explanation and E402 exception. No scoring framework or new dependency
was introduced.

## Public material selection

| Included | Retained locally |
| --- | --- |
| Eight existing execution/reporting scripts | `prepare.py` and `prepare_extension.py`, which embed case facts, dialogues or anchors |
| Blank credential template and pinned runtime requirements | Real `.env` files, installed environments and caches |
| One findings report and a short usage README | The larger case-by-case reports, original review worksheets and historical handover notes |
| 93 baseline rows with identifiers, score labels and flags | Free-text grading reasons, complete model answers and raw provider responses, including reasoning fields |
| Original aggregate counts, phase accounting and coverage metadata | Original rubric PDF/JSON, book-derived case text, references, conversation prefixes and frozen execution snapshots |
| Small authored software fixtures inside the test file | The full-record regression suite and the complete retained data it requires |

The score export was made from
`runs/extension_v2_1_http/results/score_table.json` in the retained workspace.
Only `reason` was removed; all 93 rows and every other field were preserved.
The aggregate `extension_summary.json` was copied byte-for-byte. This keeps the
original generation, initial failures, diagnostics and v2.1 recovery distinguishable.
No failed attempts were reclassified and no scores were averaged into a ranking.

The public report is a shortened account of the existing analysis. Its links point
to included files, and it identifies the evidence that remains local. Public tests
use an independently authored value-repetition example and generic anchors;
these fixtures are neither new clinical cases nor additional experimental results.

The selected reporting code still contains authored interpretation of the findings.
It reads complete cases, anchors and responses from an explicitly supplied workspace.
The preparation scripts and full clinical records were not copied into the module.

## Verification

The pre-publication verification below used macOS and Python 3.12.7 with Ruff 0.14.1.
Results for GitHub-hosted jobs and other OS/Python combinations are recorded in the
repository's [Actions history](https://github.com/kayley11/auto-rubric/actions).

| Check | Result |
| --- | --- |
| Repository Ruff lint and format checks | Passed; all nine module Python files are included |
| Root pytest, including automatic module discovery | 873 passed, including six public module checks |
| Complete-record regression, using the formatted code in a temporary copy of the retained workspace | Seven existing checks passed |
| Saved-operation replay within that regression | 133 operations reused with network disabled and no evidence writes |
| Regenerated full reports within that regression | The 93 score rows, reasons and aggregate values were unchanged apart from report timestamps |
| Export comparison | All retained numeric fields match their source; aggregate file is byte-identical |
| Original evidence | Protected input/context file hashes remain unchanged |
| Public links and file selection | Local links resolve; 17 module files are visible to Git, while other experiments and private input/run paths stay ignored |
| Credentials and paths | No configured-key or scanned credential-pattern match in 259 Git-visible text files; no personal home/temp paths in the new module |

The full-record checks ran against temporary copies; the original experiment and
its exported bundle retain their recorded code snapshots and data. Root pytest
also reported warnings from existing statistical edge-case tests; none were failures.
The credential check covered current text files, not all historical commits or binaries.

These checks establish that integration preserved the recorded outputs and key
software behavior. Clinical reference review, independent human ratings and the
additional experiments listed in [FINDINGS.md](FINDINGS.md) are still outstanding.
They are the substantive next research tasks.
