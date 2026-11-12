#!/usr/bin/env python3
"""Rebuild assets/scrolls-explainer.html from meta/generator/graph.json.

Development only. It renders graph.json with the network-flow skill's
renderer (skills/diagrams/network-flow in this repository, or
$NETWORK_FLOW_DIR), adds the explainer's callouts and keyboard support
(enhance.py), and stamps the page with this skill's metadata.version from
SKILL.md.

Usage:
  python3 meta/generator/build.py           # write assets/scrolls-explainer.html
  python3 meta/generator/build.py --check   # exit 1 if the bundled page is stale

Exit codes: 0 written / up to date, 1 stale (--check), 2 the renderer or a
source file is missing or invalid.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKILL_DIR = HERE.parent.parent
PAGE = SKILL_DIR / "assets" / "scrolls-explainer.html"
GRAPH = HERE / "graph.json"
SCENARIOS = "setup,session,update,hide,unhide,remove,restore,help,all"

sys.path.insert(0, str(HERE))
from enhance import enhance  # noqa: E402


def skill_version() -> str:
    text = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")
    m = re.search(r'^  version: "([^"]+)"$', text, re.M)
    if not m:
        raise ValueError("SKILL.md has no metadata.version")
    return m.group(1)


def renderer() -> Path:
    base = os.environ.get("NETWORK_FLOW_DIR")
    root = Path(base) if base else SKILL_DIR.parent.parent / "diagrams" / "network-flow"
    script = root / "scripts" / "render.py"
    if not script.is_file():
        raise FileNotFoundError(f"network-flow renderer not found at {script} (set NETWORK_FLOW_DIR)")
    return script


def build() -> str:
    version = skill_version()
    graph = json.loads(GRAPH.read_text(encoding="utf-8"))
    graph["eyebrow"] = graph["eyebrow"].replace("{version}", version)
    with tempfile.TemporaryDirectory() as tmp:
        src, out = Path(tmp) / "graph.json", Path(tmp) / "page.html"
        src.write_text(json.dumps(graph, ensure_ascii=False), encoding="utf-8")
        cmd = [sys.executable, str(renderer()), str(src), "--theme", "dark-grid", "--routing", "orthogonal",
               "--mode", "simulated", "--scenarios", SCENARIOS, "--output", str(out)]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise ValueError("render failed: " + (result.stderr or result.stdout).strip())
        page = out.read_text(encoding="utf-8")
    return enhance(page, version)


def main() -> int:
    ap = argparse.ArgumentParser(description="Rebuild assets/scrolls-explainer.html.")
    ap.add_argument("--check", action="store_true", help="only report whether the bundled page is current")
    args = ap.parse_args()
    try:
        page = build()
    except (OSError, ValueError) as e:
        print(f"build: {e}", file=sys.stderr)
        return 2
    current = PAGE.read_text(encoding="utf-8") if PAGE.is_file() else None
    if args.check:
        if current == page:
            print(f"up to date: {PAGE}")
            return 0
        print(f"stale: {PAGE} differs from a fresh build; run python3 meta/generator/build.py", file=sys.stderr)
        return 1
    if current == page:
        print(f"unchanged: {PAGE}")
        return 0
    PAGE.parent.mkdir(parents=True, exist_ok=True)
    PAGE.write_text(page, encoding="utf-8", newline="\n")
    print(f"wrote {PAGE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
