# Thirteen full-text cases: model results

Clinical references and candidate information requirements: **awaiting confirmation**.

## Design

The four NEJM/Lancet and nine JAMA cases use fixed written tasks. Every answering model receives the same facts and task for a given case. Later results, article titles and review references are withheld. arc:apex scores each selected rubric item using the retained manuscript snapshot; D3a sees only supplied evidence and the answer. D5c is not selected because no requests are executed.

Rule version: **overleaf-20261024-read-20261028**. One retained answer per model and task; no overall score. Differences between tasks are not a pooled model ranking.

The current scores use the evidence-only input condition. The first grading input included extra decision-window descriptions that mentioned some withheld later events. Those scores are retained as history; the same answers were rescored without those descriptions. Other items still receive separate provisional references; D3a does not.

## Collection status

Saved 52/65 planned answers and 292/365 planned item ratings.

| Answering model | Complete answers / 13 | Item ratings |
|---|---:|---:|
| arc:lite | 13 | 73 |
| arc:chat | 13 | 73 |
| arc:apex | 13 | 73 |
| google/gemma-4-31b-it:free | 0 | 0 |
| nvidia/nemotron-3-ultra-550b-a55b:free | 13 | 73 |

## Per-case scores

Scores follow the listed item order. A dash means no completed score.

| Case | Items | arc:lite | arc:chat | arc:apex | Gemma 4 | Nemotron |
|---|---|---|---|---|---|---|
| J01 · Fever, purpura and evolving renal findings | D1, D3a, D3b, D4c, D5u | 5 / 5 / 5 / 3 / 5 | 5 / 5 / 5 / 5 / 5 | 3 / 4 / 5 / 5 / 5 | — / — / — / — / — | 5 / 5 / 4 / 5 / 4 |
| J02 · Persistent daytime sleep episodes despite improved mood | D1, D3a, D3b, D5u, D6b | 5 / 5 / 5 / 5 / 5 | 5 / 5 / 5 / 4 / 4 | 5 / 5 / 5 / 4 / 5 | — / — / — / — / — | 5 / 5 / 5 / 5 / 4 |
| J03 · Progressive tremor, gait and cognitive symptoms after an initial head-injury label | D1, D3a, D3b, D4c, D5u, D6a | 5 / 5 / 5 / 5 / 4 / 3 | 4 / 5 / 5 / 3 / 4 / 5 | 5 / 5 / 5 / 3 / 5 / 5 | — / — / — / — / — / — | 5 / 5 / 5 / 5 / 4 / 4 |
| J04 · Recurrent destructive ulcers with systemic inflammatory features | D1, D3a, D3b, D5u, D6b | 4 / 5 / 5 / 5 / 3 | 5 / 5 / 4 / 5 / 4 | 5 / 5 / 4 / 5 / 4 | — / — / — / — / — | 5 / 5 / 4 / 4 / 4 |
| JA01 · Abrupt visual loss after intraocular lens exchange | D1, D3a, D3b, D3c, D5u, D6a | 5 / 5 / 5 / 5 / 5 / 4 | 4 / 5 / 4 / 5 / 4 / 4 | 5 / 5 / 5 / 4 / 5 / 4 | — / — / — / — / — / — | 4 / 4 / 3 / 4 / 4 / 4 |
| JA02 · A branching growth beside the great toenail | D1, D3a, D3b, D5u | 5 / 5 / 5 / 5 | 5 / 5 / 5 / 5 | 5 / 4 / 5 / 5 | — / — / — / — | 5 / 4 / 5 / 5 |
| JA04 · A new choroidal mass decades after breast surgery | D1, D3a, D3b, D3c, D5u | 5 / 5 / 5 / 4 / 5 | 5 / 4 / 4 / 4 / 4 | 5 / 5 / 5 / 4 / 5 | — / — / — / — / — | 5 / 5 / 4 / 4 / 5 |
| JA05 · Encephalopathy immediately after anaesthesia | D1, D2a, D3a, D3b, D3c, D5u, D6a | 5 / 4 / 5 / 5 / 4 / 5 / 3 | 5 / 5 / 5 / 5 / 4 / 5 / 5 | 5 / 5 / 4 / 5 / 4 / 5 / 4 | — / — / — / — / — / — / — | 4 / 4 / 5 / 5 / 4 / 4 / 4 |
| JA06 · Brief monocular visual loss unlike the patient's usual aura | D1, D3a, D3b, D3c, D5u, D6a | 5 / 5 / 5 / 4 / 5 / 4 | 5 / 4 / 5 / 4 / 5 / 4 | 5 / 5 / 5 / 5 / 5 / 5 | — / — / — / — / — / — | 5 / 5 / 5 / 4 / 5 / 5 |
| JA07 · Rapid palpitations, muscle cramps and tinnitus | D1, D3a, D3b, D3c, D5u, D6a, D6b | 5 / 4 / 5 / 4 / 5 / 5 / 4 | 5 / 4 / 5 / 4 / 4 / 4 / 4 | 5 / 5 / 5 / 4 / 5 / 5 / 5 | — / — / — / — / — / — / — | 5 / 5 / 4 / 4 / 5 / 5 / 4 |
| JA08 · A rapid-looking tracing with a slow measured pulse | D1, D2a, D3a, D3c, D5u, D6b | 5 / 5 / 5 / 4 / 5 / 5 | 5 / 5 / 5 / 4 / 5 / 5 | 5 / 5 / 5 / 4 / 5 / 4 | — / — / — / — / — / — | 5 / 4 / 5 / 4 / 5 / 5 |
| JA09 · Bilateral palatal ulcers with an equivocal biopsy pattern | D1, D2a, D3a, D3b, D3c, D5u | 5 / 2 / 3 / 2 / 4 / 5 | 5 / 5 / 5 / 5 / 4 / 5 | 5 / 5 / 5 / 5 / 4 / 5 | — / — / — / — / — / — | 5 / 3 / 4 / 4 / 4 / 5 |
| JA10 · Persistent Darier disease despite previous topical treatments | D1, D2a, D3a, D5u, D6b | 5 / 4 / 4 / 5 / 5 | 5 / 4 / 5 / 5 / 5 | 5 / 5 / 4 / 5 / 5 | — / — / — / — / — | 4 / 4 / 5 / 5 / 5 |

## Evidence

[Saved inputs, answers, all scoring reasons, failed attempts and reported usage](FULLTEXT_13_RAW_OUTPUT.txt) · [Scores](FULLTEXT_13_SCORES.csv) · [Design](FULLTEXT_13_DESIGN.md) · [Case facts and task designs](FULLTEXT_13_TASKS.json).

Item-level findings and specific clinical review questions are recorded in [FINDINGS.md](FULLTEXT_13_FINDINGS.md). Endpoint failures are collection outcomes, not clinical errors.
