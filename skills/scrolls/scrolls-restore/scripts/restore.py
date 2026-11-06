#!/usr/bin/env python3
"""Restore a scrolls working-memory system from git history.

The counterpart to /scrolls-remove. Brings back ONLY the agentic memory —
the scrolls folder(s) and the SCROLLS.md / CLAUDE.md / AGENTS.md pointer
stubs — into the current state of the rest of the repository, never
rolling anything else back. Records the restore as one git commit.

This file holds all of the logic. restore.sh and restore.ps1 are thin
launchers that only locate a Python interpreter and pass every argument
through unchanged.

Stdlib only, Python 3.9+.

Usage:
  restore.py [COMMIT] [-p BASE ...] [-t | -l] [-r]
             [--onto REF [-b NEW_BRANCH]] [--full] [-f]
             [-y] [-n] [--no-commit]
  restore.py --list [--all]

Source (where the memory comes from):
  (none)          The newest /scrolls-remove commit in HEAD's history
                  (trailer `Scrolls-Action: remove`); its
                  `Scrolls-Previous-Commit` is the source and its other
                  trailers say what to put back. If it was already
                  restored, nothing is done. If there is no removal commit
                  at all, falls back to the commit just before the newest
                  commit that deleted a scrolls STARTER.md.
  COMMIT          A removal commit (used as above), or ANY commit/branch/tag
                  containing a scrolls folder (folders and pointer stubs are
                  discovered in that commit's tree). Also --from COMMIT.

Target (what it lands on):
  (default)       The current checkout.
  --onto REF      A local branch: committed there via a temporary worktree,
                  without touching the current checkout.
  -b, --branch N  With --onto at a commit, tag or remote-tracking ref: create
                  branch N there and commit on it.

Scope (which folders), relative to the current directory:
  -p, --path BASE Restore folders at BASE (repeatable): the scrolls folder
                  itself, a docs folder (BASE/.scrolls), or a project folder
                  (BASE/docs/.scrolls).
  -t, --reporoot  BASE = repository top level.
  -l, --local     BASE = current directory (the default).
  -r, --recurse   Every folder under BASE, instead of the exact spots.

Other:
  --full          For pointer files the removal purged (-x), bring back the
                  whole old file instead of only the scrolls stub.
  -f, --force     Replace a scrolls folder that already exists at the target.
  -y, --yes       Apply. Without it the script only prints the plan.
  -n, --dry-run   Print the plan only (overrides -y).
  --no-commit     Apply and stage, but don't commit.
  --list          List scrolls checkpoints (removal commits) and stop.
  --all           With --list: search every ref, not just HEAD's history.

Exit codes: 0 ok / plan printed, 1 nothing to restore, 2 usage error,
3 refused by a safety check, 4 git commit failed (changes left staged).
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
from typing import Dict, List, Optional, Tuple

SCROLLS_NAMES = (".scrolls", "scrolls")
POINTER_FILES = ("SCROLLS.md", "CLAUDE.md", "AGENTS.md")
MSG_FILE_NAME = "SCROLLS_RESTORE_MSG"
STARTER_RE = re.compile(r"^(?:(.*)/)?(\.scrolls|scrolls)/STARTER\.md$")

# Embedded copies of scrolls-setup/assets/templates/*_MD_BLOCK.md, used when
# this skill is installed without scrolls-setup next to it. tests/ checks
# they stay byte-identical with the live templates.
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


class Refused(Exception):
    def __init__(self, code: int, msg: str):
        super().__init__(msg)
        self.code = code


def git(cwd: str, *args: str, check: bool = True) -> subprocess.CompletedProcess:
    res = subprocess.run(["git", "-C", cwd, *args], stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE, text=True, encoding="utf-8")
    if check and res.returncode != 0:
        raise Refused(3, f"git {' '.join(args)} failed:\n{(res.stderr or res.stdout).strip()}")
    return res


def load_templates() -> Tuple[str, str, str]:
    here = os.path.dirname(os.path.abspath(__file__))
    tdir = os.path.normpath(os.path.join(here, "..", "..", "scrolls-setup", "assets", "templates"))

    def read(name: str, fallback: str) -> str:
        try:
            with open(os.path.join(tdir, name), encoding="utf-8") as fh:
                return fh.read()
        except OSError:
            return fallback

    return (read("SCROLLS_MD_BLOCK.md", EMBEDDED_SCROLLS_BLOCK),
            read("CLAUDE_MD_BLOCK.md", EMBEDDED_CLAUDE_BLOCK),
            read("AGENTS_MD_BLOCK.md", EMBEDDED_AGENTS_BLOCK))


def pjoin(*parts: str) -> str:
    return "/".join(p for p in parts if p)


def pdir(p: str) -> str:
    return p.rsplit("/", 1)[0] if "/" in p else ""


def pbase(p: str) -> str:
    return p.rsplit("/", 1)[-1]


# ---------------------------------------------------------------- trees

class Tree:
    """Read-only view of a tree: the working directory, or a commit."""

    def __init__(self, repo: str, rev: Optional[str] = None):
        self.repo, self.rev = repo, rev

    def read(self, path: str) -> Optional[str]:
        if self.rev is None:
            try:
                with open(os.path.join(self.repo, path), encoding="utf-8", newline="") as fh:
                    return fh.read()
            except (OSError, UnicodeDecodeError):
                return None
        res = git(self.repo, "show", f"{self.rev}:{path}", check=False)
        return res.stdout if res.returncode == 0 else None

    def is_scrolls(self, folder: str) -> bool:
        if self.rev is None:
            return os.path.isfile(os.path.join(self.repo, folder, "STARTER.md"))
        return git(self.repo, "cat-file", "-e", f"{self.rev}:{folder}/STARTER.md", check=False).returncode == 0


def scrolls_folders_in(repo: str, rev: str) -> List[str]:
    out = git(repo, "ls-tree", "-r", "--name-only", "-z", rev).stdout
    found = []
    for path in out.split("\0"):
        m = STARTER_RE.match(path)
        if m:
            found.append(pdir(path))
    return sorted(set(found))


# ------------------------------------------------------------- trailers

def trailers_of(repo: str, sha: str) -> Dict[str, List[str]]:
    raw = git(repo, "log", "-1", "--format=%(trailers:unfold,only)", sha).stdout
    return parse_trailers(raw)


def parse_trailers(raw: str) -> Dict[str, List[str]]:
    out: Dict[str, List[str]] = {}
    for line in raw.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            out.setdefault(k.strip(), []).append(v.strip())
    return out


def scan_history(repo: str, revs: List[str]) -> List[Tuple[str, str, str, Dict[str, List[str]]]]:
    """(sha, iso-date, subject, trailers) for every scrolls remove/restore commit, newest first."""
    fmt = "%H%x1f%cI%x1f%s%x1f%(trailers:unfold,only)%x1e"
    res = git(repo, "log", *revs, f"--format={fmt}", "--grep=^Scrolls-Action:", check=False)
    if res.returncode != 0:
        return []
    rows = []
    for rec in res.stdout.split("\x1e"):
        rec = rec.strip("\n")
        if not rec:
            continue
        sha, date, subj, raw = (rec.split("\x1f") + ["", "", "", ""])[:4]
        tr = parse_trailers(raw)
        if tr.get("Scrolls-Action"):
            rows.append((sha, date, subj, tr))
    return rows


# ------------------------------------------------------------- stubs

def references_scrolls(text: str, forms: List[str]) -> bool:
    return any(f"{f}/STARTER.md" in text for f in forms)


def insert_block(text: str, block: str, demote_heading: bool) -> str:
    """Insert `block` near the top of `text`, the way /scrolls-setup does.

    If the file opens with a top-level heading, the block goes right under
    it (with its own top-level heading demoted to a subsection when
    `demote_heading`); otherwise it goes first. Blank lines separate it
    from the surrounding content.
    """
    blines = block.rstrip("\n").splitlines()
    lines = text.splitlines()
    head: List[str] = []
    if lines and re.match(r"^#\s", lines[0]):
        head, lines = lines[:1], lines[1:]
        if demote_heading and blines and re.match(r"^#\s", blines[0]):
            blines[0] = "#" + blines[0]
    while lines and not lines[0].strip():
        lines.pop(0)
    out = head + ([""] if head else []) + blines + ([""] if lines else []) + lines
    return "\n".join(out) + "\n"


# ------------------------------------------------------------- planning

class Action:
    def __init__(self, kind: str, path: str, note: str):
        self.kind, self.path, self.note = kind, path, note


KIND_TRAILER = {
    "folder": "Scrolls-Folder",
    "replaced": "Scrolls-Replaced",
    "restored": "Scrolls-Restored",
    "created": "Scrolls-Created",
    "inserted": "Scrolls-Inserted",
    "kept": "Scrolls-Kept",
    "skipped": "Scrolls-Skipped",
}
KIND_LABEL = {
    "folder": "restored folder",
    "replaced": "replaced folder",
    "restored": "restored",
    "created": "created",
    "inserted": "inserted",
    "kept": "kept",
    "skipped": "skipped",
}


class Source:
    def __init__(self, sha: str, how: str, removal: Optional[str] = None,
                 deletion: Optional[str] = None, manifest: Optional[Dict[str, List[str]]] = None):
        self.sha, self.how, self.removal, self.deletion, self.manifest = sha, how, removal, deletion, manifest


def resolve_commit(repo: str, ref: str) -> str:
    res = git(repo, "rev-parse", "--verify", "-q", f"{ref}^{{commit}}", check=False)
    if res.returncode != 0:
        shallow = git(repo, "rev-parse", "--is-shallow-repository", check=False).stdout.strip() == "true"
        hint = " This is a shallow clone — try `git fetch --unshallow` first." if shallow else ""
        raise Refused(2, f"Not a commit in this repository: {ref!r}.{hint}")
    return res.stdout.strip()


def source_from_removal(repo: str, removal: str, tr: Dict[str, List[str]], how: str) -> Source:
    prev = (tr.get("Scrolls-Previous-Commit") or [""])[0]
    if not prev:
        raise Refused(3, f"Removal commit {removal} has no Scrolls-Previous-Commit trailer.")
    return Source(resolve_commit(repo, prev), how, removal=removal, manifest=tr)


def find_source(repo: str, commit: Optional[str], target: Tree) -> Source:
    if commit:
        sha = resolve_commit(repo, commit)
        tr = trailers_of(repo, sha)
        if (tr.get("Scrolls-Action") or [""])[0] == "remove":
            return source_from_removal(repo, sha, tr, f"removal commit {sha[:12]} (given)")
        return Source(sha, f"commit {sha[:12]} (given)")

    if git(repo, "rev-parse", "--verify", "-q", "HEAD", check=False).returncode != 0:
        raise Refused(1, "This branch has no commits yet, so there is no history to search. Pass a COMMIT.")

    rows = scan_history(repo, ["HEAD"])
    restored = set()
    for sha, _d, _s, tr in rows:
        action = (tr.get("Scrolls-Action") or [""])[0]
        if action == "restore":
            restored.update(tr.get("Scrolls-Removal-Commit", []))
        elif action == "remove":
            if sha in restored:
                raise Refused(1, f"The newest scrolls checkpoint ({sha[:12]}) has already been restored. "
                                 "Use --list to see older checkpoints, then pass one as COMMIT.")
            return source_from_removal(repo, sha, tr, f"newest removal commit {sha[:12]}")

    # Fallback: no /scrolls-remove commit — find the newest commit that
    # deleted a scrolls STARTER.md whose folder isn't present now.
    res = git(repo, "log", "--diff-filter=D", "--name-only", "--format=%x1e%H", "HEAD", "--",
              ":(glob)**/.scrolls/STARTER.md", ":(glob)**/scrolls/STARTER.md",
              ":(glob).scrolls/STARTER.md", ":(glob)scrolls/STARTER.md", check=False)
    for rec in res.stdout.split("\x1e"):
        lines = [ln for ln in rec.strip().splitlines() if ln]
        if not lines:
            continue
        sha, paths = lines[0], lines[1:]
        for p in paths:
            folder = pdir(p)
            sibling = pjoin(pdir(folder), ".scrolls" if pbase(folder) == "scrolls" else "scrolls")
            if not target.is_scrolls(folder) and not target.is_scrolls(sibling):
                parent = git(repo, "rev-parse", "--verify", "-q", f"{sha}^", check=False).stdout.strip()
                if parent:
                    return Source(parent, f"fallback: commit before {sha[:12]}, which deleted {folder}",
                                  deletion=sha)
    raise Refused(1, "No scrolls checkpoint found in HEAD's history: no /scrolls-remove commit, and no commit "
                     "that deleted a scrolls folder. Pass a COMMIT, or use --list --all to search every branch.")


def in_scope(folder: str, bases: List[str], recurse: bool) -> bool:
    for b in bases:
        if recurse:
            if b == "" or folder == b or folder.startswith(b + "/"):
                return True
        else:
            exact = {b, pjoin(b, "docs", ".scrolls"), pjoin(b, "docs", "scrolls"),
                     pjoin(b, ".scrolls"), pjoin(b, "scrolls")}
            if folder in exact:
                return True
    return False


def plan(repo: str, src: Source, target: Tree, bases: List[str], recurse: bool,
         full: bool, force: bool, templates: Tuple[str, str, str]):
    scrolls_tpl, claude_tpl, agents_tpl = templates
    source = Tree(repo, src.sha)
    available = scrolls_folders_in(repo, src.sha)
    if src.manifest is not None:
        wanted = src.manifest.get("Scrolls-Folder", [])
        missing = [f for f in wanted if f not in available]
        if missing:
            print(f"WARN: removal lists {', '.join(missing)} but the source commit has no STARTER.md there; skipping.",
                  file=sys.stderr)
        folders = [f for f in wanted if f in available]
    else:
        folders = available
    folders = [f for f in folders if in_scope(f, bases, recurse)]
    if not folders:
        where = ", ".join(b or "<repo root>" for b in bases)
        hint = "" if recurse else " Pass -r/--recurse to include nested folders, or -t for the repo root."
        avail = ", ".join(available) or "none"
        raise Refused(1, f"No scrolls folder in the source within scope ({where}). Source has: {avail}.{hint}")

    actions: List[Action] = []
    writes: Dict[str, str] = {}
    checkout: List[str] = []
    replace: List[str] = []

    groups: Dict[str, List[str]] = {}
    for f in folders:
        sibling = pjoin(pdir(f), ".scrolls" if pbase(f) == "scrolls" else "scrolls")
        if target.is_scrolls(sibling):
            actions.append(Action("skipped", f, f"{sibling} already exists at the target; "
                                                 "use /scrolls-hide or /scrolls-unhide instead"))
            continue
        if target.is_scrolls(f):
            if not force:
                raise Refused(3, f"{f} already exists at the target. Run /scrolls-update to update it, "
                                 "or pass -f/--force to replace it with the source's version.")
            replace.append(f)
            actions.append(Action("replaced", f, "existing folder replaced with the source's version (-f)"))
        else:
            actions.append(Action("folder", f, f"from {src.sha[:12]}"))
        checkout.append(f)
        ptr = pdir(pdir(f))
        groups.setdefault(ptr, []).append(f)

    manifest = src.manifest

    def kind_in_manifest(path: str) -> Optional[str]:
        if manifest is None:
            return None
        for k in ("Deleted", "Purged", "Stripped"):
            if path in manifest.get(f"Scrolls-{k}", []):
                return k.lower()
        return "untouched"

    for ptr, flist in sorted(groups.items()):
        f0 = flist[0]
        short = pjoin(pbase(pdir(f0)), pbase(f0))
        forms = sorted({short} | set(flist) | {pjoin(pbase(pdir(x)), pbase(x)) for x in flist})
        scrolls_block = scrolls_tpl.replace("{{SCROLLS_PATH}}", short)
        specs = [
            ("SCROLLS.md", scrolls_block, True, lambda t: references_scrolls(t, forms)),
            ("CLAUDE.md", claude_tpl, False, lambda t: "@SCROLLS.md" in t),
            ("AGENTS.md", agents_tpl, False, lambda t: "@CLAUDE.md" in t or "@SCROLLS.md" in t),
        ]
        for name, block, demote, has_ref in specs:
            path = pjoin(ptr, name)
            s_text = source.read(path)
            mk = kind_in_manifest(path)
            if mk is None:  # discovered source: follow what the source had
                if s_text is None or not has_ref(s_text):
                    continue
                mk = "discovered"
            elif mk == "untouched":
                continue
            t_text = target.read(path)
            if t_text is None:
                if mk == "deleted" and s_text is not None:
                    writes[path] = s_text
                    actions.append(Action("restored", path, "file was absent; restored whole from the source"))
                elif mk == "purged" and full and s_text is not None:
                    writes[path] = s_text
                    actions.append(Action("restored", path, "file was absent; restored whole (--full)"))
                else:
                    writes[path] = block if block.endswith("\n") else block + "\n"
                    actions.append(Action("created", path, "file was absent; created with the scrolls stub only"))
            elif has_ref(t_text):
                actions.append(Action("kept", path, "already points at the scrolls"))
            else:
                writes[path] = insert_block(t_text, block, demote)
                note = "stub re-added near the top; existing content kept"
                if mk == "purged" and full:
                    note += " (--full skipped: the file exists now)"
                actions.append(Action("inserted", path, note))

    return actions, writes, checkout, replace


# ----------------------------------------------------------------- main

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="restore", description="Restore the scrolls system from git history.")
    p.add_argument("commit", nargs="?")
    p.add_argument("--from", dest="from_ref")
    p.add_argument("-p", "--path", action="append", dest="paths", default=[])
    p.add_argument("-t", "--reporoot", action="store_true")
    p.add_argument("-l", "--local", action="store_true")
    p.add_argument("-r", "--recurse", action="store_true")
    p.add_argument("--onto")
    p.add_argument("-b", "--branch")
    p.add_argument("--full", action="store_true")
    p.add_argument("-f", "--force", action="store_true")
    p.add_argument("-y", "--yes", action="store_true")
    p.add_argument("-n", "--dry-run", action="store_true")
    p.add_argument("--no-commit", action="store_true")
    p.add_argument("--list", action="store_true")
    p.add_argument("--all", action="store_true")
    return p


def normalize_argv(argv: List[str]) -> List[str]:
    out = []
    for a in argv:
        m = re.match(r"^(-[pb])=(.*)$", a)
        out.extend([m.group(1), m.group(2)] if m else [a])
    return out


def build_message(src: Source, actions: List[Action], target_desc: str) -> str:
    lines = ["maint(memory): scrolls-restored", "", f"- restored from: #{src.sha}"]
    if src.removal:
        lines.append(f"- removal commit: #{src.removal}")
    if src.deletion:
        lines.append(f"- deletion commit: #{src.deletion}")
    lines += ["", "Notes:"]
    lines += [f"- {KIND_LABEL[a.kind]}: {a.path} ({a.note})" for a in actions]
    lines += [f"- target: {target_desc}", "", "Scrolls-Action: restore", f"Scrolls-Source-Commit: {src.sha}"]
    if src.removal:
        lines.append(f"Scrolls-Removal-Commit: {src.removal}")
    if src.deletion:
        lines.append(f"Scrolls-Deletion-Commit: {src.deletion}")
    lines += [f"{KIND_TRAILER[a.kind]}: {a.path}" for a in actions]
    return "\n".join(lines) + "\n"


def do_list(repo: str, all_refs: bool) -> int:
    rows = scan_history(repo, ["--all"] if all_refs else ["HEAD"])
    restored = set()
    for _sha, _d, _s, tr in rows:
        if (tr.get("Scrolls-Action") or [""])[0] == "restore":
            restored.update(tr.get("Scrolls-Removal-Commit", []))
    removals = [r for r in rows if (r[3].get("Scrolls-Action") or [""])[0] == "remove"]
    scope = "every ref" if all_refs else "HEAD's history"
    if not removals:
        print(f"No /scrolls-remove checkpoints in {scope}.")
        return 1
    print(f"Scrolls checkpoints in {scope}, newest first:\n")
    for sha, date, _subj, tr in removals:
        prev = (tr.get("Scrolls-Previous-Commit") or ["?"])[0]
        state = "restored" if sha in restored else "not restored"
        print(f"  {sha[:12]}  {date[:10]}  [{state}]  source {prev[:12]}")
        print(f"      folders: {', '.join(tr.get('Scrolls-Folder', [])) or '-'}")
    print("\nRestore one with: /scrolls-restore <sha>")
    return 0


def main(argv: List[str]) -> int:
    try:
        args = build_parser().parse_args(normalize_argv(argv))
    except SystemExit as e:
        return 2 if e.code else 0
    try:
        return run(args)
    except Refused as e:
        print(f"{'REFUSED' if e.code == 3 else 'ERROR' if e.code == 2 else 'Nothing to restore'}: {e}",
              file=sys.stderr)
        return e.code


def run(args) -> int:
    if sum(bool(x) for x in (args.paths, args.reporoot, args.local)) > 1:
        raise Refused(2, "Cannot combine -p/--path, -t/--reporoot and -l/--local — pick one.")
    if args.commit and args.from_ref:
        raise Refused(2, "Give the source once: either COMMIT or --from, not both.")
    if args.all and not args.list:
        raise Refused(2, "--all only applies to --list. To restore from another branch, pass its checkpoint as COMMIT.")
    if args.branch and not args.onto:
        raise Refused(2, "-b/--branch needs --onto REF (where to create the branch).")

    cwd = os.getcwd()
    top = git(cwd, "rev-parse", "--show-toplevel", check=False)
    if top.returncode != 0:
        raise Refused(3, "Not inside a git repository. /scrolls-restore reads the memory from git history.")
    repo = os.path.realpath(top.stdout.strip())

    if args.list:
        return do_list(repo, args.all)

    cwd_rel = os.path.relpath(os.path.realpath(cwd), repo).replace(os.sep, "/")
    cwd_rel = "" if cwd_rel == "." else cwd_rel

    # ----------------------------------------------------------- target
    current_branch = git(repo, "symbolic-ref", "-q", "--short", "HEAD", check=False).stdout.strip()
    onto_mode = None  # None | ("branch", name) | ("new", name, sha)
    if args.onto:
        local = git(repo, "rev-parse", "--verify", "-q", f"refs/heads/{args.onto}", check=False)
        if args.branch:
            if git(repo, "rev-parse", "--verify", "-q", f"refs/heads/{args.branch}", check=False).returncode == 0:
                raise Refused(3, f"Branch {args.branch!r} already exists. Use --onto {args.branch} to restore onto it.")
            onto_mode = ("new", args.branch, resolve_commit(repo, args.onto))
        elif local.returncode == 0:
            if args.onto != current_branch:
                onto_mode = ("branch", args.onto, local.stdout.strip())
        else:
            resolve_commit(repo, args.onto)
            raise Refused(2, f"--onto {args.onto} is not a local branch. Add -b NEW_BRANCH to create one there "
                             "(the restore commit would otherwise be on no branch).")
    target = Tree(repo, onto_mode[2]) if onto_mode else Tree(repo)

    # ------------------------------------------------------------ scope
    if args.reporoot:
        bases = [""]
    elif args.paths:
        bases = []
        for p in args.paths:
            rel = os.path.normpath(os.path.join(cwd_rel, p)).replace(os.sep, "/")
            if os.path.isabs(p):
                rel = os.path.relpath(os.path.realpath(p), repo).replace(os.sep, "/")
            if rel == ".":
                rel = ""
            if rel.startswith(".."):
                raise Refused(2, f"-p {p} is outside the repository.")
            bases.append(rel)
    else:
        bases = [cwd_rel]
        if cwd_rel and not args.local:
            print(f"Note: restoring only folders at {cwd_rel}/ — not the repo root"
                  f"{'' if args.recurse else ', not recursively'}. Pass -t/--reporoot and/or -r/--recurse to widen.",
                  file=sys.stderr)

    src = find_source(repo, args.commit or args.from_ref, target)
    templates = load_templates()
    actions, writes, checkout, replace = plan(repo, src, target, bases, args.recurse,
                                              args.full, args.force, templates)

    target_desc = (f"branch {onto_mode[1]} (new, at {onto_mode[2][:12]})" if onto_mode and onto_mode[0] == "new"
                   else f"branch {onto_mode[1]}" if onto_mode
                   else f"branch {current_branch}" if current_branch else "detached HEAD")
    message = build_message(src, actions, target_desc)

    # ----------------------------------------------------- safety checks
    touched = sorted(set(checkout) | set(writes))
    problems = []
    if not onto_mode:
        dirty = git(repo, "status", "--porcelain=v1", "--ignored", "--untracked-files=all", "--", *touched,
                    check=False).stdout.splitlines() if touched else []
        if dirty:
            problems.append("Uncommitted, untracked, or ignored changes at paths this would write:\n"
                            + "\n".join(f"    {ln}" for ln in dirty)
                            + "\n  Commit, move, or discard them first, then re-run.")
        staged = [ln for ln in git(repo, "diff", "--cached", "--name-only").stdout.splitlines() if ln]
        if staged and not args.no_commit:
            problems.append("Other changes are already staged; they'd be swept into the restore commit:\n"
                            + "\n".join(f"    {ln}" for ln in staged)
                            + "\n  Commit or unstage them first, then re-run.")

    # ------------------------------------------------------------ report
    print(f"Repository: {repo}")
    print(f"Source:     {src.sha}  ({src.how})")
    print(f"Target:     {target_desc}")
    print("\nPlan:")
    for a in actions:
        print(f"  {KIND_LABEL[a.kind]:<16} {a.path}  — {a.note}")
    if src.how.startswith("fallback"):
        print("\nNOTE: no /scrolls-remove commit was found; this source was inferred from a plain deletion. "
              "Check it before applying.")

    if problems:
        print()
        for pr in problems:
            print(f"REFUSED: {pr}")
        return 3
    if not checkout:
        print("\nNothing to restore — every folder in scope was skipped.")
        return 1
    if args.dry_run or not args.yes:
        print("\nDry run — nothing changed. Re-run with -y/--yes to apply.")
        print("\nCommit message that would be used:\n")
        print("\n".join(f"    {ln}" for ln in message.splitlines()))
        return 0

    # ------------------------------------------------------------- apply
    workdir, tmp_parent = repo, None
    if onto_mode:
        tmp_parent = tempfile.mkdtemp(prefix="scrolls-restore-")
        workdir = os.path.join(tmp_parent, "wt")
        if onto_mode[0] == "new":
            res = git(repo, "worktree", "add", "-q", "-b", onto_mode[1], workdir, onto_mode[2], check=False)
        else:
            res = git(repo, "worktree", "add", "-q", workdir, onto_mode[1], check=False)
        if res.returncode != 0:
            shutil.rmtree(tmp_parent, ignore_errors=True)
            raise Refused(3, f"Could not open a temporary worktree for {onto_mode[1]}:\n{res.stderr.strip()}")

    keep_worktree = False
    try:
        for f in replace:
            git(workdir, "rm", "-r", "-q", "--", f)
        for f in checkout:
            git(workdir, "checkout", src.sha, "--", f)
        for path, text in writes.items():
            full = os.path.join(workdir, path)
            os.makedirs(os.path.dirname(full) or workdir, exist_ok=True)
            with open(full, "w", encoding="utf-8", newline="") as fh:
                fh.write(text)
            git(workdir, "add", "--", path)

        msg_path = os.path.join(git(workdir, "rev-parse", "--absolute-git-dir").stdout.strip(), MSG_FILE_NAME)
        with open(msg_path, "w", encoding="utf-8") as fh:
            fh.write(message)

        if args.no_commit:
            keep_worktree = bool(onto_mode)
            where = f" in {workdir}" if onto_mode else ""
            print(f"\nStaged, not committed (--no-commit){where}. Commit with:\n    git -C {workdir} commit -F {msg_path}")
            if onto_mode:
                print(f"Then remove the worktree: git worktree remove {workdir}")
            return 0

        res = git(workdir, "commit", "-q", "-F", msg_path, check=False)
        if res.returncode != 0:
            keep_worktree = bool(onto_mode)
            print("\nERROR: git commit failed — the restore is staged but not committed.", file=sys.stderr)
            print((res.stderr or res.stdout).strip(), file=sys.stderr)
            print(f"Fix the cause, then: git -C {workdir} commit -F {msg_path}", file=sys.stderr)
            if onto_mode:
                print(f"The temporary worktree was kept: {workdir}", file=sys.stderr)
            return 4
        new_sha = git(workdir, "rev-parse", "HEAD").stdout.strip()
        try:
            os.remove(msg_path)
        except OSError:
            pass
        print(f"\nCommitted: {new_sha}  on {target_desc}")
        print(f"Undo:      git revert --no-edit {new_sha}")
        print("The restored memory reflects the source commit; run /scrolls-update to bring it up to date.")
        return 0
    finally:
        if onto_mode and not keep_worktree:
            git(repo, "worktree", "remove", "--force", workdir, check=False)
            shutil.rmtree(tmp_parent, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
