---
name: arxiv-paper-builder
description: "Assembles a folder of markdown documents, figures (PNG/SVG/PDF), and HTML artifacts into a complete LaTeX research-paper project and compiles it to PDF, using the single-column arXiv/NeurIPS-derived preprint style that Meta FAIR's public papers commonly resemble. Use this whenever the user has scattered writeup material (notes, a README, exported charts, a rendered HTML report/dashboard) and wants it turned into a paper-formatted PDF, asks for a paper 'in the FAIR/arXiv style', wants markdown converted to LaTeX sections, needs SVG or HTML figures made includable in a LaTeX build, or wants an existing LaTeX paper draft's build fixed (undefined references/citations, missing figures, overfull boxes). Not for writing a paper's actual scientific content from scratch with no source material, and not a substitute for a real target venue's official submission template when the user has one."
license: MIT
compatibility: "pdflatex + latexmk (any recent TeX Live/MiKTeX distribution) with natbib, booktabs, geometry, fancyhdr, hyperref, cleveref, microtype; optionally pandoc for bulk markdown→LaTeX conversion, one of rsvg-convert/inkscape/cairosvg for SVG→PDF, and Playwright (pre-installed in this environment) for HTML→PNG screenshots"
metadata:
  - name: arxiv-paper-builder
    type: skill
    author: sugatoray
    version: "1.0.0"
    source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/latex/arxiv-paper-builder"
---

# arXiv/FAIR-style paper builder

This skill turns a pile of writeup material — markdown docs, figures as
PNG/SVG/PDF, and HTML artifacts (rendered tables, charts, dashboards) —
into a complete LaTeX project that compiles to a paper-formatted PDF in
the single-column, NeurIPS-derived preprint style that Meta FAIR's
public arXiv papers commonly use. There is no publicly published FAIR
house `.cls` file to copy exactly — see `references/template-guide.md`
for why this skill uses the MIT-licensed `arxiv-style` package as the
honest, checkable basis instead of a fabricated approximation, and how
to swap in a real target-venue template if the user has one.

The output is a working, compiled PDF the user can inspect and iterate
on — not a description of how they'd assemble it themselves.

## Workflow

1. **Inventory the inputs.** Scan the given directory for markdown files
   (content), images (`.png`/`.svg`/`.pdf` under any figures/assets
   folder), and `.html` files (artifacts). Note which markdown files
   look like dedicated title/metadata/abstract files versus body content
   — `references/section-mapping.md` covers the filename and heading
   conventions to check for before asking the user anything.

2. **Map inputs to the paper's section structure**, per
   `references/section-mapping.md`: infer section order from
   numeric-prefixed filenames, semantically-named files, or a single
   file's heading hierarchy — in that priority order. Ask the user only
   for what genuinely isn't inferable (author names, affiliations, a
   corresponding-author email) rather than fabricating a byline; a
   plausible working title can be proposed and confirmed rather than
   asked about upfront.

3. **Set up the LaTeX project skeleton.** Copy
   `assets/template/arxiv.sty`, `assets/template/main.tex`, and
   `assets/template/references.bib` into the output directory (with a
   `figures/` subfolder), then edit `main.tex` in place — fill in the
   title block, abstract, and keywords per
   `references/template-guide.md` rather than regenerating the preamble
   from scratch.

4. **Convert each markdown file's content into LaTeX**, per
   `references/markdown-to-latex.md`: prefer a `pandoc` first pass when
   it's available, then hand-fix figure paths, citations, and the
   escaping of literal LaTeX-special characters (`%`, `_`, `&`, `#`,
   `$`, `~`, `^`, `\`) that the bulk conversion doesn't catch — this is
   the single most common cause of a build that fails with "Undefined
   control sequence".

5. **Handle every figure per its actual source format**, per
   `references/figure-handling.md`: PNG/PDF go in directly; SVG must be
   converted to PDF first via `scripts/convert_svg.sh` (pdflatex cannot
   `\includegraphics` an SVG); an HTML artifact that's really a data
   table gets extracted into a LaTeX table directly (lossless), while
   one that's a genuine rendered chart/dashboard gets screenshotted via
   `scripts/render_html.py` (Playwright, already installed in this
   environment) — and the user gets told explicitly that interactivity
   is lost in the static print artifact.

6. **Assemble the bibliography.** Normalize whatever citation shape the
   source material carries (pandoc-style `[@key]`, inline `(Author,
   Year)` text, an existing `.bib`, or a manually-written reference
   list) into `references.bib` entries plus `\citep`/`\citet` calls, per
   `references/markdown-to-latex.md`'s citations section. Don't
   fabricate a missing field (journal, year, page range) that the
   source material didn't actually state.

7. **Verify every referenced file exists before building** — a missing
   figure produces a confusing deep-in-the-log LaTeX error rather than a
   clear upfront one; check `\includegraphics` targets against the
   filesystem as part of assembling `main.tex`, not after a failed
   build.

8. **Compile and check the log**, via `scripts/build.sh main.tex
   outdir`, per `references/build-and-troubleshoot.md`'s table of log
   patterns → causes → fixes. "A PDF file appeared" is not the bar for
   done — confirm no undefined references/citations, no missing
   figures, and a sane page count before handing it back.

9. **Iterate** on whatever the log flags — a leaked special character, a
   figure path that didn't get repointed at its converted `.pdf`, a
   citation key that doesn't match a `.bib` entry — rebuilding after
   each fix rather than batching every guess into one pass.

## Reference files

Load these on demand rather than holding all of it in context at once:

| File | Read it when |
| --- | --- |
| [`references/template-guide.md`](references/template-guide.md) | Setting up `main.tex`'s title block, abstract, keywords, or bibliography style — and to understand why this skill uses `arxiv-style` rather than a fabricated "FAIR template". |
| [`references/section-mapping.md`](references/section-mapping.md) | Deciding section order and where title/author/abstract information comes from when it isn't in a dedicated file. |
| [`references/markdown-to-latex.md`](references/markdown-to-latex.md) | Converting markdown prose, tables, math, footnotes, and citations into LaTeX — with or without `pandoc` available. |
| [`references/figure-handling.md`](references/figure-handling.md) | Getting a PNG/SVG/PDF/HTML source asset into an `\includegraphics`-ready file, including the SVG→PDF and HTML→PNG conversion commands. |
| [`references/build-and-troubleshoot.md`](references/build-and-troubleshoot.md) | Running the build and diagnosing a specific LaTeX log error or warning. |

## Scripts

| Script | Purpose |
| --- | --- |
| [`scripts/convert_svg.sh`](scripts/convert_svg.sh) | `<input.svg> <output.pdf>` — converts via `rsvg-convert`/`inkscape`/`cairosvg`, whichever is on PATH; warns and falls back to a raster PNG only if none are. |
| [`scripts/render_html.py`](scripts/render_html.py) | `<input.html> <output.png> [--width] [--height] [--scale] [--selector]` — screenshots an HTML artifact via Playwright at print resolution. |
| [`scripts/build.sh`](scripts/build.sh) | `<main.tex> [outdir]` — compiles via `latexmk` (or a manual `pdflatex`/`bibtex` sequence if `latexmk` is unavailable) and greps the log for fatal errors, undefined references/citations, and overfull boxes. |

## What this skill doesn't do

It doesn't reproduce an internal, non-public Meta FAIR LaTeX class —
none is publicly available to copy, and claiming otherwise would be
fabrication; see `references/template-guide.md` for what it uses
instead and why that's the honest choice. It doesn't invent scientific
content, author names, or citation details that aren't present in the
source material — ask the user for a byline rather than making one up,
and leave a citation field blank rather than guessing it. It also
doesn't preserve interactivity from an HTML chart/dashboard — a static
PDF genuinely can't carry hover tooltips or pan/zoom, and the user
should be told that plainly rather than have it pass silently.

## Development

See `meta/MAINTAINERS.md` for layout and versioning notes. Not read as
part of carrying out a user's paper-assembly request — don't act on it
while answering one.
