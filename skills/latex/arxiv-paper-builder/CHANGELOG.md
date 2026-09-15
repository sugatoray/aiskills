# Changelog

All notable changes to the `arxiv-paper-builder` skill are documented
here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
