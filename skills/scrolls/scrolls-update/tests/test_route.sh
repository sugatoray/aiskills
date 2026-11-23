#!/usr/bin/env bash
# Red/Green regression test for route.sh / route.py (nested scroll sets and the
# router table). All logic lives in route.py; test_route.ps1 is the PowerShell
# parity harness.
# Run with: bash tests/test_route.sh
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$HERE")"
SCRIPT="$SKILL_DIR/scripts/route.sh"

TOTAL=0
FAILURES=0
pass() { TOTAL=$((TOTAL + 1)); echo "PASS: $1"; }
fail() { TOTAL=$((TOTAL + 1)); FAILURES=$((FAILURES + 1)); echo "FAIL: $1"; }

assert_match() {
  local text="$1" pattern="$2" label="$3"
  if printf '%s' "$text" | grep -qE -- "$pattern"; then pass "$label"
  else fail "$label -- expected to match: $pattern"; echo "--- actual output ---"; printf '%s\n' "$text"; echo "---"; fi
}
assert_no_match() {
  local text="$1" pattern="$2" label="$3"
  if printf '%s' "$text" | grep -qE -- "$pattern"; then
    fail "$label -- expected NOT to match: $pattern"; echo "--- actual output ---"; printf '%s\n' "$text"; echo "---"
  else pass "$label"; fi
}
assert_exit() {
  local actual="$1" expected="$2" label="$3"
  if [ "$actual" -eq "$expected" ]; then pass "$label"; else fail "$label -- expected exit $expected, got $actual"; fi
}
# The file listed under the "-> <set>" heading for SET (one routing block per set).
routed_to() {
  local text="$1" set="$2"
  printf '%s\n' "$text" | awk -v s="-> $set" '
    /^-> / { inblk = (index($0, s) == 1 && (length($0) == length(s) || substr($0, length(s) + 1, 1) == " ")) ; next }
    /^== / { inblk = 0 }
    inblk && /^   / { sub(/^   /, ""); print }'
}
assert_routed() {
  local text="$1" file="$2" set="$3" label="$4"
  if routed_to "$text" "$set" | grep -qxF -- "$file"; then pass "$label"
  else fail "$label -- expected $file under -> $set"; echo "--- actual output ---"; printf '%s\n' "$text"; echo "---"; fi
}

new_repo() {
  local d; d="$(mktemp -d -t scrolls-route-test.XXXXXX)"
  ( cd "$d" && git init -q && git config user.email test@test.com && git config user.name test && git config commit.gpgsign false )
  printf '%s' "$d"
}
# make_set DIR: a minimal scroll set at DIR/docs/.scrolls
make_set() {
  mkdir -p "$1/docs/.scrolls"
  for f in STARTER SPEC HANDOFF GAP_ANALYSIS GAP_CONTEXT PLAN WISDOM; do printf '# %s\n' "$f" > "$1/docs/.scrolls/$f.md"; done
}
commit_all() { ( cd "$1" && git add -A && git commit -q -m "${2:-init}" ); }

# ============================================================
echo; echo "=== Scenario A: not a git repository ==="
dirA="$(mktemp -d -t scrolls-route-test.XXXXXX)"
out="$(cd "$dirA" && bash "$SCRIPT" 2>&1)"; code=$?
assert_match "$out" "Not a git repository" "reports not-a-git-repo"
assert_exit "$code" 0 "exits 0 when not a git repo"
rm -rf "$dirA"

echo; echo "=== Scenario B: no scroll set ==="
dirB="$(new_repo)"
out="$(cd "$dirB" && bash "$SCRIPT" 2>&1)"; code=$?
assert_match "$out" "scrolls-setup" "points at /scrolls-setup"
assert_exit "$code" 1 "exits 1 when no scroll set"
rm -rf "$dirB"

echo; echo "=== Scenario C: one scroll set, nothing nested ==="
dirC="$(new_repo)"; make_set "$dirC"; commit_all "$dirC"
echo x > "$dirC/app.py"
out="$(cd "$dirC" && bash "$SCRIPT" 2>&1)"; code=$?
assert_exit "$code" 0 "exits 0"
assert_routed "$out" "app.py" "docs/.scrolls" "an uncommitted file goes to the only set"
assert_match "$out" "No nested scroll sets" "says there are no nested sets"
rm -rf "$dirC"

echo; echo "=== Scenario D: a nested set covers its own folder ==="
dirD="$(new_repo)"; make_set "$dirD"; make_set "$dirD/packages/api"; commit_all "$dirD"
mkdir -p "$dirD/packages/api/src"; echo x > "$dirD/packages/api/src/server.py"; echo y > "$dirD/README.md"
out="$(cd "$dirD" && bash "$SCRIPT" 2>&1)"
assert_routed "$out" "packages/api/src/server.py" "packages/api/docs/.scrolls" "a file inside a nested set's folder goes to that set"
assert_routed "$out" "README.md" "docs/.scrolls" "a file outside every nested set goes to the top-level set"
assert_match "$out" "Not in the router table" "flags a nested set the router table doesn't list"
assert_match "$out" "packages/api/docs/.scrolls" "names that nested set"
rm -rf "$dirD"

echo; echo "=== Scenario E: the router table maps a folder to a set elsewhere ==="
dirE="$(new_repo)"; make_set "$dirE"; make_set "$dirE/src/memory/foo"
cat > "$dirE/docs/.scrolls/STARTER.md" <<'EOF'
# STARTER

## Where memory lives

| Scope | Scroll set |
| --- | --- |
| Repo-wide | `docs/.scrolls/` (this one) |
| foo family (`skills/foo/`) | `src/memory/foo/docs/.scrolls/` |

## Development strategy
EOF
commit_all "$dirE"
mkdir -p "$dirE/skills/foo/tool" "$dirE/skills/bar"; echo x > "$dirE/skills/foo/tool/SKILL.md"; echo y > "$dirE/skills/bar/SKILL.md"
out="$(cd "$dirE" && bash "$SCRIPT" 2>&1)"
assert_routed "$out" "skills/foo/tool/SKILL.md" "src/memory/foo/docs/.scrolls" "a covered folder routes to the set the table names"
assert_routed "$out" "skills/bar/SKILL.md" "docs/.scrolls" "an uncovered folder stays with the top-level set"
assert_no_match "$out" "Not in the router table" "a listed nested set is not flagged"
rm -rf "$dirE"

echo; echo "=== Scenario F: the deepest match wins ==="
dirF="$(new_repo)"; make_set "$dirF"; make_set "$dirF/packages/api"; make_set "$dirF/packages/api/plugins/auth"; commit_all "$dirF"
mkdir -p "$dirF/packages/api/plugins/auth/lib"; echo x > "$dirF/packages/api/plugins/auth/lib/token.py"; echo y > "$dirF/packages/api/main.py"
out="$(cd "$dirF" && bash "$SCRIPT" 2>&1)"
assert_routed "$out" "packages/api/plugins/auth/lib/token.py" "packages/api/plugins/auth/docs/.scrolls" "the innermost set wins"
assert_routed "$out" "packages/api/main.py" "packages/api/docs/.scrolls" "the middle set keeps its own files"
rm -rf "$dirF"

echo; echo "=== Scenario G: pruned folders are not searched ==="
dirG="$(new_repo)"; make_set "$dirG"; make_set "$dirG/node_modules/pkg"; make_set "$dirG/vendor/lib"
printf 'node_modules/\n' > "$dirG/.gitignore"; commit_all "$dirG"
out="$(cd "$dirG" && bash "$SCRIPT" 2>&1)"
assert_no_match "$out" "node_modules/pkg/docs" "a set under node_modules is ignored"
assert_no_match "$out" "vendor/lib/docs" "a set under vendor is ignored"
rm -rf "$dirG"

echo; echo "=== Scenario H: commits since the top-level set was last touched count ==="
dirH="$(new_repo)"; make_set "$dirH"; make_set "$dirH/packages/api"; commit_all "$dirH"
mkdir -p "$dirH/packages/api/src"; echo x > "$dirH/packages/api/src/a.py"; commit_all "$dirH" "work"
echo y > "$dirH/notes.txt"
out="$(cd "$dirH" && bash "$SCRIPT" 2>&1)"
assert_routed "$out" "packages/api/src/a.py" "packages/api/docs/.scrolls" "a committed file since the last scrolls update is routed"
assert_routed "$out" "notes.txt" "docs/.scrolls" "an uncommitted file is routed too"
rm -rf "$dirH"

echo; echo "=== Scenario I: an explicit path and --since ==="
dirI="$(new_repo)"; make_set "$dirI/sub"; commit_all "$dirI"
echo x > "$dirI/sub/a.py"; commit_all "$dirI" "a"; first="$(cd "$dirI" && git rev-parse HEAD)"
echo y > "$dirI/sub/b.py"; commit_all "$dirI" "b"
out="$(cd "$dirI" && bash "$SCRIPT" sub/docs/.scrolls --since "$first" 2>&1)"; code=$?
assert_exit "$code" 0 "accepts a scroll set path"
assert_routed "$out" "sub/b.py" "sub/docs/.scrolls" "--since limits the commits"
assert_no_match "$out" "sub/a.py" "a file before --since is left out"
rm -rf "$dirI"

echo; echo "=== Scenario J: the visible 'scrolls' name and nested sets inside a nested set ==="
dirJ="$(new_repo)"; make_set "$dirJ"; mkdir -p "$dirJ/tools/cli/docs/scrolls"; printf '# STARTER\n' > "$dirJ/tools/cli/docs/scrolls/STARTER.md"; commit_all "$dirJ"
echo x > "$dirJ/tools/cli/run.sh"
out="$(cd "$dirJ" && bash "$SCRIPT" 2>&1)"
assert_routed "$out" "tools/cli/run.sh" "tools/cli/docs/scrolls" "a set named 'scrolls' (unhidden) is found"
rm -rf "$dirJ"

echo
echo "$TOTAL checks, $FAILURES failed"
[ "$FAILURES" -eq 0 ]
