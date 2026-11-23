#!/usr/bin/env python3
"""route.py - which scroll set should hold the record of each changed file.

A scroll set (a docs/.scrolls or docs/scrolls folder with a STARTER.md) can have
other scroll sets nested below it: a monorepo package with its own memory, or a
family of skills whose memory lives elsewhere. The top-level set then acts as a
router: work in a folder covered by a nested set is recorded in that set, and the
top level keeps at most a pointer. This script shows where each change goes.

Coverage comes from two places:
  1. Nesting: a set at <home>/docs/.scrolls covers everything under <home>/.
  2. A router table: a "## Where memory lives" section in a set's STARTER.md
     whose rows name covered folders in `backticks` ending in "/" and the scroll
     set (a `path` ending in ".scrolls/" or "scrolls/") in the last column.
     Paths are relative to that set's home. Use it when a set's memory lives
     outside the folder it covers (e.g. src/memory/foo covering skills/foo/).
The deepest matching folder wins; anything not covered stays with the top-level
set.

Changed files: everything committed since the top-level set was last touched
(or since --since REV), plus uncommitted and untracked files.

Usage:
  route.sh [SCROLLS_PATH] [--since REV]
SCROLLS_PATH defaults to docs/.scrolls, then docs/scrolls, under the current
directory. Exit codes: 0 ok (also when not in a git repository: nothing to
route), 1 no scroll set found, 2 bad arguments.

Read-only: runs git read commands and reads files; writes nothing.
"""
import os, re, subprocess, sys

PRUNE = {"node_modules", ".git", "vendor", "dist", "build", ".venv", "venv", "__pycache__", "target", ".next", ".cache"}
MAX_DEPTH = 8
SET_NAMES = (".scrolls", "scrolls")
TABLE_HEADING = "## where memory lives"


def git(args, cwd):
    r = subprocess.run(["git"] + args, cwd=cwd, capture_output=True, text=True)
    return r.returncode, r.stdout


def norm(p):
    p = p.replace("\\", "/").strip()
    while p.startswith("./"):
        p = p[2:]
    return p.rstrip("/")


def home_of(set_rel):
    """The folder a set covers: the parent of its docs folder ('' for the repo root)."""
    return norm(os.path.dirname(os.path.dirname(set_rel)))


def join(a, b):
    return norm(b) if not a else norm(a + "/" + b)


def find_sets(root, start_rel):
    """Scroll sets at or below start_rel (repo-relative), pruned and depth-bounded."""
    found = []
    top = os.path.join(root, start_rel) if start_rel else root
    base_depth = top.rstrip(os.sep).count(os.sep)
    for dirpath, dirnames, _ in os.walk(top):
        depth = dirpath.rstrip(os.sep).count(os.sep) - base_depth
        keep = []
        for d in dirnames:
            if d in PRUNE:
                continue
            if d in SET_NAMES and os.path.isfile(os.path.join(dirpath, d, "STARTER.md")):
                found.append(norm(os.path.relpath(os.path.join(dirpath, d), root)))
                continue
            if d.startswith(".") or depth >= MAX_DEPTH:
                continue
            keep.append(d)
        dirnames[:] = sorted(keep)
    return sorted(set(found))


def router_rows(root, set_rel):
    """(covered folder, scroll set) pairs from a set's 'Where memory lives' table."""
    path = os.path.join(root, set_rel, "STARTER.md")
    try:
        lines = open(path, encoding="utf-8", errors="replace").read().splitlines()
    except OSError:
        return []
    rows, inside, home = [], False, home_of(set_rel)
    for line in lines:
        s = line.strip()
        if s.startswith("## "):
            inside = s.lower().startswith(TABLE_HEADING)
            continue
        if not inside or not s.startswith("|") or set(s) <= set("|-: "):
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        if len(cells) < 2:
            continue
        targets = [t for t in re.findall(r"`([^`]+)`", cells[-1]) if norm(t).endswith(SET_NAMES)]
        if not targets:
            continue
        target = join(home, targets[-1])
        for c in cells[:-1]:
            for scope in re.findall(r"`([^`]+)`", c):
                if scope.endswith("/") and not norm(scope).endswith(SET_NAMES):
                    rows.append((join(home, scope), target))
    return rows


def changed_files(root, set_rel, since):
    files = []
    if since is None:
        code, out = git(["log", "-1", "--format=%H", "--", set_rel], root)
        since = out.strip() if code == 0 else ""
    if since:
        code, out = git(["rev-parse", "--verify", "--quiet", since + "^{commit}"], root)
        if code != 0:
            raise ValueError("unknown revision for --since: %s" % since)
        since = out.strip()
        code, out = git(["diff", "--name-only", since + "..HEAD"], root)
        if code == 0:
            files += out.splitlines()
    code, out = git(["status", "--porcelain", "-uall"], root)
    for line in out.splitlines() if code == 0 else []:
        p = line[3:]
        if " -> " in p:
            p = p.split(" -> ", 1)[1]
        files.append(p.strip('"'))
    return sorted({norm(f) for f in files if f.strip()}), since


def route(path, coverage, top):
    best, best_len = top, -1
    for prefix, target in coverage:
        if (prefix == "" or path == prefix or path.startswith(prefix + "/")) and len(prefix) > best_len:
            best, best_len = target, len(prefix)
    return best


def main(argv):
    since, given = None, None
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--since" and i + 1 < len(argv):
            since = argv[i + 1]; i += 2; continue
        if a.startswith("--since="):
            since = a.split("=", 1)[1]; i += 1; continue
        if a in ("-h", "--help"):
            print(__doc__); return 0
        if a.startswith("-") or given is not None:
            print("route: unexpected argument %r (usage: route.sh [SCROLLS_PATH] [--since REV])" % a, file=sys.stderr)
            return 2
        given = a; i += 1

    code, out = git(["rev-parse", "--show-toplevel"], os.getcwd())
    if code != 0:
        print("Not a git repository: nothing to route.")
        return 0
    root = out.strip()

    if given is None:
        cands = [c for c in ("docs/.scrolls", "docs/scrolls") if os.path.isfile(os.path.join(os.getcwd(), c, "STARTER.md"))]
        if not cands:
            print("No scroll set (docs/.scrolls or docs/scrolls with a STARTER.md) here. Run /scrolls-setup first.")
            return 1
        given = cands[0]
    abs_set = os.path.abspath(given)
    if not os.path.isfile(os.path.join(abs_set, "STARTER.md")):
        print("No scroll set at %s (no STARTER.md). Run /scrolls-setup first." % given)
        return 1
    top = norm(os.path.relpath(abs_set, root))
    base = home_of(top)

    sets = find_sets(root, base)
    nested = [s for s in sets if s != top]
    coverage = [(home_of(s), s) for s in nested]
    listed = set()
    for s in [top] + nested:
        for scope, target in router_rows(root, s):
            coverage.append((scope, target))
            listed.add(target)

    try:
        files, since_rev = changed_files(root, top, since)
    except ValueError as e:
        print("route: %s" % e, file=sys.stderr)
        return 2
    in_base = [f for f in files if not base or f == base or f.startswith(base + "/")]

    print("== Scroll sets under %s ==" % (base or "the repository root"))
    print("%s (top level)" % top)
    if not nested:
        print("No nested scroll sets under %s: everything goes to %s." % (base or "the repository root", top))
    for s in nested:
        scopes = sorted({p for p, t in coverage if t == s})
        print("%s  covers %s" % (s, ", ".join((p or ".") + "/" for p in scopes)))

    print("\n== Routing of changed files (%s, plus uncommitted) ==" % (("since " + since_rev[:7]) if since_rev else "all commits"))
    groups = {}
    for f in in_base:
        groups.setdefault(route(f, coverage, top), []).append(f)
    if not groups:
        print("No changed files.")
    for target in [top] + sorted(t for t in groups if t != top):
        if target in groups:
            print("-> %s%s" % (target, " (top level)" if target == top else ""))
            for f in groups[target]:
                print("   " + f)

    missing = [s for s in nested if s not in listed]
    if missing:
        print("\n== Not in the router table ==")
        print("These nested scroll sets are not listed in a \"Where memory lives\" table; add a row for each to %s/STARTER.md:" % top)
        for s in missing:
            print("   " + s)
    ghosts = sorted(t for t in listed if t not in sets)
    if ghosts:
        print("\n== Listed but missing ==")
        print("These scroll sets are named in a router table but have no STARTER.md:")
        for s in ghosts:
            print("   " + s)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
