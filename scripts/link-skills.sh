#!/usr/bin/env bash
# Link skills from this repository into .agents/skills/ and .claude/skills/, so agents use the
# source under skills/ directly: an edit to a skill takes effect without reinstalling it.
#
# Usage:
#   scripts/link-skills.sh [--dry-run] [--force] PATH...    link every skill at or below each PATH
#   scripts/link-skills.sh --check                          verify every skill link in both folders
#
# PATH is a skill folder (one with a SKILL.md) or any folder above skills, such as skills/scrolls.
# Paths are taken from the current folder and must be inside the repository; the links always go
# to the repository root's .agents/skills/ and .claude/skills/, named after the skill and pointing
# at it relatively (../../skills/...), so the repository can move and the links still work.
#
#   --dry-run   say what would be linked; change nothing
#   --force     replace an existing folder (an installed copy) or a link to somewhere else
#   --check     every symlink in the two folders must resolve to a folder with a SKILL.md whose
#               `name:` equals the link's name; installed copies (real folders) are not checked
#
# A skill is linked only if its SKILL.md `name:` equals its folder name (agents look skills up by
# that name). SKILL.md.deprecated and the like are not skills. Exit codes: 0 done, 1 a conflict,
# a mismatched name or a broken link, 2 a usage error. bash 3.2 or later (macOS's is fine).
set -uo pipefail

TARGETS=".agents/skills .claude/skills"

usage() {
  cat >&2 <<'EOF'
usage: scripts/link-skills.sh [--dry-run] [--force] PATH...
       scripts/link-skills.sh --check
EOF
}
die_usage() { echo "link-skills: $1" >&2; usage; exit 2; }

dry_run=0 force=0 check=0
paths=()
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=1 ;;
    --force) force=1 ;;
    --check) check=1 ;;
    -h|--help) usage; exit 0 ;;
    -*) die_usage "unknown option: $arg" ;;
    *) paths+=("$arg") ;;
  esac
done

root="$(git rev-parse --show-toplevel 2>/dev/null)" || die_usage "not inside a git repository"
root="$(cd "$root" && pwd -P)"

# The `name:` in a SKILL.md's front matter (between the first two --- lines), unquoted.
skill_name() {
  awk 'NR == 1 && $0 != "---" { exit } NR > 1 && $0 == "---" { exit }
       NR > 1 && /^name:[ \t]*/ { sub(/^name:[ \t]*/, ""); gsub(/^["\047]|["\047][ \t]*$/, ""); sub(/[ \t]+$/, ""); print; exit }' "$1"
}

status=0

if [ "$check" -eq 1 ]; then
  [ "${#paths[@]}" -eq 0 ] || die_usage "--check takes no path"
  for target in $TARGETS; do
    [ -d "$root/$target" ] || continue
    for link in "$root/$target"/*; do
      [ -L "$link" ] || continue
      name="$(basename "$link")"
      dest="$(readlink "$link")"
      if [ ! -f "$link/SKILL.md" ]; then
        echo "broken $target/$name -> $dest"; status=1; continue
      fi
      actual="$(skill_name "$link/SKILL.md")"
      if [ "$actual" != "$name" ]; then
        echo "$target/$name: the skill's name: is '$actual', so agents won't find it as '$name'"; status=1; continue
      fi
      echo "ok $target/$name -> $dest"
    done
  done
  exit "$status"
fi

[ "${#paths[@]}" -gt 0 ] || die_usage "give a skill folder or a folder above skills"

# Every skill folder at or below the given paths, as paths relative to the repository root.
skills=()
for p in "${paths[@]}"; do
  [ -e "$p" ] || die_usage "$p: no such file or folder"
  [ -d "$p" ] || die_usage "$p: not a folder"
  abs="$(cd "$p" && pwd -P)"
  case "$abs/" in
    "$root"/*) ;;
    *) die_usage "$p: not inside the repository ($root)" ;;
  esac
  while IFS= read -r skill_md; do
    dir="$(dirname "$skill_md")"
    skills+=("${dir#"$root"/}")
  done < <(find "$abs" \( -name .git -o -name node_modules -o -name .agents -o -name .claude \) -prune \
             -o -type f -name SKILL.md -print | sort)
done
[ "${#skills[@]}" -gt 0 ] || die_usage "no SKILL.md found at or below: ${paths[*]}"

for rel in "${skills[@]}"; do
  name="$(basename "$rel")"
  actual="$(skill_name "$root/$rel/SKILL.md")"
  if [ "$actual" != "$name" ]; then
    echo "skip $rel: name: is '$actual', not '$name'; agents look skills up by the folder name" >&2
    status=1; continue
  fi
  for target in $TARGETS; do
    link="$root/$target/$name"
    dest="../../$rel"
    if [ -L "$link" ] && [ "$(readlink "$link")" = "$dest" ]; then
      echo "up to date $target/$name -> $dest"; continue
    fi
    if [ -e "$link" ] || [ -L "$link" ]; then
      if [ "$force" -ne 1 ]; then
        echo "keep $target/$name: $target/$name exists and is not a link to $rel; use --force to replace it" >&2
        status=1; continue
      fi
      if [ "$dry_run" -eq 1 ]; then echo "would replace $target/$name -> $dest"; continue; fi
      rm -rf "$link"
    elif [ "$dry_run" -eq 1 ]; then
      echo "would link $target/$name -> $dest"; continue
    fi
    mkdir -p "$root/$target"
    ln -s "$dest" "$link"
    echo "linked $target/$name -> $dest"
  done
done
exit "$status"
