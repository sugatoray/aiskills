#!/usr/bin/env bash
# Red/Green regression test for restore.sh (and, through it, restore.py).
# Uses the real /scrolls-remove script to create checkpoints, so the two
# skills' commit-message contract is exercised end to end.
# Run with: bash tests/test_restore.sh
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$HERE")"
SCRIPT="$SKILL_DIR/scripts/restore.sh"
REMOVE="$SKILL_DIR/../scrolls-remove/scripts/remove.sh"
TEMPLATES="$(cd "$SKILL_DIR/../scrolls-setup/assets/templates" && pwd)"

TOTAL=0
FAILURES=0
pass() { TOTAL=$((TOTAL + 1)); echo "PASS: $1"; }
fail() { TOTAL=$((TOTAL + 1)); FAILURES=$((FAILURES + 1)); echo "FAIL: $1"; }
assert() { local label="$1"; shift; if "$@"; then pass "$label"; else fail "$label"; fi; }
absent() { [ ! -e "$1" ]; }
same() { cmp -s "$1" "$2"; }
assert_exit() { if [ "$1" -eq "$2" ]; then pass "$3"; else fail "$3 -- expected exit $2, got $1"; fi; }
assert_match() {
  if printf '%s' "$1" | grep -qE -- "$2"; then pass "$3"; else
    fail "$3 -- expected to match: $2"; echo "--- actual ---"; printf '%s\n' "$1"; echo "---"; fi
}

new_repo() {
  local d; d="$(mktemp -d -t scrolls-restore-test.XXXXXX)"
  ( cd "$d" && git init -q -b main && git config user.email test@test.com && git config user.name test \
      && git config commit.gpgsign false )
  printf '%s' "$d"
}

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

commit_all() { ( cd "$1" && git add -A && git commit -q -m "${2:-change}" ); }
head_sha() { git -C "$1" rev-parse "${2:-HEAD}"; }
trailer() { git -C "$1" log -1 --format="%(trailers:key=$2,valueonly,separator=%x2C)" "${3:-HEAD}"; }
snapshot() { mkdir -p "$2"; cp -r "$1/docs" "$1/SCROLLS.md" "$1/CLAUDE.md" "$1/AGENTS.md" "$2/" 2>/dev/null; }

# ============================================================
echo; echo "=== 1: round trip — remove then restore gives back identical memory ==="
d="$(new_repo)"; echo app > "$d/app.txt"; scaffold "$d"; commit_all "$d" init
orig="$(mktemp -d)"; snapshot "$d" "$orig"; src="$(head_sha "$d")"
( cd "$d" && bash "$REMOVE" -y >/dev/null 2>&1 ); removal="$(head_sha "$d")"
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; rc=$?
assert_exit "$rc" 0 "plan-only exits 0"
assert_match "$out" "Dry run" "says dry run"
assert "nothing restored without -y" absent "$d/docs/.scrolls"
out="$(cd "$d" && bash "$SCRIPT" -y 2>&1)"; rc=$?
assert_exit "$rc" 0 "apply exits 0"
for f in docs/.scrolls/STARTER.md docs/.scrolls/WISDOM.md SCROLLS.md CLAUDE.md AGENTS.md; do
  assert "$f identical to before removal" same "$orig/${f}" "$d/$f"
done
assert "one restore commit on top of the removal" test "$(head_sha "$d" HEAD~1)" = "$removal"
assert "working tree clean" test -z "$(git -C "$d" status --porcelain)"
msg="$(git -C "$d" log -1 --format=%B)"
assert "subject exact" test "$(printf '%s\n' "$msg" | sed -n 1p)" = "maint(memory): scrolls-restored"
assert "restored-from line exact" test "$(printf '%s\n' "$msg" | sed -n 3p)" = "- restored from: #$src"
assert "removal-commit line exact" test "$(printf '%s\n' "$msg" | sed -n 4p)" = "- removal commit: #$removal"
assert "trailer Scrolls-Action" test "$(trailer "$d" Scrolls-Action)" = "restore"
assert "trailer Scrolls-Source-Commit" test "$(trailer "$d" Scrolls-Source-Commit)" = "$src"
assert "trailer Scrolls-Removal-Commit" test "$(trailer "$d" Scrolls-Removal-Commit)" = "$removal"
assert "trailer Scrolls-Folder" test "$(trailer "$d" Scrolls-Folder)" = "docs/.scrolls"
assert "trailer Scrolls-Restored" test "$(trailer "$d" Scrolls-Restored)" = "SCROLLS.md,CLAUDE.md,AGENTS.md"
assert_match "$out" "/scrolls-update" "suggests /scrolls-update"

echo; echo "=== 2: an already-restored checkpoint is not restored twice ==="
out="$(cd "$d" && bash "$SCRIPT" -y 2>&1)"; rc=$?
assert_exit "$rc" 1 "second restore exits 1"
assert_match "$out" "already been restored" "says so"

echo; echo "=== 3: remove -> restore -> remove -> restore chains ==="
( cd "$d" && bash "$REMOVE" -y >/dev/null 2>&1 ); removal2="$(head_sha "$d")"
( cd "$d" && bash "$SCRIPT" -y >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "second cycle restores"
assert "picked the newer removal" test "$(trailer "$d" Scrolls-Removal-Commit)" = "$removal2"
assert "scrolls back again" test -f "$d/docs/.scrolls/STARTER.md"

echo; echo "=== 4: only memory comes back; the rest of the repo keeps its current state ==="
d="$(new_repo)"; echo v1 > "$d/app.txt"; scaffold "$d"
printf '\n# Rules\n\nUse tabs.\n' >> "$d/CLAUDE.md"; commit_all "$d" init
( cd "$d" && bash "$REMOVE" -y >/dev/null 2>&1 )
echo v2 > "$d/app.txt"; printf '# Rules\n\nUse tabs.\nNew rule after removal.\n' > "$d/CLAUDE.md"; commit_all "$d" later
( cd "$d" && bash "$SCRIPT" -y >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "apply exits 0"
assert "app.txt not rolled back" test "$(cat "$d/app.txt")" = "v2"
c="$(cat "$d/CLAUDE.md")"
assert_match "$c" "See @SCROLLS.md" "stub re-inserted into CLAUDE.md"
assert_match "$c" "New rule after removal." "later CLAUDE.md content kept"
assert "stub sits under the existing H1" test "$(sed -n 3p "$d/CLAUDE.md")" = "## Access Scrolls Agentic Memory"
assert "trailer Scrolls-Inserted" test "$(trailer "$d" Scrolls-Inserted)" = "CLAUDE.md"
assert "AGENTS.md untouched (it was kept by the removal)" test "$(trailer "$d" Scrolls-Kept)" = ""

echo; echo "=== 5: purged files get the stub only, or everything with --full ==="
d="$(new_repo)"; scaffold "$d"; printf '\nPrivate notes.\n' >> "$d/CLAUDE.md"; commit_all "$d" init
( cd "$d" && bash "$REMOVE" -y -x CLAUDE.md >/dev/null 2>&1 )
( cd "$d" && bash "$SCRIPT" -y >/dev/null 2>&1 )
assert "CLAUDE.md is exactly the stub" same "$TEMPLATES/CLAUDE_MD_BLOCK.md" "$d/CLAUDE.md"
assert "trailer Scrolls-Created" test "$(trailer "$d" Scrolls-Created)" = "CLAUDE.md"
d="$(new_repo)"; scaffold "$d"; printf '\nPrivate notes.\n' >> "$d/CLAUDE.md"; commit_all "$d" init
cp "$d/CLAUDE.md" "$d.claude"
( cd "$d" && bash "$REMOVE" -y -x CLAUDE.md >/dev/null 2>&1 )
( cd "$d" && bash "$SCRIPT" -y --full >/dev/null 2>&1 )
assert "--full brings back the whole old file" same "$d.claude" "$d/CLAUDE.md"

echo; echo "=== 6: scope — exact spot by default, -r for all, -p for one ==="
d="$(new_repo)"; mkdir -p "$d/packages/api" "$d/packages/web"
scaffold "$d"; scaffold "$d/packages/api"; scaffold "$d/packages/web" docs scrolls; commit_all "$d" init
( cd "$d" && bash "$REMOVE" -y -r >/dev/null 2>&1 ); removal="$(head_sha "$d")"
( cd "$d" && bash "$SCRIPT" -y -p packages/api >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "-p packages/api exits 0"
assert "api restored" test -f "$d/packages/api/docs/.scrolls/STARTER.md"
assert "api SCROLLS.md restored" test -f "$d/packages/api/SCROLLS.md"
assert "root not restored" absent "$d/docs/.scrolls"
d="$(new_repo)"; mkdir -p "$d/packages/api" "$d/packages/web"
scaffold "$d"; scaffold "$d/packages/api"; scaffold "$d/packages/web" docs scrolls; commit_all "$d" init
( cd "$d" && bash "$REMOVE" -y -r >/dev/null 2>&1 )
( cd "$d" && bash "$SCRIPT" -y >/dev/null 2>&1 )
assert "default restores the root folder" test -f "$d/docs/.scrolls/STARTER.md"
assert "default leaves nested ones" absent "$d/packages/api/docs/.scrolls"
d="$(new_repo)"; mkdir -p "$d/packages/api" "$d/packages/web"
scaffold "$d"; scaffold "$d/packages/api"; scaffold "$d/packages/web" docs scrolls; commit_all "$d" init
( cd "$d" && bash "$REMOVE" -y -r >/dev/null 2>&1 )
( cd "$d" && bash "$SCRIPT" -y -r >/dev/null 2>&1 )
for p in docs/.scrolls packages/api/docs/.scrolls packages/web/docs/scrolls; do assert "-r restored $p" test -f "$d/$p/STARTER.md"; done
assert "-r: one commit with three folders" test "$(trailer "$d" Scrolls-Folder)" = "docs/.scrolls,packages/api/docs/.scrolls,packages/web/docs/scrolls"

echo; echo "=== 7: explicit ordinary COMMIT — folders and stubs discovered from its tree ==="
d="$(new_repo)"; scaffold "$d"; commit_all "$d" init; src="$(head_sha "$d")"
git -C "$d" rm -rq docs SCROLLS.md; printf '# Me\n\nhello\n' > "$d/CLAUDE.md"; commit_all "$d" "manual removal"
( cd "$d" && bash "$SCRIPT" -y "$src" >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "explicit commit exits 0"
assert "folder restored" test -f "$d/docs/.scrolls/STARTER.md"
assert "SCROLLS.md recreated" test -f "$d/SCROLLS.md"
assert_match "$(cat "$d/CLAUDE.md")" "hello" "current CLAUDE.md content kept"
assert_match "$(cat "$d/CLAUDE.md")" "@SCROLLS.md" "stub inserted"
assert "no removal-commit trailer" test -z "$(trailer "$d" Scrolls-Removal-Commit)"

echo; echo "=== 8: no removal commit — falls back to before the deleting commit ==="
d="$(new_repo)"; scaffold "$d"; commit_all "$d" init; src="$(head_sha "$d")"
git -C "$d" rm -rq docs; commit_all "$d" "drop docs"; del="$(head_sha "$d")"
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; rc=$?
assert_exit "$rc" 0 "fallback plan exits 0"
assert_match "$out" "fallback" "plan says it's a fallback"
( cd "$d" && bash "$SCRIPT" -y >/dev/null 2>&1 )
assert "fallback restored the folder" test -f "$d/docs/.scrolls/STARTER.md"
assert "trailer Scrolls-Deletion-Commit" test "$(trailer "$d" Scrolls-Deletion-Commit)" = "$del"
assert "trailer Scrolls-Source-Commit" test "$(trailer "$d" Scrolls-Source-Commit)" = "$src"

echo; echo "=== 9: nothing anywhere in history ==="
d="$(new_repo)"; echo x > "$d/x"; commit_all "$d" init
( cd "$d" && bash "$SCRIPT" -y >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 1 "no checkpoint exits 1"

echo; echo "=== 10: an existing folder is refused, -f replaces it ==="
d="$(new_repo)"; scaffold "$d"; commit_all "$d" init; src="$(head_sha "$d")"
echo "newer" >> "$d/docs/.scrolls/HANDOFF.md"; commit_all "$d" "update"
( cd "$d" && bash "$SCRIPT" -y "$src" >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 3 "existing folder refused"
( cd "$d" && bash "$SCRIPT" -y -f "$src" >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "-f exits 0"
assert "-f put back the source's HANDOFF.md" test "$(git -C "$d" show "$src:docs/.scrolls/HANDOFF.md")" = "$(cat "$d/docs/.scrolls/HANDOFF.md")"
assert "trailer Scrolls-Replaced" test "$(trailer "$d" Scrolls-Replaced)" = "docs/.scrolls"

echo; echo "=== 11: uncommitted work at a target path is refused ==="
d="$(new_repo)"; scaffold "$d"; commit_all "$d" init
( cd "$d" && bash "$REMOVE" -y >/dev/null 2>&1 )
mkdir -p "$d/docs/.scrolls"; echo mine > "$d/docs/.scrolls/NOTES.md"
out="$(cd "$d" && bash "$SCRIPT" -y 2>&1)"; rc=$?
assert_exit "$rc" 3 "untracked file in the target folder refused"
assert "user file untouched" test "$(cat "$d/docs/.scrolls/NOTES.md")" = "mine"

echo; echo "=== 12: --onto a local branch, through a temporary worktree ==="
d="$(new_repo)"; scaffold "$d"; echo a > "$d/a.txt"; commit_all "$d" init
( cd "$d" && bash "$REMOVE" -y >/dev/null 2>&1 )
git -C "$d" branch other; git -C "$d" checkout -q other; echo b > "$d/b.txt"; commit_all "$d" "other work"
git -C "$d" checkout -q main; main_before="$(head_sha "$d")"
out="$(cd "$d" && bash "$SCRIPT" -y --onto other 2>&1)"; rc=$?
assert_exit "$rc" 0 "--onto other exits 0"
assert "main untouched" test "$(head_sha "$d")" = "$main_before"
assert "current checkout untouched" absent "$d/docs/.scrolls"
assert "still on main" test "$(git -C "$d" symbolic-ref --short HEAD)" = "main"
assert "other got the scrolls" git -C "$d" cat-file -e other:docs/.scrolls/STARTER.md
assert "other kept its own work" git -C "$d" cat-file -e other:b.txt
assert "restore commit is on top of other's work" test "$(git -C "$d" log -1 --format=%s other~1)" = "other work"
assert "temporary worktree cleaned up" test "$(git -C "$d" worktree list | wc -l)" -eq 1

echo; echo "=== 13: --onto a commit needs -b; -b creates the branch ==="
( cd "$d" && bash "$SCRIPT" -y --onto "$(head_sha "$d" other~1)" >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 2 "--onto SHA without -b exits 2"
( cd "$d" && bash "$SCRIPT" -y --onto "$(head_sha "$d" other~1)" -b mem >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "--onto SHA -b mem exits 0"
assert "new branch has the scrolls" git -C "$d" cat-file -e mem:docs/.scrolls/STARTER.md
assert "new branch starts at the given commit" test "$(head_sha "$d" mem~1)" = "$(head_sha "$d" other~1)"
( cd "$d" && bash "$SCRIPT" -y --onto main -b mem >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 3 "-b with an existing branch name refused"
( cd "$d" && bash "$SCRIPT" -y -b x >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 2 "-b without --onto exits 2"

echo; echo "=== 14: --list, and --all for other branches ==="
d="$(new_repo)"; scaffold "$d"; commit_all "$d" init
git -C "$d" checkout -q -b side; ( cd "$d" && bash "$REMOVE" -y >/dev/null 2>&1 ); side_removal="$(head_sha "$d")"
git -C "$d" checkout -q main
out="$(cd "$d" && bash "$SCRIPT" --list 2>&1)"; rc=$?
assert_exit "$rc" 1 "--list on main finds nothing"
out="$(cd "$d" && bash "$SCRIPT" --list --all 2>&1)"; rc=$?
assert_exit "$rc" 0 "--list --all exits 0"
assert_match "$out" "${side_removal:0:12}" "--list --all shows the side-branch checkpoint"
assert_match "$out" "not restored" "shows its status"
( cd "$d" && bash "$SCRIPT" -y --all >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 2 "--all without --list exits 2"
git -C "$d" checkout -q side
( cd "$d" && bash "$SCRIPT" -y >/dev/null 2>&1 )
out="$(cd "$d" && bash "$SCRIPT" --list 2>&1)"
assert_match "$out" "\[restored\]" "--list marks it restored afterwards"

echo; echo "=== 15: --no-commit stages and writes the message file ==="
d="$(new_repo)"; scaffold "$d"; commit_all "$d" init
( cd "$d" && bash "$REMOVE" -y >/dev/null 2>&1 ); before="$(head_sha "$d")"
( cd "$d" && bash "$SCRIPT" -y --no-commit >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "--no-commit exits 0"
assert "HEAD unchanged" test "$(head_sha "$d")" = "$before"
assert "message file written" test -f "$d/.git/SCROLLS_RESTORE_MSG"
( cd "$d" && git commit -q -F .git/SCROLLS_RESTORE_MSG ); assert "message file commits cleanly" test $? -eq 0

echo; echo "=== 16: embedded fallback templates match scrolls-setup's ==="
py="$(command -v python3 || command -v python)"
"$py" - "$SKILL_DIR/scripts" "$TEMPLATES" <<'PY'
import sys; sys.path.insert(0, sys.argv[1]); import restore
t = sys.argv[2]
pairs = [("SCROLLS_MD_BLOCK.md", restore.EMBEDDED_SCROLLS_BLOCK),
         ("CLAUDE_MD_BLOCK.md", restore.EMBEDDED_CLAUDE_BLOCK),
         ("AGENTS_MD_BLOCK.md", restore.EMBEDDED_AGENTS_BLOCK)]
sys.exit(0 if all(open(f"{t}/{n}", encoding="utf-8").read() == e for n, e in pairs) else 1)
PY
assert "embedded templates in sync" test $? -eq 0

echo
echo "=== $((TOTAL - FAILURES))/$TOTAL passed ==="
[ "$FAILURES" -eq 0 ]
