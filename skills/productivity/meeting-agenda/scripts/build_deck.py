#!/usr/bin/env python3
"""Build a meeting-agenda slide deck from agenda JSON.

Reads an agenda, validates it, and writes a copy of assets/meeting-agenda.html
with the agenda in its <script type="application/json" id="agenda-data"> block.
Nothing else in the template changes. Stdlib only.

Agenda JSON (a bare list of items is also accepted):

    {"title": "Team sync", "theme": "ocean",
     "items": [{"minutes": 10, "title": "Updates", "points": ["Wins", "Blockers"]}]}

Usage:
    build_deck.py agenda.json -o meeting-agenda.html [--title "..."] [--theme daylight]
    build_deck.py - -o deck.html < agenda.json      # read stdin
    build_deck.py agenda.json --check               # validate only

Exit codes: 0 ok, 2 invalid input.
"""
import argparse
import json
import math
import pathlib
import re
import sys

TEMPLATE = pathlib.Path(__file__).resolve().parent.parent / "assets" / "meeting-agenda.html"
# Must match the THEMES list in assets/meeting-agenda.html (a test checks this).
THEMES = ("indigo", "midnight", "ocean", "daylight", "contrast")
BLOCK = re.compile(r'(<script type="application/json" id="agenda-data">)(.*?)(</script>)', re.S)


class AgendaError(ValueError):
    pass


def normalize(raw):
    """Return {"title", "items"} or raise AgendaError naming the first problem."""
    data = {"items": raw} if isinstance(raw, list) else raw
    if not isinstance(data, dict) or not isinstance(data.get("items"), list):
        raise AgendaError('agenda must be an object with an "items" list (or a bare list of items)')
    if not data["items"]:
        raise AgendaError("agenda needs at least one item")
    title = data.get("title", "")
    if not isinstance(title, str):
        raise AgendaError("title must be a string")
    theme = data.get("theme")
    if theme is not None and theme not in THEMES:
        raise AgendaError("theme must be one of: " + ", ".join(THEMES))
    items = []
    for n, it in enumerate(data["items"], 1):
        if not isinstance(it, dict):
            raise AgendaError(f"item {n}: must be an object")
        m = it.get("minutes")
        if isinstance(m, bool) or not isinstance(m, (int, float)) or not math.isfinite(m):
            raise AgendaError(f"item {n}: minutes must be a number")
        if m <= 0:
            raise AgendaError(f"item {n}: minutes must be greater than 0")
        t = it.get("title")
        if not isinstance(t, str) or not t.strip():
            raise AgendaError(f"item {n}: title is required")
        pts = it.get("points", [])
        if not isinstance(pts, list) or not all(isinstance(p, str) for p in pts):
            raise AgendaError(f"item {n}: points must be a list of strings")
        items.append({"minutes": m, "title": t.strip(), "points": [p.strip() for p in pts if p.strip()]})
    out = {"title": title.strip(), "items": items}
    if theme is not None:
        out = {"title": out["title"], "theme": theme, "items": items}
    return out


def embed(template_html, agenda):
    """Put the agenda into the template's data block, escaping every '<'."""
    payload = "\n" + json.dumps(agenda, indent=2, ensure_ascii=False).replace("<", "\\u003c") + "\n"
    if len(BLOCK.findall(template_html)) != 1:
        raise RuntimeError("template must contain exactly one agenda-data block")
    return BLOCK.sub(lambda mo: mo.group(1) + payload + mo.group(3), template_html)


def summary(agenda):
    secs = round(sum(i["minutes"] for i in agenda["items"]) * 60)
    n = len(agenda["items"])
    return f"{n} item{'s' if n != 1 else ''}, {secs // 60}:{secs % 60:02d} planned"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Build a meeting-agenda slide deck from agenda JSON.")
    ap.add_argument("agenda", help="agenda JSON file, or - for stdin")
    ap.add_argument("-o", "--output", help="where to write the deck HTML")
    ap.add_argument("--title", help="meeting title (overrides the one in the JSON)")
    ap.add_argument("--theme", help="deck theme: " + ", ".join(THEMES) + " (default: indigo)")
    ap.add_argument("--check", action="store_true", help="validate only; write nothing")
    args = ap.parse_args(argv)
    if not args.check and not args.output:
        ap.error("--output is required unless --check is given")

    text = sys.stdin.read() if args.agenda == "-" else pathlib.Path(args.agenda).read_text(encoding="utf-8")
    try:
        raw = json.loads(text)
    except json.JSONDecodeError as e:
        print(f"error: agenda is not valid JSON ({e})", file=sys.stderr)
        return 2
    if args.theme is not None:
        if isinstance(raw, list):
            raw = {"items": raw}
        if isinstance(raw, dict):
            raw = {**raw, "theme": args.theme}
    try:
        agenda = normalize(raw)
    except AgendaError as e:
        print(f"error: {e}", file=sys.stderr)
        return 2
    if args.title is not None:
        agenda["title"] = args.title.strip()

    if not args.check:
        html = embed(TEMPLATE.read_text(encoding="utf-8"), agenda)
        out = pathlib.Path(args.output)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding="utf-8")
        print(f"wrote {out}: {summary(agenda)}")
    else:
        print(f"ok: {summary(agenda)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
