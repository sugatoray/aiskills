#!/usr/bin/env python3
"""Syntax-check the tool-first formats (json, toml, xml, yaml) and list the linters on PATH.

Usage: the same scope and language flags as detect_languages.py, which sits beside this script:
    check_formats.py PATH... | - | --base REF | -p PATH [-r] | --local [-r] | -t   [-l LANGS] [--json]

It parses; it does not format, lint or validate against a schema. Those need the tools it lists
(see each language's TOOLING.md). It installs nothing and runs no external program.

    json   Python's json module; a duplicate key, NaN and Infinity are errors. Files that allow
           comments (.jsonc, .json5, tsconfig*.json, .vscode/*.json, ...) are left to the
           project's tool.
    toml   tomllib, where Python has it (3.11 and later).
    xml    expat, for well-formedness. A document that declares entities is reported and not
           expanded; external entities are never fetched.
    yaml   PyYAML's composer, if PyYAML is importable (the standard library has none); a key
           repeated in one mapping is an error. Nothing is constructed and aliases are not expanded.

Standard library only. Exit codes: 0 no errors, 1 a file failed (or git failed), 2 usage error.
"""

from __future__ import annotations

import json
import re
import shutil
import sys
import xml.parsers.expat
from pathlib import Path, PurePosixPath

sys.path.insert(0, str(Path(__file__).resolve().parent))
import detect_languages as dl  # noqa: E402

try:
    import tomllib as _tomllib
except ImportError:  # Python 3.10 and earlier
    _tomllib = None
try:
    import yaml as _yaml
except ImportError:
    _yaml = None

TOOLS = ("xmllint", "xsltproc", "jq", "yamllint", "actionlint", "taplo", "prettier", "check-jsonschema")

# JSON files whose readers accept comments and trailing commas.
_JSON_WITH_COMMENTS = re.compile(r"(\.jsonc|\.json5|^[tj]sconfig(\..+)?\.json|^devcontainer\.json|^\.eslintrc\.json)$")
_JSON_WITH_COMMENTS_DIRS = {".vscode", ".devcontainer"}


class _Unchecked(Exception):
    """The file could not be judged here; the message says why and what to use instead."""


def _allows_comments(path: str) -> bool:
    posix = PurePosixPath(path.replace("\\", "/"))
    return bool(_JSON_WITH_COMMENTS.search(posix.name)) or bool(_JSON_WITH_COMMENTS_DIRS & set(posix.parts[:-1]))


def _text(data: bytes) -> str:
    try:
        return data.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise ValueError(f"not UTF-8 (byte {error.start})") from None


def _check_json(path: str, data: bytes) -> str:
    duplicates: list[str] = []

    def not_json(literal):
        raise ValueError(f"{literal} is not JSON; Python accepts it, JSON.parse and most parsers do not")

    def pairs(items):
        seen = set()
        for key, _ in items:
            if key in seen and key not in duplicates:
                duplicates.append(key)
            seen.add(key)
        return dict(items)

    try:
        json.loads(_text(data), object_pairs_hook=pairs, parse_constant=not_json)
    except json.JSONDecodeError as error:
        if _allows_comments(path):
            raise _Unchecked("not strict JSON; this file type allows comments and trailing commas, "
                             "so check it with the tool that reads it") from None
        raise ValueError(f"{error.msg} (line {error.lineno}, column {error.colno})") from None
    if duplicates:
        raise ValueError("duplicate key: " + ", ".join(repr(key) for key in duplicates))
    if data.startswith(b"\xef\xbb\xbf"):
        return "starts with a UTF-8 byte-order mark, which JSON.parse and Python's json.load reject"
    return ""


def _check_toml(path: str, data: bytes) -> str:
    if _tomllib is None:
        raise _Unchecked("no TOML parser: tomllib needs Python 3.11 or later; use taplo or the tool that reads the file")
    try:
        _tomllib.loads(_text(data))
    except _tomllib.TOMLDecodeError as error:
        raise ValueError(str(error)) from None
    return ""


def _check_xml(path: str, data: bytes) -> str:
    parser = xml.parsers.expat.ParserCreate()

    def entity_declared(*_):
        raise _Unchecked("declares entities in a DTD; not expanded here. Check it with "
                         "`xmllint --noout --nonet`, and read review_xml/SECURITY.md")

    parser.EntityDeclHandler = entity_declared
    try:
        # Bytes, not text: the XML declaration names the encoding, and expat honours it.
        parser.Parse(data, True)
    except xml.parsers.expat.ExpatError as error:
        reason = xml.parsers.expat.ErrorString(error.code)
        raise ValueError(f"{reason} (line {error.lineno}, column {error.offset + 1})") from None
    return ""


def _check_yaml(path: str, data: bytes) -> str:
    if _yaml is None:
        raise _Unchecked("no YAML parser in the standard library and PyYAML is not installed; "
                         "use yamllint or the tool that reads the file")
    try:
        # Nodes only: nothing is constructed, so tags are never acted on, and each node is visited
        # once, so aliases are never expanded.
        duplicates = [found for document in _yaml.compose_all(_text(data), Loader=_yaml.SafeLoader)
                      for found in _duplicate_keys(document)]
    except _yaml.YAMLError as error:
        raise ValueError(" ".join(str(error).split())) from None
    if duplicates:
        raise ValueError("duplicate key: " + ", ".join(f"{key!r} (line {line})" for key, line in duplicates))
    return ""


def _duplicate_keys(root) -> list[tuple[str, int]]:
    """(key, line) for each key repeated within one mapping. YAML forbids it; PyYAML keeps the last."""
    found: list[tuple[str, int]] = []
    seen: set[int] = set()
    stack = [root]
    while stack:
        node = stack.pop()
        if node is None or id(node) in seen:
            continue
        seen.add(id(node))
        if isinstance(node, _yaml.MappingNode):
            keys: set[str] = set()
            for key, value in node.value:
                if isinstance(key, _yaml.ScalarNode) and key.value != "<<":  # `<<` is a merge, not a key
                    if key.value in keys:
                        found.append((key.value, key.start_mark.line + 1))
                    keys.add(key.value)
                stack += [key, value]
        elif isinstance(node, _yaml.SequenceNode):
            stack += node.value
    return sorted(found, key=lambda item: item[1])


_CHECKERS = {
    "json": ("python json", _check_json),
    "toml": ("python tomllib", _check_toml),
    "xml": ("python expat", _check_xml),
    "yaml": ("python yaml (PyYAML)", _check_yaml),
}


def check_file(path: str) -> dict:
    """One file's result: status is ok, error or unchecked."""
    language = dl.language_of(path)
    name, checker = _CHECKERS[language]
    result = {"path": path, "language": language, "status": "ok", "checker": "", "message": ""}
    try:
        data = Path(path).read_bytes()
    except OSError as error:
        return {**result, "status": "error", "message": f"cannot read: {error.strerror or error}"}
    try:
        note = checker(path, data)
    except _Unchecked as reason:
        return {**result, "status": "unchecked", "message": str(reason)}
    except ValueError as error:
        return {**result, "status": "error", "checker": name, "message": str(error)}
    return {**result, "checker": name, "message": note}


def available_tools() -> dict:
    """Linters and validators this review can use, with their path, or None when not on PATH."""
    return {name: shutil.which(name) for name in TOOLS}


def check(paths: list[str], langs: list[str] | None = None) -> dict:
    wanted = [lang for lang in dl.TOOL_FIRST if langs is None or lang in langs]
    grouped = dl.classify(paths, langs=wanted)["languages"]
    files = [check_file(path) for entry in grouped.values() for path in entry["files"]]
    files.sort(key=lambda item: item["path"])
    counts = {status: sum(1 for item in files if item["status"] == status) for status in ("ok", "error", "unchecked")}
    return {"files": files, "counts": counts, "tools": available_tools()}


def render_text(report: dict) -> str:
    lines = []
    for item in report["files"]:
        detail = f": {item['message']}" if item["message"] else ""
        checker = f" [{item['checker']}]" if item["checker"] else ""
        lines.append(f"{item['status']:<6} {item['path']}{checker}{detail}")
    if not report["files"]:
        lines.append("no json, toml, xml or yaml files in scope")
    else:
        counts = report["counts"]
        lines.append(f"{counts['ok']} ok, {counts['error']} with errors, {counts['unchecked']} unchecked")
    found = [name for name, where in report["tools"].items() if where]
    missing = [name for name, where in report["tools"].items() if not where]
    lines.append("tools on PATH: " + (", ".join(found) or "none"))
    lines.append("not found: " + (", ".join(missing) or "none"))
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    args = dl.build_parser(__doc__.splitlines()[0]).parse_args(argv)
    try:
        langs = dl.parse_langs(args.lang)
        paths = dl.collect_paths(args)
    except (ValueError, dl.UsageError) as error:
        print(f"check_formats: {error}", file=sys.stderr)
        return 2
    except RuntimeError as error:
        print(f"check_formats: {error}", file=sys.stderr)
        return 1
    report = check(paths, langs)
    sys.stdout.write(json.dumps(report, indent=2) + "\n" if args.json else render_text(report))
    return 1 if report["counts"]["error"] else 0


if __name__ == "__main__":
    sys.exit(main())
