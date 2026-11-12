#!/usr/bin/env python3
"""Map the files under review to languages and the reference files to read for each.

Usage:
    detect_languages.py [--json] PATH...        classify the given paths
    detect_languages.py [--json] -              read paths from stdin, one per line
    detect_languages.py [--json] --base REF     files changed against REF (git), plus untracked files

Standard library only. Exit codes: 0 ok, 1 git failed, 2 usage error.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import PurePosixPath

REFERENCE_FILES = ("REVIEW.md", "PATTERNS.md", "TOOLING.md")

# language -> file extensions (lower case). `.d.ts` needs no entry: its suffix is `.ts`.
LANGUAGES = {
    "python": (".py", ".pyi"),
    "javascript": (".js", ".mjs", ".cjs", ".jsx"),
    "typescript": (".ts", ".tsx", ".mts", ".cts"),
    "rust": (".rs",),
    "shellscript": (".sh", ".bash", ".zsh", ".ksh"),
    "powershell-script": (".ps1", ".psm1", ".psd1"),
    "sql": (".sql",),
}
_BY_EXTENSION = {ext: lang for lang, exts in LANGUAGES.items() for ext in exts}

# TypeScript is JavaScript at run time, so its review also needs the JavaScript checklist.
_EXTRA_REFERENCES = {"typescript": ("references/review_javascript/REVIEW.md",)}

# Interpreter named on a `#!` line -> language, for files without a known extension.
_INTERPRETERS = (
    (re.compile(r"^(ba|z|k|da|a)?sh$"), "shellscript"),
    (re.compile(r"^python[\d.]*$"), "python"),
    (re.compile(r"^(node|nodejs)$"), "javascript"),
    (re.compile(r"^(pwsh|powershell)$"), "powershell-script"),
)

# Folders whose contents are vendored, built or cached: reviewing them wastes the reader's attention.
_SKIPPED_DIRS = {
    "node_modules", "vendor", "third_party", "dist", "build", "target", "out",
    ".venv", "venv", "__pycache__", ".tox", ".mypy_cache", ".ruff_cache", ".git",
}
_SKIPPED_NAMES = re.compile(r"(\.min\.(js|mjs|cjs)|_pb2(_grpc)?\.pyi?|\.generated\.\w+|\.gen\.\w+)$")


def _normalise(path: str) -> str:
    return path.strip().replace("\\", "/")


def reference_dir(language: str) -> str:
    return f"references/review_{language}"


def references_for(language: str) -> list[str]:
    own = [f"{reference_dir(language)}/{name}" for name in REFERENCE_FILES]
    return own + list(_EXTRA_REFERENCES.get(language, ()))


def is_skipped(path: str) -> bool:
    """True for vendored, generated or cached files."""
    posix = PurePosixPath(_normalise(path))
    return any(part in _SKIPPED_DIRS for part in posix.parts[:-1]) or bool(_SKIPPED_NAMES.search(posix.name))


def _language_from_shebang(path: str) -> str | None:
    try:
        with open(path, "rb") as handle:
            first = handle.readline(256)
    except OSError:
        return None
    if not first.startswith(b"#!"):
        return None
    try:
        words = first[2:].decode("utf-8").split()
    except UnicodeDecodeError:
        return None
    if not words:
        return None
    interpreter = PurePosixPath(words[0]).name
    if interpreter == "env":
        # `env -S deno run` and friends name a program this script doesn't know; don't guess.
        rest = [w for w in words[1:] if not w.startswith("-")]
        if not rest or len(rest) != len(words) - 1:
            return None
        interpreter = PurePosixPath(rest[0]).name
    for pattern, language in _INTERPRETERS:
        if pattern.match(interpreter):
            return language
    return None


def language_of(path: str) -> str | None:
    """The language of one file: by extension, else by its `#!` line; None if unsupported."""
    suffix = PurePosixPath(_normalise(path)).suffix.lower()
    if suffix in _BY_EXTENSION:
        return _BY_EXTENSION[suffix]
    if suffix:
        return None
    return _language_from_shebang(path)


def classify(paths: list[str]) -> dict:
    """Group paths by language. Skipped and unsupported files stay listed so nothing vanishes silently."""
    by_language: dict[str, set[str]] = {}
    skipped: set[str] = set()
    unsupported: set[str] = set()
    for raw in paths:
        path = _normalise(raw)
        if not path:
            continue
        if is_skipped(path):
            skipped.add(path)
            continue
        language = language_of(path)
        if language is None:
            unsupported.add(path)
        else:
            by_language.setdefault(language, set()).add(path)
    return {
        "languages": {
            language: {
                "files": sorted(files),
                "references": references_for(language),
            }
            for language, files in sorted(by_language.items())
        },
        "skipped": sorted(skipped),
        "unsupported": sorted(unsupported),
    }


def _git_lines(*args: str) -> list[str]:
    result = subprocess.run(["git", *args], capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
    return [line for line in result.stdout.splitlines() if line]


def changed_files(base: str) -> list[str]:
    """Files added, copied, modified or renamed since the merge base with <base>, plus untracked files."""
    changed = _git_lines("diff", "--name-only", "--diff-filter=ACMR", "--merge-base", base)
    untracked = _git_lines("ls-files", "--others", "--exclude-standard")
    return changed + untracked


def render_text(report: dict) -> str:
    lines = []
    for language, entry in report["languages"].items():
        count = len(entry["files"])
        lines.append(f"{language} ({count} file{'' if count == 1 else 's'})")
        lines.append("  read: " + ", ".join(entry["references"]))
        lines.extend(f"  - {path}" for path in entry["files"])
    for key in ("skipped", "unsupported"):
        if report[key]:
            lines.append(f"{key} ({len(report[key])}): " + ", ".join(report[key]))
    if not report["languages"]:
        lines.insert(0, "no files in a supported language")
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("paths", nargs="*", help="files to classify, or - to read paths from stdin")
    parser.add_argument("--base", help="git ref to diff against (e.g. origin/main)")
    parser.add_argument("--json", action="store_true", help="print JSON instead of text")
    args = parser.parse_args(argv)

    paths = [p for p in args.paths if p != "-"]
    if "-" in args.paths:
        paths += sys.stdin.read().splitlines()
    if args.base:
        try:
            paths += changed_files(args.base)
        except RuntimeError as error:
            print(f"detect_languages: {error}", file=sys.stderr)
            return 1
    elif not args.paths:
        print("detect_languages: give file paths, - for stdin, or --base REF", file=sys.stderr)
        return 2

    report = classify(paths)
    sys.stdout.write(json.dumps(report, indent=2) + "\n" if args.json else render_text(report))
    return 0


if __name__ == "__main__":
    sys.exit(main())
