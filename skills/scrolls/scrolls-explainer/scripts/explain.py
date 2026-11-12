#!/usr/bin/env python3
"""Write the scrolls explainer page: an interactive, offline HTML page that
shows how the scrolls-* skills work, one animated tab per command.

The page itself is prebuilt and ships with this skill as
assets/scrolls-explainer.html; this script only copies it to where the
user wants it (and can open it). explain.sh and explain.ps1 are thin
launchers that locate a Python interpreter and pass every argument
through unchanged, so the two platforms can never drift apart.

Stdlib only, Python 3.9+.

Usage:
  explain.py [-o PATH] [-f] [--open]
  explain.py --version | -h

  -o, --output PATH   Where to write the page. A file path is used as is; an
                      existing folder, or a path ending in a slash, gets
                      scrolls-explainer.html inside it. Missing folders are
                      created. Default: ./scrolls-explainer.html
  -f, --force         Overwrite a different file that is already there.
      --open          Also open the page in the default web browser.
      --version       Print the version of the page and exit.
  -h, --help          Print this help and exit.

Exit codes: 0 written (or already up to date), 1 the bundled page is
missing or the file could not be written, 2 usage error, 3 refused: a
different file is already there and -f was not given.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
import webbrowser
from pathlib import Path

DEFAULT_NAME = "scrolls-explainer.html"
SKILL_DIR = Path(__file__).resolve().parent.parent
PAGE = SKILL_DIR / "assets" / DEFAULT_NAME
VERSION_RE = re.compile(r'<meta name="scrolls-explainer-version" content="([^"]+)">')


class Parser(argparse.ArgumentParser):
    def error(self, message: str) -> None:  # exit 2 with a short hint, like the rest of the family
        sys.stderr.write(f"explain: {message}\nRun with -h for usage.\n")
        sys.exit(2)


def page_version(data: bytes) -> str:
    m = VERSION_RE.search(data.decode("utf-8", "replace"))
    return m.group(1) if m else "unknown"


def resolve_target(output: str | None) -> Path:
    if not output:
        return Path.cwd() / DEFAULT_NAME
    p = Path(output).expanduser()
    if output.endswith(("/", os.sep)) or p.is_dir():
        p = p / DEFAULT_NAME
    if not p.is_absolute():
        p = Path.cwd() / p
    return p


def main(argv: list[str] | None = None) -> int:
    ap = Parser(prog="explain", add_help=False, usage="explain [-o PATH] [-f] [--open] | --version | -h")
    ap.add_argument("-o", "--output")
    ap.add_argument("-f", "--force", action="store_true")
    ap.add_argument("--open", action="store_true")
    ap.add_argument("--version", action="store_true")
    ap.add_argument("-h", "--help", action="store_true")
    args = ap.parse_args(argv)

    if args.help:
        print(__doc__.split("Usage:", 1)[1].split("Exit codes:", 1)[0].strip("\n").replace("explain.py", "explain"))
        return 0

    try:
        data = PAGE.read_bytes()
    except OSError:
        sys.stderr.write(f"explain: the bundled page is missing: {PAGE}\nReinstall the scrolls-explainer skill.\n")
        return 1
    version = page_version(data)

    if args.version:
        print(f"scrolls-explainer {version}")
        return 0

    target = resolve_target(args.output)
    shown = os.path.abspath(target)
    url = target.resolve().as_uri() if target.exists() else Path(shown).as_uri()

    if target.exists():
        if target.is_dir():
            sys.stderr.write(f"explain: {shown} is a folder; pass a file path or the folder with a trailing slash.\n")
            return 2
        if target.read_bytes() == data:
            print(f"scrolls-explainer {version}: {shown} is already up to date")
            print(f"open: {url}")
            return _maybe_open(args.open, url)
        if not args.force:
            sys.stderr.write(
                f"explain: {shown} already exists and is different; pass -f to overwrite it, or -o to write elsewhere.\n")
            return 3

    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    except OSError as e:
        sys.stderr.write(f"explain: could not write {shown}: {e.strerror or e}\n")
        return 1
    url = target.resolve().as_uri()
    print(f"scrolls-explainer {version}: wrote {shown}")
    print(f"open: {url}")
    return _maybe_open(args.open, url)


def _maybe_open(wanted: bool, url: str) -> int:
    if wanted:
        try:
            opened = webbrowser.open(url)
        except Exception:  # noqa: BLE001 - any browser failure is only a notice
            opened = False
        if not opened:
            print("could not open a browser here; open it by hand with the URL above.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
