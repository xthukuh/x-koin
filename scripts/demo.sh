#!/usr/bin/env bash
# Build and serve the investor demo (demo/index.html -> demo/dist/index.html)
# on http://127.0.0.1:8090/. No build tools beyond stdlib http.server.
#   scripts/demo.sh
#   PYTHON=.venv/Scripts/python.exe scripts/demo.sh   # Windows Git Bash
set -euo pipefail
PYTHON="${PYTHON:-python3}"
cd "$(dirname "$0")/.."
exec "$PYTHON" demo/serve.py
