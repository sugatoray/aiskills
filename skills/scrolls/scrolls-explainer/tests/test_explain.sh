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
BUILD="$SKILL_DIR/scripts/build_page.py"
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
# Showing the page opens a browser; never a real one from a test.
export BROWSER=true

echo "=== 0: the skill declares a version ==="
assert_match "$VERSION" '^[0-9]+\.[0-9]+\.[0-9]+$' "SKILL.md has metadata.version"

echo "=== 1a: no arguments is --show: it opens the bundled page and copies nothing ==="
d="$(new_dir)"
OUT="$(cd "$d" && BROWSER="sh -c 'printf %s \"\$0\" > $d/opened.txt' %s" bash "$SCRIPT" 2>&1)"; CODE=$?
assert_exit "$CODE" 0 "exit 0"
assert_match "$OUT" "file://.*assets/$NAME" "prints the bundled page's URL"
assert_match "$(cat "$d/opened.txt" 2>/dev/null)" "^file://.*/assets/$NAME$" "opens the bundled page itself"
assert "nothing written in the current folder" test ! -e "$d/$NAME"

echo "=== 1: -o . writes ./$NAME ==="
d="$(new_dir)"
run "$d" -o .
assert_exit "$CODE" 0 "exit 0"
assert "file written in the current folder" test -f "$d/$NAME"
assert "file is the bundled page, byte for byte" same "$d/$NAME" "$PAGE"
assert_match "$OUT" "wrote $(cd "$d" && pwd -P)/$NAME|wrote $d/$NAME" "prints the absolute path written"
assert_match "$OUT" "file://.*/$NAME" "prints a file:// URL to open"
assert_match "$OUT" "scrolls-explainer $VERSION" "names the version"

echo "=== 2: an existing, different file is never overwritten without -f ==="
d="$(new_dir)"
printf 'keep me\n' > "$d/$NAME"
run "$d" -o .
assert_exit "$CODE" 3 "refused with exit 3"
assert_match "$OUT" "already exists.*-f" "says why and how to overwrite"
assert "file left untouched" grep -qx 'keep me' "$d/$NAME"

echo "=== 3: -f / --force overwrites ==="
run "$d" -o . -f
assert_exit "$CODE" 0 "-f exit 0"
assert "-f replaced the file" same "$d/$NAME" "$PAGE"
printf 'keep me\n' > "$d/$NAME"
run "$d" -o . --force
assert "--force replaced the file" same "$d/$NAME" "$PAGE"

echo "=== 4: an identical file is reported as up to date, exit 0 ==="
run "$d" -o .
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
run "$d" -f
assert_exit "$CODE" 2 "-f without -o: exit 2 (nothing to overwrite)"
assert "-f without -o writes nothing" test ! -e "$d/$NAME"

echo "=== 9: --open hands the file:// URL to the browser ==="
d="$(new_dir)"
OPENED="$d/opened.txt"
OUT="$(cd "$d" && BROWSER="sh -c 'printf %s \"\$0\" > $OPENED' %s" bash "$SCRIPT" -o . --open 2>&1)"; CODE=$?
assert_exit "$CODE" 0 "exit 0"
assert "browser command ran" test -f "$OPENED"
assert_match "$(cat "$OPENED" 2>/dev/null)" "^file://$d/$NAME$" "browser got the copy's file:// URL"
OUT="$(cd "$(new_dir)" && BROWSER=false bash "$SCRIPT" -o . --open 2>&1)"; CODE=$?
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
  assert_exit "$CODE" 0 "build --check: page is up to date (run: bash scripts/explain.sh --build)"
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

# ---- --show and --build -------------------------------------------------
# --build runs against a throwaway copy of the skills, laid out like this
# repository (skills/scrolls/scrolls-* + skills/diagrams/network-flow) or like
# a flat install (skills/scrolls-* + skills/network-flow side by side).
SCROLLS_SRC="$(dirname "$SKILL_DIR")"
NF_SRC="$SKILL_DIR/../../diagrams/network-flow"
unset NETWORK_FLOW_DIR
make_tree() {  # make_tree repo|flat [no-renderer] -> prints the explainer dir in the copy
  local root; root="$(mktemp -d -t scrolls-explainer-tree.XXXXXX)"
  local sdir nfdir
  if [ "$1" = flat ]; then sdir="$root/skills"; nfdir="$root/skills/network-flow"
  else sdir="$root/skills/scrolls"; nfdir="$root/skills/diagrams/network-flow"; fi
  mkdir -p "$sdir"
  for s in "$SCROLLS_SRC"/scrolls-*; do cp -R "$s" "$sdir/"; done
  if [ "${2:-}" != no-renderer ]; then mkdir -p "$(dirname "$nfdir")" && cp -R "$NF_SRC" "$nfdir"; fi
  find "$root" -name __pycache__ -type d -prune -exec rm -rf {} + 2>/dev/null
  printf '%s' "$sdir/scrolls-explainer"
}
build() { local x="$1"; shift; OUT="$(cd "$(new_dir)" && bash "$x/scripts/explain.sh" --build "$@" 2>&1)"; CODE=$?; }
set_version() { sed -i.bak "s/^  version: \".*\"$/  version: \"$2\"/" "$1/SKILL.md" && rm -f "$1/SKILL.md.bak"; }

echo "=== 14: --show shows the bundled page and writes nothing ==="
d="$(new_dir)"
OUT="$(cd "$d" && BROWSER="sh -c 'printf %s \"\$0\" > $d/opened.txt' %s" bash "$SCRIPT" --show 2>&1)"; CODE=$?
assert_exit "$CODE" 0 "exit 0"
assert_match "$OUT" "assets/$NAME" "prints the bundled page's path"
assert_match "$OUT" "file://.*assets/$NAME" "prints its file:// URL"
assert_match "$(cat "$d/opened.txt" 2>/dev/null)" "^file://.*/assets/$NAME$" "opens the bundled page itself"
assert "nothing copied into the current folder" test ! -e "$d/$NAME"
run "$d" --show -o x.html
assert_exit "$CODE" 2 "--show with -o is a usage error"

echo "=== 15: --build on unchanged skills reproduces the page byte for byte ==="
if [ -d "$NF_SRC" ]; then
X="$(make_tree repo)"
build "$X"
assert_exit "$CODE" 0 "exit 0"
assert "page identical to the committed one" same "$X/assets/$NAME" "$PAGE"
assert_match "$OUT" "scrolls-(setup|update).*scrolls-" "names the skills it read"
assert_match "$OUT" "2 |up to date|unchanged" "says the page is unchanged"
assert "nothing copied into the current folder" test -z "$(ls -A "$(new_dir)")"

echo "=== 16: --build picks up an edit to the page's text ==="
sed -i.bak 's/Run once per project: creates the memory folder/Run ONCE per project: creates the memory folder/' "$X/assets/explainer-graph.json" && rm -f "$X/assets/explainer-graph.json.bak"
build "$X"
assert_exit "$CODE" 0 "exit 0"
assert "rebuilt page has the new text" grep -q "Run ONCE per project" "$X/assets/$NAME"
assert_match "$OUT" "wrote .*assets/$NAME" "says it wrote the page"

echo "=== 17: a changed SKILL.md stops the build until the page is reviewed ==="
X="$(make_tree repo)"
printf '\nA new paragraph about a new flag.\n' >> "$X/../scrolls-update/SKILL.md"
build "$X"
assert_exit "$CODE" 4 "exit 4"
assert_match "$OUT" "scrolls-update" "names the changed skill"
assert_match "$OUT" "--reviewed" "says how to confirm the review"
assert "page left untouched" same "$X/assets/$NAME" "$PAGE"
build "$X" --reviewed
assert_exit "$CODE" 0 "--reviewed: exit 0"
build "$X"
assert_exit "$CODE" 0 "after review: a plain --build passes again"

echo "=== 18: a lockstep version bump needs no review and restamps the page ==="
X="$(make_tree repo)"
for s in "$X"/../scrolls-*; do set_version "$s" 9.8.7; done
build "$X"
assert_exit "$CODE" 0 "exit 0"
assert "page stamped with the new version" grep -q 'name="scrolls-explainer-version" content="9.8.7"' "$X/assets/$NAME"
assert_match "$(bash "$X/scripts/explain.sh" --version)" "^scrolls-explainer 9.8.7$" "--version reports it"

echo "=== 19: skills out of lockstep stop the build ==="
X="$(make_tree repo)"
set_version "$X/../scrolls-hide" 9.9.9
build "$X"
assert_exit "$CODE" 4 "exit 4"
assert_match "$OUT" "lockstep|versions differ" "says the versions differ"
assert_match "$OUT" "scrolls-hide.*9.9.9" "names the odd one out"
assert "page left untouched" same "$X/assets/$NAME" "$PAGE"

echo "=== 20: a deactivated skill (SKILL.md.deprecated) loses its tab ==="
X="$(make_tree repo)"
mv "$X/../scrolls-hide/SKILL.md" "$X/../scrolls-hide/SKILL.md.deprecated"
build "$X"
assert_exit "$CODE" 0 "exit 0"
assert_match "$OUT" "scrolls-hide.*(deactivated|dropped)" "says the tab was dropped"
P2="$(cat "$X/assets/$NAME")"
assert_no_match "$P2" '"label": ?"/scrolls-hide"' "no /scrolls-hide tab"
assert_no_match "$P2" '"id": ?"hide"' "no /scrolls-hide block"
assert_match "$P2" '"label": ?"/scrolls-unhide"' "other tabs kept"
if command -v node >/dev/null 2>&1 && node -e "require('playwright')" >/dev/null 2>&1; then
  OUT="$(SCROLLS_TABS=setup,session,update,unhide,remove,restore,help node "$HERE/browser/check_page.cjs" "$X/assets/$NAME" 2>&1)"; CODE=$?
  assert_exit "$CODE" 0 "the page without /scrolls-hide still works in a browser"
  [ "$CODE" -eq 0 ] || printf '%s\n' "$OUT"
fi

echo "=== 21: a skill folder that is missing stops the build ==="
X="$(make_tree repo)"
rm -rf "$X/../scrolls-unhide"
build "$X"
assert_exit "$CODE" 4 "exit 4"
assert_match "$OUT" "scrolls-unhide.*not found" "names the missing skill"
assert "page left untouched" same "$X/assets/$NAME" "$PAGE"

echo "=== 22: a new scrolls skill without a tab stops the build ==="
X="$(make_tree repo)"
mkdir -p "$X/../scrolls-frobnicate"
sed -e 's/^name: scrolls-help$/name: scrolls-frobnicate/' -e 's/^  name: scrolls-help$/  name: scrolls-frobnicate/' "$X/../scrolls-help/SKILL.md" > "$X/../scrolls-frobnicate/SKILL.md"
build "$X"
assert_exit "$CODE" 4 "exit 4"
assert_match "$OUT" "scrolls-frobnicate.*no tab" "names the skill with no tab"

echo "=== 23: --build in a flat install (all skills side by side) ==="
X="$(make_tree flat)"
build "$X"
assert_exit "$CODE" 0 "exit 0"
assert "same page as in the repository layout" same "$X/assets/$NAME" "$PAGE"

echo "=== 24: --build without the network-flow skill says how to get it ==="
X="$(make_tree repo no-renderer)"
build "$X"
assert_exit "$CODE" 5 "exit 5"
assert_match "$OUT" "network-flow" "names the missing skill"
assert_match "$OUT" "npx skills add sugatoray/aiskills --skill network-flow|NETWORK_FLOW_DIR" "says how to get it"
OUT="$(cd "$(new_dir)" && NETWORK_FLOW_DIR="$NF_SRC" bash "$X/scripts/explain.sh" --build 2>&1)"; CODE=$?
assert_exit "$CODE" 0 "NETWORK_FLOW_DIR points at it: exit 0"

echo "=== 25: --build --show rebuilds, then shows; --build -o also copies ==="
X="$(make_tree repo)"
d="$(new_dir)"
OUT="$(cd "$d" && BROWSER=true bash "$X/scripts/explain.sh" --build --show 2>&1)"; CODE=$?
assert_exit "$CODE" 0 "--build --show: exit 0"
assert_match "$OUT" "file://.*assets/$NAME" "shows the rebuilt page"
OUT="$(cd "$d" && bash "$X/scripts/explain.sh" --build -o out.html 2>&1)"; CODE=$?
assert_exit "$CODE" 0 "--build -o: exit 0"
assert "--build -o copies the rebuilt page" same "$d/out.html" "$X/assets/$NAME"
else
  skip "--build scenarios: network-flow not found next to this skill"
fi

echo
echo "$((TOTAL - FAILURES))/$TOTAL passed, $SKIPPED skipped"
[ "$FAILURES" -eq 0 ]
