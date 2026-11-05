#!/usr/bin/env bash
# Thin bash launcher for remove.py — all logic lives there, so this and
# remove.ps1 can never drift apart. Every argument is passed through
# unchanged; see remove.py's header for the full option reference.
#
# Usage:
#   remove.sh [-p BASE ...] [-t | -l] [-r] [-x [TARGETS]] ... [-y] [-n] [--no-commit]
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
  echo "remove.sh needs Python 3.9+ (python3 or python) on PATH." >&2
  exit 2
fi

exec "$PY" "$HERE/remove.py" "$@"
