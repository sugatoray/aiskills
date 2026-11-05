#!/usr/bin/env python3
"""Generate llms.txt and llms-full.txt for a Markdown docs folder (https://llmstxt.org/).

Usage:
    python3 build_llms_txt.py DOCS_DIR

Reads DOCS_DIR/README.md:
- its ``# Title``, and its first paragraph as the summary;
- each ``##`` or ``###`` heading followed by link items ``- [Title](page.md): description``,
  which become the llms.txt sections, in order.

A linked section index (a ``README.md`` inside a subfolder) also contributes the pages it links,
right after itself. A page with no description in the list gets its own first paragraph.

Writes:
- llms.txt: title, ``> summary``, then ``## Section`` lists of ``- [Title](path): description``;
- llms-full.txt: every page's Markdown in that order, each after a ``<!-- source: path -->`` line.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ITEM_RE = re.compile(r"^\s*[-*]\s+\[([^\]]+)\]\(([^)#\s]+\.md)(?:#[^)]*)?\)\s*(?::\s*(.*))?$")
HEADING_RE = re.compile(r"^(#{1,3})\s+(.*?)\s*$")


def first_paragraph(text: str) -> str:
    """The first prose paragraph after the H1: not a heading, list, quote, table, image or code."""
    para: list[str] = []
    started = fence = False
    for line in text.splitlines():
        if line.lstrip().startswith(("```", "~~~")):
            fence = not fence
            if para:
                break
            continue
        if fence:
            continue
        if line.startswith("# "):
            started = True
            continue
        if not started:
            continue
        stripped = line.strip()
        if not stripped:
            if para:
                break
            continue
        if stripped[0] in "#->|!*" or stripped.startswith("<"):
            if para:
                break
            continue
        para.append(stripped)
    return " ".join(para)


def collect(docs: Path) -> tuple[str, str, list[tuple[str, list[tuple[str, Path, str]]]]]:
    """Title, summary and ordered (section, [(title, page, description)]) from README.md."""
    index = docs / "README.md"
    text = index.read_text(encoding="utf-8")
    title = next((m.group(2) for m in map(HEADING_RE.match, text.splitlines()) if m and m.group(1) == "#"), docs.name)
    sections: list[tuple[str, list[tuple[str, Path, str]]]] = []
    seen: set[Path] = {index.resolve()}

    def add(items: list[tuple[str, Path, str]], source: Path) -> None:
        """Add the link items of one page, expanding section indexes in place."""
        current = None
        for line in source.read_text(encoding="utf-8").splitlines():
            h = HEADING_RE.match(line)
            if h and source == index and h.group(1) in ("##", "###"):
                current = h.group(2)
                continue
            m = ITEM_RE.match(line)
            if not m:
                continue
            page = (source.parent / m.group(2)).resolve()
            if page in seen or not page.exists():
                continue
            seen.add(page)
            desc = (m.group(3) or "").strip() or first_paragraph(page.read_text(encoding="utf-8"))
            if source == index:
                if not sections or sections[-1][0] != current:
                    sections.append((current or "Docs", []))
                target = sections[-1][1]
            else:
                target = items
            target.append((m.group(1), page, desc))
            if page.name == "README.md":
                add(target, page)

    add([], index)
    return title, first_paragraph(text), sections


def build(docs: Path) -> tuple[str, str]:
    """The text of llms.txt and llms-full.txt."""
    docs = docs.resolve()
    title, summary, sections = collect(docs)
    out = [f"# {title}", "", f"> {summary}", ""]
    full = [f"<!-- source: README.md -->\n{(docs / 'README.md').read_text(encoding='utf-8').rstrip()}\n"]
    for name, items in sections:
        out += [f"## {name}", ""]
        for item_title, page, desc in items:
            rel = page.relative_to(docs).as_posix()
            out.append(f"- [{item_title}]({rel}): {desc}" if desc else f"- [{item_title}]({rel})")
            full.append(f"<!-- source: {rel} -->\n{page.read_text(encoding='utf-8').rstrip()}\n")
        out.append("")
    return "\n".join(out).rstrip() + "\n", "\n".join(full)


def main() -> int:
    """Write both files into the folder given on the command line."""
    if len(sys.argv) != 2 or not (Path(sys.argv[1]) / "README.md").exists():
        print("usage: build_llms_txt.py DOCS_DIR  (DOCS_DIR must contain README.md)", file=sys.stderr)
        return 2
    docs = Path(sys.argv[1])
    index, full = build(docs)
    (docs / "llms.txt").write_text(index, encoding="utf-8")
    (docs / "llms-full.txt").write_text(full, encoding="utf-8")
    print(f"wrote {docs / 'llms.txt'} ({index.count(chr(10) + '- [')} pages) and {docs / 'llms-full.txt'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
