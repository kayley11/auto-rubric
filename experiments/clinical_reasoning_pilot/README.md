# Clinical reasoning rubric pilot

The pilot applies a supplied clinical reasoning rubric through AutoRubric, then
checks the resulting scores, explanations and failure records. The extension
completed **16 answers across seven parent case clusters and 93 selected item
ratings**. Independent clinical ratings remain pending.

Start with the [experiment design and results](review/DECISIONS.md),
[clinical/scoring decisions](review/INDEPENDENT_REVIEW.md) and
[case materials](review/REVIEW_MATERIALS.md). The three review files include the
October checks and retain the original clinical answers.

## What is available

| Material | Location and scope |
| --- | --- |
| Review documents | [review/](review/): experiment explanation, focused clinical/rubric decisions with completed checks separated, 21 complete clinical answers and all baseline/repeat/record judgments |
| Experimental findings | [FINDINGS.md](FINDINGS.md): method, observations, limitations and next experiments |
| New evaluator checks | [judge_checks/ANALYSIS.md](judge_checks/ANALYSIS.md): 96 completed ratings, score variability, explanation problems and next decisions |
| Q18–Q21 follow-up | [Completed checks](review/REVIEW_MATERIALS.md#q18-q21-checks): four numerical outputs, two dialogue pairs, 21 length checks, 221 raw-reply reconciliations and 12 new prompt judgments |
| Item scores | [score_table.json](results/score_table.json): 93 baseline rows from `extension_v2_1_http`; free-text reasons omitted |
| Counts and resource use | [extension_summary.json](results/extension_summary.json): unchanged aggregate export, with generation, failed scoring, diagnostics and recovery separated |
| Existing runner | `portable.py` and the seven supporting scripts; complete clinical reruns require the original data workspace |
| Public checks | [tests/test_portability.py](tests/test_portability.py): authored software fixtures and checks of the numeric exports |
| Repository integration | [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md): what was included, the three fixes and verification results |

The review documents contain condensed book-based facts, authored tasks, all 21
clinical model answers, provisional references, rubric descriptions and complete
final grading explanations. The entire book, original PDF, credentials, raw provider
responses and structured clinical execution workspace are not included. The two
preparation scripts remain omitted. Clinical references and grades are unconfirmed.

## Run the public checks

After the repository's [setup](../../README.md#quick-start), run from the repository root:

```sh
uv run --locked pytest experiments/clinical_reasoning_pilot/tests -q
```

These checks require no key or clinical dataset. They exercise the real AutoRubric
parser with mock responses, including shuffled score labels, abstention and a
label/position mismatch. They also check checkpoint reuse, temporal-field validation
and reconciliation of the 93 exported scores. The root `pytest` command discovers
them automatically.

For a live introduction using an openly included sample, use `./run.sh grade` from
the repository root. That geography example is separate from this clinical study.

## Reproduce the retained clinical records

Supply a complete copy of the original experiment workspace, including its frozen
inputs, prior turns and saved operations. `--workspace` selects that directory
explicitly; there is no adjacent-directory lookup. The archive is not in this repository.

The commands below run from the repository root in its existing environment. For a separate
environment matching the recorded package versions, install this module's
[requirements.txt](requirements.txt) into a Python 3.12 virtual environment.

```sh
uv run --locked python experiments/clinical_reasoning_pilot/portable.py --workspace /path/to/full-pilot check
uv run --locked python experiments/clinical_reasoning_pilot/portable.py --workspace /path/to/full-pilot replay
uv run --locked python experiments/clinical_reasoning_pilot/portable.py --workspace /path/to/full-pilot report --all
uv run --locked python experiments/clinical_reasoning_pilot/portable.py --workspace /path/to/full-pilot validate
```

Use a working copy: report generation updates derived reports and timestamps.
Replay is offline, checks saved request fingerprints and prohibits network calls.
Missing inputs produce an error; public fixtures are never substituted for study inputs.

For new live scoring, use `portable.py new-condition --help` and `portable.py run --help`.
Keep a new condition separate from the completed one and supply credentials through
`--env-file` or the selected workspace's `.env`; [.env.example](.env.example) has no key.

## Run the new record checks

These fictional tasks require no book, clinical answers or original rubric anchors.
They assess record/task support using a separate binary criterion through AutoRubric.
They do not establish clinical rubric accuracy. From the repository root:

```sh
uv run --locked python experiments/clinical_reasoning_pilot/judge_checks/run.py prepare --run-dir /tmp/autorubric-judge-checks
uv run --locked python experiments/clinical_reasoning_pilot/judge_checks/run.py run --run-dir /tmp/autorubric-judge-checks --env-file .env
uv run --locked python experiments/clinical_reasoning_pilot/judge_checks/run.py report --run-dir /tmp/autorubric-judge-checks
```

Use a fresh directory for each new condition. The standalone preparation plans
48 ratings on KCL `arc:apex`; supply the existing KCL URL and key locally. Add
`--clinical-workspace /path/to/full-pilot` to preparation to include the 48 retained
clinical repeat ratings used in this study. That private workspace is required only
for clinical repeats. Successful operations resume without another call; failed
attempts remain saved. Reporting writes local detailed results and updates the
numeric summary and results page in this repository copy. Use a separate clone if
you want to retain the published summary while rerunning.
