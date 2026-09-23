#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
if ! command -v uv >/dev/null 2>&1; then
  echo "Install uv first: https://docs.astral.sh/uv/getting-started/installation/" >&2
  exit 2
fi
uv sync --locked --python 3.12 --cache-dir "$PROJECT_DIR/.cache/uv"
if [[ ! -e .env ]]; then
  (umask 077; cp local/.env.example .env)
fi
./run.sh check
