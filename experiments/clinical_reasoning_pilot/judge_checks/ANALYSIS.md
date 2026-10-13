# Judge checks: findings and next decisions

**Record labels were correct; selected clinical scores still vary.** This round
improves the test design. It does not establish correct clinical scores or an
improvement in clinical accuracy.

## What changed

| Earlier limitation | Change completed |
|---|---|
| Repeats also changed shuffled options | Eight saved answer/item pairs, three calls per fixed ascending/descending order |
| Controls were few and conspicuous | Six fictional record families, each with two states and two fixed answers |
| Future records carried helpful labels | Reordered records; availability exactly at the cutoff or one minute later |
| Refusal was insufficiently tested | Supported answers, warranted unsupported responses and unnecessary refusals |
| Answer quality and judge accuracy were mixed | Fixed answers judged against independently calculated record labels |

All **96 planned ratings** completed through AutoRubric 1.5.3 using KCL
`arc:apex`. Clinical answers, task context, provisional references and rubric
descriptions stayed unchanged. The record checks used a separate binary
task-support criterion; they are not Josh's clinical ordinal ratings.

## Record results

Both prompts classified **24/24 cells correctly**, with no false acceptance,
false rejection or abstention. Both passed every four-cell family. The extra
checking instructions showed **no label improvement on this set**.

| Family | State A → state B: supported answer | Correct cells per prompt |
|---|---|---:|
| T01: availability | E2 available at cutoff, value 120 → E2 one minute late, use E1 value 90 | 4/4 |
| T02: event ordinal | First X event, E1 value 5 → absent third X event, unsupported | 4/4 |
| T03: missing value | E2 records 11 → no recorded value, unsupported | 4/4 |
| T04: evidence identity | Entity P, value 100 from E1 → Q, same value from E2 | 4/4 |
| T05: time interval | 08:00–10:00 change +60 → 10:00–12:00 change −30 | 4/4 |
| T06: task mode | No observation at hour 10, unsupported → permitted interpolation, estimated 100 | 4/4 |

See [inputs and expected answers](cases.json) and [all 48 final judgments](objective_results.json).
These are six small related families, not 24 independent clinical cases. They
do not test SQL execution, database search or clinical diagnosis.

## Clinical repeat results

Five of eight selected pairs kept one score across all six calls. Three varied:

| Answer / item | Ascending, three calls | Descending, three calls | Finding |
|---|---|---|---|
| E02_INITIAL / D3a | 2, 4, 1 | 2, 4, 2 | Different credit for the same implicit summary, even within fixed order |
| E01_INITIAL / D3a | 3, 3, 2 | 5, 5, 5 | A substantial difference observed between option orders |
| U01_SEVERE / D2a | 4, 5, 4 | 4, 4, 4 | Excluding unsafe alternatives is sometimes accepted as meeting the top anchor |

Ascending and descending triplets were constant for 5/8 and 7/8 pairs respectively.
E01 suggests option-order sensitivity; three calls per order cannot establish
a general position bias. E02 shows variation without changing order. Explanations
also differ over whether a separate summary sentence is required. These findings
do not identify the correct clinical score. P01 now receives six 5s versus a
historical 3; that historical difference is not an isolated option-order test.
[RESULTS.md](RESULTS.md) contains all eight score triplets.

## Problems in explanations

Visible explanations were checked separately from labels. No score was replaced
or retried because it was unfavorable.

| Observation | Evidence | What can be concluded |
|---|---|---|
| Anchor status described incorrectly | Six D3a explanations call supplied levels unanchored or say descriptors are missing; the input lists all five levels | Confirmed inconsistency with the supplied criterion; the correct grade remains unresolved |
| Unsupported case detail recurs | Three of six P02 / D6c explanations add “unprovoked”; it is absent from the saved query and answer | Unsupported detail in the explanation; its effect on the grade needs review |
| Correct rejection includes an inaccurate detail | T05.A.a2 baseline says the order is reversed; E2→E3 is chronological, but belongs to the wrong interval | Correct rejection; inaccurate order-reversal claim |

[review_flags.json](review_flags.json) lists these findings and operation IDs.
This focused review is not an exhaustive clinical audit or a hallucination-rate
estimate. Stable high scores and correct labels do not validate every explanation.

## Next actions

1. **Clarify clinical interpretation.** Decide whether D3a requires a separate
   summary or accepts an implicit representation, and what D2a's top anchor means
   for urgent action. Clinically check references and essential safety points.
   These decisions remain pending.
2. **Test explanation fidelity in a new condition.** Require anchor-status claims
   to match displayed descriptions and case claims to remain tied to supplied
   facts. The current condition already contained cautions; more instructions
   alone must be tested. Preserve current scores and flags.
3. **Validate on new examples.** After rules are agreed, compare unchanged answers
   with blind human ratings. Include lower/middle-quality answers and harder tasks
   combining entity, event and availability conditions. Keep prompt-development
   examples separate from the final test set. More diseases alone would not address
   these scoring problems.

Clinical reference confirmation, human agreement and the deferred causal-reasoning
item D3d remain open. This study adds evaluator checks, not new clinical answers
or extra clinical rubric coverage.

## Time and usage

102 requests produced 96 accepted judgments and six timeouts. Delayed recovery
was recorded in [PLAN.md](PLAN.md) before retrying the unresolved item. Known usage
is **121,233 tokens** (108,926 input; 12,307 completion); six timed-out requests have
unknown usage. Client request durations total **860.374 seconds**; the first-to-last
attempt window is **888.373 seconds** and includes pauses. Unknown usage is not
zero; billing and GPU compute time are unknown.
