#!/usr/bin/env bash
set -euo pipefail

editor_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export POKEGO_EDITOR_MODE=production
exec "${PYTHON_BIN:-python}" "${editor_dir}/main.py"
