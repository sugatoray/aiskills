#!/usr/bin/env python3
"""Compact the history in a scrolls working-memory folder, with a git checkpoint.

/scrolls-compact condenses the parts of SPEC / PLAN / HANDOFF / GAP_ANALYSIS /
GAP_CONTEXT that are older than a compaction BASE commit, and records the
commit just before the compaction (the CHECKPOINT) so the full older text can
always be read back out of git. It never touches live state: open tickets,
open gaps and HANDOFF's open threads stay word for word, whatever their age.

The condensing itself is the agent's job (it is judgment work). This script
does everything deterministic, in three modes:

  plan (default)  Read-only. Resolve the BASE, run `git blame` on each in-scope
                  file, split it into units (sections or list items) and mark
                  each one old / live / new. Prints the plan and the marker the
                  agent must put in each file it changes, and saves the plan to
                  <git-dir>/SCROLLS_COMPACT_PLAN.json.
  --finalize      Validate the agent's edits against the saved plan, then write
                  compacted/scrolls_compact_<yyyymmdd>_<githash>.md, add a row to
                  COMPACT.md, add the COMPACT.md entry to STARTER.md (once), make
                  ONE commit and tag the checkpoint.
  --list / --show / --extract
                  Read-only time travel over past compactions.

This file holds all of the logic. compact.sh and compact.ps1 are thin
launchers that only find a Python interpreter and pass every argument
through unchanged. Stdlib only, Python 3.9+.

Usage:
  compact.py [--before=YYYYMMDD] [--base=COMMIT] [--keep-days=N] [--keep-commits=N]
             [--trunk=BRANCH] [--include=F[,F]] [--exclude=F[,F]]
             [-p PATH | -t | -l] [-r] [-n] [-y]
  compact.py --finalize [-n] [--no-commit] [--no-tag]
  compact.py --list
  compact.py --show ID [FILE]
  compact.py --extract ID FILE [-o OUT]

  --before=DATE     Compact content last changed before 00:00 local time on DATE
                    (YYYYMMDD or YYYY-MM-DD). Replaces the default rules.
  --base=COMMIT     Compact content last changed in COMMIT or its ancestors.
                    Must be an ancestor of HEAD. Replaces the default rules.
                    Given with --before, the newer of the two wins.
  --keep-days=N     Default date rule: content older than N days (default 7).
  --keep-commits=N  Default commit rule: content older than the newest N
                    first-parent commits on the trunk (default 20).
                    With neither --before nor --base, the newer of the two
                    default candidates is the BASE.
  --trunk=BRANCH    Branch the rules walk (default: origin/HEAD, main, master).
  --include=F       Also compact a project-specific scroll named in STARTER.md.
  --exclude=F       Leave one of the default five alone this run.
  -p, --path PATH   Scrolls folder, docs folder, or project folder to use.
  -t, --reporoot    Look under the git repository's top level.
  -l, --local       Look in the current directory (the default).
  -r, --recurse     Search recursively if the exact spot has no scrolls folder.
  -n, --dry-run     Plan: same as default. Finalize: validate only, write nothing.
  -y, --yes         Accepted for symmetry with the family; the plan is read-only.
  --no-commit       Finalize: stage everything but don't commit; print the
                    `git commit -F` command (the message is in <git-dir>).
  --no-tag          Finalize: don't create the scrolls-compact/<date>-<hash> tag.
  ID                A COMPACT.md row number (1 or #1), a checkpoint hash prefix,
                    or a report file name.
  -o, --output OUT  --extract: write to OUT instead of standard output.

Environment: SCROLLS_COMPACT_NOW=<epoch seconds> pins "now" (tests use it;
it also dates the compaction commit).

Exit codes: 0 ok, 1 nothing to do / not found, 2 usage error,
3 refused by a safety or validation check, 4 git commit failed (left staged).
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import time
from typing import Dict, List, Optional, Tuple

DEFAULT_FILES = ["SPEC.md", "PLAN.md", "HANDOFF.md", "GAP_ANALYSIS.md", "GAP_CONTEXT.md"]
NEVER_FILES = {"STARTER.md", "WISDOM.md", "COMPACT.md"}
SECTION_FILES = {"SPEC.md"}
SCROLLS_NAMES = (".scrolls", "scrolls")
PRUNE_NAMES = {
    ".git", "node_modules", "vendor", "dist", "build", ".venv", "venv",
    "__pycache__", "target", ".next", ".cache",
}
MAXDEPTH = 8
PLAN_FILE = "SCROLLS_COMPACT_PLAN.json"
MSG_FILE = "SCROLLS_COMPACT_MSG"
REPORT_DIR = "compacted"
TAG_PREFIX = "scrolls-compact/"

MARKER_RE = re.compile(r"^\s*<!--\s*scrolls-compact:")
HEADING_RE = re.compile(r"^(#{1,6})\s+\S")
LIST_RE = re.compile(r"^([-*+]|\d+[.)])\s+")
OPEN_TICKET_RE = re.compile(r"^[-*+]\s+\[ \]")
OPEN_THREADS_RE = re.compile(r"known issues|open threads", re.I)
ROW_RE = re.compile(r"^\|\s*#?(\d+)\s*\|")


# ------------------------------------------------------------------ helpers

def die(code: int, msg: str) -> "None":
    print(msg, file=sys.stderr)
    sys.exit(code)


def git(repo: str, *args: str, check: bool = True, env: Optional[Dict[str, str]] = None) -> subprocess.CompletedProcess:
    r = subprocess.run(["git", "-C", repo, *args], stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                       text=True, env=env)
    if check and r.returncode != 0:
        die(2, f"git {' '.join(args)} failed:\n{r.stderr.strip()}")
    return r


def out(repo: str, *args: str) -> str:
    return git(repo, *args).stdout.strip()


def posix(p: str) -> str:
    return p.replace(os.sep, "/")


def now_epoch() -> int:
    env = os.environ.get("SCROLLS_COMPACT_NOW")
    if env:
        try:
            return int(env)
        except ValueError:
            die(2, f"SCROLLS_COMPACT_NOW must be epoch seconds, not {env!r}.")
    return int(time.time())


def ymd(ts: int, sep: str = "-") -> str:
    return dt.datetime.fromtimestamp(ts).strftime(f"%Y{sep}%m{sep}%d")


def read(path: str) -> str:
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def write(path: str, text: str) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)


def split_names(values: List[str]) -> List[str]:
    names: List[str] = []
    for v in values:
        for n in v.split(","):
            n = n.strip()
            if not n:
                continue
            if "/" in n or "\\" in n:
                die(2, f"{n!r}: give a file name inside the scrolls folder, not a path.")
            if not n.endswith(".md"):
                n += ".md"
            names.append(n)
    return names


# ---------------------------------------------------------------- discovery

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
        dirs[:] = sorted(d for d in dirs if d not in PRUNE_NAMES and depth < MAXDEPTH)
        for d in list(dirs):
            p = os.path.join(root, d)
            if is_scrolls_dir(p):
                hits.append(p)
                dirs.remove(d)
    return hits


def locate(args: argparse.Namespace) -> Tuple[str, str, str]:
    """Return (repo_root, folder_abs, folder_rel) or exit."""
    if sum(bool(x) for x in (args.path, args.reporoot, args.local)) > 1:
        die(2, "Pass at most one of -p/--path, -t/--reporoot and -l/--local.")
    cwd = os.getcwd()
    probe = args.path if args.path and os.path.isdir(args.path) else cwd
    r = git(probe, "rev-parse", "--show-toplevel", check=False)
    if r.returncode != 0:
        die(2, "Not inside a git repository. /scrolls-compact keeps old history in git, so it needs one.")
    top = r.stdout.strip()
    if args.reporoot:
        base = top
    elif args.path:
        base = os.path.abspath(args.path)
    else:
        base = cwd
        if os.path.realpath(top) != os.path.realpath(cwd) and not args.local:
            print(f"note: looking under {cwd}, not the repository root {top}. Pass -t to use the root.",
                  file=sys.stderr)
    hits = find_exact(base)
    if len(hits) > 1:
        die(2, "Both " + " and ".join(posix(os.path.relpath(h, cwd)) for h in hits)
            + " exist. Keep one (see /scrolls-hide or /scrolls-unhide), then run again.")
    if not hits and args.recurse:
        hits = find_recursive(base)
        if len(hits) > 1:
            die(2, "More than one scrolls folder found; pick one with -p:\n"
                + "\n".join("  " + posix(os.path.relpath(h, cwd)) for h in hits))
    if not hits:
        hint = " Try -t (repository root) or -r (search recursively)." if not args.recurse else ""
        die(1, f"No scrolls folder found under {base}.{hint} Set one up with /scrolls-setup.")
    folder = os.path.abspath(hits[0])
    repo = out(folder, "rev-parse", "--show-toplevel")
    rel = posix(os.path.relpath(os.path.realpath(folder), os.path.realpath(repo)))
    return repo, folder, rel


# ------------------------------------------------------------ unit parsing

def parse_units(text: str, mode: str) -> Tuple[List[dict], List[int], List[int]]:
    """Split a scroll into units.

    mode "section": a `##` (or deeper) heading starts a unit that runs to the
    next heading of level 1 or 2. mode "list": a top-level list item plus its
    indented/continuation lines is a unit; headings are frame.
    Returns (units, frame_line_numbers, marker_line_numbers); line numbers
    are 1-based, and units list only their non-blank lines.
    """
    lines = text.splitlines()
    units: List[dict] = []
    frame: List[int] = []
    markers: List[int] = []
    cur: Optional[dict] = None
    ctx = ""
    in_comment = False
    in_quote = False
    prev_blank = True
    for idx, raw in enumerate(lines, start=1):
        s = raw.rstrip()
        if in_comment:
            frame.append(idx)
            if "-->" in s:
                in_comment = False
            continue
        if not s.strip():
            prev_blank = True
            in_quote = False
            continue
        if MARKER_RE.match(s):
            markers.append(idx)
            in_quote = True
            if mode == "list":
                cur = None
            prev_blank = False
            continue
        if in_quote and s.startswith(">"):
            markers.append(idx)
            continue
        in_quote = False
        if s.lstrip().startswith("<!--"):
            frame.append(idx)
            if "-->" not in s:
                in_comment = True
            cur = None
            prev_blank = False
            continue
        h = HEADING_RE.match(s)
        if mode == "section":
            if h and len(h.group(1)) <= 2:
                if len(h.group(1)) == 1:
                    cur = None
                    frame.append(idx)
                else:
                    cur = {"start": idx, "lines": [idx], "ctx": s}
                    units.append(cur)
            elif cur is not None:
                cur["lines"].append(idx)
            else:
                frame.append(idx)
        else:
            if h:
                cur = None
                ctx = s
                frame.append(idx)
            elif LIST_RE.match(s):
                cur = {"start": idx, "lines": [idx], "ctx": ctx}
                units.append(cur)
            elif cur is not None and (raw[:1].isspace() or not prev_blank):
                cur["lines"].append(idx)
            else:
                cur = None
                frame.append(idx)
        prev_blank = False
    return units, frame, markers


def unit_mode(name: str, text: str) -> str:
    if name in SECTION_FILES:
        return "section"
    if name in DEFAULT_FILES:
        return "list"
    return "section" if re.search(r"^##\s", text, re.M) else "list"


def is_live(name: str, first_line: str, ctx: str) -> bool:
    if name == "GAP_ANALYSIS.md":
        return True
    if name == "PLAN.md":
        return bool(OPEN_TICKET_RE.match(first_line))
    if name == "HANDOFF.md":
        return bool(OPEN_THREADS_RE.search(ctx))
    return False


# --------------------------------------------------------------------- blame

def blame(repo: str, rel_path: str) -> Tuple[Dict[int, str], Dict[str, int]]:
    r = git(repo, "blame", "-w", "-M", "--line-porcelain", "HEAD", "--", rel_path)
    by_line: Dict[int, str] = {}
    times: Dict[str, int] = {}
    sha = ""
    head_re = re.compile(r"^([0-9a-f]{40}) \d+ (\d+)(?: \d+)?$")
    for ln in r.stdout.splitlines():
        m = head_re.match(ln)
        if m:
            sha = m.group(1)
            by_line[int(m.group(2))] = sha
        elif ln.startswith("committer-time "):
            times[sha] = int(ln.split()[1])
    return by_line, times


class Ancestry:
    def __init__(self, repo: str, base: str):
        self.repo, self.base, self.cache = repo, base, {}  # type: ignore[var-annotated]

    def old(self, sha: str) -> bool:
        if sha not in self.cache:
            r = git(self.repo, "merge-base", "--is-ancestor", sha, self.base, check=False)
            self.cache[sha] = r.returncode == 0
        return self.cache[sha]


def is_ancestor(repo: str, a: str, b: str) -> bool:
    return git(repo, "merge-base", "--is-ancestor", a, b, check=False).returncode == 0


# ---------------------------------------------------------------- the base

def resolve_trunk(repo: str, wanted: Optional[str]) -> str:
    def ok(ref: str) -> bool:
        return git(repo, "rev-parse", "--verify", "-q", ref + "^{commit}", check=False).returncode == 0
    if wanted:
        if not ok(wanted):
            die(2, f"--trunk={wanted}: no such branch or commit.")
        return wanted
    r = git(repo, "symbolic-ref", "-q", "refs/remotes/origin/HEAD", check=False)
    if r.returncode == 0:
        ref = r.stdout.strip().replace("refs/remotes/", "", 1)
        if ok(ref):
            return ref
    for ref in ("main", "master", "origin/main", "origin/master"):
        if ok(ref):
            return ref
    print("note: no main or master branch; counting on HEAD's history.", file=sys.stderr)
    return "HEAD"


def parse_date(value: str) -> int:
    v = value.strip().strip('"').replace("-", "")
    try:
        d = dt.datetime.strptime(v, "%Y%m%d")
    except ValueError:
        die(2, f"--before={value}: use YYYYMMDD or YYYY-MM-DD.")
    return int(d.timestamp())


def choose_base(repo: str, args: argparse.Namespace, now: int) -> dict:
    trunk = resolve_trunk(repo, args.trunk)
    fp: List[Tuple[str, int]] = []
    for ln in out(repo, "log", "--first-parent", "--format=%H %ct", trunk).splitlines():
        sha, ct = ln.split()
        fp.append((sha, int(ct)))

    def by_date(cutoff: int) -> Optional[str]:
        for sha, ct in fp:
            if ct < cutoff:
                return sha
        return None

    def short(sha: Optional[str]) -> str:
        return out(repo, "rev-parse", "--short", sha) if sha else "none"

    cands: List[Tuple[str, Optional[str], str]] = []   # (label, sha, note)
    trailer_parts: List[str] = []
    if args.before or args.base:
        if args.before:
            cutoff = parse_date(args.before)
            sha = by_date(cutoff)
            cands.append(("--before", sha, f"before {ymd(cutoff)}"))
            trailer_parts.append(f"before={ymd(cutoff, '')}")
        if args.base:
            r = git(repo, "rev-parse", "--verify", "-q", args.base + "^{commit}", check=False)
            if r.returncode != 0:
                die(2, f"--base={args.base}: no such commit.")
            sha = r.stdout.strip()
            if not is_ancestor(repo, sha, "HEAD"):
                die(3, f"--base={args.base} is not an ancestor of HEAD, so it can't mark what is old here.")
            cands.append(("--base", sha, args.base))
            trailer_parts.append(f"base={sha}")
    else:
        cutoff = now - args.keep_days * 86400
        cands.append((f"{args.keep_days} day{'' if args.keep_days == 1 else 's'}", by_date(cutoff),
                      f"older than {ymd(cutoff)}"))
        n = args.keep_commits
        sha = fp[n][0] if len(fp) > n else None
        note = "" if sha else f"only {len(fp)} commits on {trunk}"
        cands.append((f"{n} commit{'' if n == 1 else 's'}", sha, note))
        trailer_parts += [f"days={args.keep_days}", f"commits={n}"]

    desc_parts = []
    for label, sha, note in cands:
        if sha:
            desc_parts.append(f"{label} -> {short(sha)} ({ymd(int(out(repo, 'log', '-1', '--format=%ct', sha)))})")
        else:
            desc_parts.append(f"{label} -> none" + (f" ({note})" if note else ""))
    desc = "; ".join(desc_parts)

    best: Optional[Tuple[str, str]] = None
    for label, sha, _ in cands:
        if not sha:
            continue
        if best is None:
            best = (label, sha)
            continue
        if is_ancestor(repo, best[1], sha):
            best = (label, sha)
        elif not is_ancestor(repo, sha, best[1]):
            if int(out(repo, "log", "-1", "--format=%ct", sha)) > int(out(repo, "log", "-1", "--format=%ct", best[1])):
                best = (label, sha)
    rule_trailer = ("newer-of " if len(cands) > 1 else "") + " ".join(trailer_parts)
    if best is None:
        return {"base": None, "desc": desc, "trunk": trunk}
    label, sha = best
    return {
        "base": sha, "base_short": short(sha), "label": label, "desc": desc, "trunk": trunk,
        "base_date": ymd(int(out(repo, "log", "-1", "--format=%ct", sha))),
        "rule_trailer": rule_trailer + " -> " + {"day": "days", "commit": "commits"}.get(
            label.lstrip("-").split(" ")[-1].rstrip("s"), label.lstrip("-").split(" ")[-1]),
    }


# ---------------------------------------------------------- compact history

def compact_rows(folder: str) -> List[dict]:
    path = os.path.join(folder, "COMPACT.md")
    if not os.path.isfile(path):
        return []
    rows = []
    for ln in read(path).splitlines():
        m = ROW_RE.match(ln)
        if not m:
            continue
        cells = [c.strip() for c in ln.strip().strip("|").split("|")]
        link = re.search(r"\((%s/[^)]+)\)" % REPORT_DIR, ln)
        rows.append({
            "n": int(m.group(1)), "date": cells[1] if len(cells) > 1 else "",
            "checkpoint": cells[2].strip("`") if len(cells) > 2 else "",
            "base": cells[3] if len(cells) > 3 else "", "rule": cells[4] if len(cells) > 4 else "",
            "files": cells[5] if len(cells) > 5 else "", "lines": cells[6] if len(cells) > 6 else "",
            "report": link.group(1) if link else "",
        })
    return rows


def report_info(folder: str, row: dict) -> dict:
    info = {"checkpoint": row["checkpoint"], "folder": None, "blobs": {}}
    path = os.path.join(folder, row["report"]) if row["report"] else ""
    if path and os.path.isfile(path):
        text = read(path)
        m = re.search(r"Checkpoint: `([0-9a-f]{40})`", text)
        if m:
            info["checkpoint"] = m.group(1)
        m = re.search(r"Folder at checkpoint: `([^`]+)`", text)
        if m:
            info["folder"] = m.group(1)
        cur = None
        for ln in text.splitlines():
            if ln.startswith("## "):
                cur = ln[3:].strip()
            mb = re.match(r"- Blob at checkpoint: `([0-9a-f]+)`", ln)
            if mb and cur:
                info["blobs"][cur] = mb.group(1)
    return info


def compaction_commit(repo: str, folder_rel: str, report_rel: str) -> Optional[str]:
    r = git(repo, "log", "-1", "--diff-filter=A", "--format=%H", "--", f"{folder_rel}/{report_rel}", check=False)
    return r.stdout.strip() or None


def previous_compaction(repo: str, folder: str, folder_rel: str) -> str:
    rows = compact_rows(folder)
    if rows:
        top = max(rows, key=lambda r: r["n"])
        info = report_info(folder, top)
        sha = compaction_commit(repo, info["folder"] or folder_rel, top["report"])
        if sha:
            return sha
    r = git(repo, "log", "-1", "--format=%H", "--grep=^Scrolls-Action: compact$", check=False)
    return r.stdout.strip() or "none"


# ------------------------------------------------------------------- plan

def safety_checks(repo: str, folder_rel: str) -> None:
    if git(repo, "rev-parse", "--verify", "-q", "HEAD", check=False).returncode != 0:
        die(3, "The repository has no commits yet, so there is no checkpoint to keep history in.")
    if out(repo, "rev-parse", "--is-shallow-repository") == "true":
        die(3, "This is a shallow clone, so older commits are missing. Run `git fetch --unshallow` first.")
    dirty = out(repo, "status", "--porcelain", "--ignored", "--untracked-files=all", "--", folder_rel)
    if dirty:
        die(3, f"{folder_rel} has uncommitted, untracked or ignored changes. The checkpoint would not "
               f"contain them, so they could be lost. Commit or clear them first:\n{dirty}")
    staged = out(repo, "diff", "--cached", "--name-only")
    if staged:
        die(3, f"Other changes are already staged and would end up in the compaction commit:\n{staged}")


def scope(args: argparse.Namespace) -> List[str]:
    inc, exc = split_names(args.include), split_names(args.exclude)
    for n in inc:
        if n in NEVER_FILES:
            die(2, f"--include={n}: {n} is never compacted.")
    names = [n for n in DEFAULT_FILES if n not in exc] + [n for n in inc if n not in DEFAULT_FILES]
    return names


def short_label(text: str, limit: int = 72) -> str:
    """A unit's first line for display: whole words, with … when cut."""
    t = text.strip()
    if len(t) <= limit:
        return t
    cut = t[:limit]
    if t[limit] != " " and " " in cut:
        cut = cut.rsplit(" ", 1)[0]
    return cut.rstrip(" ,;:.") + "…"


def fmt_range(u: dict) -> str:
    a, b = u["start"], u["end"]
    return f"L{a}" if a == b else f"L{a}-{b}"


def cmd_plan(args: argparse.Namespace) -> int:
    repo, folder, rel = locate(args)
    safety_checks(repo, rel)
    now = now_epoch()
    checkpoint = out(repo, "rev-parse", "HEAD")
    short = out(repo, "rev-parse", "--short", "HEAD")
    stamp, date = ymd(now, ""), ymd(now)
    report_rel = f"{REPORT_DIR}/scrolls_compact_{stamp}_{short}.md"
    marker = f"<!-- scrolls-compact: checkpoint={short} date={date} report={report_rel} -->"
    names = scope(args)

    b = choose_base(repo, args, now)   # before any output: a bad --before/--base fails cleanly
    print("Scrolls compaction plan")
    print(f"  repository: {repo}")
    print(f"  folder:     {rel}")
    print(f"  checkpoint: {short} ({checkpoint})")
    if not b["base"]:
        print(f"  base:       none  [{b['desc']}]")
        print("\nNothing to compact: no commit is old enough under these rules.")
        return 1
    print(f"  base:       {b['base_short']} {b['base_date']}  [rule: {b['label']}]")
    print(f"              {b['desc']}")
    print(f"  files:      {', '.join(names)}")
    print(f"  report:     {rel}/{report_rel}")
    print(f"  marker:     {marker}")

    anc = Ancestry(repo, b["base"])
    files = []
    old_total = 0
    for name in names:
        path = os.path.join(folder, name)
        frel = f"{rel}/{name}"
        if not os.path.isfile(path):
            print(f"\n{frel}: not present, skipped")
            continue
        text = read(path)
        lines = text.splitlines()
        mode = unit_mode(name, text)
        units, frame, markers = parse_units(text, mode)
        by_line, times = blame(repo, frel)
        punits = []
        for u in units:
            shas = [by_line.get(i, "") for i in u["lines"]]
            old = all(s and anc.old(s) for s in shas)
            first = lines[u["lines"][0] - 1].rstrip()
            kind = "new" if not old else ("live" if is_live(name, first, u["ctx"]) else "old")
            newest = max(shas, key=lambda s: times.get(s, 0)) if shas else ""
            punits.append({
                "kind": kind, "start": u["lines"][0], "end": u["lines"][-1],
                "label": short_label(first), "lines": [lines[i - 1].rstrip() for i in u["lines"]],
                "newest": newest[:7], "newest_date": ymd(times[newest]) if newest in times else "",
            })
        old_n = sum(1 for u in punits if u["kind"] == "old")
        old_total += old_n
        counts = {k: sum(1 for u in punits if u["kind"] == k) for k in ("old", "live", "new")}
        print(f"\n{frel} ({len(lines)} lines; {counts['old']} old, {counts['live']} live, {counts['new']} new)")
        for u in punits:
            print(f"  {u['kind']:<5} {fmt_range(u):<8} {u['label']}   (last changed {u['newest']} {u['newest_date']})")
        files.append({
            "name": name, "path": frel, "mode": mode, "lines_before": len(lines), "units": punits,
            "frame": [lines[i - 1].rstrip() for i in frame], "unit_count": len(units),
        })

    if old_total == 0:
        print("\nNothing to compact: every unit is newer than the base, or is live state.")
        return 1

    plan = {
        "version": 1, "repo": repo, "folder": rel, "checkpoint": checkpoint, "short": short,
        "now": now, "date": date, "stamp": stamp, "base": b["base"], "base_short": b["base_short"],
        "base_date": b["base_date"], "rule_label": b["label"], "rule_desc": b["desc"],
        "rule_trailer": b["rule_trailer"], "report": report_rel, "marker": marker,
        "tag": f"{TAG_PREFIX}{stamp}-{short}", "scope": names, "files": files,
        "previous": previous_compaction(repo, folder, rel),
    }
    write(os.path.join(out(repo, "rev-parse", "--absolute-git-dir"), PLAN_FILE), json.dumps(plan, indent=1))
    print(f"\nDry run: nothing changed. {old_total} old unit(s) can be condensed.")
    print("Next: condense only the `old` units (keep `live` and `new` word for word), put the marker")
    print("line above the condensed text in every file you change, then run again with --finalize.")
    return 0


# --------------------------------------------------------------- finalize

COMPACT_TEMPLATE_FALLBACK = """# COMPACT.md — Compaction History

The scrolls in this folder are compacted from time to time. Older detail in `SPEC.md`, `PLAN.md`, `HANDOFF.md`, `GAP_ANALYSIS.md` and `GAP_CONTEXT.md` is condensed, and the full text is kept in git at a **checkpoint** commit. Read this file only when a condensed summary isn't enough. Don't edit it or `compacted/` by hand: `/scrolls-compact` maintains both, and `/scrolls-update` leaves them alone.

## Reaching pre-compaction history

Take `<checkpoint>` from the table below, or the full SHA from its report. Paths are as they were at that checkpoint; each report names the folder.

- The whole file as it was: `git show <checkpoint>:{{SCROLLS_PATH}}/SPEC.md`
- The exact content, even after the folder moved: `git cat-file -p <blob id from the report>`
- The compaction commit: `git log -1 --diff-filter=A --format=%H -- {{SCROLLS_PATH}}/compacted/<report>`
- What was condensed: `git diff <checkpoint> <compaction commit> -- {{SCROLLS_PATH}}/`
- Every compaction, newest first: `git log --grep='^Scrolls-Action: compact'`

## Compaction History

| # | Date | Checkpoint | Base (cutoff) | Rule | Files | Lines | Report |
|---|------|------------|---------------|------|-------|-------|--------|
"""


def compact_template(folder_rel: str) -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(here, "..", "assets", "templates", "COMPACT.md")
    try:
        text = read(path)
    except OSError:
        text = COMPACT_TEMPLATE_FALLBACK
    return text.replace("{{SCROLLS_PATH}}", folder_rel)


def add_row(text: str, row: str) -> str:
    lines = text.splitlines()
    for i, ln in enumerate(lines):
        if re.match(r"^\|\s*-+\s*\|", ln):
            lines.insert(i + 1, row)
            return "\n".join(lines) + "\n"
    return text.rstrip("\n") + "\n\n| # | Date | Checkpoint | Base (cutoff) | Rule | Files | Lines | Report |\n" \
        "|---|------|------------|---------------|------|-------|-------|--------|\n" + row + "\n"


def add_starter_entry(text: str, folder_rel: str) -> Optional[str]:
    if "COMPACT.md" in text:
        return None
    lines = text.splitlines()
    m = re.search(r"`([^`]+)/SPEC\.md`", text)
    prefix = m.group(1) if m else folder_rel
    nums = [i for i, ln in enumerate(lines) if re.match(r"^\d+\.\s", ln)]
    entry_tail = ("— The compaction history. Read it only when you need detail older than the condensed "
                  "summaries in the files above: it names the git checkpoint that holds the full text, and "
                  "the commands to reach it. Never edit it or `compacted/` by hand.")
    if nums:
        last = nums[0]
        for i in nums[1:]:
            if all(re.match(r"^\d+\.\s", lines[j]) or not lines[j].strip() or lines[j][:1].isspace()
                   for j in range(last + 1, i)):
                last = i
        n = int(re.match(r"^(\d+)", lines[last]).group(1)) + 1
        at = last + 1
        while at < len(lines) and lines[at][:1].isspace() and lines[at].strip():
            at += 1
        lines.insert(at, f"{n}. **`{prefix}/COMPACT.md`** {entry_tail}")
    else:
        lines += ["", f"- **`{prefix}/COMPACT.md`** {entry_tail}"]
    for i, ln in enumerate(lines):
        if re.match(r"^#{1,6}\s+When to update", ln, re.I):
            j = i + 1
            last_item = None
            while j < len(lines) and not HEADING_RE.match(lines[j]):
                if LIST_RE.match(lines[j]):
                    last_item = j
                j += 1
            if last_item is not None:
                lines.insert(last_item + 1, "- **COMPACT.md**: never by hand. Only `/scrolls-compact` writes it "
                                            "and `compacted/`; `/scrolls-update` leaves both alone.")
            break
    return "\n".join(lines) + "\n"


def changed_paths(repo: str, folder_rel: str) -> List[str]:
    r = git(repo, "status", "--porcelain", "-z", "--untracked-files=all", "--", folder_rel)
    paths = []
    parts = r.stdout.split("\0")
    i = 0
    while i < len(parts):
        entry = parts[i]
        if not entry:
            i += 1
            continue
        status, path = entry[:2], entry[3:]
        paths.append(path)
        if status[0] in "RC":
            i += 1
        i += 1
    return paths


def cmd_finalize(args: argparse.Namespace) -> int:
    cwd_repo = git(os.getcwd(), "rev-parse", "--show-toplevel", check=False)
    if cwd_repo.returncode != 0:
        die(2, "Not inside a git repository.")
    repo0 = cwd_repo.stdout.strip()
    plan_path = os.path.join(out(repo0, "rev-parse", "--absolute-git-dir"), PLAN_FILE)
    if not os.path.isfile(plan_path):
        die(2, "No compaction plan found. Run /scrolls-compact without --finalize first.")
    plan = json.loads(read(plan_path))
    repo, rel = plan["repo"], plan["folder"]
    folder = os.path.join(repo, rel)
    head = out(repo, "rev-parse", "HEAD")
    if head != plan["checkpoint"]:
        die(3, f"HEAD moved since the plan was made ({plan['short']} -> {head[:7]}). "
               "Run the plan again, so the checkpoint holds what you condense.")
    scope_paths = {f["path"] for f in plan["files"]}
    problems: List[str] = []
    for p in changed_paths(repo, rel):
        if p not in scope_paths:
            problems.append(f"{p}: outside this compaction's scope; only {', '.join(plan['scope'])} may change.")
    for p in out(repo, "diff", "--cached", "--name-only").splitlines():
        if p and p not in scope_paths:
            problems.append(f"{p}: staged, but not part of this compaction. Unstage it first.")

    results = []
    for f in plan["files"]:
        before = git(repo, "show", f"HEAD:{f['path']}").stdout
        now_text = read(os.path.join(repo, f["path"])) if os.path.isfile(os.path.join(repo, f["path"])) else ""
        if now_text == before:
            results.append({"file": f, "changed": False})
            continue
        new_lines = [ln.rstrip() for ln in now_text.splitlines()]
        present = set(new_lines)
        markers = [ln for ln in new_lines if MARKER_RE.match(ln)]
        if len(markers) != 1 or f"checkpoint={plan['short']}" not in markers[0]:
            problems.append(f"{f['path']}: needs exactly one marker line, this run's:\n    {plan['marker']}")
        for u in f["units"]:
            if u["kind"] in ("new", "live"):
                for ln in u["lines"]:
                    if ln not in present:
                        problems.append(f"{f['path']}: {u['kind']} unit `{u['label']}` was changed or removed "
                                        f"(missing line: {ln!r}). Only `old` units may be condensed.")
                        break
        for ln in f["frame"]:
            if ln not in present:
                problems.append(f"{f['path']}: text outside the units was changed or removed: {ln!r}")
        if f["name"] == "GAP_CONTEXT.md":
            n_after = len(parse_units(now_text, f["mode"])[0])
            if n_after < f["unit_count"]:
                problems.append(f"{f['path']}: has {n_after} entries, was {f['unit_count']}. Tighten entries, "
                                "don't drop them: GAP_CONTEXT.md stays in lockstep with GAP_ANALYSIS.md.")
        condensed = [u["label"] for u in f["units"] if u["kind"] == "old" and any(ln not in present for ln in u["lines"])]
        results.append({"file": f, "changed": True, "after": len(new_lines), "condensed": condensed})

    if problems:
        print("Refused: the edits don't fit the plan. Nothing was committed; your edits are left in place.",
              file=sys.stderr)
        for p in problems:
            print("  - " + p, file=sys.stderr)
        return 3
    changed = [r for r in results if r["changed"]]
    if not changed:
        print("Nothing was condensed: no in-scope file changed since the plan.")
        return 1

    cp, short = plan["checkpoint"], plan["short"]
    report_path = f"{rel}/{plan['report']}"
    tag = None if args.no_tag else plan["tag"]
    before_total = sum(r["file"]["lines_before"] for r in changed)
    after_total = sum(r["after"] for r in changed)
    unchanged = [r["file"]["path"] for r in results if not r["changed"]]
    prev = plan["previous"]

    # --- report
    rep = [f"# Scrolls compaction — {plan['date']}", "",
           f"- Checkpoint: `{cp}`" + (f" (tag `{tag}`)" if tag else " (no tag)"),
           f"- Base: `{plan['base']}` ({plan['base_date']}) — rule: {plan['rule_label']}",
           f"- Candidates: {plan['rule_desc']}",
           f"- Folder at checkpoint: `{rel}`",
           f"- Previous compaction: " + ("none" if prev == "none" else f"`{prev}`"),
           "", "Each section below is a marker for one compacted file. Read a file as it was with "
           f"`git show {cp}:<path>`, or by its blob id with `git cat-file -p <blob>`.", ""]
    for r in changed:
        f = r["file"]
        blob = out(repo, "rev-parse", f"{cp}:{f['path']}")
        rep += [f"## {f['path']}", f"- Blob at checkpoint: `{blob}` → `git cat-file -p {blob}`",
                f"- Lines: {f['lines_before']} → {r['after']}"]
        if r["condensed"]:
            rep.append("- Condensed or removed:")
            rep += [f"  - `{c}`" for c in r["condensed"]]
        rep += [f"- Full text: `git show {cp}:{f['path']}`", ""]
    if unchanged:
        rep += ["## Unchanged", ""] + [f"- {p}" for p in unchanged] + [""]

    # --- COMPACT.md row
    rows = compact_rows(folder)
    n = max([r["n"] for r in rows] or [0]) + 1
    names = ", ".join(r["file"]["name"][:-3] for r in changed)
    row = (f"| {n} | {plan['date']} | `{short}` | `{plan['base_short']}` ({plan['base_date']}) | "
           f"{plan['rule_label']} | {names} | {before_total} → {after_total} | [report]({plan['report']}) |")
    cpath = os.path.join(folder, "COMPACT.md")
    ctext = read(cpath) if os.path.isfile(cpath) else compact_template(rel)
    ctext = add_row(ctext, row)
    spath = os.path.join(folder, "STARTER.md")
    stext = add_starter_entry(read(spath), rel) if os.path.isfile(spath) else None

    # --- message
    msg = ["maint(memory): scrolls-compacted", "", f"- checkpoint: #{cp}",
           f"- base: #{plan['base']} ({plan['base_date']}; rule: {plan['rule_label']})", "", "Notes:"]
    for r in changed:
        f = r["file"]
        k = len(r["condensed"])
        msg.append(f"- compacted: {f['path']} ({k} unit{'' if k == 1 else 's'} condensed, "
                   f"{f['lines_before']} → {r['after']} lines)")
    msg += [f"- unchanged: {p}" for p in unchanged]
    msg.append(f"- report: {report_path}")
    msg.append(f"- checkpoint tag: {tag}" if tag else "- checkpoint tag: none (--no-tag)")
    if stext is not None:
        msg.append(f"- STARTER.md: added the COMPACT.md entry")
    msg += ["", "Scrolls-Action: compact", f"Scrolls-Checkpoint: {cp}", f"Scrolls-Compact-Base: {plan['base']}",
            f"Scrolls-Compact-Rule: {plan['rule_trailer']}", f"Scrolls-Previous-Compaction: {prev}",
            f"Scrolls-Folder: {rel}"]
    msg += [f"Scrolls-Compacted: {r['file']['path']}" for r in changed]
    msg += [f"Scrolls-Report: {report_path}"]
    message = "\n".join(msg) + "\n"

    if args.dry_run:
        print("Validation passed (dry run: nothing written).")
        print(f"  would write: {report_path}, {rel}/COMPACT.md" + (f", {rel}/STARTER.md" if stext else ""))
        print("\n" + message)
        return 0

    write(os.path.join(repo, report_path), "\n".join(rep).rstrip("\n") + "\n")
    write(cpath, ctext)
    paths = [r["file"]["path"] for r in changed] + [report_path, f"{rel}/COMPACT.md"]
    if stext is not None:
        write(spath, stext)
        paths.append(f"{rel}/STARTER.md")
    git(repo, "add", "--", *paths)
    gitdir = out(repo, "rev-parse", "--absolute-git-dir")
    msg_path = os.path.join(gitdir, MSG_FILE)
    write(msg_path, message)
    os.remove(plan_path)

    if args.no_commit:
        print("Staged the compaction; not committed (--no-commit). Finish with:")
        print(f"  git commit -F {msg_path}")
        if tag:
            print(f"Then protect the checkpoint:\n  git tag {tag} {cp}")
        return 0

    env = dict(os.environ)
    if os.environ.get("SCROLLS_COMPACT_NOW"):
        env["GIT_AUTHOR_DATE"] = env["GIT_COMMITTER_DATE"] = f"@{plan['now']} +0000"
    r = git(repo, "commit", "-q", "-F", msg_path, check=False, env=env)
    if r.returncode != 0:
        print(r.stdout + r.stderr, file=sys.stderr)
        print(f"git commit failed; the compaction is left staged. Fix the cause, then run:\n"
              f"  git commit -F {msg_path}\n(Never retry with --no-verify.)", file=sys.stderr)
        return 4
    os.remove(msg_path)
    new = out(repo, "rev-parse", "HEAD")
    tag_note = ""
    if tag:
        t = git(repo, "tag", tag, cp, check=False)
        tag_note = f"  tag:        {tag}" if t.returncode == 0 else f"  tag:        not created ({t.stderr.strip()})"
    print("Compacted.")
    print(f"  commit:     {new}")
    print(f"  checkpoint: {cp}")
    print(f"  base:       {plan['base']} ({plan['base_date']}; rule: {plan['rule_label']})")
    for r2 in changed:
        print(f"  compacted:  {r2['file']['path']} ({r2['file']['lines_before']} → {r2['after']} lines)")
    print(f"  report:     {report_path}")
    if tag_note:
        print(tag_note)
        print(f"Push the tag so the checkpoint survives squash merges: git push origin {tag}")
    print(f"Undo: git revert --no-edit {new}")
    return 0


# ------------------------------------------------------------- traversal

def resolve_id(rows: List[dict], ident: str) -> dict:
    key = ident.strip().lstrip("#")
    if key.isdigit() and len(key) <= 4:
        for r in rows:
            if r["n"] == int(key):
                return r
    for r in rows:
        if key and (r["checkpoint"].startswith(key[:len(r["checkpoint"])]) and len(key) >= 4
                    or key in r["report"]):
            return r
    die(1, f"No compaction {ident!r} in COMPACT.md. Run --list to see them.")
    raise AssertionError


def cmd_list(args: argparse.Namespace) -> int:
    repo, folder, rel = locate(args)
    rows = sorted(compact_rows(folder), key=lambda r: -r["n"])
    if not rows:
        print(f"No compactions recorded in {rel}/COMPACT.md.")
        return 1
    print(f"Compactions of {rel}, newest first:")
    for r in rows:
        info = report_info(folder, r)
        ok = git(repo, "cat-file", "-e", info["checkpoint"] + "^{commit}", check=False).returncode == 0
        print(f"  #{r['n']}  {r['date']}  {r['checkpoint']}  base {r['base']}  [{r['files']}]  "
              f"{'reachable' if ok else 'MISSING (fetch the scrolls-compact tags)'}  {r['report']}")
    return 0


def cmd_show(args: argparse.Namespace) -> int:
    repo, folder, rel = locate(args)
    ident = args.show[0]
    fname = args.show[1] if len(args.show) > 1 else None
    row = resolve_id(compact_rows(folder), ident)
    info = report_info(folder, row)
    cfolder = info["folder"] or rel
    commit = compaction_commit(repo, cfolder, row["report"])
    if not commit:
        die(1, f"The commit that added {row['report']} isn't in this history (not committed yet?).")
    path = f"{cfolder}/{fname}" if fname else cfolder
    r = git(repo, "diff", info["checkpoint"], commit, "--", path, check=False)
    if r.returncode != 0:
        die(1, r.stderr.strip())
    sys.stdout.write(r.stdout)
    return 0


def cmd_extract(args: argparse.Namespace) -> int:
    repo, folder, rel = locate(args)
    ident, fname = args.extract
    row = resolve_id(compact_rows(folder), ident)
    info = report_info(folder, row)
    cfolder = info["folder"] or rel
    r = git(repo, "show", f"{info['checkpoint']}:{cfolder}/{fname}", check=False)
    if r.returncode != 0:
        blob = info["blobs"].get(f"{cfolder}/{fname}")
        r = git(repo, "cat-file", "-p", blob, check=False) if blob else r
    if r.returncode != 0:
        die(1, f"Can't read {cfolder}/{fname} at {info['checkpoint']}: {r.stderr.strip()}")
    if args.output:
        write(args.output, r.stdout)
        print(f"Wrote {args.output}")
    else:
        sys.stdout.write(r.stdout)
    return 0


# ------------------------------------------------------------------ main

class Parser(argparse.ArgumentParser):
    def error(self, message: str) -> "None":  # exit 2, the family's usage code
        die(2, f"usage error: {message}")


def main(argv: List[str]) -> int:
    p = Parser(prog="compact", add_help=True)
    p.add_argument("--before")
    p.add_argument("--base")
    p.add_argument("--keep-days", type=int, default=7)
    p.add_argument("--keep-commits", type=int, default=20)
    p.add_argument("--trunk")
    p.add_argument("--include", action="append", default=[])
    p.add_argument("--exclude", action="append", default=[])
    p.add_argument("-p", "--path")
    p.add_argument("-t", "--reporoot", action="store_true")
    p.add_argument("-l", "--local", action="store_true")
    p.add_argument("-r", "--recurse", action="store_true")
    p.add_argument("-n", "--dry-run", action="store_true")
    p.add_argument("-y", "--yes", action="store_true")
    p.add_argument("--no-commit", action="store_true")
    p.add_argument("--no-tag", action="store_true")
    p.add_argument("--finalize", action="store_true")
    p.add_argument("--list", action="store_true")
    p.add_argument("--show", nargs="+", metavar="ID [FILE]")
    p.add_argument("--extract", nargs=2, metavar=("ID", "FILE"))
    p.add_argument("-o", "--output")
    args = p.parse_args(argv)
    modes = [m for m in ("finalize", "list", "show", "extract") if getattr(args, m)]
    if len(modes) > 1:
        die(2, "Pass only one of --finalize, --list, --show and --extract.")
    if args.show and len(args.show) > 2:
        die(2, "--show takes ID and at most one FILE.")
    if args.keep_days < 0 or args.keep_commits < 0:
        die(2, "--keep-days and --keep-commits can't be negative.")
    if args.finalize:
        return cmd_finalize(args)
    if args.list:
        return cmd_list(args)
    if args.show:
        return cmd_show(args)
    if args.extract:
        return cmd_extract(args)
    return cmd_plan(args)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
