#!/usr/bin/env python3
"""Check a Markdown docs folder: links, anchors, images, code fences, reachability, llms.txt coverage.

Usage:
    python3 check_docs.py DOCS_DIR

Prints one ``path:line: problem`` per issue and exits 1 if there are any (0 otherwise). Standard
library only, so it runs anywhere Python 3.10+ does.

Checks:
- relative links and images point at files that exist (a folder link needs a README.md);
- ``#anchors`` match a heading in the target page (GitHub's slug rules, including -1/-2 suffixes);
- images have alt text;
- every opening code fence names a language;
- every page is reachable from README.md by following links;
- a license.md page exists, with at least one Markdown table (the library's license, and the
  license of each component it bundles, if any);
- llms.txt (if the folder has one) lists every page.
"""

from __future__ import annotations

import re
import sys
from collections import deque
from pathlib import Path

LINK_RE = re.compile(r"(!?)\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+\"[^\"]*\")?\s*\)")
FENCE_RE = re.compile(r"^(\s*)(`{3,}|~{3,})(.*)$")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
INLINE_CODE_RE = re.compile(r"(`+)(.+?)\1")


def github_slug(text: str) -> str:
    """Turn heading text into the anchor GitHub generates for it (before duplicate suffixes)."""
    text = re.sub(r"<[^>]+>", "", text)  # inline HTML
    text = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", text)  # links keep their text
    text = text.strip().lower()
    text = "".join(ch for ch in text if ch.isalnum() or ch in " -_")
    return text.replace(" ", "-")


def scan(path: Path) -> tuple[list[tuple[int, str, str, str]], set[str], list[str]]:
    """Read one page.

    Returns:
        (links as (line, bang, text, target), heading anchors, problems found while scanning).
    """
    links, anchors, problems = [], set(), []
    counts: dict[str, int] = {}
    fence: str | None = None
    for no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        m = FENCE_RE.match(line)
        if m:
            marker, info = m.group(2), m.group(3).strip()
            if fence is None:
                fence = marker
                if not info:
                    problems.append(f"{path}:{no}: code fence without a language (use ```text for plain output)")
            elif marker[0] == fence[0] and len(marker) >= len(fence) and not info:
                fence = None
            continue
        if fence is not None:
            continue
        h = HEADING_RE.match(line)
        if h:
            slug = github_slug(h.group(2))
            n = counts.get(slug, 0)
            anchors.add(slug if n == 0 else f"{slug}-{n}")
            counts[slug] = n + 1
        for lm in LINK_RE.finditer(INLINE_CODE_RE.sub("", line)):
            links.append((no, lm.group(1), lm.group(2), lm.group(3)))
    if fence is not None:
        problems.append(f"{path}: unclosed code fence")
    return links, anchors, problems


def resolve(source: Path, target: str) -> Path:
    """The file a relative link points at: a folder means its README.md when it has one (GitHub
    shows that), else the folder itself (GitHub lists its files, so the link still works)."""
    dest = (source.parent / target).resolve()
    return dest / "README.md" if dest.is_dir() and (dest / "README.md").exists() else dest


def check(docs: Path) -> list[str]:
    """All problems in the docs folder, as ``path:line: message`` strings."""
    docs = docs.resolve()
    pages = sorted(docs.rglob("*.md"))
    info = {p: scan(p) for p in pages}
    problems = [msg for _, _, probs in info.values() for msg in probs]
    graph: dict[Path, set[Path]] = {p: set() for p in pages}
    for page, (links, _, _) in info.items():
        for no, bang, text, target in links:
            if re.match(r"^[a-z][a-z0-9+.-]*:", target):  # http:, https:, mailto: ...
                continue
            where = f"{page.relative_to(docs.parent)}:{no}"
            if bang and not text.strip():
                problems.append(f"{where}: image without alt text: {target}")
            file_part, _, anchor = target.partition("#")
            dest = page if not file_part else resolve(page, file_part)
            if not dest.exists():
                problems.append(f"{where}: broken link: {target}")
                continue
            if anchor and dest.suffix == ".md":
                if anchor.lower() not in info.get(dest, scan(dest))[1]:
                    problems.append(f"{where}: no heading for anchor #{anchor} in {dest.name}")
            if dest.suffix == ".md" and dest in graph:
                graph[page].add(dest)
    index = docs / "README.md"
    if not index.exists():
        problems.append(f"{docs}: no README.md landing page")
    else:
        seen, queue = {index}, deque([index])
        while queue:
            for nxt in graph[queue.popleft()] - seen:
                seen.add(nxt)
                queue.append(nxt)
        for page in pages:
            if page not in seen:
                problems.append(f"{page.relative_to(docs.parent)}: not reachable from README.md")
    license_page = docs / "license.md"
    if not license_page.exists():
        problems.append(
            "license.md: missing (add a License page: the library's license, and a table of the license "
            "each bundled component uses; link it from README.md under ### License)"
        )
    elif not re.search(r"^\s*\|[\s:|-]*-[\s:|-]*\|\s*$", license_page.read_text(encoding="utf-8"), re.M):
        problems.append("license.md: no table (list each part and its license in a Markdown table)")
    llms = docs / "llms.txt"
    if llms.exists():
        listed = {resolve(llms, t.partition("#")[0]) for _, _, _, t in scan(llms)[0]}
        for page in pages:
            if page not in listed and page != index:  # llms.txt is the landing page's own index
                problems.append(f"{llms.relative_to(docs.parent)}: doesn't list {page.relative_to(docs)}")
    return problems


def main() -> int:
    """Check the folder given on the command line."""
    if len(sys.argv) != 2 or not Path(sys.argv[1]).is_dir():
        print(__doc__.strip().splitlines()[2], file=sys.stderr)
        return 2
    problems = check(Path(sys.argv[1]))
    for p in problems:
        print(p)
    pages = len(list(Path(sys.argv[1]).rglob("*.md")))
    print(f"{pages} pages, {len(problems)} problem(s)", file=sys.stderr)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
