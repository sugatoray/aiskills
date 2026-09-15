# LaTeX skills

Skills for producing a LaTeX-formatted research paper from raw writeup
material — assembling markdown documents, figures (PNG/SVG/PDF), and
HTML artifacts into a complete project in the single-column
arXiv/NeurIPS-derived preprint style Meta FAIR's public papers commonly
resemble, and compiling it to PDF.

## Skills

| Skill | Purpose |
| --- | --- |
| [`arxiv-paper-builder`](arxiv-paper-builder/) | Assembles markdown docs, PNG/SVG/PDF figures, and HTML artifacts into a LaTeX research-paper project (arXiv/NeurIPS-derived preprint style) and compiles it to PDF — SVG→PDF conversion, HTML→PNG screenshotting, markdown→LaTeX conversion, and build-log troubleshooting included. |

More skills will be added under this folder over time (e.g. a real
target-venue template pack, a citation-management skill) following the
same layout as `arxiv-paper-builder/`.

## This folder

- `.claude-plugin/plugin.json` — the family-level Claude Code plugin
  manifest, grouping every skill in this folder into one `latex-skills`
  plugin listed in the repo-root `.claude-plugin/marketplace.json`. See
  [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md) for its design and
  keep-in-sync rules — the same layout `skills/stata/` and
  `skills/scrolls/` use for their own group manifests.
- `meta/MAINTAINERS.md` — family-wide maintainer notes. Not read at
  invocation time.

## Layout

Each skill's directory has:

- `SKILL.md` — the skill's runtime instructions.
- `README.md` — a minimal, human-facing pointer to the files below; not
  read at invocation time.
- `references/` — detailed content loaded on demand rather than held in
  context on every invocation (template macros, markdown→LaTeX
  conversion rules, figure handling, build troubleshooting).
- `assets/template/` — the vendored LaTeX template (style file, a
  `main.tex` skeleton, a `references.bib` starter).
- `scripts/` — bundled helper scripts (SVG→PDF conversion, HTML→PNG
  screenshotting, the compile-and-check-the-log build step).
- `meta/MAINTAINERS.md` — development notes: layout and versioning.
  Not read at invocation time.
- `CHANGELOG.md` — that skill's own version history.
- `.claude-plugin/plugin.json` — Claude Code plugin manifest, present
  when the skill also sits at its plugin root with no `skills/`
  subfolder (true today for `arxiv-paper-builder/`), letting it load
  directly via `claude --plugin-dir <path>`.
