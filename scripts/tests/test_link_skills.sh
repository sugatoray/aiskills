#!/usr/bin/env bash
# Red/Green regression test for scripts/link-skills.sh and the Makefile targets that call it.
# Each scenario builds a throwaway git repository, so the real repository is never touched
# (except the last scenario, which only runs --check on it).
# Run with: bash scripts/tests/test_link_skills.sh   (or: make test-scripts)
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS="$(dirname "$HERE")"
REPO="$(dirname "$SCRIPTS")"
SCRIPT="$SCRIPTS/link-skills.sh"

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
    fail "$label -- did not expect: $pattern"; echo "--- actual output ---"; printf '%s\n' "$text"; echo "---"
  else pass "$label"; fi
}
assert_exit() {
  local actual="$1" expected="$2" label="$3"
  if [ "$actual" -eq "$expected" ]; then pass "$label"; else fail "$label -- expected exit $expected, got $actual"; fi
}
assert_true() { if eval "$1"; then pass "$2"; else fail "$2 -- condition false: $1"; fi; }

# A throwaway repository: skills/fam/{alpha,beta}, a deprecated skill, a nested
# non-skill folder, a single skill elsewhere, and the tools and Makefile under test.
new_repo() {
  local d; d="$(mktemp -d -t link-skills-test.XXXXXX)"
  ( cd "$d" && git init -q && git config user.email t@t && git config user.name t )
  mkskill "$d/skills/fam/alpha" alpha
  mkskill "$d/skills/fam/beta" beta
  mkdir -p "$d/skills/fam/old" "$d/skills/fam/meta"
  printf -- '---\nname: old\n---\n' > "$d/skills/fam/old/SKILL.md.deprecated"
  printf '# notes\n' > "$d/skills/fam/meta/MAINTAINERS.md"
  mkskill "$d/skills/dev/tools-x/gamma" gamma
  mkdir -p "$d/scripts"; cp "$SCRIPT" "$d/scripts/" 2>/dev/null; cp "$REPO/Makefile" "$d/" 2>/dev/null
  echo "$d"
}
mkskill() { mkdir -p "$1"; printf -- '---\nname: %s\ndescription: "test skill"\n---\n# %s\n' "$2" "$2" > "$1/SKILL.md"; }
run() { local dir="$1"; shift; ( cd "$dir" && bash "$SCRIPT" "$@" 2>&1 ); }
link_of() { readlink "$1/$2" 2>/dev/null; }

# ============================================================
echo; echo "=== A: usage ==="
r="$(new_repo)"
out="$(run "$r")"; code=$?
assert_exit "$code" 2 "no path is a usage error (exit 2)"
assert_match "$out" "usage" "says how to use it"
out="$(run "$r" skills/nope)"; code=$?
assert_exit "$code" 2 "a missing path is a usage error"
assert_match "$out" "skills/nope: no such file or folder" "names the missing path"
out="$(run "$r" --bogus skills/fam)"; code=$?
assert_exit "$code" 2 "an unknown option is a usage error"

echo; echo "=== B: one skill folder links into both targets, relatively ==="
r="$(new_repo)"
out="$(run "$r" skills/fam/alpha)"; code=$?
assert_exit "$code" 0 "exit 0"
assert_true "[ \"\$(link_of '$r/.claude/skills' alpha)\" = '../../skills/fam/alpha' ]" ".claude/skills/alpha -> ../../skills/fam/alpha"
assert_true "[ \"\$(link_of '$r/.agents/skills' alpha)\" = '../../skills/fam/alpha' ]" ".agents/skills/alpha -> ../../skills/fam/alpha"
assert_true "[ -f '$r/.claude/skills/alpha/SKILL.md' ] && [ -f '$r/.agents/skills/alpha/SKILL.md' ]" "both links resolve to the SKILL.md"
assert_match "$out" "linked \.claude/skills/alpha -> \.\./\.\./skills/fam/alpha" "reports each link"
assert_true "[ ! -e '$r/.claude/skills/beta' ]" "a sibling skill is not linked"

echo; echo "=== C: a parent folder links every skill below it, and nothing else ==="
r="$(new_repo)"
out="$(run "$r" skills/fam)"; code=$?
assert_exit "$code" 0 "exit 0"
assert_true "[ -L '$r/.claude/skills/alpha' ] && [ -L '$r/.claude/skills/beta' ]" "alpha and beta linked"
assert_true "[ ! -e '$r/.claude/skills/old' ] && [ ! -e '$r/.claude/skills/meta' ]" "deprecated skill and non-skill folder skipped"
out="$(run "$r" skills)"; code=$?
assert_true "[ \"\$(link_of '$r/.agents/skills' gamma)\" = '../../skills/dev/tools-x/gamma' ]" "nested deeper skill found from skills/"

echo; echo "=== D: running again is a no-op ==="
out="$(run "$r" skills/fam)"; code=$?
assert_exit "$code" 0 "exit 0"
assert_match "$out" "up to date \.claude/skills/alpha" "reports up to date"
assert_no_match "$out" "^linked" "links nothing new"

echo; echo "=== E: --dry-run changes nothing ==="
r="$(new_repo)"
out="$(run "$r" --dry-run skills/fam)"; code=$?
assert_exit "$code" 0 "exit 0"
assert_match "$out" "would link \.claude/skills/alpha -> \.\./\.\./skills/fam/alpha" "says what it would link"
assert_true "[ ! -e '$r/.claude/skills/alpha' ] && [ ! -e '$r/.agents' ]" "creates nothing"

echo; echo "=== F: an existing installed copy is kept unless --force ==="
r="$(new_repo)"
mkdir -p "$r/.claude/skills/alpha"; echo copy > "$r/.claude/skills/alpha/SKILL.md"
out="$(run "$r" skills/fam/alpha)"; code=$?
assert_exit "$code" 1 "exit 1 on a conflict"
assert_match "$out" "\.claude/skills/alpha exists and is not a link to skills/fam/alpha.*--force" "explains and names --force"
assert_true "[ ! -L '$r/.claude/skills/alpha' ] && grep -q copy '$r/.claude/skills/alpha/SKILL.md'" "the copy is untouched"
assert_true "[ -L '$r/.agents/skills/alpha' ]" "the other target is still linked"
out="$(run "$r" --force skills/fam/alpha)"; code=$?
assert_exit "$code" 0 "--force: exit 0"
assert_true "[ \"\$(link_of '$r/.claude/skills' alpha)\" = '../../skills/fam/alpha' ]" "--force replaces the copy with the link"
assert_true "[ -f '$r/skills/fam/alpha/SKILL.md' ] && grep -q 'name: alpha' '$r/skills/fam/alpha/SKILL.md'" "the source skill is untouched"

echo; echo "=== G: a link to somewhere else is kept unless --force ==="
r="$(new_repo)"
mkdir -p "$r/.claude/skills"; ln -s ../../skills/fam/beta "$r/.claude/skills/alpha"
out="$(run "$r" skills/fam/alpha)"; code=$?
assert_exit "$code" 1 "exit 1"
assert_true "[ \"\$(link_of '$r/.claude/skills' alpha)\" = '../../skills/fam/beta' ]" "the other link is untouched"
out="$(run "$r" --force skills/fam/alpha)"; code=$?
assert_true "[ \"\$(link_of '$r/.claude/skills' alpha)\" = '../../skills/fam/alpha' ]" "--force relinks it"

echo; echo "=== H: a skill whose name: differs from its folder is not linked ==="
r="$(new_repo)"
mkskill "$r/skills/fam/delta" not-delta
out="$(run "$r" skills/fam)"; code=$?
assert_exit "$code" 1 "exit 1"
assert_match "$out" "skills/fam/delta: name: is 'not-delta', not 'delta'" "names the mismatch"
assert_true "[ ! -e '$r/.claude/skills/delta' ] && [ ! -e '$r/.claude/skills/not-delta' ]" "nothing linked for it"
assert_true "[ -L '$r/.claude/skills/alpha' ]" "the other skills are still linked"

echo; echo "=== H2: a quoted name: is read without its quotes ==="
r="$(new_repo)"
mkdir -p "$r/skills/q/eps"; printf -- '---\nname: "eps"\ndescription: x\n---\n' > "$r/skills/q/eps/SKILL.md"
mkdir -p "$r/skills/q/zeta"; printf -- "---\nname: 'zeta'\n---\n" > "$r/skills/q/zeta/SKILL.md"
out="$(run "$r" skills/q)"; code=$?
assert_exit "$code" 0 "double- and single-quoted names: exit 0"
assert_true "[ -L '$r/.claude/skills/eps' ] && [ -L '$r/.claude/skills/zeta' ]" "both linked"

echo; echo "=== I: paths outside the repository, and the link folders themselves, are refused ==="
r="$(new_repo)"
out="$(run "$r" /tmp)"; code=$?
assert_exit "$code" 2 "a path outside the repository is a usage error"
run "$r" skills/fam/alpha >/dev/null
out="$(run "$r" .)"; code=$?
assert_no_match "$out" "skills/alpha/SKILL|\.claude/skills/alpha ->.*\.claude" "skills reached through .claude or .agents are not relinked"
assert_true "[ \"\$(link_of '$r/.claude/skills' alpha)\" = '../../skills/fam/alpha' ]" "existing link unchanged after linking ."

echo; echo "=== J: from a subfolder, links still go to the repository root ==="
r="$(new_repo)"
out="$( cd "$r/skills/fam" && bash "$SCRIPT" alpha 2>&1 )"; code=$?
assert_exit "$code" 0 "exit 0"
assert_true "[ \"\$(link_of '$r/.claude/skills' alpha)\" = '../../skills/fam/alpha' ]" "path given relative to the current folder"
assert_true "[ ! -e '$r/skills/fam/.claude' ]" "no link folders made in the subfolder"

echo; echo "=== K: --check verifies every skill link ==="
r="$(new_repo)"
run "$r" skills/fam >/dev/null
out="$(run "$r" --check)"; code=$?
assert_exit "$code" 0 "all good: exit 0"
assert_match "$out" "ok \.claude/skills/alpha -> \.\./\.\./skills/fam/alpha" "lists each good link"
mkdir -p "$r/.claude/skills/copy-only"; mkskill "$r/.claude/skills/copy-only" copy-only
out="$(run "$r" --check)"; code=$?
assert_exit "$code" 0 "an installed copy (not a link) is not checked"
mv "$r/skills/fam/beta" "$r/skills/fam/beta2"
out="$(run "$r" --check)"; code=$?
assert_exit "$code" 1 "a broken link: exit 1"
assert_match "$out" "broken \.claude/skills/beta -> \.\./\.\./skills/fam/beta" "names the broken link"
r="$(new_repo)"
run "$r" skills/fam/alpha >/dev/null
sed -i.bak 's/^name: alpha$/name: alpha-renamed/' "$r/skills/fam/alpha/SKILL.md" && rm -f "$r/skills/fam/alpha/SKILL.md.bak"
out="$(run "$r" --check)"; code=$?
assert_exit "$code" 1 "a renamed skill: exit 1"
assert_match "$out" "\.claude/skills/alpha: the skill's name: is 'alpha-renamed'" "names the renamed skill"

echo; echo "=== L: the Makefile targets ==="
r="$(new_repo)"
out="$( cd "$r" && make -s link-skills 2>&1 )"; code=$?
assert_true "[ $code -ne 0 ]" "make link-skills without SKILL= fails"
assert_match "$out" "SKILL=" "and says to give SKILL="
out="$( cd "$r" && make -s link-skills SKILL=skills/fam/alpha 2>&1 )"; code=$?
assert_exit "$code" 0 "make link-skills SKILL=skills/fam/alpha"
assert_true "[ -L '$r/.claude/skills/alpha' ] && [ -L '$r/.agents/skills/alpha' ]" "links made through make"
out="$( cd "$r" && make -s link-skills SKILL=skills/fam DRY_RUN=1 2>&1 )"; code=$?
assert_match "$out" "would link \.claude/skills/beta" "DRY_RUN=1 passes --dry-run"
out="$( cd "$r" && make -s check-skill-links 2>&1 )"; code=$?
assert_exit "$code" 0 "make check-skill-links"
out="$( cd "$r" && make -s help 2>&1 )"; code=$?
assert_match "$out" "link-skills" "make help lists the targets"
assert_match "$out" "make test-scripts" "make help names test-scripts"

echo; echo "=== M: the real repository's skill links are all valid ==="
out="$( cd "$REPO" && bash "$SCRIPT" --check 2>&1 )"; code=$?
assert_exit "$code" 0 "--check passes on this repository"

echo
echo "$((TOTAL - FAILURES))/$TOTAL passed"
[ "$FAILURES" -eq 0 ]
