# Experiments and results through 23 October 2026

## Latest findings

1. [Six new cases](review/01_NEW_CASES.md): sources, audiences, static rubric findings and separate MELD results.
2. [Eight-case model comparison](review/02_MODEL_COMPARISON.md): matching repairs, information obtained or missed, and D5c/D3a scores for arc:lite, arc:chat and arc:apex.
3. [Final findings and decisions](review/03_FINAL_FINDINGS.md): answers to Josh's questions and the clinical/reference and scoring rules still needing confirmation.

The models asked different questions. For N02, only arc:apex requested glucose; arc:lite missed it but still received D3a=5. In this setup, D3a grades the final answer against obtained information, while D5c grades the interview with the full inventory available to the judge. Which omissions should affect either item remains an author decision.

## Saved experiments

| Experiment | Report | Data and complete visible output |
| --- | --- | --- |
| N01–N03: three static answers, 28 item grades | [Results](new_cases_20261022/RESULTS.md) · [Sources](new_cases_20261022/SOURCE_REGISTER.md) | [Item scores](new_cases_20261022/scores.csv) · [Plain-text answers/grades](new_cases_20261022/SCORE_OUTPUT.txt) · [Requests and returns](new_cases_20261022/RAW_OUTPUT.txt) |
| N04–N06: five static/branch answers, 37 grades | [Results](new_cases_batch2_20261022/RESULTS.md) · [Sources](new_cases_batch2_20261022/SOURCE_REGISTER.md) | [Item scores](new_cases_batch2_20261022/scores.csv) · [Plain-text answers/grades](new_cases_batch2_20261022/SCORE_OUTPUT.txt) · [Requests and returns](new_cases_batch2_20261022/RAW_OUTPUT.txt) |
| N01–N03: initial MELD screen, six continuations | [Results](new_cases_20261022/meld_20261022/RESULTS.md) | [Similarities](new_cases_20261022/meld_20261022/similarities.csv) · [Full continuations](new_cases_20261022/meld_20261022/CONTINUATIONS.txt) |
| N01–N03: length-controlled MELD, six continuations | [Before/after analysis](new_cases_20261022/meld_length_control_20261022/COMPARISON.md) | [Similarities](new_cases_20261022/meld_length_control_20261022/similarities.csv) · [Full continuations](new_cases_20261022/meld_length_control_20261022/CONTINUATIONS.txt) |
| N04–N06: length-controlled MELD, six continuations | [Results](new_cases_batch2_20261022/meld_length_control_20261023/RESULTS.md) | [Similarities](new_cases_batch2_20261022/meld_length_control_20261023/similarities.csv) · [Full continuations](new_cases_batch2_20261022/meld_length_control_20261023/CONTINUATIONS.txt) |
| First static/interview comparison: eight cases | [Results](patient_agent_pilot_20261023/COMPARISON.md) | [Complete output](patient_agent_pilot_20261023/RAW_OUTPUT.txt) |
| Static/interview comparison after practical fixes | [Before/after analysis](patient_agent_revision_20261023/COMPARISON.md) | [Complete output](patient_agent_revision_20261023/RAW_OUTPUT.txt) |
| First three-model interview comparison | [Results](patient_agent_models_20261023/COMPARISON.md) | [Complete output](patient_agent_models_20261023/RAW_OUTPUT.txt) |
| Three-model comparison after matching repairs: 24 final answers, 48 grades, 131 turns | [Final analysis](patient_agent_models_matching_20261023/COMPARISON.md) | [Information before/after](patient_agent_models_matching_20261023/BEFORE_AFTER_INFORMATION.csv) · [Scores before/after](patient_agent_models_matching_20261023/BEFORE_AFTER_SCORES.csv) · [All original/intermediate/final output](patient_agent_models_matching_20261023/RAW_OUTPUT.txt) |
| Researcher checks: numerical results, lengths, saved grade mappings, 18 MELD comparisons and model evidence | [Completed checks](runs/researcher_checks_20261023/CHECKS.md) | [Recalculated MELD](runs/researcher_checks_20261023/MELD_RECALCULATION.csv) · [Word counts](runs/researcher_checks_20261023/WORD_COUNTS.csv) · [Model evidence](runs/researcher_checks_20261023/MODEL_EVIDENCE.json) |

Rubric grades and MELD similarities answer different questions. None of the twelve length-controlled continuations reached the pre-set 95% near-exact threshold; that does not establish that the sources were unseen. Clinical references remain provisional. Repeated turns, branches and technical reruns are not independent patients.

## Reading the archive

These are saved results, not new model calls. Earlier outputs and unsuccessful attempts remain alongside the final records. The two matching follow-up folders retain nine superseded technical interviews; the final comparison identifies the selected records. Reports distinguish missing questions from failures to return information that was asked for.

CSV, JSON and TXT evidence is copied without changing answers, grades, explanations or recorded parameters. Markdown links are adjusted for this repository. Historical scripts are retained as plain-text `.py.txt` captures, not runnable entry points. Recorded local paths and hashes describe the original runs. [MANIFEST.json](MANIFEST.json) records source and published hashes.

The six adapted cases retain article attribution and source locations; their selected reports are CC BY 4.0. Downloaded articles, patient images, credentials, caches and personal UI records are excluded. Source links point to the publishers. The earlier book-based pilot is documented in the [main review](../../review/DECISIONS.md).
