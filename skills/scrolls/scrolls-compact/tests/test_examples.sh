#!/usr/bin/env bash
# Red/Green check of assets/EXAMPLES.md: structure, coverage of every flag
# and exit code, and a replay of every example against the real script.
# Run with: bash tests/test_examples.sh
# To see actual outputs (when adding or changing an example):
#   python3 tests/check_examples.py --print
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$HERE/check_examples.py" "$@"
