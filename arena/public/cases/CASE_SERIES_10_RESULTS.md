# Ten case-series papers: results

Clinical references and information requirements: **awaiting confirmation**.

One task per source paper: five clinician patient assessments, one parent explanation and four series-level evidence reviews. These task types are reported separately; they are not ten independent sampled patients.

## Model availability

| Model | Complete answers / 10 | Complete item grades |
|---|---:|---:|
| arc:lite | 10 | 48 |
| arc:chat | 10 | 48 |
| arc:apex | 10 | 48 |
| google/gemma-4-31b-it:free | 0 | 0 |
| nvidia/nemotron-3-ultra-550b-a55b:free | 10 | 48 |

## Per-task results

Scores follow the item order. A dash means no completed grade, not zero.

| Task | Items | arc:lite | arc:chat | arc:apex | Gemma 4 | Nemotron |
|---|---|---|---|---|---|---|
| SR01 · Progressive spastic weakness with a discordant prior label | D1, D2a, D3a, D3b, D3c, D5u | 5 / 5 / 5 / 5 / 4 / 5 | 4 / 5 / 5 / 5 / 4 / 4 | 5 / 4 / 5 / 5 / 4 / 5 | — / — / — / — / — / — | 4 / 4 / 5 / 2 / 3 / 4 |
| SR02 · Tissue target engagement and clinical benefit | D1, D2a, D3d, D5u | 5 / 4 / 5 / 5 | 5 / 4 / 5 / 5 | 5 / 5 / 5 / 5 | — / — / — / — | 5 / 4 / 5 / 5 |
| SR03 · Recovery before and after rescue immunotherapy | D1, D2a, D3d, D5u | 5 / 5 / 5 / 5 | 5 / 5 / 5 / 5 | 5 / 5 / 5 / 5 | — / — / — / — | 5 / 5 / 5 / 5 |
| SR04 · Respiratory illness after long-term B-cell depletion | D1, D2a, D3a, D3d, D5u, D6b | 5 / 5 / 5 / 5 / 4 / 4 | 5 / 5 / 5 / 5 / 5 / 4 | 5 / 5 / 5 / 5 / 5 / 4 | — / — / — / — / — / — | 5 / 4 / 5 / 5 / 5 / 4 |
| SR05 · Progressive language-led impairment after earlier haemorrhage | D1, D2a, D3a, D3b, D5u | 3 / 5 / 5 / 4 / 5 | 5 / 5 / 5 / 5 / 5 | 5 / 5 / 4 / 5 / 5 | — / — / — / — / — | 4 / 4 / 5 / 5 / 3 |
| SR06 · Explaining a staged infant treatment plan | D1, D2a, D5u, D6b, D7b | 5 / 4 / 4 / 5 / 5 | 5 / 5 / 4 / 4 / 5 | 5 / 4 / 5 / 4 / 5 | — / — / — / — / — | 5 / 4 / 4 / 5 / 5 |
| SR07 · Response denominators and a supportive-treatment claim | D1, D2a, D3d, D5u | 5 / 5 / 5 / 5 | 5 / 5 / 5 / 5 | 5 / 5 / 5 / 5 | — / — / — / — | 5 / 4 / 5 / 5 |
| SR08 · Clinical shrinkage versus pathological response | D1, D2a, D3d, D5u | 5 / 4 / 5 / 5 | 5 / 5 / 5 / 5 | 5 / 5 / 5 / 5 | — / — / — / — | 5 / 5 / 5 / 5 |
| SR09 · An individual nonresponse within a high-response series | D1, D2a, D3a, D5u, D6b | 5 / 5 / 4 / 5 / 4 | 5 / 3 / 5 / 5 / 4 | 5 / 3 / 5 / 5 / 4 | — / — / — / — / — | 4 / 3 / 5 / 4 / 4 |
| SR10 · Early severe skin disease with normal glucose | D1, D2a, D3a, D3c, D5u | 5 / 5 / 5 / 4 / 4 | 5 / 5 / 5 / 4 / 4 | 5 / 5 / 5 / 4 / 4 | — / — / — / — / — | 3 / 3 / 5 / 4 / 4 |

[Design and controls](CASE_SERIES_10_DESIGN.md) · [Findings and review questions](CASE_SERIES_10_FINDINGS.md) · [Full saved output](CASE_SERIES_10_RAW_OUTPUT.txt) · [Scores and reasons](CASE_SERIES_10_SCORES.csv) · [Source positions](CASE_SERIES_10_SOURCES.json).
