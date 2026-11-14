# Gemma 4 31B: recovered answers and Full rubric assessments

All 135 tasks have a complete Gemma output and a saved 22-item automated assessment. Clinical and applicability confirmation remain separate.

Google's direct free Gemma API returned complete responses after the previously tested OpenRouter and NVIDIA routes failed. All earlier results are retained. Clinical references and candidate information requirements remain **awaiting confirmation**.

## Free route verified

The working route is the [Google Gemma API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api). Google lists Gemma 4 input and output as free in its [API pricing](https://ai.google.dev/gemini-api/docs/pricing#gemma-4). The exact returned model ID is checked before an output is accepted.

| Route checked | Observed result | Used for this recovery |
|---|---|---|
| Google direct API, own key | Successful exact-model and clinical responses | Yes |
| Google compatible API, own key | Successful exact-model and clinical responses; transport saved per case | Yes, where recorded |
| OpenRouter free shared route | HTTP 429 on the latest probe | No |
| NVIDIA NIM | Latest inference probe timed out; no complete pilot answer | No |
| KCL model catalogue | No Gemma 4 31B deployment listed on 14 November | No |

## What was held fixed

The 135 original cases/tasks were retained: 105 written tasks and 30 interviews (8 prepared cases and 22 source-report cases). Written generation reused the exact saved messages. Interviews retained six question opportunities and the existing fixed-fact release controller. Presentation labels now follow the frozen protocol. Hidden outcomes were not supplied to the answering model.

The new answering configuration is `gemma-4-31b-it` through the Google Gemini API, temperature 0, top-p 1 and thinking disabled (`minimal`). This is a separate provider run. The scoring model remains `arc:apex` / GLM-5.3 with the saved full Overleaf rubric. Original-cohort judge sampling settings are retained: earlier 78 at 0.7/0.8; complex BN at 0/1. New technical output schemas constrain JSON fields and legal categories without changing clinical definitions.

Both tested Google transports are recorded per case: the native API and Google's own compatible API. Both are served by Google with the same model, messages and thinking configuration. The local raw calls preserve the selected transport and every unsuccessful attempt.

For the earlier 78 tasks, the main scoring record contains the actual case/task, received evidence and unchanged final answer. For the 57 BN tasks, the saved scoring-only safety key and three observation checks are also retained. These guides can name undisclosed outcomes as examples of what the judge must not require; they were not given to the answering model. D5c is assessed separately with the frozen candidate checklist. Scope decisions follow the 12 November audit: clear omissions are assessed, genuine exclusions remain N/A, and unresolved applicability remains awaiting confirmation.

## Coverage

| Result | Count |
|---|---:|
| Complete answers | 135/135 |
| Complete Full rubric profiles | 135/135 |
| complete item positions | 2553 |
| not applicable item positions | 247 |
| applicability pending item positions | 162 |
| indeterminate item positions | 8 |
| pending item positions | 0 |
| no complete answer item positions | 0 |

There are 2,970 item positions, not necessarily 2,970 numerical grades. Provider failure, an unscored answer, uncertain applicability and insufficient assessment evidence have different statuses.

## Technical checks

A judge response containing literal placeholders is a non-assessment, not a clinical finding of insufficient evidence. BN52: 19 placeholder items replaced after an identical-input grading retry. Original files and all other valid item grades are unchanged; both returns remain available in the saved output.

Every completed profile has all 22 item positions. Numerical grades use only the saved allowed categories, including 1/3/5-only items. Non-numerical positions have null scores and a specific reason. Judge excerpts are retained as returned and checked against the unchanged final answer; unmatched excerpts are flagged rather than silently rewritten.

Transient Google 500/503 errors and unsuccessful format returns are saved. An initially network-restricted prefetch worker also produced local DNS failures; it was restarted with authorised network access. Those failures are environmental errors, not model refusals. Incomplete outputs receive no clinical grade. A grading-queue restart is documented; completed files were preserved and interprocess locks now prevent overlapping work. No paid model or another Gemma size was substituted.

The account returned a free-tier input limit of 16,000 tokens per minute. A shared scheduler uses a conservative 14,000-token budget, counts complete prompts through Google's tokenizer and respects retry delays. Recovery permits up to 12 technical attempts per operation and transport, with at most three new attempts per pass. Both Google transports share the same success cache and operation lock, so a completed output is reused rather than regenerated. Completed answers and valid grades are never retried to obtain different content or scores. These recovered results therefore do not constitute a single-attempt availability or speed comparison.

## Case-by-case status

| Case | Original format | Answer | Full profile | Numerical grades | Awaiting applicability confirmation |
|---|---|---|---|---:|---:|
| B01 | written-record | complete | complete | 19 | 1 |
| B02 | written-record | complete | complete | 20 | 0 |
| B03 | written-record | complete | complete | 21 | 0 |
| B04 | written-record | complete | complete | 20 | 0 |
| B05 | written-record | complete | complete | 20 | 1 |
| B06 | written-record | complete | complete | 21 | 0 |
| B07 | written-record | complete | complete | 19 | 2 |
| B08 | written-record | complete | complete | 20 | 1 |
| B09 | written-record | complete | complete | 21 | 0 |
| B10 | written-record | complete | complete | 17 | 2 |
| B11 | written-record | complete | complete | 21 | 0 |
| B12 | written-record | complete | complete | 20 | 1 |
| B13 | written-record | complete | complete | 18 | 2 |
| B14 | written-record | complete | complete | 20 | 0 |
| B15 | written-record | complete | complete | 20 | 1 |
| B16 | written-record | complete | complete | 19 | 2 |
| B17 | written-record | complete | complete | 18 | 2 |
| B18 | written-record | complete | complete | 14 | 3 |
| B19 | written-record | complete | complete | 17 | 2 |
| B20 | written-record | complete | complete | 17 | 4 |
| B21 | written-record | complete | complete | 17 | 1 |
| B22 | written-record | complete | complete | 19 | 1 |
| C01 | prepared-interview | complete | complete | 17 | 0 |
| C02 | prepared-interview | complete | complete | 20 | 0 |
| C03 | prepared-interview | complete | complete | 19 | 0 |
| C04 | prepared-interview | complete | complete | 19 | 2 |
| C05 | prepared-interview | complete | complete | 16 | 1 |
| N01 | written-record | complete | complete | 19 | 1 |
| N02 | prepared-interview | complete | complete | 19 | 0 |
| N03 | written-record | complete | complete | 15 | 2 |
| N04 | prepared-interview | complete | complete | 20 | 1 |
| N05 | prepared-interview | complete | complete | 18 | 2 |
| N06 | written-record | complete | complete | 15 | 1 |
| CAND01 | source-interview | complete | complete | 21 | 0 |
| CAND02 | source-interview | complete | complete | 20 | 1 |
| CAND03 | source-interview | complete | complete | 21 | 0 |
| CAND04 | source-interview | complete | complete | 21 | 0 |
| CAND05 | source-interview | complete | complete | 21 | 0 |
| CAND06 | source-interview | complete | complete | 16 | 5 |
| CAND07 | source-interview | complete | complete | 19 | 2 |
| CAND08 | source-interview | complete | complete | 21 | 0 |
| CAND09 | source-interview | complete | complete | 20 | 1 |
| CAND10 | source-interview | complete | complete | 20 | 1 |
| CAND11 | source-interview | complete | complete | 21 | 0 |
| CAND12 | source-interview | complete | complete | 20 | 1 |
| CAND13 | source-interview | complete | complete | 21 | 0 |
| CAND14 | source-interview | complete | complete | 21 | 0 |
| CAND15 | source-interview | complete | complete | 19 | 2 |
| CAND16 | source-interview | complete | complete | 21 | 0 |
| CAND17 | source-interview | complete | complete | 21 | 0 |
| CAND18 | source-interview | complete | complete | 21 | 0 |
| CAND19 | source-interview | complete | complete | 20 | 1 |
| CAND20 | source-interview | complete | complete | 21 | 0 |
| CAND21 | source-interview | complete | complete | 21 | 0 |
| CAND22 | source-interview | complete | complete | 20 | 1 |
| SR01 | written-record | complete | complete | 18 | 3 |
| SR02 | written-record | complete | complete | 13 | 0 |
| SR03 | written-record | complete | complete | 16 | 1 |
| SR04 | written-record | complete | complete | 16 | 2 |
| SR05 | written-record | complete | complete | 19 | 1 |
| SR06 | written-record | complete | complete | 14 | 1 |
| SR07 | written-record | complete | complete | 12 | 0 |
| SR08 | written-record | complete | complete | 13 | 0 |
| SR09 | written-record | complete | complete | 14 | 2 |
| SR10 | written-record | complete | complete | 18 | 1 |
| J01 | written-record | complete | complete | 20 | 1 |
| J02 | written-record | complete | complete | 19 | 2 |
| J03 | written-record | complete | complete | 21 | 0 |
| J04 | written-record | complete | complete | 15 | 4 |
| JA01 | written-record | complete | complete | 20 | 0 |
| JA02 | written-record | complete | complete | 18 | 1 |
| JA04 | written-record | complete | complete | 18 | 3 |
| JA05 | written-record | complete | complete | 18 | 2 |
| JA06 | written-record | complete | complete | 19 | 2 |
| JA07 | written-record | complete | complete | 17 | 3 |
| JA08 | written-record | complete | complete | 20 | 1 |
| JA09 | written-record | complete | complete | 19 | 1 |
| JA10 | written-record | complete | complete | 15 | 2 |
| BN01 | written-record | complete | complete | 20 | 1 |
| BN02 | written-record | complete | complete | 19 | 2 |
| BN03 | written-record | complete | complete | 20 | 1 |
| BN04 | written-record | complete | complete | 20 | 1 |
| BN05 | written-record | complete | complete | 20 | 1 |
| BN06 | written-record | complete | complete | 20 | 1 |
| BN07 | written-record | complete | complete | 20 | 1 |
| BN08 | written-record | complete | complete | 19 | 2 |
| BN09 | written-record | complete | complete | 19 | 1 |
| BN10 | written-record | complete | complete | 20 | 1 |
| BN11 | written-record | complete | complete | 20 | 1 |
| BN12 | written-record | complete | complete | 19 | 2 |
| BN13 | written-record | complete | complete | 18 | 3 |
| BN14 | written-record | complete | complete | 20 | 1 |
| BN15 | written-record | complete | complete | 20 | 1 |
| BN16 | written-record | complete | complete | 20 | 1 |
| BN17 | written-record | complete | complete | 17 | 3 |
| BN18 | written-record | complete | complete | 20 | 0 |
| BN19 | written-record | complete | complete | 20 | 1 |
| BN20 | written-record | complete | complete | 20 | 1 |
| BN21 | written-record | complete | complete | 19 | 2 |
| BN22 | written-record | complete | complete | 20 | 1 |
| BN23 | written-record | complete | complete | 16 | 3 |
| BN24 | written-record | complete | complete | 20 | 1 |
| BN25 | written-record | complete | complete | 20 | 1 |
| BN26 | written-record | complete | complete | 18 | 2 |
| BN27 | written-record | complete | complete | 20 | 1 |
| BN28 | written-record | complete | complete | 19 | 1 |
| BN29 | written-record | complete | complete | 20 | 1 |
| BN30 | written-record | complete | complete | 17 | 3 |
| BN31 | written-record | complete | complete | 20 | 1 |
| BN32 | written-record | complete | complete | 14 | 4 |
| BN33 | written-record | complete | complete | 20 | 1 |
| BN34 | written-record | complete | complete | 20 | 1 |
| BN35 | written-record | complete | complete | 20 | 1 |
| BN36 | written-record | complete | complete | 18 | 2 |
| BN37 | written-record | complete | complete | 20 | 1 |
| BN38 | written-record | complete | complete | 18 | 1 |
| BN39 | written-record | complete | complete | 19 | 1 |
| BN40 | written-record | complete | complete | 20 | 1 |
| BN41 | written-record | complete | complete | 20 | 1 |
| BN42 | written-record | complete | complete | 20 | 1 |
| BN43 | written-record | complete | complete | 20 | 1 |
| BN44 | written-record | complete | complete | 19 | 2 |
| BN45 | written-record | complete | complete | 20 | 1 |
| BN46 | written-record | complete | complete | 20 | 1 |
| BN47 | written-record | complete | complete | 20 | 0 |
| BN48 | written-record | complete | complete | 19 | 1 |
| BN49 | written-record | complete | complete | 19 | 1 |
| BN50 | written-record | complete | complete | 18 | 3 |
| BN51 | written-record | complete | complete | 18 | 2 |
| BN52 | written-record | complete | complete | 20 | 1 |
| BN53 | written-record | complete | complete | 18 | 2 |
| BN54 | written-record | complete | complete | 20 | 1 |
| BN55 | written-record | complete | complete | 20 | 1 |
| BN56 | written-record | complete | complete | 20 | 1 |
| BN57 | written-record | complete | complete | 19 | 2 |

## Files

[All item grades and reasons](ALL_ITEM_RESULTS.csv) · [Per-case status](RESULTS_BY_CASE.csv). Full local provider calls, failures and original input snapshots are retained in this run. The website receives visible case/answer/assessment copies only, without credentials or provider envelopes.
