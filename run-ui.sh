#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -x "$PROJECT_DIR/.venv/bin/python" ]]; then
  echo "Python environment not found. Run ./setup.sh first." >&2
  exit 2
fi
cd "$PROJECT_DIR/arena"
if [[ ! -d node_modules ]]; then
  npm ci --prefer-offline --no-audit --no-fund
fi
npm run build
exec "$PROJECT_DIR/.venv/bin/python" server.py "$@"
