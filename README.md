# auto rubric

An English local deployment of [AutoRubric](https://github.com/delip/autorubric), with a command-line runner and a clinical evaluation interface.

This repository builds on **AutoRubric v1.5.3** and provides a ready-to-configure runner for the **KCL OpenAI-compatible API**. The default model is `arc:nexus`. Commands, samples, and requested grading explanations are in English.

The [clinical reasoning experiments](experiments/clinical_reasoning_pilot/README.md) include the original rubric pilot, six new cases, separate MELD checks and the latest eight-case comparison across three models. Start with the [three short English reports and complete results](experiments/clinical_reasoning_pilot/studies/20261023/README.md). Saved answers, item scores, judge explanations and earlier comparison rounds are included; clinical references remain provisional.

Public website: **[AutoRubric clinical workspace](https://auto-rubric.kayley1026lzt.chatgpt.site)**. Saved results are public; generation, scoring and review saving require an authorised account. The Python backend runs on the host computer, so live evaluations need that computer and its tunnel online. No paid hosting service was opened. See the [public deployment and access guide](arena/hosting/README.md), [中文使用说明](arena/hosting/USAGE_CN.md), and [deployment validation with complete outputs](arena/validation/20261026-public/README.md). API keys and access passwords are not included in this repository.

The [clinical workspace](arena/README.md) supports original or proposed D3a/D5c rules, eight fixed-fact patient interviews, evidence checks, independent human review and export. The study includes the 25 October N04 follow-up and repeated scores alongside the original 24-interview comparison. Case input comes first; settings expand on demand; results show criterion names and main findings. Clinical references and candidate information requirements remain **awaiting confirmation**. Historical outputs and internal version IDs are preserved; public display labels use generic wording.

For local use, run `./run-ui.sh` after setup and open **http://127.0.0.1:8765**. The [26 October interface validation](arena/validation/20261026-ui/README.md), [25 October complete outputs](arena/validation/20261025-ui/README.md) and [24 October validation](arena/validation/20261024/README.md) remain available. New private evaluations stay local and are not automatically added to the public study.

## Quick start

The setup scripts support macOS and Linux, or Windows through WSL. Install [uv](https://docs.astral.sh/uv/getting-started/installation/) first. Setup creates a Python 3.12 virtual environment and installs the locked dependencies; uv can download Python if needed.

```bash
git clone https://github.com/kayley11/auto-rubric.git
cd auto-rubric
./setup.sh
```

Open the generated `.env` file in your editor and set your own API key:

```dotenv
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=https://ai.create.kcl.ac.uk/api/v1
AUTORUBRIC_MODEL=openai/arc:nexus
```

The base URL ends with `/api/v1`; do not append `/chat/completions`. No API key is included in the repository. Existing `.env` settings are preserved when setup runs again.

```bash
./run.sh check   # Check configuration without calling the model
./run.sh smoke   # Run an offline check with fixed mock responses
./run.sh grade   # Evaluate the included sample through the configured API
```

`smoke` works without an API key. `grade` requires a working key and sends the rubric and submission to the configured provider. JSON reports are written to `local/results/`, which is ignored by Git.

The sample checks whether an answer correctly identifies Paris as France's capital and Europe as its continent, without incorrectly naming London. Its expected verdicts are `MET`, `MET`, and `UNMET`, with a normalized score of `1.0`.

## Grade your own text

```bash
./run.sh grade \
  --rubric /absolute/path/rubric.yaml \
  --input /absolute/path/answer.txt \
  --query-file /absolute/path/question.txt \
  --output /absolute/path/result.json
```

Rubrics support AutoRubric YAML or JSON. Text files use UTF-8, and `--query-file` is optional. Reports contain criterion verdicts, explanations, the score, and available usage statistics. Incomplete evaluations return a nonzero exit code.

## Project files

| Path | Purpose |
| --- | --- |
| `setup.sh` | Install dependencies and create a local configuration template |
| `run.sh` | Run configuration checks, offline verification, or live grading |
| `local/run.py` | English grading runner |
| `run-ui.sh`, `arena/` | Local clinical evaluation UI, model connection and human review |
| `arena/hosting/` | Public Site gateway, deployment preparation and usage guides |
| `arena/validation/20261026-public/` | Public deployment checks and complete non-secret validation outputs |
| `local/.env.example` | KCL connection settings with a blank API key |
| `local/rubric.yaml` | Sample weighted rubric |
| `local/query.txt`, `local/answer.txt` | Sample question and answer |
| `src/autorubric/` | Upstream AutoRubric library |
| `tests/` | Upstream test suite |
| `README_DEPLOYMENT.md` | Configuration, model selection, and verification details |
| `README_UPSTREAM.md` | Original upstream README |

Local credentials, virtual environments, caches, and generated grading reports are excluded from Git. Upstream website and PyPI publishing workflows run only in the original upstream repository.

## Development checks

```bash
uv run --locked ruff check .
uv run --locked ruff format --check .
LITELLM_LOCAL_MODEL_COST_MAP=True uv run --locked pytest -q
```

## Attribution and license

Based on [delip/autorubric](https://github.com/delip/autorubric), version `v1.5.3`, revision `2bb17cdaeb075813045c34926fd47aaa19451b04`. Upstream authorship, commit history, and the [MIT license](LICENSE) are retained.

See the [upstream README](README_UPSTREAM.md) for the library's original documentation and research citation, or the [deployment guide](README_DEPLOYMENT.md) for this repository's local workflow.
