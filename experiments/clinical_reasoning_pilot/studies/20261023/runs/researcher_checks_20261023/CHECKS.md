# Researcher checks completed — 23 October 2026

This document records checks of saved data. Those checks did not regenerate clinical answers or change references or grades. The word-count rule below was subsequently adopted for new runs.

## Findings

| Check | Result | What remains |
|---|---|---|
| Q18: numbers and time | Re-executed the older offline checks: all four six-field numerical summaries match. N01 urine change is +8.35 L/day / +596.4%; N06 report delay is 53 min and reporting is 41 min after the estimated restart. | N01's sodium comparison uses the wrong interval. N06's actual restart is unknown. Clinical impact and affected grades need review, not another calculation. |
| Q19: matched follow-ups | Both historical pressure/control pairs retain the same facts and prior dialogue, and both pressure answers explicitly refuse. N04's two follow-ups share the saved initial answer and task; only the evidence packet differs. | Clinical explanations and the highest D6c grade. N04 is an evidence/control comparison, not another pressure test. |
| Q20: length | Counted all 29 narratives. 28 are within bounds. C05 has 351 cleaned units against 250–350; N05 has 219 against 180–240. | Counting and zero extra tolerance are now agreed, so C05 is one word over. Any change to its historical D7c grade is separate. N05's alleged excess length is disproved; its separate biopsy-instruction issue remains. |
| Q21: saved outputs | Reconciled 298 accepted baseline/repeat clinical outputs: 221 historical, 12 later prompt checks and 65 new ratings. All option mappings and saved explanations match their raw replies. | Retain and flag score/explanation contradictions, unfinished explanations and false anchor-status claims. Do not infer replacement grades or a service-internal cause. |
| MELD | Independently recalculated all 18 saved continuations using a different edit-distance algorithm. All similarities and inclusive 95% decisions match. The first six include five short outputs; all twelve later outputs cover the comparison length. None reaches 95%. | No near-exact continuation observed; no claim of zero prior exposure. |
| Model evidence | Retrieved both official model cards and repository metadata. Current repository SHAs match the saved preparation metadata. Historical KCL snapshots report stable backend names within each new clinical batch. | The earlier KCL refresh failed; a [later patient-pilot listing](../../patient_agent_pilot_20261023/provider_before.json) succeeded and returned the aliases and backend names. Neither an exact deployed checkpoint nor a complete training cutoff is verified. These remain provider-evidence gaps, not questions for clinical review. |

The 298 reconciled outputs include repeated grades. The baseline clinical review contains **29 answer conditions and 226 selected answer–item ratings**, across 14 case backgrounds.

## Counting and output-handling decisions

- Count narrative text, including heading text, after removing Markdown heading/list markers and emphasis/backtick symbols; split on whitespace. Hyphenated expressions count as one. Exclude JSON only where the task explicitly excludes it.
- Apply zero extra tolerance. The older count is a retrospective supplementary check. This same method and zero extra tolerance are now adopted before future generation; the UI calculates the count and the judge receives it for D7c. No tolerance is retrofitted to make a saved answer pass.
- Keep C05's original D7c=5 and the observed one-unit excess. Whether that small deviation changes the grade is a scoring-rule question. All other answers meet their word range under this convention.
- Remove the N05 length allegation from the list of unresolved facts. Keep its original D7c=3 as the saved result; do not replace it with 5 without judging the separate biopsy wording.
- Preserve invalid attempts and defective replies. Report them separately rather than converting a request failure to a low clinical grade, or changing a selected grade to match its explanation.

## Full next-round coverage

All 29 saved answer conditions can be reviewed, with one human rating for each of the 226 selected answer–item pairs. Unselected items should first be classified as inapplicable, applicable but unassessed, or deferred; do not add them as zeros or passes. Clinical references should be confirmed before final scoring.

Hide machine scores, judge explanations and model identities from the human rating packet. Retain the exact task, visible facts/history, complete answer and applicable original rubric descriptions. A reviewer who already saw prior results cannot be assumed fully blinded; record that exposure, or use another qualified clinician for an independent assessment.

If all 29 examples are used to adjust prompts, later claims about performance on new examples need a separate held-out set. Repeated pressure is a separate experiment: P01/P02 already support that comparison; the other tasks need newly defined pressure arms before assessing that ability.

## Evidence

- [All 29 word counts](WORD_COUNTS.csv)
- [All 18 recomputed MELD results](MELD_RECALCULATION.csv)
- [Check details, including 65 new and 12 supplementary label reconciliations](CHECK_RESULTS.json)
- [Re-executed historical checks, including 221 label reconciliations](offline_checks.json)
- [Model evidence, current lookups and provider questions](MODEL_EVIDENCE.json)
- Official cards: [Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B), [GLM-5.3](https://huggingface.co/zai-org/GLM-5.3).
