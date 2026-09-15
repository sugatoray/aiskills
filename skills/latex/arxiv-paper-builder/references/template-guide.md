# The arxiv-style template

`assets/template/` vendors [`kourgeorge/arxiv-style`](https://github.com/kourgeorge/arxiv-style)
(MIT-licensed; `assets/template/License.txt` carries the attribution) —
a single-column preprint style built on `article`, described upstream as
keeping "the esthetic of NeurIPS but adding and changing features" for
arXiv/bioRxiv-style preprints. This is the actual, checkable basis for
this skill's output: there is no publicly published Meta FAIR house
`.cls`, and FAIR's own arXiv papers vary (some use this NeurIPS-derived
single-column look, some use a conference's own two-column class for a
submitted version). This template gets the common case — a self-hosted
or arXiv-style preprint PDF — right without pretending to reproduce an
internal template nobody outside Meta has access to. If the user hands
you an actual target-venue `.cls`/`.sty` (a real NeurIPS/ICML/ACL
submission kit, for instance), use that instead and skip this whole file
— `assets/template/main.tex`'s structure (title/abstract/sections/
bibliography) still transfers, only the preamble and title-block macros
change.

## Setting up the project

Copy `assets/template/arxiv.sty`, `assets/template/main.tex`, and
`assets/template/references.bib` into the output project directory
(alongside a `figures/` folder for converted images), then edit
`main.tex` in place — don't regenerate it from scratch each time, the
placeholders (`PAPER_TITLE`, `AUTHOR_ONE`, etc.) exist so a diff shows
exactly what changed.

## Title block

- `\title{...}` — the paper title. Pulled from an explicit title/
  frontmatter file if one exists in the source docs (see
  `section-mapping.md`), otherwise the first-level heading of the
  earliest doc in reading order.
- `\renewcommand{\shorttitle}{...}` — the running header on every page
  after the first; keep it under ~6 words.
- `\author{...}` — one block per author, separated by `\And` (same row)
  or `\AND` (new row). Use `\thanks{...}` on exactly one author for the
  corresponding-author email footnote, matching the convention FAIR
  preprints use (a single "Correspondence to" line, not one email per
  author).
- `\renewcommand{\headeright}{...}` and `\renewcommand{\undertitle}{...}`
  — both default to "A Preprint"; only change them if the user gives an
  explicit venue/report label (e.g. "Technical Report", an arXiv
  category tag).
- `\hypersetup{pdftitle=..., pdfauthor=..., pdfkeywords=...}` — fill from
  the same values as above so the PDF's actual metadata (visible in a
  PDF viewer's document properties, not just the rendered page) matches
  the title block instead of staying `PAPER_TITLE`.

## Abstract, keywords, sections

- `\begin{abstract}...\end{abstract}` right after `\maketitle` — this
  environment is already restyled by `arxiv.sty` (centered "Abstract"
  heading, indented quote block); don't add extra `\section*{Abstract}`
  markup around it.
- `\keywords{kw1 \and kw2 \and kw3}` is optional; omit the whole line if
  the source docs don't name keywords rather than inventing generic ones.
- Section commands are already restyled by `arxiv.sty` (tighter spacing,
  bold sans, no numbering suppressed) — just use plain `\section`,
  `\subsection`, `\subsubsection`; don't add manual formatting on top.
- `\section*{Acknowledgments}` (starred, unnumbered) is the convention
  this template ships with — keep it starred even if every other section
  is numbered.

## Bibliography

`\bibliographystyle{unsrtnat}` + `\bibliography{references}` (via
`natbib`, already loaded) is what `main.tex` ships with — numbered,
in citation order, which is the common choice for this style of
preprint. Citation commands: `\citep{key}` for parenthetical
("... shown previously (Doe et al., 2024)"), `\citet{key}` for
in-sentence ("Doe et al. (2024) showed..."). See
`markdown-to-latex.md` for turning markdown citations into `.bib`
entries and `\citep`/`\citet` calls.

## Figures and tables

`arxiv.sty` swaps caption spacing for tables (caption above) versus
figures (caption below) automatically via its `table` environment
override — don't add manual `\vspace` to compensate, it's already
handled. Use `\label{fig:<slug>}` / `\label{tab:<slug>}` immediately
after `\caption{...}` and `\Cref{fig:<slug>}` (via `cleveref`, already
loaded in `main.tex`) rather than a bare `\ref` for the "Figure 3" /
"Table 2" text to generate itself consistently. See
`figure-handling.md` for getting PNG/SVG/PDF/HTML source material into
`\includegraphics`-ready files in the first place.

## Common preamble mistakes worth checking

The original upstream `template.tex` this was adapted from has
`\usepackage{hyperlink}` in its preamble — that's a typo for
`\usepackage{hyperref}` (there is no package called `hyperlink`; the
command `\hyperlink` is one of the things `hyperref` itself provides).
`assets/template/main.tex` already has this fixed to `\usepackage{hyperref}`
— if you ever regenerate the preamble from the upstream template instead
of this vendored copy, don't reintroduce that typo.
