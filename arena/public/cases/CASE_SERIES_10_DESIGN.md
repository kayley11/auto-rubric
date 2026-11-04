# Ten case-series papers: task design

Clinical references and information requirements: **awaiting confirmation**.

Five clinician patient assessments, one parent explanation and four series-level evidence reviews. This is one task per paper, not a claim that the studies supply ten independent sampled patients. Individual patient facts are kept separate from group summaries.

| Task | Material | Audience / purpose | Items |
|---|---|---|---|
| SR01 | Index patient P1 | Clinical assessment | D1, D2a, D3a, D3b, D3c, D5u |
| SR02 | Eight autopsy tissue donors; no synthetic individual | Series evidence review | D1, D2a, D3d, D5u |
| SR03 | 18 attacks in 17 patients; aggregate comparisons | Series evidence review | D1, D2a, D3d, D5u |
| SR04 | Table patient 1 | Clinical assessment | D1, D2a, D3a, D3d, D5u, D6b |
| SR05 | Detailed index patient, decision point around age 55 | Clinical assessment | D1, D2a, D3a, D3b, D5u |
| SR06 | Infant ID 3 | Family explanation | D1, D2a, D5u, D6b, D7b |
| SR07 | 33-patient case series; no synthetic individual | Series evidence review | D1, D2a, D3d, D5u |
| SR08 | 15-patient prospective series; 12 surgical patients | Series evidence review | D1, D2a, D3d, D5u |
| SR09 | Patient 16 | Clinical assessment | D1, D2a, D3a, D5u, D6b |
| SR10 | Patient 2 | Clinical assessment | D1, D2a, D3a, D3c, D5u |

## Controls

The same facts and task go to all five retained answering models. One complete visible response per model/task is retained, including off-length answers. Failed attempts remain saved. The free endpoints have zero maximum prices and no paid fallback.

arc:apex grades one item at a time through AutoRubric, with the retained temperature, top-p and ascending option order. D3a receives only supplied facts, task and answer; other items additionally receive separate provisional review points. No judge receives hidden later events, source title, answering-model identity or previous scores. D5c is not scored because no requests are executed.

D3d is selected for the explicit causal-evidence reviews. D3a is selected only for the five clinician tasks that explicitly request a patient synthesis. Original D7b audience calibration has only the anchored 1/3/5 options. No overall score or pooled ranking across different task types is calculated.

## Evidence

[Frozen inputs and source-specific review questions](CASE_SERIES_10_TASKS.json) · [Source positions](CASE_SERIES_10_SOURCES.json) · [Rules](CASE_SERIES_10_RUBRIC.json).
