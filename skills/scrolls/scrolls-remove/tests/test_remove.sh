#!/usr/bin/env bash
# Red/Green regression test for remove.sh (and, through it, remove.py).
# Run with: bash tests/test_remove.sh
# Every scenario runs in its own throwaway git repository under mktemp.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$HERE")"
SCRIPT="$SKILL_DIR/scripts/remove.sh"
TEMPLATES="$(cd "$SKILL_DIR/../scrolls-setup/assets/templates" && pwd)"

TOTAL=0
FAILURES=0
pass() { TOTAL=$((TOTAL + 1)); echo "PASS: $1"; }
fail() { TOTAL=$((TOTAL + 1)); FAILURES=$((FAILURES + 1)); echo "FAIL: $1"; }
assert() { local label="$1"; shift; if "$@"; then pass "$label"; else fail "$label"; fi; }
absent() { [ ! -e "$1" ]; }
assert_exit() { if [ "$1" -eq "$2" ]; then pass "$3"; else fail "$3 -- expected exit $2, got $1"; fi; }
assert_match() {
  if printf '%s' "$1" | grep -qE -- "$2"; then pass "$3"; else
    fail "$3 -- expected to match: $2"; echo "--- actual ---"; printf '%s\n' "$1"; echo "---"; fi
}
assert_no_match() {
  if printf '%s' "$1" | grep -qE -- "$2"; then
    fail "$3 -- expected NOT to match: $2"; echo "--- actual ---"; printf '%s\n' "$1"; echo "---"; else pass "$3"; fi
}

new_repo() {
  local d; d="$(mktemp -d -t scrolls-remove-test.XXXXXX)"
  ( cd "$d" && git init -q && git config user.email test@test.com && git config user.name test \
      && git config commit.gpgsign false )
  printf '%s' "$d"
}

# Reproduces what /scrolls-setup writes: <base>/<docs>/<name>/ with the
# seven scroll files, plus SCROLLS.md / CLAUDE.md / AGENTS.md at <base>.
scaffold() {
  local base="$1" docs="${2:-docs}" name="${3:-.scrolls}"
  local short; short="$(basename "$docs")/$name"
  mkdir -p "$base/$docs/$name"
  for f in STARTER SPEC HANDOFF GAP_ANALYSIS GAP_CONTEXT PLAN WISDOM; do
    printf '# %s\nSee %s/STARTER.md\n' "$f" "$short" > "$base/$docs/$name/$f.md"
  done
  local ptr; ptr="$(dirname "$base/$docs")"
  sed "s#{{SCROLLS_PATH}}#$short#g" "$TEMPLATES/SCROLLS_MD_BLOCK.md" > "$ptr/SCROLLS.md"
  cp "$TEMPLATES/CLAUDE_MD_BLOCK.md" "$ptr/CLAUDE.md"
  cp "$TEMPLATES/AGENTS_MD_BLOCK.md" "$ptr/AGENTS.md"
}

commit_all() { ( cd "$1" && git add -A && git commit -q -m "${2:-init}" ); }
head_sha() { git -C "$1" rev-parse HEAD; }
last_msg() { git -C "$1" log -1 --format=%B; }
trailer() { git -C "$1" log -1 --format="%(trailers:key=$2,valueonly,separator=%x2C)"; }

# ============================================================
echo; echo "=== 1: no -y prints the plan and changes nothing ==="
d="$(new_repo)"; scaffold "$d"; commit_all "$d"; before="$(head_sha "$d")"
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; rc=$?
assert_exit "$rc" 0 "plan-only run exits 0"
assert_match "$out" "Dry run" "says it was a dry run"
assert_match "$out" "removed folder +docs/.scrolls" "plan lists the scrolls folder"
assert "scrolls folder still there" test -d "$d/docs/.scrolls"
assert "HEAD unchanged" test "$(head_sha "$d")" = "$before"
out="$(cd "$d" && bash "$SCRIPT" -y -n 2>&1)"; rc=$?
assert_exit "$rc" 0 "-n wins over -y"
assert "still nothing removed after -y -n" test -d "$d/docs/.scrolls"

echo; echo "=== 2: -y on a pristine setup removes everything in one commit ==="
d="$(new_repo)"; echo hi > "$d/README.md"; scaffold "$d"; commit_all "$d"; prev="$(head_sha "$d")"
out="$(cd "$d" && bash "$SCRIPT" -y 2>&1)"; rc=$?
assert_exit "$rc" 0 "apply exits 0"
assert "docs/.scrolls gone" absent "$d/docs/.scrolls"
assert "empty docs/ pruned" absent "$d/docs"
assert "SCROLLS.md deleted" absent "$d/SCROLLS.md"
assert "stub-only CLAUDE.md deleted" absent "$d/CLAUDE.md"
assert "AGENTS.md deleted once CLAUDE.md is gone" absent "$d/AGENTS.md"
assert "README untouched" test -f "$d/README.md"
assert "exactly one new commit" test "$(git -C "$d" rev-parse HEAD~1)" = "$prev"
assert "working tree clean" test -z "$(git -C "$d" status --porcelain)"
msg="$(last_msg "$d")"
assert "subject line exact" test "$(printf '%s\n' "$msg" | sed -n 1p)" = "maint(memory): scrolls-removed"
assert "line 2 blank" test -z "$(printf '%s\n' "$msg" | sed -n 2p)"
assert "previous-commit line exact" test "$(printf '%s\n' "$msg" | sed -n 3p)" = "- previous commit: #$prev"
assert_match "$msg" "^Notes:$" "has a Notes section"
assert "trailer Scrolls-Action" test "$(trailer "$d" Scrolls-Action)" = "remove"
assert "trailer Scrolls-Previous-Commit" test "$(trailer "$d" Scrolls-Previous-Commit)" = "$prev"
assert "trailer Scrolls-Folder" test "$(trailer "$d" Scrolls-Folder)" = "docs/.scrolls"
assert "trailer Scrolls-Deleted" test "$(trailer "$d" Scrolls-Deleted)" = "SCROLLS.md,CLAUDE.md,AGENTS.md"
assert "trailer Scrolls-Pruned" test "$(trailer "$d" Scrolls-Pruned)" = "docs"
assert_match "$out" "Undo: +git revert --no-edit" "prints an undo command"
assert "message file cleaned up" absent "$d/.git/SCROLLS_REMOVE_MSG"

echo; echo "=== 3: CLAUDE.md with other content is stripped, AGENTS.md kept ==="
d="$(new_repo)"; scaffold "$d"
printf '\n# Project rules\n\nUse tabs.\n' >> "$d/CLAUDE.md"
mkdir -p "$d/docs"; echo "real docs" > "$d/docs/guide.md"
commit_all "$d"
( cd "$d" && bash "$SCRIPT" -y >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "apply exits 0"
c="$(cat "$d/CLAUDE.md")"
assert_no_match "$c" "SCROLLS.md|Access Scrolls" "stub removed from CLAUDE.md"
assert_match "$c" "Use tabs." "other CLAUDE.md content kept"
assert_match "$(head -1 "$d/CLAUDE.md")" "^# Project rules$" "no leading blank lines left behind"
assert "AGENTS.md kept (CLAUDE.md still exists)" test -f "$d/AGENTS.md"
assert "docs/ kept because it holds other files" test -f "$d/docs/guide.md"
assert "trailer Scrolls-Stripped" test "$(trailer "$d" Scrolls-Stripped)" = "CLAUDE.md"
assert "trailer Scrolls-Kept" test "$(trailer "$d" Scrolls-Kept)" = "AGENTS.md"
assert "no Scrolls-Pruned trailer" test -z "$(trailer "$d" Scrolls-Pruned)"

echo; echo "=== 4: -x CLAUDE.md purges it even with other content ==="
d="$(new_repo)"; scaffold "$d"; printf '\nUse tabs.\n' >> "$d/CLAUDE.md"; commit_all "$d"
( cd "$d" && bash "$SCRIPT" -y -x CLAUDE.md >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "apply exits 0"
assert "CLAUDE.md purged" absent "$d/CLAUDE.md"
assert "AGENTS.md follows (its only pointer is gone)" absent "$d/AGENTS.md"
assert "trailer Scrolls-Purged" test "$(trailer "$d" Scrolls-Purged)" = "CLAUDE.md"

echo; echo "=== 5: bare -x = all, plus a custom file name ==="
d="$(new_repo)"; scaffold "$d"
printf '\nmore\n' >> "$d/CLAUDE.md"; printf '\nmore\n' >> "$d/AGENTS.md"; printf '\nmore\n' >> "$d/SCROLLS.md"
echo "See @SCROLLS.md" > "$d/GEMINI.md"; commit_all "$d"
( cd "$d" && bash "$SCRIPT" -y -x -x GEMINI.md >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "apply exits 0"
for f in SCROLLS.md CLAUDE.md AGENTS.md GEMINI.md; do assert "$f purged" absent "$d/$f"; done
d2="$(new_repo)"; scaffold "$d2"; printf '\nmore\n' >> "$d2/CLAUDE.md"; commit_all "$d2"
( cd "$d2" && bash "$SCRIPT" -y --purge=all >/dev/null 2>&1 )
assert "--purge=all form works" absent "$d2/CLAUDE.md"

echo; echo "=== 6: -x refuses paths ==="
d="$(new_repo)"; scaffold "$d"; commit_all "$d"
( cd "$d" && bash "$SCRIPT" -y -x ../etc/passwd >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 2 "path-like -x value rejected"
assert "nothing removed" test -d "$d/docs/.scrolls"

echo; echo "=== 7: uncommitted or untracked scrolls content blocks removal ==="
d="$(new_repo)"; scaffold "$d"; commit_all "$d"
echo "edit" >> "$d/docs/.scrolls/HANDOFF.md"
out="$(cd "$d" && bash "$SCRIPT" -y 2>&1)"; rc=$?
assert_exit "$rc" 3 "modified scroll file refused"
assert_match "$out" "HANDOFF.md" "names the dirty file"
assert "HANDOFF.md still there" test -f "$d/docs/.scrolls/HANDOFF.md"
git -C "$d" checkout -q -- .
echo "new" > "$d/docs/.scrolls/NOTES.md"
( cd "$d" && bash "$SCRIPT" -y >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 3 "untracked scroll file refused"
rm "$d/docs/.scrolls/NOTES.md"
echo "x" >> "$d/CLAUDE.md"
( cd "$d" && bash "$SCRIPT" -y >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 3 "modified pointer file refused"

echo; echo "=== 8: unrelated staged changes block removal ==="
d="$(new_repo)"; scaffold "$d"; echo a > "$d/app.txt"; commit_all "$d"
echo b >> "$d/app.txt"; git -C "$d" add app.txt
out="$(cd "$d" && bash "$SCRIPT" -y 2>&1)"; rc=$?
assert_exit "$rc" 3 "staged unrelated change refused"
assert_match "$out" "app.txt" "names the staged file"

echo; echo "=== 9: -r sweeps every scrolls folder into one commit ==="
d="$(new_repo)"; mkdir -p "$d/packages/api" "$d/packages/web"
scaffold "$d"; scaffold "$d/packages/api"; scaffold "$d/packages/web" docs scrolls
commit_all "$d"; prev="$(head_sha "$d")"
( cd "$d" && bash "$SCRIPT" -y -r >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "sweep exits 0"
for p in docs/.scrolls packages/api/docs/.scrolls packages/web/docs/scrolls; do assert "$p gone" absent "$d/$p"; done
for p in SCROLLS.md packages/api/SCROLLS.md packages/web/CLAUDE.md; do assert "$p gone" absent "$d/$p"; done
assert "one commit for the whole sweep" test "$(git -C "$d" rev-parse HEAD~1)" = "$prev"
assert "three Scrolls-Folder trailers" test "$(trailer "$d" Scrolls-Folder)" = "docs/.scrolls,packages/api/docs/.scrolls,packages/web/docs/scrolls"

echo; echo "=== 10: without -r a nested folder is not found ==="
d="$(new_repo)"; mkdir -p "$d/packages/api"; scaffold "$d/packages/api"; commit_all "$d"
out="$(cd "$d" && bash "$SCRIPT" -y 2>&1)"; rc=$?
assert_exit "$rc" 1 "nothing at the exact spot exits 1"
assert_match "$out" "-r/--recurse" "suggests -r"
assert "nested scrolls untouched" test -d "$d/packages/api/docs/.scrolls"

echo; echo "=== 11: -p accepts a docs folder, a project folder, or the scrolls folder ==="
for target in packages/api/docs packages/api packages/api/docs/.scrolls; do
  d="$(new_repo)"; mkdir -p "$d/packages/api"; scaffold "$d/packages/api"; scaffold "$d"; commit_all "$d"
  ( cd "$d" && bash "$SCRIPT" -y -p "$target" >/dev/null 2>&1 ); rc=$?
  assert_exit "$rc" 0 "-p $target exits 0"
  assert "-p $target removed the package scrolls" absent "$d/packages/api/docs/.scrolls"
  assert "-p $target removed the package SCROLLS.md" absent "$d/packages/api/SCROLLS.md"
  assert "-p $target left the root scrolls alone" test -d "$d/docs/.scrolls"
done

echo; echo "=== 12: -t from a subdirectory; -p with -t is a usage error ==="
d="$(new_repo)"; scaffold "$d"; mkdir -p "$d/src/deep"; echo x > "$d/src/deep/f.txt"; commit_all "$d"
( cd "$d/src/deep" && bash "$SCRIPT" -y -t >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "-t exits 0"
assert "-t removed the repo-root scrolls" absent "$d/docs/.scrolls"
( cd "$d" && bash "$SCRIPT" -t -p . >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 2 "-t with -p rejected"

echo; echo "=== 13: reworded SCROLLS.md is flagged for review, not edited ==="
d="$(new_repo)"; scaffold "$d"; printf '# Memory\nRead docs/.scrolls/STARTER.md please.\n' > "$d/SCROLLS.md"; commit_all "$d"
out="$(cd "$d" && bash "$SCRIPT" -y 2>&1)"; rc=$?
assert_exit "$rc" 0 "apply exits 0"
assert "reworded SCROLLS.md left in place" test -f "$d/SCROLLS.md"
assert "trailer Scrolls-Review" test "$(trailer "$d" Scrolls-Review)" = "SCROLLS.md"
assert_match "$out" "needs review" "plan flags it"

echo; echo "=== 14: no commits yet is refused ==="
d="$(new_repo)"; scaffold "$d"
( cd "$d" && bash "$SCRIPT" -y >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 3 "unborn HEAD refused"
assert "nothing removed" test -d "$d/docs/.scrolls"

echo; echo "=== 15: --no-commit stages and writes the message file ==="
d="$(new_repo)"; scaffold "$d"; commit_all "$d"; before="$(head_sha "$d")"
( cd "$d" && bash "$SCRIPT" -y --no-commit >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "--no-commit exits 0"
assert "HEAD unchanged" test "$(head_sha "$d")" = "$before"
assert "removal staged" test -n "$(git -C "$d" diff --cached --name-only)"
assert "message file written" test -f "$d/.git/SCROLLS_REMOVE_MSG"
( cd "$d" && git commit -q -F .git/SCROLLS_REMOVE_MSG ); assert "message file commits cleanly" test $? -eq 0

echo; echo "=== 16: pre-1.2 CLAUDE.md with the SCROLLS block embedded is cleaned ==="
d="$(new_repo)"; scaffold "$d"
{ echo "# Rules"; echo; sed "s#{{SCROLLS_PATH}}#docs/.scrolls#g" "$TEMPLATES/SCROLLS_MD_BLOCK.md"; echo; echo "Be nice."; } > "$d/CLAUDE.md"
commit_all "$d"
( cd "$d" && bash "$SCRIPT" -y >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "apply exits 0"
c="$(cat "$d/CLAUDE.md")"
assert_no_match "$c" "docs/.scrolls" "embedded block removed"
assert_match "$c" "Be nice." "rest kept"

echo; echo "=== 17: setup's demoted-heading insertion is still recognised ==="
d="$(new_repo)"; scaffold "$d"
{ echo "# Existing"; echo; sed -e "s#{{SCROLLS_PATH}}#docs/.scrolls#g" -e 's/^# Scrolls/## Scrolls/' "$TEMPLATES/SCROLLS_MD_BLOCK.md"; echo; echo "Kept text."; } > "$d/SCROLLS.md"
commit_all "$d"
( cd "$d" && bash "$SCRIPT" -y >/dev/null 2>&1 )
assert_no_match "$(cat "$d/SCROLLS.md")" "STARTER.md" "demoted block stripped"
assert "trailer Scrolls-Stripped" test "$(trailer "$d" Scrolls-Stripped)" = "SCROLLS.md"

echo; echo "=== 18: embedded fallback templates match scrolls-setup's ==="
py="$(command -v python3 || command -v python)"
"$py" - "$SKILL_DIR/scripts" "$TEMPLATES" <<'PY'
import sys; sys.path.insert(0, sys.argv[1]); import remove
t = sys.argv[2]
pairs = [("SCROLLS_MD_BLOCK.md", remove.EMBEDDED_SCROLLS_BLOCK),
         ("CLAUDE_MD_BLOCK.md", remove.EMBEDDED_CLAUDE_BLOCK),
         ("AGENTS_MD_BLOCK.md", remove.EMBEDDED_AGENTS_BLOCK)]
sys.exit(0 if all(open(f"{t}/{n}", encoding="utf-8").read() == e for n, e in pairs) else 1)
PY
assert "embedded templates in sync" test $? -eq 0

echo
echo "=== $((TOTAL - FAILURES))/$TOTAL passed ==="
[ "$FAILURES" -eq 0 ]
