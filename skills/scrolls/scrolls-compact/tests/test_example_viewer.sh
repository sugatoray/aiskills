#!/usr/bin/env bash
# Red/Green check of assets/example-viewer.html: static checks, then browser
# checks (online, and offline with the plain-text fallback) when Node.js and
# Playwright are available.
# Run with: bash tests/test_example_viewer.sh
# Rebuild the page with: python3 scripts/build_example_viewer.py
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAGE="$HERE/../assets/example-viewer.html"
status=0
python3 "$HERE/check_example_viewer.py" || status=1
if command -v node >/dev/null 2>&1 && node -e "require('playwright')" >/dev/null 2>&1; then
  if [ -f "$PAGE" ]; then
    echo "--- browser"
    node "$HERE/browser/check_example_viewer.cjs" "$PAGE" || status=1
    echo "--- browser, offline"
    VIEWER_OFFLINE=1 node "$HERE/browser/check_example_viewer.cjs" "$PAGE" || status=1
  else
    echo "FAIL browser checks: no page to check"; status=1
  fi
else
  echo "SKIP browser checks (needs node and playwright)"
fi
[ "$status" -eq 0 ] && echo "ALL OK" || echo "FAILED"
exit "$status"
