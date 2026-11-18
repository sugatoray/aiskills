#!/usr/bin/env python3
"""Check the examples: assets/EXAMPLES.md (a small index) and one file per
example, assets/examples/example_NNN.md. Checks the layout, the coverage, and
that every documented output is what the skill really prints.

Layout rules (so an agent can read the index, then only the example it needs):
  - EXAMPLES.md holds no example bodies, stays under INDEX_MAX_LINES lines, and
    has one table row per example: | Example | File | Prompt | Shows | Starts from |.
  - The table's files and assets/examples/*.md match one to one, in order.
  - Each example file holds exactly one example, links back to ../EXAMPLES.md,
    says what it starts from (linking the example it depends on, if any), and
    stays under the Read tool's 2,000-line default.

Each example is replayed, in order, in a fresh demo repository:

  <!--- example:start fixture=NAME --->   which demo repository to build
  <!--- setup-block:start --->            ```bash``` run in the repository first
  <!--- prompt-block:start --->           ```prompt``` with a `## metadata:` header:
                                           date (the pinned clock, 08:00 UTC that
                                           day), agent, and optionally cwd. The
                                           /scrolls-compact line runs scripts/
                                           compact.sh with the same arguments.
                                         or ```bash``` (a shell command whose
                                           output is shown, e.g. cat COMPACT.md)
  <!--- prompt-output:start --->          "**Output**:" (exit 0) or
                                           "**Output** (exit N):", then ```text```

Outputs are compared exactly, after the temporary repository path is
replaced with /work/shop. Fixture commits have fixed authors, dates and
content, so commit SHAs are the same on every run.

Usage:
  check_examples.py            check; exit 1 on any failure
  check_examples.py --print    print each prompt's actual output (to review
                               and paste when an example is added or changed)
"""
from __future__ import annotations

import os
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKILL = HERE.parent
EXAMPLE = SKILL / "assets" / "EXAMPLES.md"
EXAMPLE_DIR = SKILL / "assets" / "examples"
INDEX_MAX_LINES = 150
FILE_MAX_LINES = 2000
SCRIPT = SKILL / "scripts" / "compact.sh"
SHOWN_ROOT = "/work/shop"
S = "docs/.scrolls"

# Every flag SKILL.md documents, and every exit code, must appear somewhere.
FLAGS = ["--before", "--base", "--keep-days", "--keep-commits", "--trunk", "--include", "--exclude",
         "-p", "-t", "-l", "-r", "-n", "-y", "--no-commit", "--no-tag", "--finalize", "--list",
         "--show", "--extract", "-o"]
EXIT_CODES = {0, 1, 2, 3, 4}

TOTAL = 0
FAILS = 0


def check(cond: bool, label: str, detail: str = "") -> bool:
    global TOTAL, FAILS
    TOTAL += 1
    if cond:
        print(f"PASS: {label}")
    else:
        FAILS += 1
        print(f"FAIL: {label}" + (f"\n{detail}" if detail else ""))
    return cond


# ------------------------------------------------------------- fixtures

def run(cmd, cwd, env=None, shell=False):
    return subprocess.run(cmd, cwd=cwd, env=env, shell=shell, text=True,
                          stdout=subprocess.PIPE, stderr=subprocess.STDOUT)


def git_env(ts: int) -> dict:
    env = dict(os.environ)
    env.update({"GIT_AUTHOR_NAME": "Dana Dev", "GIT_AUTHOR_EMAIL": "dana@example.com",
                "GIT_COMMITTER_NAME": "Dana Dev", "GIT_COMMITTER_EMAIL": "dana@example.com",
                "GIT_AUTHOR_DATE": f"@{ts} +0000", "GIT_COMMITTER_DATE": f"@{ts} +0000"})
    return env


def day(s: str, hour: int = 10) -> int:
    return int(datetime.strptime(s, "%Y-%m-%d").replace(hour=hour, tzinfo=timezone.utc).timestamp())


def write(root: Path, rel: str, text: str) -> None:
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def append(root: Path, rel: str, text: str) -> None:
    with open(root / rel, "a", encoding="utf-8") as fh:
        fh.write(text)


def commit(root: Path, when: int, msg: str) -> None:
    run(["git", "add", "-A"], root)
    r = run(["git", "commit", "-q", "--allow-empty", "-m", msg], root, env=git_env(when))
    assert r.returncode == 0, r.stdout


STARTER = """# STARTER.md — Read Me First

You're picking up work on **shop**, a small web store. Read these in order:

1. **`{p}/SPEC.md`** — What the store does, feature by feature.
2. **`{p}/HANDOFF.md`** — Where things stand right now.
3. **`{p}/GAP_ANALYSIS.md`** — What is not built yet.
4. **`{p}/GAP_CONTEXT.md`** — Why each gap exists.
5. **`{p}/PLAN.md`** — The prioritized backlog.
6. **`{p}/WISDOM.md`** — Constraints, traps and lessons.

## When to update each file
- **SPEC.md**: after shipping a feature.
- **HANDOFF.md**: at the end of every session (overwrite).
- **GAP_ANALYSIS.md** / **GAP_CONTEXT.md**: when a gap opens or closes, in lockstep.
- **PLAN.md**: when a ticket's status changes.
- **WISDOM.md**: when you learn something worth keeping.
"""


def handoff(state: str, happened: str, threads: str) -> str:
    return ("# HANDOFF.md — Change of Guard\n\nOverwrite at the end of every session.\n\n"
            f"## Current state\n{state}\n## What just happened\n{happened}\n"
            f"## Known issues / open threads\n{threads}")


SHOP_DATES = ["2026-10-06", "2026-10-21", "2026-11-03", "2026-11-12", "2026-11-14"]


def build_shop(root: Path, base: str = "", dates=None) -> None:
    """The demo store. Five commits on main, by default 2026-10-06, -10-21, -11-03, -11-12, -11-14."""
    d = [day(x) for x in SHOP_DATES] if dates is None else dates
    s = f"{base}{S}" if base else S
    write(root, "app/store.py", "# the store\n")
    write(root, f"{s}/STARTER.md", STARTER.format(p=f"docs/.scrolls"))
    write(root, f"{s}/SPEC.md", "# SPEC.md — Feature Spec\n\nWhat shop does, feature by feature.\n\n"
          "## Product search (#12)\nSearch by name or SKU, with typo tolerance.\n"
          "The results page shows 20 items at a time.\n")
    write(root, f"{s}/PLAN.md", "# PLAN.md — Prioritized Backlog\n\nHighest priority first.\n\n"
          "- [x] SHOP-1: Product search. Merged in #12.\n- [ ] SHOP-2: Saved carts.\n")
    write(root, f"{s}/HANDOFF.md", handoff("- main has product search (#12).\n",
                                           "- Shipped product search.\n",
                                           "- Search is slow on catalogs over 10k items.\n"))
    write(root, f"{s}/GAP_ANALYSIS.md", "# GAP_ANALYSIS.md — Known Gaps\n\nOne line per gap.\n\n"
          "- No saved carts.\n- Search is English-only.\n")
    write(root, f"{s}/GAP_CONTEXT.md", "# GAP_CONTEXT.md — Why Each Gap Exists\n\nOne reason per gap.\n\n"
          "- **No saved carts**: a deliberate cut for v1. The user wanted checkout first, and saved "
          "carts need accounts, which are not built yet.\n"
          "- **Search is English-only**: a blocker. The stemming library supports English only; "
          "revisit when it adds more languages.\n")
    write(root, f"{s}/WISDOM.md", "# WISDOM.md\n\n## Traps\n- Prices are integers in cents. Never floats.\n")
    commit(root, d[0], "Add product search (#12)")

    append(root, f"{s}/SPEC.md", "\n## Checkout (#18)\nCard payments through the payment gateway.\n"
           "A receipt goes out by email.\n")
    append(root, f"{s}/PLAN.md", "- [x] SHOP-3: Checkout. Merged in #18.\n")
    write(root, f"{s}/HANDOFF.md", handoff("- main has product search (#12) and checkout (#18).\n",
                                           "- Shipped checkout.\n",
                                           "- Search is slow on catalogs over 10k items.\n"))
    append(root, "app/store.py", "# checkout\n")
    commit(root, d[1], "Add checkout (#18)")

    append(root, f"{s}/SPEC.md", "\n## Order history (#23)\nSigned-in users see their past orders.\n")
    append(root, f"{s}/PLAN.md", "- [x] SHOP-4: Order history. Merged in #23.\n")
    append(root, "app/store.py", "# orders\n")
    commit(root, d[2], "Add order history (#23)")

    append(root, f"{s}/SPEC.md", "\n## Wishlist (#27)\nA heart icon saves an item for later.\n")
    append(root, f"{s}/PLAN.md", "- [x] SHOP-5: Wishlist. Merged in #27.\n- [ ] SHOP-6: Gift cards.\n")
    write(root, f"{s}/HANDOFF.md", handoff(
        "- main has search, checkout, order history and wishlist.\n",
        "- Shipped wishlist (#27).\n",
        "- Search is slow on catalogs over 10k items.\n- Wishlists don't sync across devices yet.\n"))
    append(root, "app/store.py", "# wishlist\n")
    commit(root, d[3], "Add wishlist (#27)")

    p = root / s / "HANDOFF.md"
    p.write_text(p.read_text().replace("- Shipped wishlist (#27).\n",
                                       "- Shipped wishlist (#27).\n- Started gift cards (SHOP-6).\n"))
    append(root, "app/store.py", "# gift cards: started\n")
    commit(root, d[4], "Start gift cards")


def fixture(name: str, root: Path) -> None:
    if name == "no-git":
        return
    run(["git", "init", "-q", "-b", "main"], root)
    run(["git", "config", "commit.gpgsign", "false"], root)
    run(["git", "config", "tag.gpgsign", "false"], root)
    if name == "no-scrolls":
        write(root, "app/store.py", "# the store\n")
        commit(root, day("2026-11-01"), "Initial commit")
    elif name == "shop":
        build_shop(root)
    elif name == "busy-shop":
        build_shop(root)
        for i in range(1, 25):
            append(root, "app/store.py", f"# tweak {i}\n")
            commit(root, day("2026-11-14", 12) + i * 600, f"Tweak {i}")
    elif name == "monorepo":
        write(root, "README.md", "# shop monorepo\n")
        build_shop(root, base="packages/api/")
    elif name == "fresh-shop":
        # The same store, but every commit in the last two days: nothing is old.
        build_shop(root, dates=[day("2026-11-13", h) for h in (9, 11, 13, 15)] + [day("2026-11-14")])
    else:
        raise SystemExit(f"unknown fixture {name!r}")


# --------------------------------------------------------------- parsing

MARK = re.compile(r"^<!--- ([a-z-]+:(?:start|end)(?::[a-z]+)?)(.*?) --->$")
FENCE = re.compile(r"^```(\w*)$")


def parse(text: str):
    """Return (examples, problems). Each example: {num, title_line, fixture, items: [...]}."""
    lines = text.splitlines()
    problems = []
    stack = []
    examples = []
    cur = None
    i = 0
    while i < len(lines):
        ln = lines[i]
        m = MARK.match(ln)
        if m:
            tag, attrs = m.group(1), m.group(2).strip()
            kind, edge = tag.split(":")[0], tag.split(":")[1]
            sub = tag.split(":")[2] if tag.count(":") == 2 else ""
            key = kind + (":" + sub if sub else "")
            if edge == "start":
                stack.append((key, i + 1))
                if kind == "example" and not sub:
                    if cur is not None:
                        problems.append(f"line {i+1}: example:start inside another example")
                    fx = re.search(r"fixture=(\S+)", attrs)
                    cur = {"line": i + 1, "fixture": fx.group(1) if fx else None, "items": [], "num": None}
                    examples.append(cur)
                elif kind in ("setup-block", "prompt-block") and cur is not None:
                    j = i + 1
                    while j < len(lines) and not FENCE.match(lines[j]):
                        j += 1
                    if j >= len(lines):
                        problems.append(f"line {i+1}: {kind} without a code fence")
                    else:
                        lang = FENCE.match(lines[j]).group(1)
                        k = j + 1
                        while k < len(lines) and lines[k] != "```":
                            k += 1
                        cur["items"].append({"kind": kind, "lang": lang, "body": lines[j+1:k], "line": i + 1})
                elif kind == "prompt-output" and not sub and cur is not None:
                    j = i + 1
                    while j < len(lines) and not lines[j].startswith("**Output"):
                        j += 1
                    em = re.match(r"^\*\*Output\*\*(?: \(exit (\d)\))?:$", lines[j]) if j < len(lines) else None
                    if not em:
                        problems.append(f"line {i+1}: prompt-output must start with **Output**: or **Output** (exit N):")
                        code = 0
                    else:
                        code = int(em.group(1) or 0)
                    k = j + 1
                    while k < len(lines) and lines[k] != "```text":
                        k += 1
                    e = k + 1
                    while e < len(lines) and lines[e] != "```":
                        e += 1
                    cur["items"].append({"kind": "output", "code": code, "body": lines[k+1:e], "line": i + 1})
            else:
                if not stack or stack[-1][0] != key:
                    problems.append(f"line {i+1}: {tag} does not close {stack[-1][0] if stack else 'anything'}")
                else:
                    stack.pop()
                if kind == "example" and not sub:
                    cur = None
        elif cur is not None and ln.startswith("## Example-"):
            cur["num"] = ln[len("## Example-"):].strip()
        i += 1
    for key, at in stack:
        problems.append(f"line {at}: {key}:start is never closed")
    return examples, problems


def metadata(body):
    meta, cmd = {}, []
    for ln in body:
        m = re.match(r'^##\s+(\w+):\s*"?(.*?)"?$', ln)
        if ln.startswith("##"):
            if m and m.group(1) != "metadata":
                meta[m.group(1)] = m.group(2)
        elif ln.strip():
            cmd.append(ln)
    return meta, cmd


# ---------------------------------------------------------------- replay

EXAMPLES: dict = {}


def prompt_env(meta: dict) -> dict:
    env = git_env(day(meta.get("date", "2026-11-15"), 8))
    env["TZ"] = "UTC"
    env["SCROLLS_COMPACT_NOW"] = str(day(meta.get("date", "2026-11-15"), 8))
    return env


def run_item(item, root: Path):
    """Run one setup or prompt item. Returns (exit code, shown output, label) for prompts."""
    if item["kind"] == "setup-block":
        r = run("\n".join(item["body"]), root, env=git_env(day("2026-11-15", 8)), shell=True)
        return r.returncode, r.stdout, "setup"
    meta, cmd = metadata(item["body"])
    env = prompt_env(meta)
    cwd = root / meta["cwd"] if meta.get("cwd") else root
    if item["lang"] == "prompt":
        argv = ["bash", str(SCRIPT)] + shlex.split(cmd[0])[1:]
        r = run(argv, cwd, env=env)
    else:
        r = run("\n".join(cmd), cwd, env=env, shell=True)
    return r.returncode, r.stdout, " ".join(cmd)[:60]


def build(name: str, root: Path) -> None:
    """A plain fixture, or after-NN / condensed-NN: Example-NN replayed (up to its first --finalize)."""
    m = re.match(r"^(after|condensed)-(\d\d)$", name)
    if not m:
        fixture(name, root)
        return
    ex = EXAMPLES[m.group(2)]
    build(ex["fixture"], root)
    for item in ex["items"]:
        if item["kind"] == "output":
            continue
        if m.group(1) == "condensed" and item["kind"] == "prompt-block" and "--finalize" in " ".join(item["body"]):
            return
        code, out, label = run_item(item, root)
        if item["kind"] == "setup-block" and code != 0:
            raise SystemExit(f"fixture {name}: setup failed:\n{out}")


def replay(ex, printing: bool):
    tmp = Path(tempfile.mkdtemp(prefix="scrolls-compact-example."))
    root = tmp / "shop"
    root.mkdir()
    try:
        build(ex["fixture"], root)
        pending = None
        for item in ex["items"]:
            if item["kind"] == "setup-block":
                code, out, _ = run_item(item, root)
                check(code == 0, f"Example-{ex['num']}: setup at line {item['line']} runs", out)
            elif item["kind"] == "prompt-block":
                meta, cmd = metadata(item["body"])
                if item["lang"] == "prompt" and (len(cmd) != 1 or not cmd[0].startswith("/scrolls-compact")):
                    check(False, f"Example-{ex['num']}: prompt at line {item['line']} is one /scrolls-compact line")
                    pending = None
                    continue
                code, out, label = run_item(item, root)
                out = out.replace(str(root), SHOWN_ROOT).replace(str(tmp), "/work").rstrip("\n")
                pending = (code, out, label)
            elif item["kind"] == "output":
                if pending is None:
                    check(False, f"Example-{ex['num']}: output at line {item['line']} follows a prompt")
                    continue
                code, out, label = pending
                pending = None
                want = "\n".join(item["body"]).rstrip("\n")
                if printing:
                    print(f"----- Example-{ex['num']} · {label} · exit {code}\n{out}\n")
                    continue
                check(code == item["code"], f"Example-{ex['num']}: `{label}` exits {item['code']}",
                      f"  actual exit {code}")
                if not check(out == want, f"Example-{ex['num']}: `{label}` prints the documented output"):
                    import difflib
                    print("\n".join(difflib.unified_diff(want.splitlines(), out.splitlines(),
                                                         "documented", "actual", lineterm="")))
        if pending is not None:
            check(False, f"Example-{ex['num']}: the last prompt has a documented output")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


ROW = re.compile(r"^\| \[(\d\d)\]\((examples/example_(\d{3})\.md)\) \| `examples/example_\d{3}\.md` \|"
                 r" (.+?) \| (.+?) \| (.+?) \|$")


def main() -> int:
    printing = "--print" in sys.argv
    if not check(EXAMPLE.is_file(), "assets/EXAMPLES.md exists"):
        return 1
    index = EXAMPLE.read_text(encoding="utf-8")

    # ---- the index
    check(len(index.splitlines()) <= INDEX_MAX_LINES,
          f"EXAMPLES.md is a small index ({len(index.splitlines())} lines, at most {INDEX_MAX_LINES})")
    check(not re.search(r"(?m)^<!--- (example|prompt-block|prompt-output|setup-block):start", index),
          "EXAMPLES.md holds no example bodies (they live in examples/)")
    check("| Example | File | Prompt | Shows | Starts from |" in index,
          "EXAMPLES.md's table has the columns Example, File, Prompt, Shows, Starts from")
    rows = [ROW.match(l) for l in index.splitlines() if l.startswith("| [")]
    check(all(rows), "every table row has the expected shape, with the file as a link and as a path")
    rows = [r for r in rows if r]
    files = sorted(p.name for p in EXAMPLE_DIR.glob("*.md")) if EXAMPLE_DIR.is_dir() else []
    check(EXAMPLE_DIR.is_dir(), "assets/examples/ exists")
    check([f"example_{r.group(3)}.md" for r in rows] == files,
          "the table and assets/examples/*.md match one to one, in order",
          f"  table: {[r.group(2) for r in rows]}\n  files: {files}")
    for r in rows:
        check(int(r.group(1)) == int(r.group(3)), f"row {r.group(1)} points at its own file ({r.group(2)})")

    # ---- each example file
    examples, problems = [], []
    for name in files:
        text = (EXAMPLE_DIR / name).read_text(encoding="utf-8")
        exs, probs = parse(text)
        problems += [f"{name}: {p}" for p in probs]
        n = name[len("example_"):-3]
        check(len(exs) == 1, f"{name}: holds exactly one example")
        check(len(text.splitlines()) < FILE_MAX_LINES, f"{name}: under {FILE_MAX_LINES} lines")
        check("](../EXAMPLES.md)" in text, f"{name}: links back to ../EXAMPLES.md")
        check(re.search(r"(?m)^Starts from: ", text) is not None, f"{name}: says what it starts from")
        for e in exs:
            check(e["num"] is not None and int(e["num"]) == int(n), f"{name}: is Example-{int(n):02d}")
            e["file"] = name
            dep = re.match(r"^(?:after|condensed)-(\d\d)$", e["fixture"] or "")
            if dep:
                check(f"(example_{int(dep.group(1)):03d}.md)" in text,
                      f"{name}: links the example it starts from (example_{int(dep.group(1)):03d}.md)")
            row = next((r for r in rows if int(r.group(1)) == int(n)), None)
            if row:
                want = (f"[Example-{dep.group(1)}](examples/example_{int(dep.group(1)):03d}.md)" if dep
                        else f"`{e['fixture']}`")
                check(want in row.group(6), f"row {row.group(1)}: Starts from names {want}", f"  row says: {row.group(6)}")
        examples += exs
    check(not problems, "markers are balanced and well formed", "\n".join("  " + p for p in problems))
    check(len(examples) >= 15, f"has an exhaustive set of examples ({len(examples)} found, at least 15)")
    nums = [e["num"] for e in examples]
    check(nums == [f"{i:02d}" for i in range(1, len(examples) + 1)], "examples are numbered Example-01, -02, … in order",
          f"  found {nums}")
    for e in examples:
        check(e["fixture"] is not None, f"Example-{e['num']}: names its fixture")
        check(any(it["kind"] == "prompt-block" for it in e["items"]), f"Example-{e['num']}: has a prompt")
        for it in e["items"]:
            if it["kind"] == "prompt-block":
                meta, _ = metadata(it["body"])
                check("date" in meta and "agent" in meta,
                      f"Example-{e['num']}: prompt at line {it['line']} has date and agent metadata")
    prompts = [" ".join(metadata(it["body"])[1]) for e in examples for it in e["items"]
               if it["kind"] == "prompt-block" and it["lang"] == "prompt"]
    for flag in FLAGS:
        check(any(re.search(r"(^|\s)" + re.escape(flag) + r"(?=$|[\s=])", p) for p in prompts),
              f"coverage: some example uses {flag}")
    codes = {it["code"] for e in examples for it in e["items"] if it["kind"] == "output"}
    for c in sorted(EXIT_CODES):
        check(c in codes, f"coverage: some example shows exit code {c}")
    for e in examples:
        EXAMPLES[e["num"]] = e
    for e in examples:
        if e["fixture"]:
            replay(e, printing)
    print(f"\n=== {TOTAL - FAILS}/{TOTAL} passed ===")
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(main())
