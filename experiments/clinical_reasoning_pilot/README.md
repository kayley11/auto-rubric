# Clinical reasoning rubric pilot

The pilot applies a supplied clinical reasoning rubric through AutoRubric, then
checks the resulting scores, explanations and failure records. The extension
completed **16 answers across seven parent case clusters and 93 selected item
ratings**. Independent clinical ratings remain pending.

Start with [findings and remaining questions](FINDINGS.md). The useful result is an
inspectable account of where automatic scoring works technically and where its
interpretation needs review.

## What is available

| Material | Location and scope |
| --- | --- |
| Experimental findings | [FINDINGS.md](FINDINGS.md): method, observations, limitations and next experiments |
| Item scores | [score_table.json](results/score_table.json): 93 baseline rows from `extension_v2_1_http`; free-text reasons omitted |
| Counts and resource use | [extension_summary.json](results/extension_summary.json): unchanged aggregate export, with generation, failed scoring, diagnostics and recovery separated |
| Existing runner | `portable.py` and the seven supporting scripts; complete clinical reruns require the original data workspace |
| Public checks | [tests/test_portability.py](tests/test_portability.py): authored software fixtures and checks of the numeric exports |
| Repository integration | [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md): what was included, the three fixes and verification results |

The book passages, original rubric anchor wording, case/reference files, complete
model answers, free-text grading reasons and raw provider responses are retained
locally. The two preparation scripts embed research materials and are also omitted.
This public subset supports inspecting the reported numbers and testing the runner's
key behaviors. Assessing an individual clinical score requires the retained answer,
reference and rubric.

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
