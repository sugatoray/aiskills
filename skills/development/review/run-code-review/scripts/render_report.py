#!/usr/bin/env python3
"""Render a /run-code-review report, kept as JSON, to Markdown, HTML or JSON, with links to each line.

Usage:
    render_report.py REPORT.json|-  [-o OUT ...] [-f] [--open] [--host-type github|gitlab] [--no-links]

REPORT.json follows references/report.schema.json. Run this from the project under review: file
paths in the report are named from the folder it runs in, as detect_languages.py names them.

    (no -o)          print the Markdown report
    -o FILE.html     a self-contained page: no network, the report embedded as inert JSON
    -o FILE.md       the Markdown report (references/REPORT_TEMPLATE.md)
    -o FILE.json     the report with its counts, line links and repository details added
    -o DIR, -o       DIR (or the current folder) gets run-code-review-<title>-<YYYYMMDD-HHMM>.html
    -f, --force      overwrite a different file; without it the file is kept (exit 3)
    --open           open the HTML file afterwards
    --host-type T    build GitHub or GitLab links when the remote's host name doesn't say which
    --no-links       no line links

Line links point at the reviewed commit on the remote the current branch tracks (else origin).
A link is left out where it would be wrong: the commit is not pushed, the file changed since the
commit or is untracked, or the host type is unknown. The JSON's "repo" says why.

Standard library only. Exit codes: 0 written, 2 usage error or invalid report, 3 a different file
is already there (use -f).
"""

from __future__ import annotations

import argparse
import copy
import datetime as _dt
import json
import os
import re
import subprocess
import sys
import webbrowser
from pathlib import Path
from urllib.parse import quote, urlsplit

SKILL_DIR = Path(__file__).resolve().parent.parent
TEMPLATE = SKILL_DIR / "assets" / "report-template.html"

SCHEMA_VERSION = 1
SEVERITIES = ("blocker", "major", "minor", "nit")
VERDICTS = ("Request changes", "Approve with comments", "Approve", "No verdict")
MODES = ("Full review", "Security-only review")
CONFIDENCES = ("confirmed", "likely", "to verify")
REQUIRED = ("schema_version", "title", "mode", "verdict", "reason", "summary", "scope", "findings")
FINDING_REQUIRED = ("id", "severity", "title", "file", "lines", "confidence", "problem", "impact")
HOST_TYPES = ("github", "gitlab")
FORMATS = (".html", ".md", ".json")


def skill_version() -> str:
    match = re.search(r'^\s*version:\s*"([^"]+)"', (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8"), re.M)
    return match.group(1) if match else ""


# --- remotes, host types and links ------------------------------------------------------------

def parse_remote(url: str) -> dict | None:
    """The web host and project path of a git remote URL, never its credentials."""
    url = (url or "").strip()
    scp = re.fullmatch(r"(?:[^@/]+@)?([^:/]+):(?!//)(.+)", url)  # git@host:owner/repo.git
    if scp and "://" not in url:
        host, path = scp.group(1), scp.group(2)
    else:
        parts = urlsplit(url)
        if parts.scheme not in ("http", "https", "ssh", "git", "git+ssh") or not parts.hostname:
            return None
        host = parts.hostname
        if parts.port and parts.scheme in ("http", "https"):
            host = f"{host}:{parts.port}"  # an SSH port is not the web server's
        path = parts.path
    project = re.sub(r"\.git$", "", path.strip("/"))
    if not project or "/" not in project:
        return None
    return {"host": host.lower(), "project": project}


def detect_host_type(host: str, override: str | None = None) -> str | None:
    if override:
        return override
    name = host.split(":")[0]
    for kind in HOST_TYPES:
        if name == f"{kind}.com" or kind in name.split("."):
            return kind
    return None


def line_anchor(host_type: str, lines: str) -> str:
    match = re.match(r"\s*(\d+)(?:\s*-\s*(\d+))?", str(lines or ""))
    if not match:
        return ""
    start, end = match.groups()
    if not end:
        return f"#L{start}"
    return f"#L{start}-L{end}" if host_type == "github" else f"#L{start}-{end}"


def blob_url(host_type: str, host: str, project: str, sha: str, path: str, lines: str) -> str:
    sep = "/blob/" if host_type == "github" else "/-/blob/"
    return f"https://{host}/{project}{sep}{sha}/{quote(path)}{line_anchor(host_type, lines)}"


def _git(cwd: str, *args: str) -> str | None:
    try:
        out = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, check=True)
    except (OSError, subprocess.CalledProcessError):
        return None
    return out.stdout.strip()


def repo_info(cwd: str, commit: str | None, host_type: str | None, no_links: bool) -> tuple[dict, dict]:
    """Repository details for the report, and a map of repository path -> linkable (bool)."""
    info = {"host_type": None, "host": None, "project": None, "remote": None, "commit": None,
            "links": False, "reason": ""}

    def off(reason: str) -> tuple[dict, dict]:
        info["reason"] = reason
        return info, {}

    if no_links:
        return off("line links turned off with --no-links")
    top = _git(cwd, "rev-parse", "--show-toplevel")
    if top is None:
        return off("not a git checkout")
    sha = _git(cwd, "rev-parse", "--verify", f"{commit or 'HEAD'}^{{commit}}")
    if not sha:
        return off(f"commit {commit or 'HEAD'} not found")
    info["commit"] = sha
    upstream = _git(cwd, "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}")
    remote = upstream.split("/", 1)[0] if upstream else "origin"
    url = _git(cwd, "remote", "get-url", remote)
    if not url:
        return off(f"no remote named {remote}")
    info["remote"] = remote
    parsed = parse_remote(url)
    if not parsed:
        return off(f"remote {remote} has no web address")
    info.update(parsed)
    kind = detect_host_type(parsed["host"], host_type)
    if not kind:
        return off(f"{parsed['host']} is not recognisably GitHub or GitLab; pass --host-type github or gitlab")
    info["host_type"] = kind
    if not _git(cwd, "branch", "-r", "--contains", sha, "--list", f"{remote}/*"):
        return off(f"commit {sha[:12]} is not pushed to {remote}")
    changed = set((_git(top, "diff", "--name-only", sha) or "").splitlines())
    tracked = set((_git(top, "ls-tree", "-r", "--name-only", sha) or "").splitlines())
    info["links"] = True
    return info, {p: p in tracked and p not in changed for p in tracked | changed}


def add_links(report: dict, cwd: str, host_type: str | None = None, no_links: bool = False) -> dict:
    info, linkable = repo_info(cwd, report.get("commit"), host_type, no_links)
    report["repo"] = info
    top = _git(cwd, "rev-parse", "--show-toplevel") if info["links"] else None
    for finding in report["findings"]:
        finding["url"] = None
        if not top:
            continue
        path = os.path.relpath(os.path.normpath(os.path.join(cwd, finding["file"])), top).replace(os.sep, "/")
        if linkable.get(path):
            finding["url"] = blob_url(info["host_type"], info["host"], info["project"], info["commit"],
                                      path, finding["lines"])
    return report


# --- the report's shape -----------------------------------------------------------------------

def counts(report: dict) -> dict:
    return {s: sum(1 for f in report.get("findings", []) if f.get("severity") == s) for s in SEVERITIES}


def validate(report) -> list[str]:
    if not isinstance(report, dict):
        return ["the report must be a JSON object"]
    errors = [f"missing field: {k}" for k in REQUIRED if k not in report]
    if report.get("schema_version", SCHEMA_VERSION) != SCHEMA_VERSION:
        errors.append(f"schema_version must be {SCHEMA_VERSION}")
    for key, allowed in (("verdict", VERDICTS), ("mode", MODES)):
        if key in report and report[key] not in allowed:
            errors.append(f"{key} must be one of: {', '.join(allowed)}")
    findings = report.get("findings", [])
    if not isinstance(findings, list):
        return errors + ["findings must be a list"]
    seen = set()
    for i, f in enumerate(findings, 1):
        where = f"finding {f.get('id', i) if isinstance(f, dict) else i}"
        if not isinstance(f, dict):
            errors.append(f"{where}: must be an object")
            continue
        errors += [f"{where}: missing field: {k}" for k in FINDING_REQUIRED if k not in f]
        if "severity" in f and f["severity"] not in SEVERITIES:
            errors.append(f"{where}: severity must be one of: {', '.join(SEVERITIES)}")
        if "confidence" in f and f["confidence"] not in CONFIDENCES:
            errors.append(f"{where}: confidence must be one of: {', '.join(CONFIDENCES)}")
        if f.get("id") in seen:
            errors.append(f"{where}: duplicate id {f.get('id')}")
        seen.add(f.get("id"))
    n = counts(report)
    verdict = report.get("verdict")
    if n["blocker"] and verdict not in ("Request changes", "No verdict"):
        errors.append(f"verdict {verdict} with {n['blocker']} blocker finding(s): see references/SEVERITY.md")
    elif n["major"] and verdict == "Approve":
        errors.append(f"verdict Approve with {n['major']} major finding(s): see references/SEVERITY.md")
    return errors


def prepared(report: dict) -> dict:
    """A copy with derived fields filled in: counts, ordering, generator, defaults."""
    r = copy.deepcopy(report)
    order = {s: i for i, s in enumerate(SEVERITIES)}
    r["findings"] = sorted(r["findings"], key=lambda f: order[f["severity"]])  # stable: keeps the reviewer's order
    r["counts"] = counts(r)
    r.setdefault("generated", _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC"))
    r["generator"] = f"/run-code-review {skill_version()}".strip()
    for key in ("checks", "questions", "preexisting", "works_well", "order_of_work"):
        r.setdefault(key, [])
    r.setdefault("tests", {"summary": "", "cases": []})
    for f in r["findings"]:
        f.setdefault("url", None)
    return r


# --- Markdown ---------------------------------------------------------------------------------

def _loc(f: dict) -> str:
    text = f"`{f['file']}:{f['lines']}`"
    return f"[{text}]({f['url']})" if f.get("url") else text


def _cell(text: str) -> str:
    return str(text).replace("|", "\\|").replace("\n", " ")


def render_markdown(report: dict) -> str:
    r = prepared(report)
    n = r["counts"]
    out = [f"# Code review: {r['title']}", "",
           f"**Verdict: {r['verdict']}** — {r['reason']}", "", r["summary"], "",
           "| Severity | Count |", "| --- | --- |"]
    out += [f"| {s.capitalize()} | {n[s]} |" for s in SEVERITIES]
    scope = r["scope"]
    checks = "; ".join(f"`{c['command']}`{' ' + c['version'] if c.get('version') else ''} — {c['result']}"
                       for c in r["checks"]) or "none"
    out += ["", "## Scope and method", "", f"- **Mode:** {r['mode']}",
            f"- **Reviewed:** {scope.get('reviewed', '')}", f"- **Languages:** {scope.get('languages', '')}",
            f"- **Checks run:** {checks}", f"- **Not run / not reviewed:** {scope.get('not_run') or 'nothing'}"]
    main = [f for f in r["findings"] if f["severity"] != "nit"]
    nits = [f for f in r["findings"] if f["severity"] == "nit"]
    out += ["", "## Findings", ""]
    if main:
        out += ["| # | Severity | Where | Finding |", "| --- | --- | --- | --- |"]
        out += [f"| {f['id']} | {f['severity'].capitalize()} | {_loc(f)} | {_cell(f['title'])} |" for f in main]
    else:
        out.append("No findings above nit.")
    for f in main:
        where = _loc(f) + (f" (`{f['symbol']}`)" if f.get("symbol") else "")
        conf = f["confidence"] + (f" — {f['confidence_note']}" if f.get("confidence_note") else "")
        out += ["", f"### {f['id']}. {f['title']} — {f['severity'].capitalize()}", "",
                f"- **Where:** {where}", f"- **Confidence:** {conf}",
                f"- **Problem:** {f['problem']}", f"- **Impact:** {f['impact']}"]
        s = f.get("suggestion") or {}
        if s.get("diff"):
            out += ["- **Suggested change:**", "", "  ```diff"] + [f"  {l}" for l in s["diff"].splitlines()] + ["  ```"]
        elif s.get("text"):
            out += [f"- **Suggested change:** {s['text']}"]
        if s.get("note"):
            out += ["", f"  {s['note']}"]
    if nits:
        out += ["", "## Nits", ""] + [f"- {_loc(f)} — {f['title']}" for f in nits]
    if r["questions"]:
        out += ["", "## Questions", ""] + [f"- `{q['where']}` — {q['question']} {q.get('otherwise', '')}".rstrip()
                                           for q in r["questions"]]
    tests = r["tests"]
    if tests.get("summary") or tests.get("cases"):
        out += ["", "## Tests", ""] + ([tests["summary"], ""] if tests.get("summary") else [])
        out += [f"- {c}" for c in tests.get("cases", [])]
    if r["preexisting"]:
        out += ["", "## Pre-existing issues", ""] + [f"- `{p['where']}` — {p['severity']}: {p['text']}"
                                                     for p in r["preexisting"]]
    if r["works_well"]:
        out += ["", "## What works well", ""] + [f"- {w}" for w in r["works_well"]]
    if r["order_of_work"]:
        out += ["", "## Suggested order of work", ""] + [f"{i}. {o}" for i, o in enumerate(r["order_of_work"], 1)]
    return "\n".join(out).rstrip() + "\n"


# --- HTML -------------------------------------------------------------------------------------

def _inert_json(data: dict) -> str:
    """JSON that cannot close or open markup when placed inside a <script> element."""
    text = json.dumps(data, ensure_ascii=False, indent=None, separators=(",", ":"))
    for ch, esc in (("&", "\\u0026"), ("<", "\\u003c"), (">", "\\u003e"),
                    ("\u2028", "\\u2028"), ("\u2029", "\\u2029")):
        text = text.replace(ch, esc)
    return text


def render_html(report: dict) -> str:
    data = prepared(report)
    data["markdown"] = render_markdown(report)
    template = TEMPLATE.read_text(encoding="utf-8")
    return template.replace("__REPORT_JSON__", _inert_json(data), 1)


def render_json(report: dict) -> str:
    return json.dumps(prepared(report), ensure_ascii=False, indent=2) + "\n"


# --- the command line -------------------------------------------------------------------------

def _slug(text: str, limit: int = 48) -> str:
    """The title for a file name: no parenthesised aside, cut at a word, at most `limit` long."""
    slug = re.sub(r"[^a-z0-9]+", "-", re.sub(r"\(.*?\)", "", text).lower()).strip("-")
    if len(slug) > limit:
        slug = slug[:limit + 1].rsplit("-", 1)[0]
    return slug or "report"


def target_path(out: str, title: str) -> Path:
    path = Path(out)
    if out.endswith(("/", os.sep)) or path.is_dir():
        stamp = _dt.datetime.now().strftime("%Y%m%d-%H%M")
        return path / f"run-code-review-{_slug(title)}-{stamp}.html"
    return path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Render a /run-code-review report to Markdown, HTML or JSON.")
    parser.add_argument("report", help="the report as JSON (references/report.schema.json), or - for stdin")
    parser.add_argument("-o", "--output", action="append", nargs="?", const=".",
                        help="a .html, .md or .json file, or a folder (default: the current folder)")
    parser.add_argument("-f", "--force", action="store_true", help="overwrite a different file")
    parser.add_argument("--open", action="store_true", help="open the HTML file afterwards")
    parser.add_argument("--host-type", choices=HOST_TYPES, help="the code host, when its name doesn't say")
    parser.add_argument("--no-links", action="store_true", help="no line links")
    args = parser.parse_args(argv)

    try:
        text = sys.stdin.read() if args.report == "-" else Path(args.report).read_text(encoding="utf-8")
        report = json.loads(text)
    except (OSError, json.JSONDecodeError) as exc:
        print(f"render_report.py: cannot read the report: {exc}", file=sys.stderr)
        return 2
    errors = validate(report)
    if errors:
        print("render_report.py: the report is not valid:\n  " + "\n  ".join(errors), file=sys.stderr)
        return 2

    targets = [target_path(o, report["title"]) for o in (args.output or [])]
    for t in targets:
        if t.suffix not in FORMATS:
            print(f"render_report.py: {t}: the output must end in .html, .md or .json, or be a folder", file=sys.stderr)
            return 2

    add_links(report, os.getcwd(), args.host_type, args.no_links)
    if not targets:
        sys.stdout.write(render_markdown(report))
        return 0

    renderers = {".html": render_html, ".md": render_markdown, ".json": render_json}
    planned = []
    for t in targets:
        content = renderers[t.suffix](report)
        if t.exists() and not args.force:
            if t.read_text(encoding="utf-8") == content:
                planned.append((t, None))
                continue
            print(f"render_report.py: {t} exists and differs; nothing written. Use -f/--force to overwrite.",
                  file=sys.stderr)
            return 3
        planned.append((t, content))
    for t, content in planned:
        if content is None:
            print(f"up to date {t}")
            continue
        t.parent.mkdir(parents=True, exist_ok=True)
        t.write_text(content, encoding="utf-8")
        print(f"wrote {t}")

    n = counts(report)
    links = report["repo"]
    print(f"{report['verdict']} — " + ", ".join(f"{n[s]} {s}" for s in SEVERITIES))
    print(f"line links: {links['host_type']} ({links['host']}/{links['project']} @ {links['commit'][:12]})"
          if links["links"] else f"line links: off ({links['reason']})")
    if args.open:
        for t, _ in planned:
            if t.suffix == ".html":
                webbrowser.open(t.resolve().as_uri())
    return 0


if __name__ == "__main__":
    sys.exit(main())
