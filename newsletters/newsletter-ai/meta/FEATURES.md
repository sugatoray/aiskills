# Features

A catalog of everything `newsletter-ai` does today, grouped by area. For
*how* to use any of this, see [`../README.md`](../README.md); for
schema/API detail and maintenance notes, see
[`MAINTAINERS.md`](MAINTAINERS.md); for version-by-version history, see
[`../CHANGELOG.md`](../CHANGELOG.md). This file is the map across all of
it — not read at invocation time.

## Invocation

- **`/newsletter-ai`**, aliased as **`/nltr-ai`** (`SKILL.md`
  `metadata.aliases`) — both trigger the same skill.
- **`-o`/`--output {md,yaml,yml}`**, with `--md`/`--yaml`/`--yml`
  shorthand — selects markdown chat prose (default) or a structured YAML
  document.
- **`-r`/`--report path/to/folder-or-report.html`** (`yaml`/`yml` output
  only) — renders the YAML straight into the interactive HTML report,
  writing it and a copy of the source YAML side by side. Accepts either
  a folder (`report.html` + `report.yaml` inside it) or an explicit
  `.html`/`.htm` path (`.yaml` sidecar with the same basename).

## Editorial content

- The 15-part brief structure, sourcing rules, and writing style all
  live in [`../assets/PROMPT.md`](../assets/PROMPT.md) — the single
  source of truth `SKILL.md` points at rather than restating.
- Editorial honesty is enforced procedurally, not just by instruction:
  the YAML schema has no field that requires filling a section with
  invented content — `body: ["No material development this week."]` is
  a first-class, expected shape.
- Every sourced claim carries a real `sources: [{label, url}]` — the
  brief instructs never fabricating a URL; omit `sources` when there
  isn't a real one rather than inventing one.

## YAML report schema and validation

*Implementation: [`../builder/report_data.py`](../builder/report_data.py).*

- `load_yaml(path)` — reads a YAML file, rejects a non-mapping top level.
- `validate(data) -> list[str]` — full schema validation returning
  *every* problem found (not just the first): required `meta` fields,
  non-empty `sections`, unique kebab-case section `id`s, `kind` in
  `{home, standard}`, required per-section fields, non-empty `items` for
  standard sections, required `sources[].label`, `sources[].url`
  restricted to absolute `http(s)` (rejects `javascript:` and similar),
  and every `home` section's `cards[].target` checked against real
  section ids.
- `compute_references(section)` — dedupes a section's item `sources` by
  URL (first-seen order) into a numbered reference list, and annotates
  each item with the shared reference numbers. This is what makes
  citation links unbreakable *by construction*: the citation number and
  the References-accordion entry are computed from the same data in the
  same pass.
- `build_context(data)` — validates, then runs `compute_references`
  across every standard section; raises `ValidationError` (all problems
  joined into one message) on invalid data.
- Item content shapes (freely mixable per item): `body` (paragraphs),
  `facts` (label/text pairs), `table` (headers/rows), `stats`
  (value/label tiles), `kv` (term/desc pairs).

## Interactive HTML report

*Implementation: [`../assets/templates/report.html`](../assets/templates/report.html)
(Jinja2) + [`../builder/build_report.py`](../builder/build_report.py) (renderer).*

- Sidebar navigation (one entry per section) + tab panels, macOS
  System-Settings-style.
- One accordion per item, with a colored monochrome-icon badge, an
  optional tag pill, and whichever content shape(s) that item carries.
- **Per-tab References accordion**, auto-generated only for sections
  that actually have sourced items (never an empty one) — see
  `compute_references` above.
- **Inline `[n]` citation chips** on every sourced item; clicking one
  switches tabs if needed, opens the References accordion, scrolls to
  and highlights the matching entry. No manual cross-referencing by the
  content author — see "no broken links," below.
- Light/dark theming: full token set for `prefers-color-scheme: dark`
  and an explicit `data-theme` toggle (button in the top bar); WCAG
  AA-checked contrast on small caption text and status pills; tactile
  `:hover`/`:active` feedback on every interactive control.
- Print stylesheet: cover page, table of contents, every tab panel and
  accordion forced visible (nothing collapsed/hidden gets silently
  truncated) — works with the browser's own "Save as PDF."
- **No-broken-links guarantee**, enforced by tests: every internal
  `href="#..."` resolves to a real `id`, and every citation link stays
  inside its own section.

## Data fusion (single-file distribution)

*Implementation: [`../builder/fuse.py`](../builder/fuse.py).*

- `embed_source(html, yaml_text)` — embeds the exact source YAML into
  the rendered HTML as a hidden, base64-encoded `<script>` blob, inserted
  at the document's *actual* closing `</body>` (not the first occurrence
  of that text — a page's own comments can mention it, which broke an
  earlier version; see `MAINTAINERS.md`).
- `extract_source(html)` — reads it back out.
- On by default in `build_report.py`/`build()`; `--no-fuse` /
  `embed_data=False` opts out.
- **"Download data" button** in the report's top bar: decodes the
  embedded blob client-side (via `TextDecoder`, not a naive `atob()` —
  the naive version corrupted every multi-byte character) and offers it
  as a real `.yaml` file download.

## Build pipeline / CLI

*Implementation: [`../builder/build_report.py`](../builder/build_report.py),
[`../builder/paths.py`](../builder/paths.py).*

- `render_html(data, ...)` / `build(input, output=None, *,
  report_path=None, ...)` — library API; `build()` supports both the
  legacy single-output-file form and the folder-or-file `report_path`
  form.
- `paths.resolve_report_paths(path, default_basename="report")` — turns
  the `-r`/`--report` argument into a concrete `(html_path, yaml_path)`
  pair; creates missing parent directories.
- CLI: `python builder/build_report.py INPUT.yaml [OUTPUT.html] [-r/--report PATH] [--no-fuse] [--template PATH]`,
  with clean, non-zero-exit error reporting on invalid data (safe to
  call from scripts/CI with no LLM involved).

## Screenshot automation

*Implementation: [`../builder/screenshots.cjs`](../builder/screenshots.cjs)
(Playwright) + [`../builder/capture_screenshots.py`](../builder/capture_screenshots.py) (wrapper).*

- Scene-driven: each named scene picks a tab (`hash`), a theme, and an
  optional interaction (currently `click-first-citation`, used to
  capture the citation-navigation shot mid-interaction).
- Ships two scenes matching the images `README.md` embeds:
  `report-overview-light`, `report-citations-dark`.
- `capture_screenshots.py capture(input_yaml, output_dir, scenes=None)`
  — builds the YAML to a temp HTML, shells out to `screenshots.cjs`,
  returns `{scene_name: Path}`. CLI:
  `python builder/capture_screenshots.py INPUT.yaml OUTPUT_DIR [SCENE_NAME ...]`.
- This is how [`../assets/images/`](../assets/images/) gets
  (re)generated — not a one-off manual screenshot.

## Documentation

- [`../README.md`](../README.md) — human- and agent-facing usage guide:
  invocation examples (both slash-command forms), a full flags table,
  a programmatic/CLI section for agents, and the two screenshots above.
- [`MAINTAINERS.md`](MAINTAINERS.md) — layout, the full YAML schema
  reference, data-fusion implementation gotchas, template-editing notes,
  and the testing breakdown.
- [`../CHANGELOG.md`](../CHANGELOG.md) — version-by-version history.
- This file.

## Testing

Red/Green pytest suite under [`../tests/`](../tests/) (no test code lives
outside that directory; all non-test code lives under
[`../builder/`](../builder/)). Everything except the two browser-driven
files needs no network access and no Node; those two shell out to
Node + Playwright (skipped automatically if unavailable — see
`tests/conftest.py`):

| File | Covers |
|---|---|
| `test_report_data.py` | Schema validation and reference-dedup logic, in isolation. |
| `test_paths.py` | `-r`/`--report` path resolution. |
| `test_fuse.py` | Embed/extract round-trip, including the decoy-`</body>` regression. |
| `test_build_report.py` | Full template rendering against a synthetic fixture covering every item content-shape; link integrity; theme tokens; print CSS; fusion defaults. |
| `test_example_data.py` | The same structural/link-integrity checks, against the real shipped `sample-report.yaml` rather than a synthetic fixture. |
| `test_cli.py` | `build_report.py`'s library API and actual CLI (subprocess-invoked). |
| `test_browser_download.py` | Real-browser regression: builds a report, clicks "Download data," diffs the result against the source byte-for-byte — this is what caught the Unicode/`atob()` bug a pure-Python test couldn't. |
| `test_capture_screenshots.py` | The screenshot-automation itself: every scene produces a valid, correctly-sized PNG; light and dark scenes are genuinely different; unknown scene names are rejected; the CLI writes the expected files. |

Every feature above was built test-first: a failing test confirmed
before the implementation existed, then made to pass — not retrofitted
afterward.

## Repository conventions

- `builder/` — all non-test code for this skill (deliberately not named
  `scripts/`, unlike the `skills/scrolls/*` family, at explicit
  request).
- `tests/` — all tests, plus the one Node helper (`tests/browser/`) a
  Python test shells out to.
- `assets/templates/` — the Jinja2 template and the real example/schema
  YAML, next to each other.
- `assets/images/` — screenshots `README.md` embeds, machine-generated
  (see Screenshot automation above) rather than hand-captured and
  committed as one-offs.
