# arxiv-paper-builder

Assembles a folder of markdown documents, figures (PNG/SVG/PDF), and
HTML artifacts into a complete LaTeX research-paper project and compiles
it to PDF, using the single-column arXiv/NeurIPS-derived preprint style
that Meta FAIR's public papers commonly resemble.

See [`SKILL.md`](SKILL.md) for the skill's runtime instructions. This
file is a human-facing pointer, not read at invocation time.

## What's here

- [`SKILL.md`](SKILL.md) — the workflow: inventory inputs, map to
  section structure, set up the project, convert markdown, handle
  figures, assemble the bibliography, build, iterate.
- [`references/template-guide.md`](references/template-guide.md) — the
  `arxiv-style` template's macros (title block, abstract, keywords,
  bibliography) and why this skill uses it instead of a fabricated
  "FAIR template" (none is publicly available).
- [`references/section-mapping.md`](references/section-mapping.md) —
  inferring paper section order and title/author/abstract information
  from filenames and heading structure.
- [`references/markdown-to-latex.md`](references/markdown-to-latex.md)
  — markdown → LaTeX conversion rules (with or without `pandoc`),
  special-character escaping, and normalizing citations into `.bib`
  entries.
- [`references/figure-handling.md`](references/figure-handling.md) —
  PNG/PDF used directly, SVG converted to PDF first, and HTML artifacts
  either extracted as a data table or screenshotted via Playwright.
- [`references/build-and-troubleshoot.md`](references/build-and-troubleshoot.md)
  — running the build and a log-pattern → cause → fix table for the
  common LaTeX errors this workflow produces.
- [`assets/template/`](assets/template/) — the vendored `arxiv.sty`
  (MIT-licensed, from
  [`kourgeorge/arxiv-style`](https://github.com/kourgeorge/arxiv-style);
  see `assets/template/License.txt`), plus a `main.tex` skeleton and a
  `references.bib` starter.
- [`scripts/convert_svg.sh`](scripts/convert_svg.sh),
  [`scripts/render_html.py`](scripts/render_html.py),
  [`scripts/build.sh`](scripts/build.sh) — SVG→PDF conversion, HTML→PNG
  screenshotting, and the compile-and-check-the-log build step.
- [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md) — development notes:
  layout, versioning, and the vendored-template update policy. Not read
  at invocation time.
- [`CHANGELOG.md`](CHANGELOG.md) — this skill's version history.

## Installing as a Claude Code plugin

This directory is a self-contained Claude Code plugin: `SKILL.md` sits
at the plugin root with no `skills/` subfolder needed, and
[`.claude-plugin/plugin.json`](.claude-plugin/plugin.json) carries the
plugin manifest. Load it locally with:

```
claude --plugin-dir skills/latex/arxiv-paper-builder
```

`agents/claude-code.yaml` and `agents/openai.yaml` carry per-agent-
harness interface metadata for the `npx skills add --agent <name>`
install path, matching the pattern the `stata-recipes` and `scrolls-*`
skills use — unrelated to, and not in conflict with, the plugin's own
`agents/` directory convention; see `meta/MAINTAINERS.md`.

This skill is also installable via the repo's marketplace, as part of
the `latex-skills` plugin (every `latex-*`/`arxiv-*` skill under
`skills/latex/`, currently just this one):

```
/plugin marketplace add sugatoray/aiskills
/plugin install latex-skills@sugatoray
```

See [`../meta/MAINTAINERS.md`](../meta/MAINTAINERS.md) for how that
family-level manifest relates to this skill's own
`.claude-plugin/plugin.json`, and the [group README](../README.md) for
the `npx skills add` install path.

## Using a real target-venue template instead

If the user has an actual submission kit (a real NeurIPS/ICML/ACL
`.cls`/`.sty`), swap it in for `assets/template/arxiv.sty` — the
`main.tex` structure (title/abstract/sections/bibliography) still
transfers; only the preamble and title-block macros change. See
`references/template-guide.md`.
