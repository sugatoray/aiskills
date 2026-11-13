#!/usr/bin/env python3
"""Map the files under review to languages and the reference files to read for each.

Usage:
    detect_languages.py PATH...            classify the given paths
    detect_languages.py -                  read paths from stdin, one per line
    detect_languages.py --base REF         files changed against REF (git), plus untracked files
    detect_languages.py -p PATH [-r]       a file, or the files in a folder (-r: and below it)
    detect_languages.py --local [-r]       the files in the current folder (-r: and below it)
    detect_languages.py -t                 every tracked file, from the repository's top level

Options: -l/--lang py,js,... keep only these languages (alone, or omitted: all);
         -s/--security list the security references only; --json print JSON.

json, toml, xml and yaml are marked tool-first: check_formats.py, beside this script, checks them.

Standard library only. Exit codes: 0 ok, 1 git failed, 2 usage error.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path, PurePosixPath

REFERENCE_FILES = ("REVIEW.md", "PATTERNS.md", "TOOLING.md", "SECURITY.md", "WISDOM.md")
SECURITY_FILES = ("SECURITY.md", "WISDOM.md")

# language -> file extensions (lower case). `.d.ts` needs no entry: its suffix is `.ts`.
LANGUAGES = {
    "python": (".py", ".pyi"),
    "javascript": (".js", ".mjs", ".cjs", ".jsx"),
    "typescript": (".ts", ".tsx", ".mts", ".cts"),
    "rust": (".rs",),
    "shellscript": (".sh", ".bash", ".zsh", ".ksh"),
    "powershell-script": (".ps1", ".psm1", ".psd1"),
    "sql": (".sql",),
    "html": (".html", ".htm"),
    "xml": (".xml", ".xsd", ".xsl", ".xslt"),
    "css": (".css", ".scss", ".less"),
    "markdown": (".md", ".markdown"),
    "json": (".json", ".jsonc", ".json5"),
    "yaml": (".yaml", ".yml"),
    "toml": (".toml",),
}

# Formats that a parser, formatter or schema validator judges better and more cheaply than a
# reader: run the checks in TOOLING.md (or scripts/check_formats.py) first, then read for what
# no tool decides. The reading list is unchanged.
TOOL_FIRST = ("json", "toml", "xml", "yaml")

# Short names accepted by --lang, beside the keys of LANGUAGES.
ALIASES = {
    "py": "python", "js": "javascript", "ts": "typescript", "rs": "rust",
    "sh": "shellscript", "ps1": "powershell-script", "md": "markdown", "yml": "yaml",
}
_BY_EXTENSION = {ext: lang for lang, exts in LANGUAGES.items() for ext in exts}

# TypeScript is JavaScript at run time, so its review also needs the JavaScript checklist.
_EXTRA_REFERENCES = {"typescript": ("references/review_javascript/REVIEW.md",)}
_EXTRA_SECURITY_REFERENCES = {"typescript": ("references/review_javascript/SECURITY.md",)}

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
_SKIPPED_NAMES = re.compile(
    r"(\.min\.(js|mjs|cjs|css)|_pb2(_grpc)?\.pyi?|\.generated\.\w+|\.gen\.\w+"
    # Lock files are written by a package manager: review the manifest that produced them.
    r"|\.lock|[-.]lock\.(json|ya?ml|toml)|^npm-shrinkwrap\.json)$"
)


# Text output names at most this many skipped, filtered or unsupported files per line; --json names all.
TEXT_LIST_LIMIT = 20


class UsageError(Exception):
    """The command line named nothing to review."""


def _normalise(path: str) -> str:
    return path.strip().replace("\\", "/")


def reference_dir(language: str) -> str:
    return f"references/review_{language}"


def references_for(language: str, security: bool = False) -> list[str]:
    names, extra = (SECURITY_FILES, _EXTRA_SECURITY_REFERENCES) if security else (REFERENCE_FILES, _EXTRA_REFERENCES)
    own = [f"{reference_dir(language)}/{name}" for name in names]
    return own + list(extra.get(language, ()))


def parse_langs(text: str | None) -> list[str]:
    """Language keys for a --lang value such as "py,js,sql". None or "" means every language."""
    if not text or not text.strip():
        return sorted(LANGUAGES)
    chosen = set()
    for raw in text.split(","):
        name = raw.strip().lower()
        if not name:
            continue
        key = ALIASES.get(name, name)
        if key not in LANGUAGES:
            valid = ", ".join(sorted(set(LANGUAGES) | set(ALIASES)))
            raise ValueError(f"unknown language {raw.strip()!r}; use one of: {valid}")
        chosen.add(key)
    return sorted(chosen) or sorted(LANGUAGES)


def is_skipped(path: str) -> bool:
    """True for vendored, generated or cached files, and for a skipped folder named as `dir/`."""
    normal = _normalise(path)
    posix = PurePosixPath(normal)
    if normal.endswith("/"):
        return any(part in _SKIPPED_DIRS for part in posix.parts)
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


def classify(paths: list[str], langs: list[str] | None = None, security: bool = False) -> dict:
    """Group paths by language. Skipped, filtered and unsupported files stay listed so nothing vanishes silently."""
    wanted = set(langs) if langs is not None else set(LANGUAGES)
    by_language: dict[str, set[str]] = {}
    skipped: set[str] = set()
    filtered: set[str] = set()
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
        elif language not in wanted:
            filtered.add(path)
        else:
            by_language.setdefault(language, set()).add(path)
    return {
        "mode": "security" if security else "full",
        "languages": {
            language: {
                "files": sorted(files),
                "tool_first": language in TOOL_FIRST,
                "references": references_for(language, security),
            }
            for language, files in sorted(by_language.items())
        },
        "skipped": sorted(skipped),
        "filtered": sorted(filtered),
        "unsupported": sorted(unsupported),
    }


def _git_lines(*args: str) -> list[str]:
    result = subprocess.run(["git", *args], capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
    return [line for line in result.stdout.splitlines() if line]


def _repo_top(flag: str) -> str:
    try:
        return _git_lines("rev-parse", "--show-toplevel")[0]
    except (RuntimeError, IndexError):
        raise RuntimeError(f"{flag}: not inside a git repository") from None


def _from_here(top: str, paths: list[str]) -> list[str]:
    """Git names files from the repository's top level; name them from the current folder, so they open as printed."""
    return [_normalise(os.path.relpath(os.path.join(top, path))) for path in paths]


def changed_files(base: str) -> list[str]:
    """Files added, copied, modified or renamed since the merge base with <base>, plus untracked files."""
    top = _repo_top("--base")
    changed = _git_lines("-C", top, "diff", "--name-only", "--diff-filter=ACMR", "--merge-base", base)
    untracked = _git_lines("-C", top, "ls-files", "--others", "--exclude-standard")
    return _from_here(top, changed + untracked)


def repo_files() -> list[str]:
    """Every tracked file in the repository, named from the current folder."""
    top = _repo_top("--reporoot")
    return _from_here(top, _git_lines("-C", top, "ls-files"))


def _git_folder_listing(root: Path) -> list[str] | None:
    """Files under <root> that git tracks or would track (ignored files left out), relative to <root>.

    None when <root> is not in a git checkout.
    """
    try:
        listed = _git_lines("-C", str(root), "ls-files", "--cached", "--others", "--exclude-standard", "--", ".")
    except (RuntimeError, OSError):
        return None
    return [name for name in listed if (root / name).is_file()]


def _walk_listing(root: Path, recurse: bool) -> list[str]:
    """Files under <root>, relative to it. Skipped folders are not entered; each is listed once as `dir/`."""
    names = []
    for here, dirs, files in os.walk(root):
        rel = Path(here).relative_to(root)
        kept = []
        for name in sorted(dirs):
            if name in _SKIPPED_DIRS:
                names.append((rel / name).as_posix() + "/")
            elif name != ".git":
                kept.append(name)
        dirs[:] = kept if recurse else []
        names += [(rel / name).as_posix() for name in files]
    return names


def _collapse_skipped_folders(names: list[str]) -> list[str]:
    """Name each skipped folder once (`node_modules/`) instead of every file in it."""
    out = set()
    for name in names:
        parts = PurePosixPath(name).parts
        cut = next((i for i, part in enumerate(parts[:-1]) if part in _SKIPPED_DIRS), None)
        out.add(name if cut is None else "/".join(parts[:cut + 1]) + "/")
    return sorted(out)


def folder_files(folder: str, recurse: bool) -> list[str]:
    """The files in <folder>, and below it when <recurse>; a file path is returned as is.

    In a git checkout, files git ignores are left out. Skipped folders (node_modules/, vendor/, ...)
    are named once, as `dir/`, not file by file. UsageError if <folder> does not exist.
    """
    root = Path(folder)
    if not root.exists():
        raise UsageError(f"{folder}: no such file or folder")
    if not root.is_dir():
        return [folder]
    listed = _git_folder_listing(root)
    if listed is None:
        names = _walk_listing(root, recurse)
    else:
        names = [n for n in listed if recurse or "/" not in n]
    prefix = PurePosixPath(_normalise(folder))
    joined = [(prefix / name).as_posix() + ("/" if name.endswith("/") else "") for name in _collapse_skipped_folders(names)]
    return [n[2:] if n.startswith("./") else n for n in joined]


def render_text(report: dict) -> str:
    lines = []
    if report["mode"] == "security":
        lines.append("security review: read only the references listed")
    for language, entry in report["languages"].items():
        count = len(entry["files"])
        note = " [tool-first: run the checks in TOOLING.md before reading]" if entry["tool_first"] else ""
        lines.append(f"{language} ({count} file{'' if count == 1 else 's'}){note}")
        lines.append("  read: " + ", ".join(entry["references"]))
        lines.extend(f"  - {path}" for path in entry["files"])
    for key in ("skipped", "filtered", "unsupported"):
        if report[key]:
            shown = ", ".join(report[key][:TEXT_LIST_LIMIT])
            more = len(report[key]) - TEXT_LIST_LIMIT
            tail = f", … and {more} more (--json lists all)" if more > 0 else ""
            lines.append(f"{key} ({len(report[key])}): {shown}{tail}")
    if not report["languages"]:
        lines.insert(0, "no files in a supported language")
    return "\n".join(lines) + "\n"


def build_parser(description: str) -> argparse.ArgumentParser:
    """The scope and language flags, shared with check_formats.py."""
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("paths", nargs="*", help="files to classify, or - to read paths from stdin")
    parser.add_argument("--base", help="git ref to diff against (e.g. origin/main)")
    parser.add_argument("-l", "--lang", nargs="?", const="", default=None,
                        help="comma-separated languages to keep (py,js,ts,sh,ps1,html,sql,xml,css,rs,md,"
                             "json,yaml,toml); alone or omitted: all")
    parser.add_argument("-s", "--security", action="store_true", help="list the security references only")
    scope = parser.add_mutually_exclusive_group()
    scope.add_argument("-p", "--path", action="append", help="a file or folder to review (repeatable)")
    scope.add_argument("-t", "--reporoot", action="store_true", help="every tracked file in the repository")
    scope.add_argument("--local", action="store_true", help="the current folder")
    parser.add_argument("-r", "--recurse", action="store_true", help="with -p or --local: include subfolders")
    parser.add_argument("--json", action="store_true", help="print JSON instead of text")
    return parser


def collect_paths(args: argparse.Namespace) -> list[str]:
    """The paths the parsed flags name. UsageError if they name nothing; RuntimeError if git fails."""
    if not (args.paths or args.base or args.reporoot or args.path or args.local):
        raise UsageError("give file paths, - for stdin, --base REF, -p PATH, --local or -t")
    paths = [p for p in args.paths if p != "-"]
    if "-" in args.paths:
        paths += sys.stdin.read().splitlines()
    if args.base:
        paths += changed_files(args.base)
    if args.reporoot:
        paths += repo_files()
    for folder in args.path or []:
        paths += folder_files(folder, args.recurse)
    if args.local:
        paths += folder_files(".", args.recurse)
    return paths


def main(argv: list[str] | None = None) -> int:
    args = build_parser(__doc__.splitlines()[0]).parse_args(argv)
    try:
        langs = parse_langs(args.lang)
        paths = collect_paths(args)
    except (ValueError, UsageError) as error:
        print(f"detect_languages: {error}", file=sys.stderr)
        return 2
    except RuntimeError as error:
        print(f"detect_languages: {error}", file=sys.stderr)
        return 1

    report = classify(paths, langs=langs, security=args.security)
    sys.stdout.write(json.dumps(report, indent=2) + "\n" if args.json else render_text(report))
    return 0


if __name__ == "__main__":
    sys.exit(main())
