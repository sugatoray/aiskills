# Changelog

All notable changes to the `landing-page-builder` skill are documented
here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-09-06

### Added

- Initial release: researches a named person from public sources,
  structures the findings into a sourced YAML data file
  (`references/data-schema.md`), and renders a tasteful, self-contained
  HTML/CSS landing page from it.
- `references/research-guidelines.md` — disambiguating the subject,
  what counts as a usable public source, cross-checking specific
  claims, and the image-sourcing rule (person-controlled/official
  source only, otherwise a designed monogram treatment instead of a
  photo).
- `references/design-guidelines.md` — typography, color, layout/
  composition, and motion guidance driven by the specific person's
  field and material, plus a concrete list of generic patterns to avoid
  (purple-gradient heroes, emoji section headers, fabricated stats,
  uniform three-card grids, dead social icons, stock photography,
  Lorem ipsum).
- `references/page-structure.md` — section-by-section content plan,
  each section mapped to the YAML field(s) that back it, so a section
  with no data simply doesn't render.
- `assets/example-person.yaml` — a fully worked, fictional example of
  the schema.
- `.claude-plugin/plugin.json`, `agents/claude-code.yaml`,
  `agents/openai.yaml` — Claude Code plugin packaging and per-agent-
  harness interface metadata, matching the pattern used by this repo's
  other skill families (see `meta/MAINTAINERS.md`).
