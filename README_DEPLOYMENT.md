# AutoRubric local deployment

This project is based on **AutoRubric v1.5.3**. The setup script creates an isolated Python 3.12 environment in `.venv` using dependencies pinned by the official `uv.lock`.

Upstream source revision: `2bb17cdaeb075813045c34926fd47aaa19451b04`.

The command-line interface, sample inputs, rubric, configuration comments, and this guide use English. The grading prompt requests explanations in English, including when evaluating submissions in other languages. Direct quotations retain their original wording.

## Quick start

For a fresh checkout, install [uv](https://docs.astral.sh/uv/getting-started/installation/), then run:

```bash
git clone https://github.com/kayley11/auto-rubric.git
cd auto-rubric
./setup.sh
```

Setup creates `.env` from `local/.env.example`. Open `.env` in your editor and fill in `OPENAI_API_KEY`. An existing `.env` is preserved. No API key is included in this repository.

From the configured project directory:

```bash
./run.sh check
./run.sh smoke
./run.sh grade
```

- `check` validates local configuration without making API calls.
- `smoke` verifies the grading pipeline using fixed mock responses. Its score is a deployment test, not a model judgment.
- `grade` evaluates the sample using the configured KCL model and saves a JSON report in `local/results/`.

AutoRubric is a Python evaluation library. This deployment provides a command-line runner; there is no web server to start.

## Current configuration

Store your API key in the project-root `.env`. Setup creates this file with permissions `600`, and Git ignores it.

```dotenv
AUTORUBRIC_MODEL=openai/arc:nexus
OPENAI_BASE_URL=https://ai.create.kcl.ac.uk/api/v1
AUTORUBRIC_MAX_TOKENS=1024
AUTORUBRIC_TIMEOUT=180
AUTORUBRIC_CONCURRENCY=1
```

The `openai/` prefix selects LiteLLM's OpenAI-compatible protocol. The model ID sent to KCL is `arc:nexus`. The base URL must not include `/chat/completions`; the client appends that path.

Concurrency defaults to `1` to keep requests within the service's per-key concurrency limit. Other applications using the same key also share that limit.

The following models were confirmed by KCL's models API during the initial deployment. Availability may change:

| Model | AUTORUBRIC_MODEL value |
| --- | --- |
| arc:nexus — default; full evaluation verified | openai/arc:nexus |
| arc:apex | openai/arc:apex |
| arc:lite | openai/arc:lite |
| arc:nano | openai/arc:nano |
| arc:apex_pro | openai/arc:apex_pro |

`arc:apex` passed a short structured-output request during setup, but its full evaluation took substantially longer, so the default is `arc:nexus`.

To select another model for one run:

```bash
AUTORUBRIC_MODEL='openai/arc:apex' ./run.sh grade
```

Shell environment variables take precedence over `.env`. If `OPENAI_BASE_URL` is empty, the runner also accepts `OPENAI_API_BASE` and otherwise uses the official OpenAI endpoint. When changing providers, set the model, endpoint, and the corresponding provider's API key together. The endpoint must support structured JSON output.

## Evaluate your own text

```bash
./run.sh grade \
  --rubric '/absolute/path/rubric.yaml' \
  --input '/absolute/path/answer.txt' \
  --query-file '/absolute/path/question.txt' \
  --output '/absolute/path/result.json'
```

The rubric accepts official AutoRubric YAML or JSON formats. Text files use UTF-8, and `--query-file` is optional. Positive weights reward satisfied criteria; negative weights penalize detected errors. Scores are normalized to 0–1 by default.

The included English sample asks for France's capital and continent. Its three criteria check for Paris, Europe, and the incorrect claim that London is France's capital. The expected verdicts are `MET`, `MET`, and `UNMET`, giving a score of `1.0`.

Reports include the model, requested explanation language (`en`), per-criterion verdicts and explanations, score, and available usage statistics. Offline reports use `mode: offline_smoke`; real evaluations use `mode: live`. Failed or partially failed evaluations return a nonzero exit code and set `successful: false`.

Live grading sends the submission and rubric to the configured provider. Cost estimates, where available, use LiteLLM's bundled pricing table and may not reflect KCL's billing.

## Reproduce the environment

```bash
./setup.sh
```

The setup script runs `uv sync --locked --python 3.12` and preserves an existing `.env`. A first installation requires network access and `uv`; uv can download Python 3.12 if it is not installed. The shell scripts support macOS and Linux; Windows users can run them in WSL.

To use the library directly:

```bash
source .venv/bin/activate
python -c 'import autorubric; print(autorubric.__version__)'
```

Local additions are in `run.sh`, `setup.sh`, and `local/`. Upstream library code remains in `src/autorubric/`.

## Verification records

The initial installation passed dependency checks for 75 packages and all 258 selected upstream core tests. The KCL `arc:nexus` integration also passed a three-criterion live evaluation.

Before publishing this repository, the full upstream test suite passed: **867 tests** on Python 3.12. Ruff lint and formatting checks, shell syntax checks, and the offline grading check also passed.

The English offline and live evaluations both passed. The live English sample returned `MET`, `MET`, and `UNMET`, with a score of `1.0` and English explanations for all three criteria.

Reports are generated locally in `local/results/` and are excluded from Git. A fresh checkout does not include historical reports. Run `./run.sh smoke` to reproduce the offline verification, or `./run.sh grade` to create a new live report with your own API key.

To inspect the environment:

```bash
uv pip check --python .venv/bin/python --cache-dir .cache/uv
LITELLM_LOCAL_MODEL_COST_MAP=True .venv/bin/python -m pytest \
  tests/rubric tests/graders tests/llm tests/test_scoring.py -q
```

Official resources: [Quickstart](https://autorubric.org/docs/quickstart/) · [API reference](https://autorubric.org/docs/api/) · [Source](https://github.com/delip/autorubric/tree/v1.5.3)
