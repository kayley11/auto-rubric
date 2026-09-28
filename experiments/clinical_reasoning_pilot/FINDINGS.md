# Clinical rubric pilot: findings and open questions

The selected scoring tasks completed, while several answer, reference and evaluator
issues still need review. High machine scores alone do not establish clinical
correctness or the reliability of the rubric.

## Experiment and completed work

The extension used four task families: staged evidence, incorrect-belief pushback,
longitudinal records and explicit urgency. The 16 target answers come from seven
parent clusters, including three newly authored synthetic parents; branches share
context and are not independent patients. Book-based tasks were adapted for text
evaluation. Newly authored facts and dialogue were marked separately in the retained protocol.

Answers were generated with the KCL CREATE alias `arc:lite`, temperature 0. The
accepted v2.1 scoring condition used `arc:apex`, temperature 0.7, top-p 0.8, low
reasoning effort and shuffled option labels (seed 20260927). Both output budgets
were 8,192 tokens; requests were sequential. AutoRubric was version 1.5.3.

| Component | Completed |
| --- | ---: |
| Target answers | 16 |
| Selected baseline item ratings | 93 |
| Narrow factual audits | 16 |
| Repeat judgments | 6 |
| Authored negative controls | 2 |

The [93-row export](results/score_table.json) contains only the accepted v2.1
baseline ratings. Earlier scoring attempts, repeated judgments and negative
controls are separate. The [summary](results/extension_summary.json) records their
counts and accounting. A score of 1–5 is the rubric label; no cross-task composite
or model ranking is calculated.

## Observations

- **Expected behaviors were observed in several task families.** All four requested
  longitudinal numeric summaries passed the deterministic checks. Evidence branches
  revised assessments, neutral branches retained their ordering, both incorrect-belief
  pushback answers resisted the false conclusion, and the explicit urgent branch
  began with escalation. These observations concern this small set of responses.
- **High ratings coexist with review concerns.** The retained analysis flags an
  assumed normal test result, diagnostic wording and a pharmacological explanation.
  These are provisional review findings awaiting independent clinical adjudication.
- **Task interpretation can change a score.** Problem representation received 5 for
  `E01_INITIAL` and 1 for `E02_INITIAL`. One rationale accepted an implicit summary;
  the other required an explicit sentence that the task had not requested. This
  needs an agreed task/anchor interpretation before judging either score incorrect.
- **Parser checks address a narrower problem.** The label/position guard rejects
  an output that selects one shuffled option while naming another score. It does
  not assess medical correctness. The retained ledger also flags an incomplete
  justification and an incorrect assertion that an anchored level was unanchored.
- **The repeat sample is limited.** All six repeated items retained score 5. This
  checks six upper-end cases, not reliability across the full score range.

Baseline score counts are **1: 1; 2: 0; 3: 3; 4: 19; 5: 70**. The distribution is
over selected item judgments on related answers. It is not an accuracy estimate.
Without the retained answers and reasons, the public numerical export cannot
independently establish whether these individual ratings are justified.

## Recovery and resource use

The original extension produced the 16 answers but encountered score-label
mismatches and timeouts. The separate v2.1 condition reused those answers unchanged,
used direct HTTP and removed unrelated examples from the judge system prompt.
Transport, prompt and service time changed together, so the recovery does not
identify a unique cause of the earlier failures.

| Phase | Attempts | Failed attempts | Known tokens |
| --- | ---: | ---: | ---: |
| Answer generation | 16 | 0 | 52,171 |
| Original scoring | 7 | 6 | 8,805 |
| Diagnostics | 3 | 0 | 4,262 |
| v2.1 scoring | 123 | 6 | 244,381 |
| Total | 149 | 12 | 309,619 |

Six records have unknown usage, which is not counted as zero. Known usage comprises
248,361 input and 61,258 completion tokens; 42,421 reported reasoning tokens are a
subset of completion tokens. Imported answers are not charged a second time in
this accounting. Monetary billing is unknown.

Client-observed request durations sum to 1,322.944 seconds. The attempt window is
2,146.795 seconds and includes pauses and recovery work. Neither measures GPU
compute time. Provider metadata does not establish an internal agent/tool graph.

## What remains to resolve

Across the earlier five-case apex condition and this extension, 21/22 ordinal items
have at least one numeric judgment. That combined coverage claim includes an earlier
condition outside this public score export. D3d, causal reasoning, remains deferred:
its interpretation as reasoning type, task-appropriate quality or both needs to be
defined. Adding more diseases alone would not resolve that ambiguity.

The immediate next step is to review reference accuracy, essential safety omissions,
implicit versus explicit problem representation and missing intermediate anchors.
Independent human ratings and adjudication are still absent. After clarifying those
rules, compare unchanged answers in a separately labelled scoring condition.

Additional cases should address specific gaps: contradictory evidence, repeated
incorrect pressure, irregular or delayed records, and another urgent/non-urgent
family. Include ambiguous or lower-scoring answers in repeat-judge checks. These
experiments are proposed and have not been run.

The book suggestion was *Cases for PACES*; the supplied Clinical LLM Reasoning Rubric
provided the grading framework. Full source excerpts, clinical references and the
original review packet remain with the retained local experiment records.
