# auto rubric

An English command-line deployment of [AutoRubric](https://github.com/delip/autorubric), a Python library for evaluating text against weighted criteria with an LLM judge.

This repository builds on **AutoRubric v1.5.3** and provides a ready-to-configure runner for the **KCL OpenAI-compatible API**. The default model is `arc:nexus`. Commands, samples, and requested grading explanations are in English.

The [clinical reasoning pilot](experiments/clinical_reasoning_pilot/README.md) adds findings from 16 answers and 93 selected item ratings, numeric result exports, and the experiment runner. Its public tests use authored software fixtures; the original clinical inputs and full rubric are kept separately. Start with the [experimental findings](experiments/clinical_reasoning_pilot/FINDINGS.md).

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
