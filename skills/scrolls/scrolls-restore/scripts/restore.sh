#!/usr/bin/env bash
# Thin bash launcher for restore.py — all logic lives there, so this and
# restore.ps1 can never drift apart. Every argument is passed through
# unchanged; see restore.py's header for the full option reference.
#
# Usage:
#   restore.sh [COMMIT] [-p BASE ...] [-t | -l] [-r] [--onto REF [-b BRANCH]] [--full] [-f] [-y] [-n] [--no-commit]
#   restore.sh --list [--all]
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PY=""
for cand in python3 python; do
  if command -v "$cand" >/dev/null 2>&1 && "$cand" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)' 2>/dev/null; then
    PY="$cand"
    break
  fi
done
if [ -z "$PY" ]; then
  echo "restore.sh needs Python 3.9+ (python3 or python) on PATH." >&2
  exit 2
fi

exec "$PY" "$HERE/restore.py" "$@"
