#!/usr/bin/env bash
# Red/Green regression test for explain.sh (and, through it, explain.py),
# the bundled page, and the build that produces it.
# Run with: bash tests/test_explain.sh
# Every scenario writes into its own throwaway folder under mktemp.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$HERE")"
SCRIPT="$SKILL_DIR/scripts/explain.sh"
PAGE="$SKILL_DIR/assets/scrolls-explainer.html"
BUILD="$SKILL_DIR/meta/generator/build.py"
NAME="scrolls-explainer.html"
VERSION="$(sed -n 's/^  version: "\(.*\)"$/\1/p' "$SKILL_DIR/SKILL.md" 2>/dev/null | head -n 1)"

TOTAL=0
FAILURES=0
SKIPPED=0
pass() { TOTAL=$((TOTAL + 1)); echo "PASS: $1"; }
fail() { TOTAL=$((TOTAL + 1)); FAILURES=$((FAILURES + 1)); echo "FAIL: $1"; }
skip() { SKIPPED=$((SKIPPED + 1)); echo "SKIP: $1"; }
assert() { local label="$1"; shift; if "$@"; then pass "$label"; else fail "$label"; fi; }
assert_exit() { if [ "$1" -eq "$2" ]; then pass "$3"; else fail "$3 -- expected exit $2, got $1"; fi; }
assert_match() {
  if printf '%s' "$1" | grep -qE -- "$2"; then pass "$3"; else
    fail "$3 -- expected to match: $2"; echo "--- actual ---"; printf '%s\n' "$1"; echo "---"; fi
}
assert_no_match() {
  if printf '%s' "$1" | grep -qE -- "$2"; then
    fail "$3 -- expected NOT to match: $2"; echo "--- actual ---"; printf '%s\n' "$1"; echo "---"; else pass "$3"; fi
}
same() { cmp -s "$1" "$2"; }
new_dir() { mktemp -d -t scrolls-explainer-test.XXXXXX; }
run() { local d="$1"; shift; OUT="$(cd "$d" && bash "$SCRIPT" "$@" 2>&1)"; CODE=$?; }

echo "=== 0: the skill declares a version ==="
assert_match "$VERSION" '^[0-9]+\.[0-9]+\.[0-9]+$' "SKILL.md has metadata.version"

echo "=== 1: no arguments writes ./$NAME ==="
d="$(new_dir)"
run "$d"
assert_exit "$CODE" 0 "exit 0"
assert "file written in the current folder" test -f "$d/$NAME"
assert "file is the bundled page, byte for byte" same "$d/$NAME" "$PAGE"
assert_match "$OUT" "wrote $(cd "$d" && pwd -P)/$NAME|wrote $d/$NAME" "prints the absolute path written"
assert_match "$OUT" "file://.*/$NAME" "prints a file:// URL to open"
assert_match "$OUT" "scrolls-explainer $VERSION" "names the version"

echo "=== 2: an existing, different file is never overwritten without -f ==="
d="$(new_dir)"
printf 'keep me\n' > "$d/$NAME"
run "$d"
assert_exit "$CODE" 3 "refused with exit 3"
assert_match "$OUT" "already exists.*-f" "says why and how to overwrite"
assert "file left untouched" grep -qx 'keep me' "$d/$NAME"

echo "=== 3: -f / --force overwrites ==="
run "$d" -f
assert_exit "$CODE" 0 "-f exit 0"
assert "-f replaced the file" same "$d/$NAME" "$PAGE"
printf 'keep me\n' > "$d/$NAME"
run "$d" --force
assert "--force replaced the file" same "$d/$NAME" "$PAGE"

echo "=== 4: an identical file is reported as up to date, exit 0 ==="
run "$d"
assert_exit "$CODE" 0 "exit 0 without -f"
assert_match "$OUT" "up to date" "says it is already up to date"

echo "=== 5: -o FILE writes there, creating missing folders ==="
d="$(new_dir)"
run "$d" -o "out/nested/explainer.html"
assert_exit "$CODE" 0 "exit 0"
assert "written to the given file" same "$d/out/nested/explainer.html" "$PAGE"
assert "nothing written to the default name" test ! -e "$d/$NAME"
run "$d" --output "$d/abs.html"
assert "--output with an absolute path" same "$d/abs.html" "$PAGE"

echo "=== 6: -o DIR writes DIR/$NAME ==="
d="$(new_dir)"; mkdir -p "$d/site"
run "$d" -o site
assert_exit "$CODE" 0 "existing folder: exit 0"
assert "existing folder gets $NAME" same "$d/site/$NAME" "$PAGE"
run "$d" -o "newdir/"
assert "trailing slash means a folder, created if missing" same "$d/newdir/$NAME" "$PAGE"

echo "=== 7: --version and --help ==="
d="$(new_dir)"
run "$d" --version
assert_exit "$CODE" 0 "--version exit 0"
assert_match "$OUT" "^scrolls-explainer $VERSION$" "--version prints the SKILL.md version"
run "$d" -h
assert_exit "$CODE" 0 "-h exit 0"
assert_match "$OUT" "-o, --output" "-h documents -o"
assert_match "$OUT" "-f, --force" "-h documents -f"
assert_match "$OUT" "--open" "-h documents --open"
assert "-h writes nothing" test ! -e "$d/$NAME"

echo "=== 8: usage errors exit 2 and write nothing ==="
d="$(new_dir)"
run "$d" --bogus
assert_exit "$CODE" 2 "unknown flag: exit 2"
assert "unknown flag writes nothing" test ! -e "$d/$NAME"
run "$d" -o
assert_exit "$CODE" 2 "-o without a value: exit 2"
run "$d" extra-arg
assert_exit "$CODE" 2 "stray argument: exit 2"

echo "=== 9: --open hands the file:// URL to the browser ==="
d="$(new_dir)"
OPENED="$d/opened.txt"
OUT="$(cd "$d" && BROWSER="sh -c 'printf %s \"\$0\" > $OPENED' %s" bash "$SCRIPT" --open 2>&1)"; CODE=$?
assert_exit "$CODE" 0 "exit 0"
assert "browser command ran" test -f "$OPENED"
assert_match "$(cat "$OPENED" 2>/dev/null)" "^file://.*/$NAME$" "browser got the file:// URL"
OUT="$(cd "$(new_dir)" && BROWSER=false bash "$SCRIPT" --open 2>&1)"; CODE=$?
assert_exit "$CODE" 0 "a failing browser is not an error"
assert_match "$OUT" "open it by hand|could not open" "says to open the file by hand"

echo "=== 10: the bundled page ==="
P="$(cat "$PAGE" 2>/dev/null)"
assert "page exists" test -s "$PAGE"
assert_match "$P" "<meta name=\"scrolls-explainer-version\" content=\"$VERSION\">" "page is stamped with the SKILL.md version"
assert_match "$P" "scrolls $VERSION" "version shows in the page header"
for c in setup update hide unhide remove restore help; do
  assert_match "$P" "\"label\": ?\"/scrolls-$c\"" "has a /scrolls-$c tab"
done
assert_match "$P" '"session":' "has the New session tab"
assert_match "$P" "rf-callout" "has step callouts"
assert_match "$P" "data-keys-help" "has the keyboard shortcut panel"
assert_no_match "$P" '<script[^>]+src=|<link[^>]+href=|@import|url\(https?:' "loads nothing from the network"

echo "=== 11: the bundled page is what the build produces now ==="
NF="$SKILL_DIR/../../diagrams/network-flow/scripts/render.py"
if [ -f "$NF" ] || [ -n "${NETWORK_FLOW_DIR:-}" ]; then
  OUT="$(python3 "$BUILD" --check 2>&1)"; CODE=$?
  assert_exit "$CODE" 0 "build --check: page is up to date (run: python3 meta/generator/build.py)"
  [ "$CODE" -eq 0 ] || printf '%s\n' "$OUT"
else
  skip "network-flow renderer not found next to this skill (set NETWORK_FLOW_DIR)"
fi

echo "=== 12: the page works in a real browser ==="
if command -v node >/dev/null 2>&1 && node -e "require('playwright')" >/dev/null 2>&1; then
  OUT="$(node "$HERE/browser/check_page.cjs" "$PAGE" 2>&1)"; CODE=$?
  assert_exit "$CODE" 0 "browser checks (tests/browser/check_page.cjs)"
  [ "$CODE" -eq 0 ] || printf '%s\n' "$OUT"
else
  skip "Node.js with Playwright not available"
fi

echo "=== 13: git ignores none of the skill's files (they would silently not ship) ==="
if git -C "$SKILL_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  IGN="$(cd "$SKILL_DIR" && find . -type f ! -path '*/__pycache__/*' ! -name '*.pyc' -print0 | git check-ignore -z --stdin --no-index 2>/dev/null | tr '\0' '\n')"
  if [ -z "$IGN" ]; then pass "no file is git-ignored"; else fail "git-ignored files: $IGN"; fi
else
  skip "not inside a git repository"
fi

echo
echo "$((TOTAL - FAILURES))/$TOTAL passed, $SKIPPED skipped"
[ "$FAILURES" -eq 0 ]
