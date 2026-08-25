# Changelog

All notable changes to the `newsletter-ai` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.2.0] - 2026-08-25

### Added

- `-o`/`--output {md,yaml,yml}` (and `--md`/`--yaml`/`--yml` shorthand)
  on `/newsletter-ai`: produce the edition as a sourced YAML document
  instead of markdown prose.
- `assets/templates/report.html`: a Jinja2 template rendering that YAML
  into an interactive, multi-tab, accordioned, light/dark HTML report
  with a browser-native print/PDF export — the productionized version of
  the one-off Apple-style report built earlier this skill's history.
- `scripts/report_data.py` and `scripts/build_report.py`: load, validate,
  and render report YAML (`python scripts/build_report.py in.yaml
  out.html`). Every item's `sources` are deduped by URL and turned into
  numbered citation chips plus a matching entry in that section's
  auto-generated References accordion, computed from one pass over the
  same data — citation links cannot point at a missing reference by
  construction.
- `assets/example/sample-report.yaml`: a complete real edition (Week of
  Aug 19-25, 2026) demonstrating the schema, used both as the `SKILL.md`
  reference example and as a test fixture.
- `scripts/requirements.txt` (PyYAML, Jinja2) and a pytest suite under
  `tests/` (Red/Green): schema validation, reference-dedup logic, full
  template rendering against a synthetic fixture covering every item
  content-shape, and the same link-integrity/theme/print-CSS checks
  re-run against the real shipped YAML. Covers behavior carried over from
  the original one-off HTML build (light/dark theme tokens, print CSS
  forcing every accordion/tab panel visible with no truncation) as well
  as the new citation/References-accordion navigation.

### Changed

- `SKILL.md` now documents the output-format flag and the YAML schema
  pointer; bumped to reflect the new capability.

## [1.1.0] - 2026-08-25

### Changed

- Renamed `Skill.md` -> `SKILL.md` and moved `prompt.md` ->
  `assets/PROMPT.md`, to match the `skills/scrolls/*` naming convention
  used elsewhere in this repo; updated `SKILL.md`'s references
  accordingly. No change to the editorial brief itself.

### Added

- `meta/MAINTAINERS.md` documenting the skill's layout and how to update
  `assets/PROMPT.md`.

## [1.0.0] - 2026-08-25

### Added

- Initial release: `SKILL.md` skill definition that points at the
  editorial brief, and the 15-part AI intelligence newsletter prompt
  (Top 20 developments, model intelligence, open-vs-closed, talent,
  funding/M&A, production deployment, agents, chips/compute, data
  centers/energy, the global AI race, a company watchlist, key numbers,
  under-the-radar signals, what changed this week, and a closing
  synthesis).
