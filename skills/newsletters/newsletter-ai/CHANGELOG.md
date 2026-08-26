# Changelog

All notable changes to the `newsletter-ai` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Work on this skill is tracked under
[Epic #30](https://github.com/sugatoray/aiskills/issues/30); each entry
below links to its corresponding closed issue.

## [1.5.1] - 2026-08-26

### Changed

- Dev tooling now uses [`uv`](https://docs.astral.sh/uv/) instead of bare
  `pip install -r builder/requirements.txt`: added `pyproject.toml` +
  `uv.lock` declaring the runtime deps (`PyYAML`, `Jinja2`) and a `dev`
  dependency group (`pytest`); removed `builder/requirements.txt`, now
  superseded. `README.md` and `meta/MAINTAINERS.md` updated to `uv run
  pytest tests -q` / `uv run builder/build_report.py ...`. Built
  Red/Green: `tests/test_packaging.py` (pyproject.toml exists, declares
  `pyyaml`/`jinja2` as runtime deps and `pytest` in the `dev` group,
  declares `requires-python`, and the old `requirements.txt` hasn't crept
  back in) written and confirmed failing before `pyproject.toml` existed.
  No change to the produced newsletter or the CLI's own behavior — dev
  workflow only.

## [1.5.0] - 2026-08-25 ([#41](https://github.com/sugatoray/aiskills/issues/41))

### Added

- `meta/FEATURES.md`: a complete, grouped catalog of everything this
  skill implements, with pointers into the code and tests behind each
  item.
- Screenshot automation: `builder/screenshots.cjs` (Playwright,
  scene-driven — each scene picks a tab, a theme, and an optional
  interaction) and `builder/capture_screenshots.py` (build + capture
  wrapper, CLI and library). `assets/images/` is now machine-generated
  (`python builder/capture_screenshots.py assets/templates/sample-report.yaml
  assets/images`) rather than hand-captured; regenerated the two shipped
  images with it to prove the pipeline. Built Red/Green: `tests/test_capture_screenshots.py`
  (schema-name agreement between the Python and Node scene lists, valid
  PNG dimensions parsed straight from the `IHDR` chunk with stdlib
  `struct`, light/dark scenes verified byte-different, subset capture,
  unknown-scene rejection, and the CLI) written and confirmed failing
  before `screenshots.cjs`/`capture_screenshots.py` existed.
- `tests/conftest.py`: shared Node/Playwright-availability helpers,
  factored out for the new browser-driven test to reuse (existing
  `test_browser_download.py` left as-is to avoid touching passing code
  unnecessarily).

## [1.4.0] - 2026-08-25 ([#40](https://github.com/sugatoray/aiskills/issues/40))

### Added

- `README.md`: human- and agent-facing usage guide — invocation examples
  for both `/newsletter-ai` and its new `/nltr-ai` shorthand, a full
  flags table (`-o`/`--output`, `--md`/`--yaml`/`--yml`, `-r`/`--report`)
  with side-by-side examples, a programmatic/CLI section for agents that
  want to render already-written YAML without an LLM call, and two
  screenshots of the rendered report (light-theme overview, dark-theme
  citation-to-reference navigation).
- `assets/images/`: the two screenshots `README.md` embeds, rendered
  from `assets/templates/sample-report.yaml`.
- `metadata.aliases: [nltr-ai]` in `SKILL.md`'s frontmatter, and the
  description updated to say both `/newsletter-ai` and `/nltr-ai`
  trigger the same skill.

## [1.3.0] - 2026-08-25 ([#37](https://github.com/sugatoray/aiskills/issues/37))

### Added

- `-r`/`--report path/to/folder-or-report.html` for `/newsletter-ai -o
  yaml`: renders the YAML straight into `report.html` (or
  `<name>.html`) with a `.yaml` copy written next to it, instead of
  leaving the render step to the user. `builder/paths.py` resolves the
  folder-vs-file argument into a concrete path pair (Red/Green tested).
- **Data fusion**: `builder/fuse.py` embeds the source YAML into the
  rendered HTML by default (a hidden, base64-encoded `<script>` blob),
  and `report.html` grows a "Download data" button that extracts it back
  out client-side — a single `.html` file now stays fully reproducible
  even without its `.yaml` sidecar. `--no-fuse` opts out.
  Building this exposed two real bugs, both now covered by regression
  tests: (1) `fuse.py`'s first version spliced the payload into a
  *decoy* `</body>` — a mention of that literal text inside an
  explanatory code comment earlier in the page — instead of the real
  closing tag, corrupting the document (`tests/test_fuse.py`, fixed by
  inserting at the *last* `</body>` instead of the first); (2) the
  download button's `atob()` call returned a binary string rather than
  decoded Unicode text, mangling every em dash, curly quote, and other
  multi-byte character in the downloaded file — invisible to Python
  round-trip tests, caught only by a real-browser test
  (`tests/test_browser_download.py`, driving headless Chromium via
  Playwright end to end: build → open → click → diff the downloaded file
  byte-for-byte against the source).
- Per-control tactile `:hover`/`:active` feedback across the report UI
  (nav items, home cards, accordion triggers, top-bar buttons), and a
  contrast pass on small caption/meta text and the "Sample edition"
  pill that were below WCAG AA — informed by a design-taste audit
  (`npx skills add https://github.com/Leonxlnx/taste-skill --skill
  design-taste-frontend`; its landing-page-specific rules — hero copy
  limits, eyebrow counts, motion choreography — don't apply to this
  report UI and were intentionally not applied, but its contrast,
  shape-consistency, and tactile-feedback checks did).

### Changed

- Renamed `scripts/` → `builder/` (all non-test code for this skill;
  `tests/` stays test-only) and moved
  `assets/example/sample-report.yaml` → `assets/templates/sample-report.yaml`,
  next to the template it renders through. Updated every reference in
  `SKILL.md`, `meta/MAINTAINERS.md`, and the test suite's import paths.
- `SKILL.md` documents the `-r`/`--report` flag and the new file layout.

## [1.2.0] - 2026-08-25 ([#36](https://github.com/sugatoray/aiskills/issues/36))

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

## [1.1.0] - 2026-08-25 ([#32](https://github.com/sugatoray/aiskills/issues/32), [#33](https://github.com/sugatoray/aiskills/issues/33))

### Changed

- Renamed `Skill.md` -> `SKILL.md` and moved `prompt.md` ->
  `assets/PROMPT.md`, to match the `skills/scrolls/*` naming convention
  used elsewhere in this repo; updated `SKILL.md`'s references
  accordingly. No change to the editorial brief itself.

### Added

- `meta/MAINTAINERS.md` documenting the skill's layout and how to update
  `assets/PROMPT.md`.

## [1.0.0] - 2026-08-25 ([#31](https://github.com/sugatoray/aiskills/issues/31))

### Added

- Initial release: `SKILL.md` skill definition that points at the
  editorial brief, and the 15-part AI intelligence newsletter prompt
  (Top 20 developments, model intelligence, open-vs-closed, talent,
  funding/M&A, production deployment, agents, chips/compute, data
  centers/energy, the global AI race, a company watchlist, key numbers,
  under-the-radar signals, what changed this week, and a closing
  synthesis).
