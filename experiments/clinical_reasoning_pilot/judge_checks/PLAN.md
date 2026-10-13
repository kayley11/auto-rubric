# Judge checks: plan

Prepared 13 October 2026. This is a small evaluator diagnostic, separate from the
completed clinical pilot. All new record tasks are fictional and non-clinical.

| Check | Design | Planned ratings | Outcome |
|---|---|---:|---|
| Fixed-answer stability | Eight retained answer/item pairs; three fresh calls in ascending and three in descending score order | 48 | Score triplets, abstentions, failures and changes between orders |
| Objective error recognition | Six record-task families, each with two states and two fixed answers | 24 per prompt | Correct classifications, false acceptance and false rejection |
| Task-state sensitivity | Same 24 cells: a relevant condition changes which answer is supported | Included above | Entire four-cell family correct; no credit for always accepting/rejecting |

Total: **96 planned ratings**. No new clinical answers or clinical anchor changes.
Objective labels are binary and do not invent Josh's missing 2/4 descriptors.

## What changes

- Option shuffling is disabled. Actual ascending/descending orders are saved;
  changing answer text cannot accidentally change an option permutation.
- Clinical checks reuse the saved answer, rendered query, reference and system
  prompt. Only the displayed score order varies; historical scores are excluded
  from repeat-agreement calculations. The selected pairs intentionally cover
  historical scores 1, 3, 4 and 5, so results are not a representative reliability estimate.
- New tasks use irregular, reordered records without "future" or "unavailable"
  hints. They test result availability, absent events, missing values, entity/record
  identity, signed change, and recorded-versus-estimated values.
- The baseline and evidence-check prompts use identical tasks, answers and
  criterion. The second adds explicit checking instructions; it receives no
  oracle labels, expected answers or extra patient facts.
- Correct answers and correct unsupported responses are both included. An
  unsupported response is appropriate only when the supplied task requires it.

## Execution and analysis

Use the existing KCL `arc:apex` route, temperature 0.7, top-p 0.8, requested low
reasoning effort and an 8,192-token limit. Disable cache and library retries; run
sequentially, interleaving prompt arms and score orders. Allow one extra attempt
only after an invalid output or request failure. Stop after two consecutively
unresolved operations. Save all attempts, visible judgments, timing and usage.
Never repeat a valid judgment merely because its score is undesirable.

Freeze inputs before the first scoring call. Keep the six families together in
analysis: 24 variants are not 24 independent cases. Report counts and family
results; no significance or population reliability claim is planned. These
fixtures are evaluation data, not examples for tuning during this run. Any
subsequent tuning needs a new evaluation set.

## Deliverables and limits

Publish this plan, fictional fixtures, runner, numeric summary and concise
results in the AutoRubric experiment module. Retain original clinical answers,
anchors, reasons and provider records in the private local run directory.
Update the existing findings page with the new results and links.

Clinical references, D3a interpretation, missing anchors, task-dependent upper
anchors and clinical human agreement remain unresolved. This run cannot settle
medical correctness, validate the whole clinical rubric or measure private
model reasoning. A null improvement or ceiling result will be reported as such.

## Recovery allowance

Recorded 2026-10-13T04:23:53.328251+00:00, before any recovery call.

`U01_SEVERE / D2a`, descending order, draw 2, remained unresolved after
two 90-second requests. Finish the other planned operations, then allow one
delayed recovery pass with at most two attempts for unresolved operations only.
Keep the same frozen inputs and parameters; never repeat a successful judgment.
Retain both original failures and include recovery attempts and unknown usage
in accounting. The target remains 96 accepted judgments.
