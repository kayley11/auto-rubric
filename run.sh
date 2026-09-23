#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -x "$PROJECT_DIR/.venv/bin/python" ]]; then
  echo "Virtual environment not found. Run: $PROJECT_DIR/setup.sh" >&2
  exit 2
fi
exec "$PROJECT_DIR/.venv/bin/python" "$PROJECT_DIR/local/run.py" "$@"
