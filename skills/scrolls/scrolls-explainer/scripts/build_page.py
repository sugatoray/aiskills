#!/usr/bin/env python3
"""Rebuild assets/scrolls-explainer.html from the scrolls-* skills as they
are now. Behind `explain --build`; also runnable on its own.

What comes from the skills themselves, every time:
  - which tabs exist: one per scrolls-* skill next to this one. A skill
    whose SKILL.md was renamed to SKILL.md.deprecated / .deactivated /
    .inactive (the family's way to switch a skill off) loses its tab and
    its blocks. A skill folder that is missing altogether stops the build
    (more likely a partial install than a decision), and so does a new
    scrolls-* skill that has no tab yet.
  - the version stamped on the page: the family's lockstep version, read
    from every SKILL.md; the build stops if they differ.
  - a fingerprint of each skill's SKILL.md (its version line left out). The
    words on the page (each tab's steps) are written by hand in
    assets/explainer-graph.json, so when a SKILL.md changes, the build
    stops and names it until someone checks that tab and confirms with
    --reviewed, which records the new fingerprints.

The page is rendered with the network-flow skill's renderer, found next to
this skill (a flat install), at ../../diagrams/network-flow (this
repository's layout), or at $NETWORK_FLOW_DIR. page_enhance.py then adds
the step callouts and keyboard support.

Stdlib only, Python 3.9+.

Usage:
  build_page.py [--reviewed] [--skills-dir DIR]   write assets/scrolls-explainer.html
  build_page.py --check [--skills-dir DIR]        exit 1 if the page is stale

Exit codes: 0 written / up to date, 1 stale (--check), 4 the skills need
attention first (review, lockstep, a missing skill, a skill with no tab),
5 the network-flow renderer was not found.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKILL_DIR = HERE.parent
SELF = "scrolls-explainer"
PAGE = SKILL_DIR / "assets" / "scrolls-explainer.html"
GRAPH = SKILL_DIR / "assets" / "explainer-graph.json"
OFF_NAMES = ("SKILL.md.deprecated", "SKILL.md.deactivated", "SKILL.md.inactive")
VERSION_LINE = re.compile(r'^  version: "([^"]+)"\n?', re.M)
GET_RENDERER = ("install the network-flow skill next to this one "
                "(npx skills add sugatoray/aiskills --skill network-flow), "
                "or set NETWORK_FLOW_DIR to its folder")

sys.path.insert(0, str(HERE))
from page_enhance import enhance  # noqa: E402


class NeedsAttention(Exception):
    """The skills and the page disagree; a person (or the agent) must act."""
    code = 4


class RendererMissing(Exception):
    code = 5


def fingerprint(text: str) -> str:
    """SKILL.md's content, minus its version line (a lockstep bump is not a change)."""
    body = VERSION_LINE.sub("", text.replace("\r\n", "\n"))
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def version_of(text: str) -> str | None:
    m = VERSION_LINE.search(text)
    return m.group(1) if m else None


def find_skills(skills_dir: Path) -> dict[str, dict]:
    """scrolls-* folders under skills_dir: {name: {state, text, off_file}}."""
    found: dict[str, dict] = {}
    for d in sorted(skills_dir.glob("scrolls-*")):
        if not d.is_dir():
            continue
        skill_md = d / "SKILL.md"
        if skill_md.is_file():
            found[d.name] = {"state": "active", "text": skill_md.read_text(encoding="utf-8")}
            continue
        off = next((n for n in OFF_NAMES if (d / n).is_file()), None)
        if off:
            found[d.name] = {"state": "off", "off_file": off}
    return found


def tab_skills(graph: dict) -> dict[str, str]:
    """{skill name: scenario id} for every tab labelled /scrolls-<name>."""
    out = {}
    for sid, sc in graph["scenarios"].items():
        label = sc.get("label", "")
        if label.startswith("/scrolls-"):
            out[label[1:]] = sid
    return out


def drop_tab(graph: dict, skill: str, sid: str) -> None:
    """Remove a command's tab, its block, the links to it, and anything left unlinked."""
    graph["scenarios"].pop(sid, None)
    gone_edges = {e["id"] for e in graph["edges"] if sid in (e["from"], e["to"])}
    graph["edges"] = [e for e in graph["edges"] if e["id"] not in gone_edges]
    linked = {n for e in graph["edges"] for n in (e["from"], e["to"])}
    gone_nodes = {n["id"] for n in graph["nodes"] if n["id"] == sid or n["id"] not in linked}
    graph["nodes"] = [n for n in graph["nodes"] if n["id"] not in gone_nodes]
    for key in list(graph["scenarios"]):
        sc = graph["scenarios"][key]
        sc["scope"] = [e for e in sc["scope"] if e not in gone_edges]
        sc["steps"] = [s for s in sc["steps"] if s["edge"] not in gone_edges and s.get("at") not in gone_nodes]
        if not sc["steps"]:
            del graph["scenarios"][key]
    for layout in graph.get("layouts", {}).values():
        for n in gone_nodes:
            layout.pop(n, None)


def renderer() -> Path:
    env = os.environ.get("NETWORK_FLOW_DIR")
    candidates = [Path(env)] if env else [SKILL_DIR.parent / "network-flow",
                                          SKILL_DIR.parent.parent / "diagrams" / "network-flow"]
    for root in candidates:
        script = root / "scripts" / "render.py"
        if script.is_file():
            return script
    where = env if env else " or ".join(str(c) for c in candidates)
    raise RendererMissing(f"the network-flow skill's renderer was not found ({where}): {GET_RENDERER}")


def plan(skills_dir: Path, reviewed: bool = False) -> tuple[dict, str, list[str]]:
    """Check the skills against the page source. Returns (graph to render, version, notes).

    With reviewed=True, records the current SKILL.md fingerprints in
    explainer-graph.json, but only when nothing else needs attention.
    """
    source = json.loads(GRAPH.read_text(encoding="utf-8"))
    graph = copy.deepcopy(source)
    known = graph.pop("sources", {})
    found = find_skills(skills_dir)
    tabs = tab_skills(graph)
    notes = [f"skills in {skills_dir}: " + (", ".join(
        n + ("" if s["state"] == "active" else " (off)") for n, s in found.items()) or "none")]
    problems, changed = [], []

    for skill, sid in tabs.items():
        info = found.get(skill)
        if info is None:
            problems.append(f"{skill}: not found in {skills_dir}. Install it (a tab is only dropped when the "
                            f"skill's SKILL.md is renamed to {OFF_NAMES[0]}, .deactivated or .inactive).")
        elif info["state"] == "off":
            drop_tab(graph, skill, sid)
            notes.append(f"dropped the /{skill} tab: {skill} is deactivated ({info['off_file']})")
        elif known.get(skill) != fingerprint(info["text"]):
            changed.append(skill)

    for skill, info in found.items():
        if info["state"] == "active" and skill != SELF and skill not in tabs:
            problems.append(f"{skill}: no tab for /{skill} in assets/explainer-graph.json. Add a scenario "
                            f'labelled "/{skill}" (and its block), drafted from its SKILL.md, then run --build again.')

    versions = {n: version_of(s["text"]) for n, s in found.items() if s["state"] == "active"}
    if len(set(versions.values())) > 1:
        common = max(set(versions.values()), key=list(versions.values()).count)
        odd = ", ".join(f"{n} {v}" for n, v in versions.items() if v != common)
        problems.append(f"the scrolls skills' versions differ (they move in lockstep): {odd}; the others are {common}.")
    version = next(iter(set(versions.values())), None) or "unknown"

    if changed and not reviewed:
        problems.append("SKILL.md changed since the page was last reviewed: " + ", ".join(changed) + ". "
                        "Check that each one's tab still says what the skill does (edit "
                        "assets/explainer-graph.json if not), then run --build --reviewed.")
    if problems:
        raise NeedsAttention("\n".join("- " + p for p in problems))

    if reviewed:
        fresh = {n: fingerprint(found[n]["text"]) for n in tabs if found.get(n, {}).get("state") == "active"}
        if fresh != known:
            source["sources"] = dict(sorted(fresh.items()))
            GRAPH.write_text(json.dumps(source, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            notes.append("recorded the reviewed SKILL.md fingerprints in assets/explainer-graph.json")

    graph["eyebrow"] = graph["eyebrow"].replace("{version}", version)
    return graph, version, notes


def render(graph: dict, version: str) -> str:
    script = renderer()
    with tempfile.TemporaryDirectory() as tmp:
        src, out = Path(tmp) / "graph.json", Path(tmp) / "page.html"
        src.write_text(json.dumps(graph, ensure_ascii=False), encoding="utf-8")
        cmd = [sys.executable, str(script), str(src), "--theme", "dark-grid", "--routing", "orthogonal",
               "--mode", "simulated", "--scenarios", ",".join(k for k in graph["scenarios"] if k != "all"),
               "--output", str(out)]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise NeedsAttention("- the page source does not render: " + (result.stderr or result.stdout).strip())
        page = out.read_text(encoding="utf-8")
    return enhance(page, version)


def build(skills_dir: Path | None = None, reviewed: bool = False, check: bool = False) -> int:
    """Print what happens and return an exit code (see the module docstring)."""
    skills_dir = skills_dir or SKILL_DIR.parent
    try:
        graph, version, notes = plan(skills_dir, reviewed=reviewed and not check)
        page = render(graph, version)
    except (NeedsAttention, RendererMissing) as e:
        print(f"explain --build: stopped, nothing written.\n{e}", file=sys.stderr)
        return e.code
    for n in notes:
        print(n)
    current = PAGE.read_text(encoding="utf-8") if PAGE.is_file() else None
    if current == page:
        print(f"unchanged: {PAGE} already matches the skills (scrolls {version})")
        return 0
    if check:
        print(f"stale: {PAGE} differs from a fresh build; run: bash scripts/explain.sh --build", file=sys.stderr)
        return 1
    PAGE.parent.mkdir(parents=True, exist_ok=True)
    PAGE.write_text(page, encoding="utf-8", newline="\n")
    print(f"wrote {PAGE} (scrolls {version})")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="Rebuild assets/scrolls-explainer.html from the scrolls-* skills.")
    ap.add_argument("--check", action="store_true", help="only report whether the page is current")
    ap.add_argument("--reviewed", action="store_true", help="record the current SKILL.md fingerprints")
    ap.add_argument("--skills-dir", type=Path, help="where the scrolls-* skills are (default: next to this skill)")
    args = ap.parse_args()
    return build(args.skills_dir, reviewed=args.reviewed, check=args.check)


if __name__ == "__main__":
    sys.exit(main())
