#!/usr/bin/env python3
"""Remove a scrolls working-memory system from a git repository.

The exact opposite of /scrolls-setup: deletes the scrolls folder
(docs/.scrolls or docs/scrolls), cleans the SCROLLS.md / CLAUDE.md /
AGENTS.md pointer chain setup installed, and records everything in ONE
git commit whose message names the commit just before the removal, so
the removal can always be undone (and later parsed by /scrolls-restore).

This file holds all of the logic. remove.sh and remove.ps1 are thin
launchers that only locate a Python interpreter and pass every argument
through unchanged, so the two platforms can never drift apart.

Stdlib only, Python 3.9+.

Usage:
  remove.py [-p BASE ...] [-t | -l] [-r] [-x [TARGETS]] ... [-y] [-n] [--no-commit]

  -p, --path BASE     Base directory to look in (repeatable). BASE may be the
                      scrolls folder itself, a docs folder (BASE/.scrolls), or a
                      project folder (BASE/docs/.scrolls).
  -t, --reporoot      Use the git repository's top level as BASE.
  -l, --local         Use the current directory as BASE (the default).
  -r, --recurse       Find EVERY scrolls folder under BASE and remove them all.
  -x, --purge [T]     Also delete these pointer files outright, even if they
                      hold content setup didn't write. T is a comma list and
                      the flag is repeatable. Values: SCROLLS.md, CLAUDE.md,
                      AGENTS.md, any other plain file name next to `docs`
                      (e.g. GEMINI.md), or `all` (the default when -x is given
                      with no value) = SCROLLS.md, CLAUDE.md, AGENTS.md.
  -y, --yes           Apply. Without it the script only prints the plan.
  -n, --dry-run       Print the plan only (overrides -y).
      --no-commit     Apply and stage, but don't commit. The commit message is
                      written to <git-dir>/SCROLLS_REMOVE_MSG for `git commit -F`.

Exit codes: 0 ok / plan printed, 1 nothing found, 2 usage error,
3 refused by a safety check, 4 git commit failed (changes left staged).
"""
from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from typing import Dict, List, Optional, Tuple

MAXDEPTH = 8
PRUNE_NAMES = {
    ".git", "node_modules", "vendor", "dist", "build", ".venv", "venv",
    "__pycache__", "target", ".next", ".cache",
}
SCROLLS_NAMES = (".scrolls", "scrolls")
POINTER_FILES = ("SCROLLS.md", "CLAUDE.md", "AGENTS.md")
MSG_FILE_NAME = "SCROLLS_REMOVE_MSG"

# Embedded copies of scrolls-setup/assets/templates/*_MD_BLOCK.md. The
# live templates are preferred when this skill is installed next to
# scrolls-setup (see load_templates); these copies are the fallback for a
# standalone install. tests/ checks the two stay byte-identical.
EMBEDDED_SCROLLS_BLOCK = (
    "# Scrolls — Project Memory\n"
    "\n"
    "Before doing ANY work in this project, read `{{SCROLLS_PATH}}/STARTER.md` first — it tells you which of the other `{{SCROLLS_PATH}}/*.md` files to read, in what order, and when to update each of them.\n"
    "\n"
    "**Quick summary for the `{{SCROLLS_PATH}}/` directory**:\n"
    "\n"
    "Start with **`{{SCROLLS_PATH}}/STARTER.md`** — it explains the reading order for the rest of `{{SCROLLS_PATH}}/` (`SPEC.md` for the full feature list, `HANDOFF.md` for the latest session's state, `GAP_ANALYSIS.md`/`GAP_CONTEXT.md` for known gaps and why, `PLAN.md` for the prioritized backlog, `WISDOM.md` for hard-won lessons and traps to avoid). These files are the project's working memory across sessions and are kept up to date as the app evolves.\n"
)
EMBEDDED_CLAUDE_BLOCK = "## Access Scrolls Agentic Memory\n\nSee @SCROLLS.md.\n"
EMBEDDED_AGENTS_BLOCK = "See @CLAUDE.md\n"

HEADING_RE = re.compile(r"^#{1,6}\s+")


def die(code: int, msg: str) -> "None":
    print(msg, file=sys.stderr)
    sys.exit(code)


def git(repo: str, *args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", "-C", repo, *args],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=check,
    )


def posix(p: str) -> str:
    return p.replace(os.sep, "/") if os.sep != "/" else p


# ---------------------------------------------------------------- templates

def load_templates() -> Tuple[str, str, str]:
    here = os.path.dirname(os.path.abspath(__file__))
    tdir = os.path.normpath(os.path.join(here, "..", "..", "scrolls-setup", "assets", "templates"))

    def read(name: str, fallback: str) -> str:
        path = os.path.join(tdir, name)
        try:
            with open(path, encoding="utf-8") as fh:
                return fh.read()
        except OSError:
            return fallback

    return (
        read("SCROLLS_MD_BLOCK.md", EMBEDDED_SCROLLS_BLOCK),
        read("CLAUDE_MD_BLOCK.md", EMBEDDED_CLAUDE_BLOCK),
        read("AGENTS_MD_BLOCK.md", EMBEDDED_AGENTS_BLOCK),
    )


# ---------------------------------------------------------- block stripping

def _norm(line: str) -> str:
    return line.rstrip()


def _heading_text(line: str) -> Optional[str]:
    if HEADING_RE.match(line):
        return HEADING_RE.sub("", line).strip()
    return None


def _line_eq(actual: str, expected: str, loose_period: bool) -> bool:
    a, e = _norm(actual), _norm(expected)
    if a == e:
        return True
    # Setup may demote the block's heading to a subsection (or the user may
    # promote it), so a heading matches at any level.
    ha, he = _heading_text(a), _heading_text(e)
    if ha is not None and he is not None and ha == he:
        return True
    if loose_period and a.rstrip(".") == e.rstrip("."):
        return True
    return False


def strip_block(text: str, block: str, loose_period: bool = False) -> Tuple[str, bool]:
    """Remove the first occurrence of `block` from `text`.

    Matching is line-based on the block's non-blank lines, in order, with
    any run of blank lines allowed between them (setup separates inserted
    blocks with blank lines; editors sometimes add or drop one). Trailing
    whitespace is ignored and a heading may be at any level. Returns
    (new_text, found).
    """
    want = [ln for ln in block.splitlines() if ln.strip()]
    if not want:
        return text, False
    lines = text.splitlines()
    n = len(lines)
    for start in range(n):
        if not _line_eq(lines[start], want[0], loose_period):
            continue
        i, k = start + 1, 1
        while k < len(want):
            while i < n and not lines[i].strip():
                i += 1
            if i < n and _line_eq(lines[i], want[k], loose_period):
                i += 1
                k += 1
            else:
                break
        if k == len(want):
            before, after = lines[:start], lines[i:]
            while before and not before[-1].strip():
                before.pop()
            while after and not after[0].strip():
                after.pop(0)
            joined = before + ([""] if before and after else []) + after
            out = "\n".join(joined)
            return (out + "\n") if out.strip() else "", True
    return text, False


# ------------------------------------------------------------ discovery

def is_scrolls_dir(path: str) -> bool:
    return os.path.basename(os.path.normpath(path)) in SCROLLS_NAMES and \
        os.path.isfile(os.path.join(path, "STARTER.md"))


def find_exact(base: str) -> List[str]:
    if os.path.isfile(os.path.join(base, "STARTER.md")):
        return [base]
    for tier in (os.path.join(base, "docs"), base):
        hits = [os.path.join(tier, n) for n in SCROLLS_NAMES if is_scrolls_dir(os.path.join(tier, n))]
        if hits:
            return hits
    return []


def find_recursive(base: str) -> List[str]:
    hits: List[str] = []
    base_depth = os.path.abspath(base).rstrip(os.sep).count(os.sep)
    for root, dirs, _files in os.walk(base):
        depth = os.path.abspath(root).rstrip(os.sep).count(os.sep) - base_depth
        keep = []
        for d in sorted(dirs):
            if d in PRUNE_NAMES:
                continue
            full = os.path.join(root, d)
            if d in SCROLLS_NAMES and os.path.isfile(os.path.join(full, "STARTER.md")):
                hits.append(full)
                continue  # never descend into a scrolls folder
            keep.append(d)
        dirs[:] = keep if depth + 1 < MAXDEPTH else []
    return hits


# ------------------------------------------------------------ planning

class Action:
    # kind: folder | deleted | stripped | purged | kept | review | pruned
    def __init__(self, kind: str, path: str, note: str):
        self.kind, self.path, self.note = kind, path, note


KIND_TRAILER = {
    "folder": "Scrolls-Folder",
    "deleted": "Scrolls-Deleted",
    "stripped": "Scrolls-Stripped",
    "purged": "Scrolls-Purged",
    "kept": "Scrolls-Kept",
    "review": "Scrolls-Review",
    "pruned": "Scrolls-Pruned",
}
KIND_LABEL = {
    "folder": "removed folder",
    "deleted": "deleted",
    "stripped": "stripped",
    "purged": "purged",
    "kept": "kept",
    "review": "needs review",
    "pruned": "pruned empty folder",
}


def parse_purge(values: Optional[List[str]]) -> List[str]:
    if not values:
        return []
    out: List[str] = []
    for v in values:
        for item in v.split(","):
            item = item.strip()
            if not item:
                continue
            if item.lower() == "all":
                out.extend(POINTER_FILES)
                continue
            if "/" in item or "\\" in item or item in (".", "..") or item.startswith("-"):
                die(2, f"-x/--purge takes plain file names next to the docs folder (e.g. CLAUDE.md), not paths: {item!r}")
            out.append(item)
    seen, uniq = set(), []
    for x in out:
        if x not in seen:
            seen.add(x)
            uniq.append(x)
    return uniq


def read_text(path: str) -> Optional[str]:
    try:
        with open(path, encoding="utf-8", newline="") as fh:
            return fh.read()
    except OSError:
        return None


def plan_pointers(repo: str, ptr_rel: str, ref_forms: List[str], purge: List[str],
                  templates: Tuple[str, str, str]) -> Tuple[List[Action], Dict[str, str]]:
    """Decide what happens to each pointer file in one directory.

    Returns (actions, new_contents) where new_contents maps a repo-relative
    path to the text it should be rewritten to ("" never appears there —
    an emptied file becomes a `deleted` action instead).
    """
    scrolls_tpl, claude_tpl, agents_tpl = templates
    actions: List[Action] = []
    new_contents: Dict[str, str] = {}

    def rel(name: str) -> str:
        return f"{ptr_rel}/{name}" if ptr_rel else name

    def mentions_scrolls(text: str) -> bool:
        return any(form in text for form in ref_forms)

    claude_gone = False

    # SCROLLS.md -------------------------------------------------------
    sp = rel("SCROLLS.md")
    stext = read_text(os.path.join(repo, sp))
    if stext is not None:
        if "SCROLLS.md" in purge:
            only_block = any(strip_block(stext, scrolls_tpl.replace("{{SCROLLS_PATH}}", f))[0] == ""
                             for f in ref_forms)
            actions.append(Action("deleted" if only_block else "purged", sp,
                                  "held only the scrolls pointer block" if only_block
                                  else "deleted by -x/--purge, including content setup didn't write"))
        else:
            out, found = stext, False
            for form in ref_forms:
                out, found = strip_block(stext, scrolls_tpl.replace("{{SCROLLS_PATH}}", form))
                if found:
                    break
            if found and out == "":
                actions.append(Action("deleted", sp, "held only the scrolls pointer block"))
            elif found and not mentions_scrolls(out):
                new_contents[sp] = out
                actions.append(Action("stripped", sp, "scrolls pointer block removed; other content kept"))
            elif mentions_scrolls(stext):
                actions.append(Action("review", sp, "references the scrolls folder but not in setup's exact wording; left untouched"))
            else:
                actions.append(Action("kept", sp, "no reference to the removed scrolls folder"))

    # CLAUDE.md --------------------------------------------------------
    cp = rel("CLAUDE.md")
    ctext = read_text(os.path.join(repo, cp))
    if ctext is None:
        claude_gone = True
    elif "CLAUDE.md" in purge:
        claude_gone = True
        out, _ = strip_block(ctext, claude_tpl, loose_period=True)
        actions.append(Action("deleted" if out == "" else "purged", cp,
                              "held only the scrolls pointer stub" if out == ""
                              else "deleted by -x/--purge, including content setup didn't write"))
    else:
        out, found = strip_block(ctext, claude_tpl, loose_period=True)
        # Pre-1.2.0 setups embedded the SCROLLS.md block straight into CLAUDE.md.
        for form in ref_forms:
            out2, found2 = strip_block(out, scrolls_tpl.replace("{{SCROLLS_PATH}}", form))
            if found2:
                out, found = out2, True
                break
        leftover = found and ("@SCROLLS.md" in out or mentions_scrolls(out))
        if found and out == "":
            claude_gone = True
            actions.append(Action("deleted", cp, "held only the scrolls pointer stub"))
        elif found and not leftover:
            new_contents[cp] = out
            actions.append(Action("stripped", cp, "scrolls pointer stub removed; other content kept"))
        elif found and leftover:
            new_contents[cp] = out
            actions.append(Action("stripped", cp, "scrolls pointer stub removed; other content kept"))
            actions.append(Action("review", cp, "still mentions SCROLLS.md or the scrolls folder elsewhere"))
        elif "@SCROLLS.md" in ctext or mentions_scrolls(ctext):
            actions.append(Action("review", cp, "references scrolls but not in setup's exact wording; left untouched"))
        else:
            actions.append(Action("kept", cp, "no scrolls pointer found"))

    # AGENTS.md --------------------------------------------------------
    ap = rel("AGENTS.md")
    atext = read_text(os.path.join(repo, ap))
    if atext is not None:
        if "AGENTS.md" in purge:
            out, _ = strip_block(atext, agents_tpl, loose_period=True)
            actions.append(Action("deleted" if out == "" else "purged", ap,
                                  "held only the pointer to CLAUDE.md" if out == ""
                                  else "deleted by -x/--purge, including content setup didn't write"))
        else:
            out, found = strip_block(atext, "See @SCROLLS.md\n", loose_period=True)
            if claude_gone:
                out, f2 = strip_block(out, agents_tpl, loose_period=True)
                found = found or f2
            if found and out == "":
                actions.append(Action("deleted", ap, "held only a pointer to a file this removal deletes"))
            elif found:
                new_contents[ap] = out
                actions.append(Action("stripped", ap, "dangling pointer removed; other content kept"))
            elif mentions_scrolls(atext):
                actions.append(Action("review", ap, "references the scrolls folder directly; left untouched"))
            else:
                actions.append(Action("kept", ap, "still points at CLAUDE.md, which stays"))

    # Other -x targets -------------------------------------------------
    for name in purge:
        if name in POINTER_FILES:
            continue
        op = rel(name)
        full = os.path.join(repo, op)
        if os.path.isdir(full):
            die(2, f"-x/--purge only deletes files; {op} is a directory.")
        if os.path.isfile(full):
            actions.append(Action("purged", op, "deleted by -x/--purge"))
        else:
            print(f"Note: -x {name}: no such file at {op or '.'}, nothing to purge.", file=sys.stderr)

    return actions, new_contents


# ------------------------------------------------------------ main

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="remove", add_help=True,
                                description="Remove the scrolls system and commit the removal.")
    p.add_argument("-p", "--path", action="append", dest="paths", default=[])
    p.add_argument("-t", "--reporoot", action="store_true")
    p.add_argument("-l", "--local", action="store_true")
    p.add_argument("-r", "--recurse", action="store_true")
    p.add_argument("-x", "--purge", action="append", nargs="?", const="all", dest="purge")
    p.add_argument("-y", "--yes", action="store_true")
    p.add_argument("-n", "--dry-run", action="store_true")
    p.add_argument("--no-commit", action="store_true")
    return p


def normalize_argv(argv: List[str]) -> List[str]:
    out = []
    for a in argv:
        m = re.match(r"^(-[px])=(.*)$", a)
        if m:
            out.extend([m.group(1), m.group(2)])
        else:
            out.append(a)
    return out


def main(argv: List[str]) -> int:
    parser = build_parser()
    try:
        args = parser.parse_args(normalize_argv(argv))
    except SystemExit as e:
        return 2 if e.code else 0

    picked = sum(bool(x) for x in (args.paths, args.reporoot, args.local))
    if picked > 1:
        die(2, "Cannot combine -p/--path, -t/--reporoot and -l/--local — pick one way to target a location.")

    purge = parse_purge(args.purge)
    cwd = os.getcwd()

    cwd_repo = git(cwd, "rev-parse", "--show-toplevel", check=False)
    cwd_repo_root = cwd_repo.stdout.strip() if cwd_repo.returncode == 0 else ""

    if args.reporoot:
        if not cwd_repo_root:
            die(2, "-t/--reporoot requires being inside a git repository; none was detected here.")
        bases = [cwd_repo_root]
    elif args.local:
        bases = [cwd]
    elif args.paths:
        bases = args.paths
    else:
        default = os.environ.get("DEFAULT_SCROLLS_RELPATH") or cwd
        bases = [default]
        if not os.environ.get("DEFAULT_SCROLLS_RELPATH") and cwd_repo_root and \
                os.path.realpath(cwd_repo_root) != os.path.realpath(cwd):
            print(f"Note: looking under {cwd} only — not the repo root ({cwd_repo_root})"
                  f"{'' if args.recurse else ', not recursively'}.", file=sys.stderr)
            print("Pass -t/--reporoot for the repo root, -r/--recurse to sweep everything under here, or both.",
                  file=sys.stderr)

    found: List[str] = []
    for b in bases:
        if not os.path.isdir(b):
            print(f"WARN: '{b}' does not exist, skipping", file=sys.stderr)
            continue
        hits = find_recursive(b) if args.recurse else find_exact(b)
        for h in hits:
            real = os.path.realpath(h)
            if real not in found:
                found.append(real)

    if not found:
        print(f"No scrolls folder (.scrolls or scrolls with a STARTER.md) found under: {' '.join(bases)}")
        if not args.recurse:
            print("Checked the exact default locations only — pass -r/--recurse to search recursively.")
        print("Nothing to remove.")
        return 1

    # All targets must live in ONE git repository, so one commit covers them.
    repos = set()
    for f in found:
        r = git(f, "rev-parse", "--show-toplevel", check=False)
        if r.returncode != 0:
            die(3, f"REFUSED: {f} is not inside a git repository. /scrolls-remove only works where the "
                   "removal can be committed and undone.")
        repos.add(os.path.realpath(r.stdout.strip()))
    if len(repos) > 1:
        die(3, "REFUSED: the scrolls folders found span several git repositories: "
               + ", ".join(sorted(repos)) + ". Run once per repository.")
    repo = repos.pop()

    head = git(repo, "rev-parse", "--verify", "-q", "HEAD", check=False)
    if head.returncode != 0:
        die(3, "REFUSED: this repository has no commits yet, so there is no previous commit to "
               "record (or restore from). Commit the scrolls first, then re-run.")
    prev_sha = head.stdout.strip()
    branch = git(repo, "symbolic-ref", "-q", "--short", "HEAD", check=False).stdout.strip()

    templates = load_templates()

    def relpath(p: str) -> str:
        r = posix(os.path.relpath(p, repo))
        return "" if r == "." else r

    actions: List[Action] = []
    new_contents: Dict[str, str] = {}
    remove_dirs: List[str] = []
    ptr_groups: Dict[str, List[str]] = {}

    for f in sorted(found):
        srel = relpath(f)
        files = [ln for ln in git(repo, "ls-files", "--", srel).stdout.splitlines() if ln]
        actions.append(Action("folder", srel, f"{len(files)} tracked file{'s' if len(files) != 1 else ''}"))
        remove_dirs.append(srel)
        docs_rel = posix(os.path.dirname(srel))
        ptr_rel = posix(os.path.dirname(docs_rel)) if docs_rel else ""
        docs_name = os.path.basename(docs_rel) if docs_rel else ""
        forms = ptr_groups.setdefault(ptr_rel, [])
        for form in ([f"{docs_name}/{os.path.basename(srel)}"] if docs_name else []) + [srel]:
            if form not in forms:
                forms.append(form)

    for ptr_rel, forms in sorted(ptr_groups.items()):
        acts, contents = plan_pointers(repo, ptr_rel, forms, purge, templates)
        actions.extend(acts)
        new_contents.update(contents)

    # Docs folders left empty once their scrolls folder is gone.
    removed_abs = {os.path.join(repo, d) for d in remove_dirs}
    for d in sorted({posix(os.path.dirname(x)) for x in remove_dirs if posix(os.path.dirname(x))}):
        full = os.path.join(repo, d)
        try:
            rest = [e for e in os.listdir(full) if os.path.join(full, e) not in removed_abs]
        except OSError:
            continue
        if not rest:
            actions.append(Action("pruned", d, "empty once the scrolls folder is gone"))

    touched = [a.path for a in actions if a.kind in ("folder", "deleted", "stripped", "purged")]

    # ------------------------------------------------------- safety checks
    problems: List[str] = []
    dirty = git(repo, "status", "--porcelain=v1", "--ignored", "--untracked-files=all", "--", *touched,
                check=False).stdout.splitlines()
    if dirty:
        problems.append("Uncommitted, untracked, or ignored changes under the paths this would remove — "
                        "they are NOT in the previous commit, so removing them could not be undone:\n"
                        + "\n".join(f"    {ln}" for ln in dirty)
                        + "\n  Commit (or discard) them first, then re-run.")
    staged = [ln for ln in git(repo, "diff", "--cached", "--name-only").stdout.splitlines() if ln]
    if staged and not args.no_commit:
        problems.append("Other changes are already staged; they'd be swept into the removal commit:\n"
                        + "\n".join(f"    {ln}" for ln in staged)
                        + "\n  Commit or unstage them first (git restore --staged <file>), then re-run.")

    # ---------------------------------------------------------- report plan
    print(f"Repository: {repo}")
    print(f"Branch:     {branch or '(detached HEAD)'}")
    print(f"Previous commit (restore point): {prev_sha}")
    print()
    print("Plan:")
    for a in actions:
        print(f"  {KIND_LABEL[a.kind]:<20} {a.path or '.'}  — {a.note}")
    if not branch:
        print("\nWARNING: HEAD is detached; the removal commit won't be on any branch.")

    others = stray_references(repo, ptr_groups, {a.path for a in actions})
    if others:
        print("\nOther files that still mention the scrolls folder or SCROLLS.md (reported, never edited):")
        for o in others:
            print(f"    {o}")

    message = build_message(prev_sha, actions)

    if problems:
        print()
        for pr in problems:
            print(f"REFUSED: {pr}")
        return 3

    if args.dry_run or not args.yes:
        print("\nDry run — nothing changed. Re-run with -y/--yes to apply.")
        print("\nCommit message that would be used:\n")
        print("\n".join(f"    {ln}" for ln in message.splitlines()))
        return 0

    # --------------------------------------------------------------- apply
    for d in remove_dirs:
        git(repo, "rm", "-r", "-q", "--", d)
    for a in actions:
        if a.kind in ("deleted", "purged"):
            git(repo, "rm", "-q", "--", a.path)
        elif a.kind == "stripped" and a.path in new_contents:
            with open(os.path.join(repo, a.path), "w", encoding="utf-8", newline="") as fh:
                fh.write(new_contents[a.path])
            git(repo, "add", "--", a.path)
    for a in actions:
        if a.kind == "pruned":
            full = os.path.join(repo, a.path)
            try:
                if os.path.isdir(full) and not os.listdir(full):
                    os.rmdir(full)
            except OSError:
                pass

    git_dir = git(repo, "rev-parse", "--absolute-git-dir").stdout.strip()
    msg_path = os.path.join(git_dir, MSG_FILE_NAME)
    with open(msg_path, "w", encoding="utf-8") as fh:
        fh.write(message)

    if args.no_commit:
        print(f"\nStaged, not committed (--no-commit). Commit with:\n    git commit -F {msg_path}")
        return 0

    res = git(repo, "commit", "-q", "-F", msg_path, check=False)
    if res.returncode != 0:
        print("\nERROR: git commit failed — the removal is staged but not committed.", file=sys.stderr)
        print((res.stderr or res.stdout).strip(), file=sys.stderr)
        print(f"Fix the cause (e.g. a pre-commit hook), then: git commit -F {msg_path}", file=sys.stderr)
        return 4
    new_sha = git(repo, "rev-parse", "HEAD").stdout.strip()
    try:
        os.remove(msg_path)
    except OSError:
        pass
    print(f"\nCommitted: {new_sha}")
    print(f"Undo:      git revert --no-edit {new_sha}")
    return 0


def build_message(prev_sha: str, actions: List[Action]) -> str:
    notes = [f"- {KIND_LABEL[a.kind]}: {a.path or '.'} ({a.note})" for a in actions]
    trailers = ["Scrolls-Action: remove", f"Scrolls-Previous-Commit: {prev_sha}"]
    trailers += [f"{KIND_TRAILER[a.kind]}: {a.path or '.'}" for a in actions]
    return (
        "maint(memory): scrolls-removed\n"
        "\n"
        f"- previous commit: #{prev_sha}\n"
        "\n"
        "Notes:\n"
        + "\n".join(notes) + "\n"
        "\n"
        + "\n".join(trailers) + "\n"
    )


def stray_references(repo: str, ptr_groups: Dict[str, List[str]], handled: set) -> List[str]:
    needles = {"SCROLLS.md"}
    for forms in ptr_groups.values():
        needles.update(forms)
    hits: List[str] = []
    for ptr_rel in ptr_groups:
        top = os.path.join(repo, ptr_rel) if ptr_rel else repo
        for root, dirs, files in os.walk(top):
            dirs[:] = [d for d in dirs if d not in PRUNE_NAMES and d not in SCROLLS_NAMES]
            for name in files:
                full = os.path.join(root, name)
                rel = posix(os.path.relpath(full, repo))
                if rel in handled or rel in hits:
                    continue
                try:
                    if os.path.getsize(full) > 1_000_000:
                        continue
                    with open(full, encoding="utf-8") as fh:
                        text = fh.read()
                except (OSError, UnicodeDecodeError):
                    continue
                if any(n in text for n in needles):
                    hits.append(rel)
                if len(hits) >= 50:
                    return hits
    return sorted(hits)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
