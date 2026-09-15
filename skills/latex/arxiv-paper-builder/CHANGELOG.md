# Changelog

All notable changes to the `arxiv-paper-builder` skill are documented
here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.1] - 2026-09-15

### Fixed

- `assets/template/main.tex`: the `\hypersetup{pdftitle=..., pdfauthor=...,
  pdfkeywords=...}` placeholders had unescaped underscores
  (`PAPER_TITLE` instead of `PAPER\_TITLE`) while the rest of the file
  escaped them consistently — a real build-breaking inconsistency,
  caught by adding the CI compile job below rather than by inspection.
- `scripts/build.sh`'s no-`latexmk` fallback used `cd` into the `.tex`
  file's own directory and ignored the `outdir` argument entirely,
  silently diverging from the `latexmk` path's `outdir` semantics.
  Switched to `pdflatex -output-directory="$outdir"` with `BIBINPUTS`
  set so `bibtex` still finds `references.bib` next to `main.tex` when
  `outdir` is a separate build directory; also removes the
  `cd`-without-error-check shellcheck (SC2164) finding.

### Added

- `.github/workflows/latex-arxiv-paper-builder.yml`: CI for this skill,
  since the development sandbox has no LaTeX/pandoc/SVG/Playwright
  toolchain to verify against locally. Four jobs: `claude plugin
  validate --strict` on both plugin manifests and the marketplace;
  `shellcheck` + `py_compile` on the scripts; an actual `dante-ev/
  latex-action` compile of `assets/template/main.tex` to PDF (uploaded
  as a build artifact) via `latexmk`; and a smoke test of
  `convert_svg.sh` (via `rsvg-convert`) and `render_html.py` (via
  Playwright's Chromium) against tiny generated fixtures. Triggered on
  changes under `skills/latex/**` and the marketplace manifest, plus
  `workflow_dispatch`.

## [1.0.0] - 2026-09-15

### Added

- Initial release: assembles markdown docs, PNG/SVG/PDF figures, and
  HTML artifacts into a LaTeX project using the vendored, MIT-licensed
  `arxiv-style` template (`assets/template/`), and compiles it to PDF.
- `references/template-guide.md` — the template's macros and why
  `arxiv-style` is used instead of a fabricated "FAIR template" (none is
  publicly available).
- `references/section-mapping.md` — inferring section order and
  title/author/abstract info from filenames and heading structure.
- `references/markdown-to-latex.md` — markdown → LaTeX conversion rules
  (with or without `pandoc`), special-character escaping, and
  normalizing citations into `.bib` entries.
- `references/figure-handling.md` — PNG/PDF direct inclusion, SVG → PDF
  conversion, and HTML artifact handling (data-table extraction vs.
  Playwright screenshot).
- `references/build-and-troubleshoot.md` — the build procedure and a
  log-pattern → cause → fix table.
- `scripts/convert_svg.sh`, `scripts/render_html.py`,
  `scripts/build.sh` — SVG→PDF conversion, HTML→PNG screenshotting via
  Playwright, and the latexmk-based build-and-log-check step.
- `.claude-plugin/plugin.json`, `agents/claude-code.yaml`,
  `agents/openai.yaml`, `meta/MAINTAINERS.md` — packaging and
  development notes, matching the `stata-recipes` skill's layout.
- Also added to the new `latex-skills` family plugin
  (`skills/latex/.claude-plugin/plugin.json`), installable via
  `/plugin install latex-skills@sugatoray` after `/plugin marketplace
  add sugatoray/aiskills`.
