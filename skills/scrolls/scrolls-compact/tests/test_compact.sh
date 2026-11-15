#!/usr/bin/env bash
# Red/Green regression test for compact.sh (and, through it, compact.py).
# Run with: bash tests/test_compact.sh
# Every scenario runs in its own throwaway git repository under mktemp,
# with commit dates pinned relative to a fixed "now".
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$HERE")"
SCRIPT="$SKILL_DIR/scripts/compact.sh"

export TZ=UTC
NOW=1800000000                       # 2027-01-15 08:00:00 UTC
export SCROLLS_COMPACT_NOW="$NOW"
TODAY=20270115

TOTAL=0
FAILURES=0
pass() { TOTAL=$((TOTAL + 1)); echo "PASS: $1"; }
fail() { TOTAL=$((TOTAL + 1)); FAILURES=$((FAILURES + 1)); echo "FAIL: $1"; }
assert() { local label="$1"; shift; if "$@"; then pass "$label"; else fail "$label"; fi; }
absent() { [ ! -e "$1" ]; }
assert_exit() { if [ "$1" -eq "$2" ]; then pass "$3"; else fail "$3 -- expected exit $2, got $1"; echo "--- output ---"; printf '%s\n' "${4:-}"; echo "---"; fi; }
assert_match() {
  if printf '%s' "$1" | grep -qE -- "$2"; then pass "$3"; else
    fail "$3 -- expected to match: $2"; echo "--- actual ---"; printf '%s\n' "$1"; echo "---"; fi
}
assert_no_match() {
  if printf '%s' "$1" | grep -qE -- "$2"; then
    fail "$3 -- expected NOT to match: $2"; echo "--- actual ---"; printf '%s\n' "$1"; echo "---"; else pass "$3"; fi
}

new_repo() {
  local d; d="$(mktemp -d -t scrolls-compact-test.XXXXXX)"
  ( cd "$d" && git init -q -b main && git config user.email test@test.com && git config user.name test \
      && git config commit.gpgsign false && git config tag.gpgsign false )
  printf '%s' "$d"
}

# commit_at REPO DAYS_AGO MSG [HOURS_AGO_EXTRA]
commit_at() {
  local ts=$((NOW - $2 * 86400 - ${4:-0} * 3600))
  ( cd "$1" && git add -A && GIT_AUTHOR_DATE="@$ts +0000" GIT_COMMITTER_DATE="@$ts +0000" \
      git commit -q --allow-empty -m "$3" )
}

head_sha() { git -C "$1" rev-parse HEAD; }
short_sha() { git -C "$1" rev-parse --short "${2:-HEAD}"; }
trailer() { git -C "$1" log -1 --format="%(trailers:key=$2,valueonly,separator=%x2C)" "${3:-HEAD}"; }

S=docs/.scrolls

write_starter() {
  cat > "$1/$S/STARTER.md" <<'EOF'
# STARTER.md — Read Me First

Read these in order:

1. **`docs/.scrolls/SPEC.md`** — features.
2. **`docs/.scrolls/HANDOFF.md`** — the snapshot.
3. **`docs/.scrolls/GAP_ANALYSIS.md`** — gaps.
4. **`docs/.scrolls/GAP_CONTEXT.md`** — why.
5. **`docs/.scrolls/PLAN.md`** — backlog.
6. **`docs/.scrolls/WISDOM.md`** — lessons.

## When to update each file
- **SPEC.md**: after shipping a feature.
- **WISDOM.md**: whenever you learn something.

## Quick orientation
Nothing yet.
EOF
}

# Three commits: day 30, day 10, day 1. With the defaults (and only three
# commits on main) the base is the day-10 commit.
fixture() {
  local d="$1"
  mkdir -p "$d/$S"
  write_starter "$d"
  printf '# SPEC.md — Feature Spec\n\nIntro paragraph.\n\n## Old feature A\nA does a thing.\nA also does more.\n' > "$d/$S/SPEC.md"
  printf '# PLAN.md — Backlog\n\nIntro.\n\n- [x] T-1: old done\n- [ ] T-2: old open\n' > "$d/$S/PLAN.md"
  printf '# HANDOFF.md\n\nSnapshot.\n\n## Current state\n- old state bullet\n  with a continuation line\n\n## Known issues / open threads\n- old open thread\n' > "$d/$S/HANDOFF.md"
  printf '# GAP_ANALYSIS.md\n\n- gap one\n' > "$d/$S/GAP_ANALYSIS.md"
  printf '# GAP_CONTEXT.md\n\n- **gap one**: a long and winding reason that goes on and on.\n' > "$d/$S/GAP_CONTEXT.md"
  printf '# WISDOM.md\n\n- never forget\n' > "$d/$S/WISDOM.md"
  echo "code" > "$d/app.txt"
  commit_at "$d" 30 "day 30: scrolls"

  printf '\n## Mid feature B\nB does a thing.\n' >> "$d/$S/SPEC.md"
  printf -- '- [x] T-3: mid done\n' >> "$d/$S/PLAN.md"
  commit_at "$d" 10 "day 10"

  printf '\n## New feature C\nC is fresh.\n' >> "$d/$S/SPEC.md"
  printf -- '- [ ] T-4: new open\n- [x] T-5: new done\n' >> "$d/$S/PLAN.md"
  python3 - "$d/$S/HANDOFF.md" <<'PY'
import sys
p = sys.argv[1]; s = open(p).read()
s = s.replace("- old state bullet\n  with a continuation line\n", "- old state bullet\n  with a continuation line\n- new state bullet\n")
open(p, "w").write(s)
PY
  commit_at "$d" 1 "day 1"
}

marker_of() { printf '%s\n' "$1" | sed -n 's/^ *marker: *//p'; }

# What an agent would do in step 3: condense the old units, add markers.
condense() {
  local d="$1" marker="$2"
  python3 - "$d/$S" "$marker" <<'PY'
import sys, os
folder, marker = sys.argv[1], sys.argv[2]
def edit(name, fn):
    p = os.path.join(folder, name); s = open(p).read(); open(p, "w").write(fn(s))
edit("SPEC.md", lambda s: s.replace(
    "## Old feature A\nA does a thing.\nA also does more.\n\n## Mid feature B\nB does a thing.\n",
    "## Compacted features\n" + marker + "\n> Older detail was compacted. See `COMPACT.md`.\n\n"
    "- **Old feature A** — does a thing.\n- **Mid feature B** — does a thing.\n"))
edit("PLAN.md", lambda s: s.replace("- [x] T-1: old done\n", "").replace("- [x] T-3: mid done\n", "")
     .replace("Intro.\n", "Intro.\n\n" + marker + "\n> 2 done tickets compacted. See `COMPACT.md`.\n"))
edit("HANDOFF.md", lambda s: s.replace("- old state bullet\n  with a continuation line\n", marker + "\n"))
edit("GAP_CONTEXT.md", lambda s: s.replace("a long and winding reason that goes on and on.", "a long reason.")
     .replace("# GAP_CONTEXT.md\n", "# GAP_CONTEXT.md\n" + marker + "\n"))
PY
}

# ============================================================
echo; echo "=== 1: plan with defaults: date rule wins on a 3-commit repo ==="
d="$(new_repo)"; fixture "$d"; before="$(head_sha "$d")"
day10="$(git -C "$d" rev-parse --short HEAD~1)"
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; rc=$?
assert_exit "$rc" 0 "plan exits 0" "$out"
assert_match "$out" "Dry run" "says nothing changed"
assert_match "$out" "base: +$day10 .*rule: 7 days" "base is the day-10 commit by the 7-day rule"
assert_match "$out" "20 commits -> none" "commit rule has no candidate"
assert_match "$out" "checkpoint: +$(short_sha "$d")" "checkpoint is HEAD"
assert_match "$out" "compacted/scrolls_compact_${TODAY}_$(short_sha "$d")\.md" "report name is date then hash"
assert_match "$out" "marker: +<!-- scrolls-compact: checkpoint=$(short_sha "$d")" "prints the marker to paste"
assert_match "$out" "old +L[0-9]+-[0-9]+ +## Old feature A" "SPEC old feature A is old"
assert_match "$out" "old +L[0-9]+-[0-9]+ +## Mid feature B" "SPEC mid feature B is old"
assert_match "$out" "new +L[0-9]+-[0-9]+ +## New feature C" "SPEC new feature C is new"
assert_match "$out" "old +L[0-9]+ +- \[x\] T-1" "done T-1 is old"
assert_match "$out" "live +L[0-9]+ +- \[ \] T-2" "open T-2 is live despite its age"
assert_match "$out" "new +L[0-9]+ +- \[x\] T-5" "recent done T-5 is new"
assert_match "$out" "old +L[0-9]+-[0-9]+ +- old state bullet" "stale handoff bullet is old"
assert_match "$out" "live +L[0-9]+ +- old open thread" "open thread is live"
assert_match "$out" "live +L[0-9]+ +- gap one" "GAP_ANALYSIS lines are live"
assert_no_match "$out" "WISDOM" "WISDOM.md is never in scope"
assert "HEAD unchanged" test "$(head_sha "$d")" = "$before"
assert "tree clean" test -z "$(git -C "$d" status --porcelain)"
assert "plan saved in the git dir" test -f "$d/.git/SCROLLS_COMPACT_PLAN.json"

echo; echo "=== 2: commit rule wins when it is newer ==="
d="$(new_repo)"; fixture "$d"
for i in $(seq 1 24); do echo "$i" >> "$d/app.txt"; commit_at "$d" 0 "c$i" $((25 - i)); done
expect="$(git -C "$d" rev-list --first-parent main | sed -n 21p | cut -c1-7)"
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; rc=$?
assert_exit "$rc" 0 "plan exits 0" "$out"
assert_match "$out" "base: +$expect.*rule: 20 commits" "base is the 21st first-parent commit"
out="$(cd "$d" && bash "$SCRIPT" --keep-commits=30 2>&1)"
assert_match "$out" "rule: 7 days" "--keep-commits=30 makes the date rule the newer one"
out="$(cd "$d" && bash "$SCRIPT" --keep-days=40 --keep-commits=40 2>&1)"; rc=$?
assert_exit "$rc" 1 "nothing older than both windows -> exit 1" "$out"
assert_match "$out" "[Nn]othing to compact" "says nothing to compact"

echo; echo "=== 3: --before and --base; both given -> newer wins ==="
d="$(new_repo)"; fixture "$d"
day30="$(git -C "$d" rev-parse --short HEAD~2)"; day10="$(git -C "$d" rev-parse --short HEAD~1)"
out="$(cd "$d" && bash "$SCRIPT" --before=20261225 2>&1)"
assert_match "$out" "base: +$day30 .*rule: --before" "--before=YYYYMMDD picks the day-30 commit"
out="$(cd "$d" && bash "$SCRIPT" --before=2026-12-25 2>&1)"
assert_match "$out" "base: +$day30 " "--before accepts YYYY-MM-DD"
out="$(cd "$d" && bash "$SCRIPT" --base=HEAD~1 2>&1)"
assert_match "$out" "base: +$day10 .*rule: --base" "--base picks that commit"
out="$(cd "$d" && bash "$SCRIPT" --before=20261225 --base=HEAD~1 2>&1)"
assert_match "$out" "base: +$day10 .*rule: --base" "both given: the newer (--base) wins"
out="$(cd "$d" && bash "$SCRIPT" --before=2026-13-45 2>&1)"; rc=$?
assert_exit "$rc" 2 "bad date -> usage error" "$out"
out="$(cd "$d" && bash "$SCRIPT" -p . -t 2>&1)"; rc=$?
assert_exit "$rc" 2 "-p with -t -> usage error" "$out"
out="$(cd "$d" && bash "$SCRIPT" --include=WISDOM.md 2>&1)"; rc=$?
assert_exit "$rc" 2 "--include=WISDOM.md refused" "$out"
git -C "$d" checkout -q -b side HEAD~2; echo x > "$d/side.txt"; commit_at "$d" 20 "side"
side="$(head_sha "$d")"; git -C "$d" checkout -q main
out="$(cd "$d" && bash "$SCRIPT" --base="$side" 2>&1)"; rc=$?
assert_exit "$rc" 3 "--base not an ancestor of HEAD -> 3" "$out"

echo; echo "=== 4: a section with one fresh line stays new ==="
d="$(new_repo)"; fixture "$d"
python3 - "$d/$S/SPEC.md" <<'PY'
import sys; p=sys.argv[1]; s=open(p).read(); open(p,"w").write(s.replace("A also does more.", "A also does much more."))
PY
commit_at "$d" 0 "touch A"
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"
assert_match "$out" "new +L[0-9]+-[0-9]+ +## Old feature A" "edited section is new"

echo; echo "=== 5: safety refusals and not-found ==="
d="$(new_repo)"; fixture "$d"
echo dirty >> "$d/$S/PLAN.md"
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; rc=$?
assert_exit "$rc" 3 "dirty scrolls folder -> 3" "$out"
git -C "$d" checkout -q -- "$S/PLAN.md"
echo new > "$d/$S/NOTES.md"
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; rc=$?
assert_exit "$rc" 3 "untracked file in scrolls folder -> 3" "$out"
rm "$d/$S/NOTES.md"
echo more >> "$d/app.txt"; git -C "$d" add app.txt
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; rc=$?
assert_exit "$rc" 3 "other changes staged -> 3" "$out"
git -C "$d" reset -q; git -C "$d" checkout -q -- app.txt
e="$(new_repo)"; commit_at "$e" 1 "empty"
out="$(cd "$e" && bash "$SCRIPT" 2>&1)"; rc=$?
assert_exit "$rc" 1 "no scrolls folder -> 1" "$out"
mkdir -p "$e/pkg/docs/.scrolls"; cp "$d/$S/STARTER.md" "$e/pkg/docs/.scrolls/"; commit_at "$e" 1 "pkg"
out="$(cd "$e" && bash "$SCRIPT" -r -n 2>&1)"
assert_match "$out" "folder: +pkg/docs/.scrolls" "-r finds a nested scrolls folder"
n="$(mktemp -d)"; out="$(cd "$n" && bash "$SCRIPT" 2>&1)"; rc=$?
assert_exit "$rc" 2 "not a git repository -> 2" "$out"

echo; echo "=== 6: finalize happy path: one commit, report, table, STARTER, tag ==="
d="$(new_repo)"; fixture "$d"; cp_sha="$(head_sha "$d")"; cp="$(short_sha "$d")"
base_full="$(git -C "$d" rev-parse HEAD~1)"
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; marker="$(marker_of "$out")"
condense "$d" "$marker"
out="$(cd "$d" && bash "$SCRIPT" --finalize 2>&1)"; rc=$?
assert_exit "$rc" 0 "finalize exits 0" "$out"
report="$S/compacted/scrolls_compact_${TODAY}_${cp}.md"
assert "exactly one new commit on the checkpoint" test "$(git -C "$d" rev-parse HEAD~1)" = "$cp_sha"
assert "tree clean" test -z "$(git -C "$d" status --porcelain)"
assert "report written" test -f "$d/$report"
assert "COMPACT.md written" test -f "$d/$S/COMPACT.md"
msg="$(git -C "$d" log -1 --format=%B)"
assert "subject exact" test "$(printf '%s\n' "$msg" | sed -n 1p)" = "maint(memory): scrolls-compacted"
assert "checkpoint line exact" test "$(printf '%s\n' "$msg" | sed -n 3p)" = "- checkpoint: #$cp_sha"
assert_match "$msg" "^- base: #$base_full \(2027-01-05; rule: 7 days\)" "base line"
assert "trailer Scrolls-Action" test "$(trailer "$d" Scrolls-Action)" = "compact"
assert "trailer Scrolls-Checkpoint" test "$(trailer "$d" Scrolls-Checkpoint)" = "$cp_sha"
assert "trailer Scrolls-Compact-Base" test "$(trailer "$d" Scrolls-Compact-Base)" = "$base_full"
assert "trailer Scrolls-Previous-Compaction none" test "$(trailer "$d" Scrolls-Previous-Compaction)" = "none"
assert "trailer Scrolls-Folder" test "$(trailer "$d" Scrolls-Folder)" = "$S"
assert "trailer Scrolls-Report" test "$(trailer "$d" Scrolls-Report)" = "$report"
assert_match "$(trailer "$d" Scrolls-Compacted)" "$S/SPEC.md" "SPEC.md listed as compacted"
assert_match "$(trailer "$d" Scrolls-Compacted)" "$S/PLAN.md" "PLAN.md listed as compacted"
assert_no_match "$(trailer "$d" Scrolls-Compacted)" "GAP_ANALYSIS" "unchanged GAP_ANALYSIS not listed"
assert_match "$msg" "unchanged: $S/GAP_ANALYSIS.md" "unchanged file noted"
assert "checkpoint tag on the checkpoint" test "$(git -C "$d" rev-parse "scrolls-compact/${TODAY}-${cp}^{commit}")" = "$cp_sha"
c="$(cat "$d/$S/COMPACT.md")"
assert_match "$c" "^# COMPACT.md" "COMPACT.md has its heading"
assert_match "$c" "^\| 1 \| 2027-01-15 \| \`$cp\` \|" "table row 1"
assert_match "$c" "compacted/scrolls_compact_${TODAY}_${cp}\.md" "row links the report relatively"
assert_match "$c" "git show <checkpoint>:" "COMPACT.md explains plain git recovery"
r="$(cat "$d/$report")"
assert_match "$r" "Checkpoint: \`$cp_sha\`" "report has full checkpoint"
assert_match "$r" "^## $S/SPEC.md" "report has a SPEC marker section"
assert_match "$r" "Blob at checkpoint: \`$(git -C "$d" rev-parse "$cp_sha:$S/SPEC.md")\`" "report has the blob id"
assert_match "$r" "Old feature A" "report lists condensed SPEC section"
assert_match "$r" "T-1: old done" "report lists removed ticket"
s="$(cat "$d/$S/STARTER.md")"
assert_match "$s" "^7\. \*\*\`docs/.scrolls/COMPACT.md\`\*\*" "STARTER gets item 7"
assert_match "$s" "^- \*\*COMPACT.md\*\*:" "STARTER gets a when-to-update line"
assert "plan file removed" absent "$d/.git/SCROLLS_COMPACT_PLAN.json"
assert_match "$out" "Undo: +git revert --no-edit" "prints undo"
assert_match "$out" "git push origin scrolls-compact/${TODAY}-${cp}" "prints the tag push command"

echo; echo "=== 7: finalize validation refusals ==="
setup7() {
  d="$(new_repo)"; fixture "$d"
  out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; marker="$(marker_of "$out")"
  condense "$d" "$marker"
}
setup7; sed -i '/T-2: old open/d' "$d/$S/PLAN.md"
out="$(cd "$d" && bash "$SCRIPT" --finalize 2>&1)"; rc=$?
assert_exit "$rc" 3 "deleting a live open ticket -> 3" "$out"
assert_match "$out" "T-2" "names the ticket"
assert "no commit made" test "$(git -C "$d" log -1 --format=%s)" = "day 1"
setup7; sed -i 's/C is fresh./C is rewritten./' "$d/$S/SPEC.md"
out="$(cd "$d" && bash "$SCRIPT" --finalize 2>&1)"; rc=$?
assert_exit "$rc" 3 "editing a new unit -> 3" "$out"
setup7; sed -i '/scrolls-compact:/d' "$d/$S/PLAN.md"
out="$(cd "$d" && bash "$SCRIPT" --finalize 2>&1)"; rc=$?
assert_exit "$rc" 3 "changed file without marker -> 3" "$out"
setup7; sed -i '/gap one/d' "$d/$S/GAP_CONTEXT.md"
out="$(cd "$d" && bash "$SCRIPT" --finalize 2>&1)"; rc=$?
assert_exit "$rc" 3 "GAP_CONTEXT entry dropped -> 3" "$out"
setup7; echo "- extra" >> "$d/$S/WISDOM.md"
out="$(cd "$d" && bash "$SCRIPT" --finalize 2>&1)"; rc=$?
assert_exit "$rc" 3 "out-of-scope WISDOM.md edited -> 3" "$out"
setup7; sed -i 's/^Intro paragraph.$/Intro changed./' "$d/$S/SPEC.md"
out="$(cd "$d" && bash "$SCRIPT" --finalize 2>&1)"; rc=$?
assert_exit "$rc" 3 "frame text changed -> 3" "$out"
setup7; git -C "$d" stash -q; commit_at "$d" 0 "moved"; git -C "$d" stash pop -q
out="$(cd "$d" && bash "$SCRIPT" --finalize 2>&1)"; rc=$?
assert_exit "$rc" 3 "HEAD moved since the plan -> 3" "$out"
d="$(new_repo)"; fixture "$d"; ( cd "$d" && bash "$SCRIPT" >/dev/null 2>&1 )
out="$(cd "$d" && bash "$SCRIPT" --finalize 2>&1)"; rc=$?
assert_exit "$rc" 1 "nothing condensed -> 1" "$out"
d="$(new_repo)"; fixture "$d"
out="$(cd "$d" && bash "$SCRIPT" --finalize 2>&1)"; rc=$?
assert_exit "$rc" 2 "finalize without a plan -> 2" "$out"
setup7; out="$(cd "$d" && bash "$SCRIPT" --finalize -n 2>&1)"; rc=$?
assert_exit "$rc" 0 "finalize -n validates only" "$out"
assert "finalize -n makes no commit" test "$(git -C "$d" log -1 --format=%s)" = "day 1"
assert "finalize -n writes no report" absent "$d/$S/COMPACT.md"

echo; echo "=== 8: --no-commit and --no-tag ==="
d="$(new_repo)"; fixture "$d"; cp="$(short_sha "$d")"
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; condense "$d" "$(marker_of "$out")"
out="$(cd "$d" && bash "$SCRIPT" --finalize --no-commit 2>&1)"; rc=$?
assert_exit "$rc" 0 "--no-commit exits 0" "$out"
assert "no commit made" test "$(git -C "$d" log -1 --format=%s)" = "day 1"
assert_match "$(git -C "$d" diff --cached --name-only)" "COMPACT.md" "changes are staged"
assert_match "$out" "git commit -F" "prints the commit command"
assert "no tag yet with --no-commit" test -z "$(git -C "$d" tag -l 'scrolls-compact/*')"
d="$(new_repo)"; fixture "$d"
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; condense "$d" "$(marker_of "$out")"
( cd "$d" && bash "$SCRIPT" --finalize --no-tag >/dev/null 2>&1 ); rc=$?
assert_exit "$rc" 0 "--no-tag exits 0"
assert "--no-tag makes no tag" test -z "$(git -C "$d" tag -l 'scrolls-compact/*')"

echo; echo "=== 9: a second compaction chains to the first ==="
d="$(new_repo)"; fixture "$d"
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; condense "$d" "$(marker_of "$out")"
( cd "$d" && bash "$SCRIPT" --finalize >/dev/null 2>&1 )
first="$(head_sha "$d")"
# Make the next run 30 days later, so day-1 content is old too.
export SCROLLS_COMPACT_NOW=$((NOW + 30 * 86400))
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; rc=$?
assert_exit "$rc" 0 "second plan exits 0" "$out"
m2="$(marker_of "$out")"; cp2="$(short_sha "$d")"
python3 - "$d/$S/PLAN.md" "$m2" <<'PY'
import sys, re
p, m = sys.argv[1], sys.argv[2]; s = open(p).read()
s = s.replace("- [x] T-5: new done\n", "")
s = re.sub(r"<!-- scrolls-compact:.*-->", m, s)
open(p, "w").write(s)
PY
out="$(cd "$d" && bash "$SCRIPT" --finalize 2>&1)"; rc=$?
assert_exit "$rc" 0 "second finalize exits 0" "$out"
assert "Previous-Compaction points at the first" test "$(trailer "$d" Scrolls-Previous-Compaction)" = "$first"
c="$(cat "$d/$S/COMPACT.md")"
assert "row 2 is above row 1" test "$(printf '%s\n' "$c" | grep -E '^\| [0-9]+ \|' | head -1 | cut -d'|' -f2 | tr -d ' ')" = "2"
assert "two rows" test "$(printf '%s\n' "$c" | grep -cE '^\| [0-9]+ \|')" = "2"
assert "STARTER entry not duplicated" test "$(grep -c 'COMPACT.md' "$d/$S/STARTER.md")" = "2"
export SCROLLS_COMPACT_NOW="$NOW"

echo; echo "=== 10: --list, --show, --extract (also after squash-style rewrite and unhide) ==="
d="$(new_repo)"; fixture "$d"; cp_sha="$(head_sha "$d")"; cp="$(short_sha "$d")"
out="$(cd "$d" && bash "$SCRIPT" 2>&1)"; condense "$d" "$(marker_of "$out")"
( cd "$d" && bash "$SCRIPT" --finalize >/dev/null 2>&1 )
out="$(cd "$d" && bash "$SCRIPT" --list 2>&1)"; rc=$?
assert_exit "$rc" 0 "--list exits 0" "$out"
assert_match "$out" "#1 +2027-01-15 +$cp" "--list shows the row"
assert_match "$out" "reachable" "--list says the checkpoint is reachable"
out="$(cd "$d" && bash "$SCRIPT" --extract 1 PLAN.md 2>&1)"; rc=$?
assert_exit "$rc" 0 "--extract exits 0" "$out"
assert "--extract prints the pre-compaction file" test "$out" = "$(git -C "$d" show "$cp_sha:$S/PLAN.md")"
out="$(cd "$d" && bash "$SCRIPT" --extract "$cp" PLAN.md -o "$d/old_plan.md" 2>&1)"
assert_match "$(cat "$d/old_plan.md")" "T-1: old done" "--extract by hash with -o writes the file"
rm "$d/old_plan.md"
out="$(cd "$d" && bash "$SCRIPT" --show "#1" PLAN.md 2>&1)"; rc=$?
assert_exit "$rc" 0 "--show exits 0" "$out"
assert_match "$out" "^-- \[x\] T-1: old done" "--show shows the removed ticket"
# A squash merge flattens the message: trailers gone, the tree still has COMPACT.md.
git -C "$d" commit -q --amend -m "Squashed PR"
out="$(cd "$d" && bash "$SCRIPT" --show 1 PLAN.md 2>&1)"
assert_match "$out" "^-- \[x\] T-1: old done" "--show still works without trailers"
git -C "$d" mv docs/.scrolls docs/scrolls; commit_at "$d" 0 "unhide"
out="$(cd "$d" && bash "$SCRIPT" --extract 1 SPEC.md 2>&1)"; rc=$?
assert_exit "$rc" 0 "--extract after unhide exits 0" "$out"
assert_match "$out" "A also does more." "--extract after unhide returns the old text"
out="$(cd "$d" && bash "$SCRIPT" --extract 9 SPEC.md 2>&1)"; rc=$?
assert_exit "$rc" 1 "unknown compaction id -> 1" "$out"
e="$(new_repo)"; fixture "$e"
out="$(cd "$e" && bash "$SCRIPT" --list 2>&1)"; rc=$?
assert_exit "$rc" 1 "--list with no compactions -> 1" "$out"

echo; echo "=== 11: --include and --exclude ==="
d="$(new_repo)"; fixture "$d"
printf '# DECISIONS.md\n\n## Decision one\nWe chose X.\n' > "$d/$S/DECISIONS.md"; commit_at "$d" 20 "decisions"
out="$(cd "$d" && bash "$SCRIPT" --include=DECISIONS.md --exclude=HANDOFF.md 2>&1)"; rc=$?
assert_exit "$rc" 0 "plan with include/exclude exits 0" "$out"
assert_match "$out" "$S/DECISIONS.md" "included file planned"
assert_no_match "$out" "$S/HANDOFF.md" "excluded file not planned"

echo; echo "=== 12: wording, -y passthrough, template parity ==="
d="$(new_repo)"; fixture "$d"
out="$(cd "$d" && bash "$SCRIPT" -y 2>&1)"; rc=$?
assert_exit "$rc" 0 "-y is accepted on the plan" "$out"
condense "$d" "$(marker_of "$out")"
( cd "$d" && bash "$SCRIPT" --finalize >/dev/null 2>&1 )
msg="$(git -C "$d" log -1 --format=%B)"
assert_match "$msg" "HANDOFF.md \(1 unit condensed," "singular 'unit' for one"
assert_match "$msg" "SPEC.md \(2 units condensed," "plural 'units' for two"
fallback="$(cd "$SKILL_DIR/scripts" && python3 -c 'import compact,sys; sys.stdout.write(compact.COMPACT_TEMPLATE_FALLBACK)')"
assert "assets/templates/COMPACT.md matches the embedded fallback" test "$fallback" = "$(cat "$SKILL_DIR/assets/templates/COMPACT.md")"

echo
echo "=== $((TOTAL - FAILURES))/$TOTAL passed ==="
[ "$FAILURES" -eq 0 ]
