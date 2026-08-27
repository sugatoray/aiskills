# Maintaining newsletter-ai

For people developing this skill — not read as part of producing a
`/newsletter-ai` edition (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the only file read at invocation time. Frontmatter
  (`name`, `description`, `metadata.version`, `metadata.aliases`) plus
  the steps for using `assets/PROMPT.md` to produce one edition, in
  markdown or YAML.
- `../README.md` — human-facing usage doc (how to invoke, all flags with
  examples, screenshots). Not read at invocation time; keep its flag
  table in sync with `SKILL.md`'s Steps when either changes.
- `FEATURES.md` — a catalog of everything this skill does, grouped by
  area, with pointers into the code/tests that implement each item. Not
  read at invocation time. Update it alongside any change that adds,
  removes, or materially changes a feature — it's meant to stay a
  complete map, not drift into a partial one.
- `MARKDOWN_FORMATTING.md` — the two markdown spacing rules every `.md`
  file in this skill follows (see Markdown Linting Rules below).
- `../CHANGELOG.md` — this skill's version history; update it alongside
  `metadata.version` in `SKILL.md`.
- `assets/images/` — the screenshots `README.md` embeds. Regenerate with
  the screenshot automation (see Screenshot automation below), not by
  hand; keep filenames descriptive (`report-<what>-<light|dark>.png`)
  since `README.md` references them by exact path.
- `assets/PROMPT.md` — the editorial brief itself: role, audience,
  research window, sourcing rules, the 15-part structure, editorial
  rules, and writing style. This is the single source of truth for what
  the newsletter *contains* — `SKILL.md` only points at it and never
  duplicates its content.
- `assets/templates/report.html` — the Jinja2 template for the
  interactive, multi-tab, light/dark HTML report. Renders a validated
  report data dict (see Schema below) into a self-contained HTML file:
  sidebar nav + tab panels per section, accordions per item, an
  auto-generated References accordion per section, a print stylesheet
  with a cover/TOC for the browser's own "Save as PDF", and a
  "Download data" button that pulls a fused source-YAML copy back out
  (see Data fusion below).
- `assets/templates/sample-report.yaml` — a complete, valid, real
  edition (Week of Aug 19-25, 2026) in the YAML schema, living next to
  the template it renders through. Doubles as the reference example for
  `SKILL.md`'s YAML-output step and as a test fixture
  (`tests/test_example_data.py` renders it and checks link integrity on
  every change).
- `builder/` — all non-test code for this skill (Python + the one
  browser-check helper script). Named `builder/` rather than the
  `scripts/` convention used by the `skills/scrolls/*` family, at the
  user's explicit request when this pipeline was built:
  - `report_data.py` — loads and validates report YAML (`load_yaml`,
    `validate`), and dedupes each standard section's item `sources` by
    URL into a numbered reference list, annotating each item with the
    shared reference numbers (`compute_references`, `build_context`).
    This is what makes citation links unbreakable by construction: the
    citation number and the References-accordion entry it points at are
    computed from the same data in the same pass, so they can't drift
    apart.
  - `build_report.py` — CLI + library (`render_html`, `build`) that
    renders validated data through `report.html` via Jinja2, resolves
    the `-r`/`--report` output path, and fuses the source YAML into the
    HTML by default. See CLI below.
  - `paths.py` — `resolve_report_paths(path, default_basename="report")`:
    turns a single "folder-or-report.html" argument into a concrete
    `(html_path, yaml_path)` pair. A directory (existing or not) gets
    `<default_basename>.html`/`.yaml` inside it; an `.html`/`.htm` path
    is used as-is with a same-basename `.yaml` sidecar next to it.
  - `fuse.py` — `embed_source(html, yaml_text)` / `extract_source(html)`:
    embeds the exact source YAML text into the rendered HTML as a
    hidden, base64-encoded `<script>` blob (see Data fusion below), and
    reads it back out.
  - `capture_screenshots.py` / `screenshots.cjs` — screenshot automation
    for `assets/images/` (Node + a globally-installed `playwright`,
    already present in this environment — see Screenshot automation
    below and Testing).
  - `requirements.txt` — pip fallback for when `uv` isn't available;
    `pyyaml` and `jinja2`, kept in sync with `pyproject.toml`'s runtime
    dependencies below by `tests/test_packaging.py`. `uv` is the
    RECOMMENDED path — see the next bullet.
- `pyproject.toml` / `uv.lock` — this skill's Python dependencies, managed
  with [`uv`](https://docs.astral.sh/uv/) (**RECOMMENDED**): `pyyaml` and
  `jinja2` as runtime deps (everything in `builder/` is otherwise stdlib —
  a deliberate departure from the `scrolls-*` family's stdlib-only
  convention, since hand-rolling a YAML parser or a Jinja2-grade
  templating engine would be worse than depending on two extremely
  stable, common libraries), and `pytest` in the `dev` dependency group.
  `uv run <script>` (from this directory) installs everything into a
  local `.venv` on first use — no separate install step. `tests/
  test_packaging.py` asserts both dependency groups stay declared here
  and that `builder/requirements.txt` (the pip fallback above) doesn't
  drift out of sync with the runtime deps listed here.
- `tests/` — pytest suite (including `test_packaging.py`, guarding the
  `pyproject.toml` setup above), `tests/conftest.py`'s shared
  Node/Playwright availability helpers, and one Node helper
  (`tests/browser/`) a Python test shells out to; see Testing below.

## Markdown Linting Rules

Every markdown file in this skill follows the two spacing rules in
[`MARKDOWN_FORMATTING.md`](MARKDOWN_FORMATTING.md) (blank line around
every header, blank line around every fenced code block). Read it before
editing any `.md` file here, and re-check a diff against it before
committing — the rules apply to this file too.

## CLI

```
python builder/build_report.py INPUT.yaml OUTPUT.html [--template PATH] [--no-fuse]
python builder/build_report.py INPUT.yaml -r/--report PATH [--template PATH] [--no-fuse]
```

The first form is the legacy single-file form (writes exactly the given
HTML path). The second (`-r`/`--report`) is what `SKILL.md` tells the
`yaml`-output flow to use: PATH is either a folder or an explicit
`.html`/`.htm` file (see `paths.resolve_report_paths`), and the command
writes both the rendered HTML *and* an exact copy of the source YAML
text next to it. Both forms fuse the source YAML into the HTML by
default; pass `--no-fuse` to skip that.

## The report YAML schema

Authoritative definition: `builder/report_data.py`'s `validate()`
function and module docstring. Authoritative example:
`assets/templates/sample-report.yaml` — copy its shape for a new edition
rather than re-deriving the schema from prose. Summary:

```yaml
meta:
  title: "..."          # required
  window: "..."         # required, e.g. "Week of Aug 19-25, 2026"
  generated: "..."      # required, e.g. "August 25, 2026"
  eyebrow: "..."
  coverage_line: "..."
  sample_edition: true|false
  scope_note: "... (safe HTML allowed)"

sections:                       # required, non-empty, ordered
  - id: home                    # required, unique, lowercase kebab-case
    kind: home                  # "home" | "standard"
    nav_label: "Overview"       # required
    icon: home                  # required — must match a #ico-* symbol in report.html
    title: "Overview"           # required
    eyebrow: "..."
    lede: "... (safe HTML)"
    callout: {style, icon, html}
    cards:                      # kind: home only — each target must be a real section id
      - {target: part1, icon, badge, title, desc}

  - id: part1
    kind: standard
    nav_label: "..."
    icon: trend
    number: "01"                # shown in the sidebar and used for "Part N" in the print TOC
    eyebrow: "Part 1"
    title: "..."
    lede: "..."
    items:                      # required, non-empty for standard sections
      - title: "..."            # required
        icon: dollar
        badge: green            # b-{badge} CSS class — see report.html's palette
        tag: "Capital / M&A"    # small label pill; omit for none
        open: true               # starts expanded; omit/false to start collapsed
        body: ["paragraph", ...]         # plain paragraphs (safe HTML)
        facts: [{label, text}, ...]       # Part-1-style structured facts (safe HTML in text)
        table: {headers: [...], rows: [[...], ...]}
        stats: [{value, label}, ...]
        kv: [{term, desc}, ...]           # desc allows safe HTML (e.g. a hand-written <a>)
        sources: [{label, url}, ...]      # url MUST be absolute http(s); never fabricate one
```

An item may mix `body`/`facts`/`table`/`stats`/`kv` freely (the template
renders whichever are present, in that order) and independently carries
`sources`. Every source becomes a `[n]` citation chip at the end of that
item and a numbered entry in that section's auto-generated References
accordion — see `report_data.compute_references`. Sections with no
sourced items get no References accordion; don't add an empty one by
hand.

Icon names come from the `<symbol>` sprite defined at the top of
`assets/templates/report.html` (`ico-home`, `ico-trend`, `ico-dollar`,
`ico-flask`, `ico-server`, `ico-globe`, `ico-people`, `ico-cpu`,
`ico-bolt`, `ico-compass`, `ico-hash`, `ico-pulse`, `ico-calendar`,
`ico-horizon`, `ico-eye`, `ico-alert`, `ico-building`, `ico-download`) —
adding a new icon means adding a `<g id="ico-...">` there. Badge names
come from the `.b-*` classes next to them (`red`, `orange`, `green`,
`mint`, `teal`, `cyan`, `indigo`, `purple`, `gray`).

## Data fusion (single-file distribution)

`fuse.embed_source` inserts the source YAML text into the rendered HTML
as `<script type="application/x-yaml-base64" id="report-source-yaml"
data-encoding="base64" data-filename="report.yaml">…</script>`, right
before the real closing `</body>` tag. Two non-obvious things about it,
both discovered by shipping this feature and hitting the bug for real —
keep them in mind before touching `fuse.py` or the download JS in
`report.html`:

1. **Base64, not escaped raw text.** The payload is base64-encoded
   specifically so it can never contain a literal `</script` sequence
   and truncate the tag early. Don't "simplify" this to inline the raw
   YAML text with HTML-escaping instead — HTML entities are not decoded
   inside `<script>` content (it's a raw-text element per the HTML
   spec), so an escaped `&lt;` would come back as the literal four
   characters `&lt;`, not `<`.
2. **Insert at the *last* `</body>`, not the first.** A page's own
   markup, JS, or comments may mention the literal text `</body>` before
   the real closing tag (this actually happened: an explanatory comment
   in `report.html` about *where* the fused tag gets inserted contained
   the string `</body>`, and the first version of `fuse.py` used
   `str.replace("</body>", ..., 1)` — which matched that comment instead
   of the real tag and corrupted the page). `fuse.py` uses `str.rfind`
   for this reason; there's a regression test for exactly this scenario
   in `tests/test_fuse.py`
   (`test_embed_inserts_at_the_real_closing_body_tag_not_a_decoy_earlier_in_the_page`).

On the client side, `report.html`'s download-button JS has two matching
gotchas, both covered by `tests/test_browser_download.py`:

1. **Script execution order.** The fused `<script>` is inserted *after*
   the app's own `<script>` tag in document order (both live in
   `<body>`), so a synchronous top-level `getElementById` for it at the
   top of the app script finds nothing. The wiring is deferred to
   `DOMContentLoaded` (or run immediately if the document has already
   finished loading) so it sees the fully-parsed DOM regardless of
   where the fused tag landed.
2. **`atob()` returns a binary string, not Unicode text.** For any
   multi-byte UTF-8 character (em dashes, curly quotes, `·`, `→`, …),
   `atob()` gives you one JS "character" per raw byte, not the decoded
   code point — using that string directly produces mojibake
   (`â` instead of `—`) when it's turned into a Blob. The fix decodes
   through `Uint8Array` + `TextDecoder('utf-8')`. Pure-Python round-trip
   tests can't catch this (Python's own encode/decode is correct); only
   a real-browser test can, which is why `test_browser_download.py`
   exists — see Testing below.

## Screenshot automation

`assets/images/` is machine-generated, not hand-captured. Regenerate it
after any visual change to `report.html`:

```
python builder/capture_screenshots.py assets/templates/sample-report.yaml assets/images
```

This builds `sample-report.yaml` to a temporary HTML file and shells out
to `builder/screenshots.cjs` (Playwright), which captures one PNG per
*scene*. A scene is `{name, hash, theme, action}` — which tab, which
theme, and an optional small interaction (currently only
`click-first-citation`, used for the citation-navigation shot) performed
before the shot. The two shipped scenes,
`report-overview-light`/`report-citations-dark`, are defined in the
`SCENES` array at the top of `screenshots.cjs` and mirrored in
`capture_screenshots.py`'s `SCENE_NAMES` — `test_capture_screenshots.py`
asserts those two lists agree, so update both together. Pass specific
scene names on either the Python or the Node CLI to capture a subset
instead of regenerating everything.

Adding a new scene: add an entry to `SCENES` in `screenshots.cjs`
(new `action` values go in `runAction`), add its name to `SCENE_NAMES`
in `capture_screenshots.py`, then re-run the command above.

## Updating `assets/PROMPT.md`

Edit it directly when the editorial brief needs to change — new or
reordered parts, different sourcing rules, a different audience, a
different tone. If a part is added, removed, or reordered, update
`SKILL.md`'s step numbering and, if you also maintain
`assets/templates/sample-report.yaml`, keep its `sections` order
matching.

## Updating `assets/templates/report.html`

It's plain Jinja2 — no build step of its own. One gotcha worth knowing:
`section.items` in Jinja2 resolves to `dict.items()` (the method), not
the `items` key, because `section` is a plain dict — always write
`section['items']` in the template, never `section.items`. After any
template change, re-render the example (`python builder/build_report.py
assets/templates/sample-report.yaml /tmp/out.html`) and re-run the test
suite; the link-integrity and theme-token tests catch most regressions
(a class rename that silently breaks the References-accordion selector,
a missing `data-theme` block, a broken citation anchor).

The visual design follows Apple's system-settings idiom (sidebar nav,
grouped accordions, a single restrained accent) — if you're changing
colors, spacing, or interaction states, keep every interactive control's
`:hover`/`:active`/`:focus-visible` states present and consistent, and
re-check contrast (`--ink-faint` and the `--badge-*-ink` tokens exist
specifically because their first values were below WCAG AA on small
text) in both themes before shipping.

## Testing

Red/Green pytest suite. Everything except `test_browser_download.py` and
`test_capture_screenshots.py` needs no network access and no Node; those
two shell out to Node + Playwright (already available in this
environment) to drive a real browser, via the shared availability check
in `tests/conftest.py`, and are skipped automatically if it's not on
PATH.

`uv` is the RECOMMENDED path:

```
cd skills/newsletters/newsletter-ai
uv run pytest tests -q
```

`uv` reads `pyproject.toml`/`uv.lock`, creates/updates the local `.venv`,
and installs the runtime deps plus the `dev` group (`pytest`) on first
run — no separate `pip install` step. Running from a different cwd:
`uv run --project skills/newsletters/newsletter-ai pytest
skills/newsletters/newsletter-ai/tests -q`.

<details>
<summary>No <code>uv</code>? Plain <code>pip</code> fallback</summary>

```
cd skills/newsletters/newsletter-ai
pip install -r builder/requirements.txt pytest
pytest tests -q
```

</details>

- `tests/test_packaging.py` — the `pyproject.toml` setup itself: it
  exists, declares `pyyaml`/`jinja2` as runtime dependencies and `pytest`
  in the `dev` group, and declares `requires-python`; and that
  `builder/requirements.txt` (the pip fallback above) still exists and
  declares exactly the same runtime packages as `pyproject.toml`, so the
  two installation paths can't silently drift apart.
- `tests/test_report_data.py` — schema validation and reference-dedup
  logic in isolation (synthetic dicts, no template involved).
- `tests/test_paths.py` — `-r`/`--report` path resolution
  (folder-vs-`.html` detection, custom basenames, directory creation).
- `tests/test_fuse.py` — embedding/extracting the source YAML from
  rendered HTML: round-trips exactly (including a payload that itself
  contains a literal `</script>`), replaces rather than duplicates on a
  second fuse pass, and — the regression that matters most — inserts at
  the real closing `</body>` even when the page's own markup mentions
  that text earlier.
- `tests/test_build_report.py` — renders `tests/fixtures/sample.yaml`
  (a small fixture exercising every item content-shape: `body`, `facts`,
  `table`, `stats`, `kv`) through the real template and asserts: one nav
  item and one tab panel per section, home cards target real section
  ids, **no internal `#anchor` link lacks a matching `id`** (the
  no-broken-links guarantee), citation links never point outside their
  own section, References accordions exist exactly where — and only
  where — a section has sourced items, light *and* dark theme tokens are
  present, print CSS forces every tab panel and accordion panel visible
  (the truncation-bug regression from this skill's first HTML pass),
  each content shape renders, the download button markup is present,
  and fusing is on by default / off with `embed_data=False`.
- `tests/test_example_data.py` — the same link-integrity and structural
  checks, but against the real shipped content
  (`assets/templates/sample-report.yaml`) rather than a synthetic
  fixture, so a bad edit to the real data fails CI even if the fixture
  still passes.
- `tests/test_cli.py` — `build_report.py`'s library API (`build()` with
  `report_path=` vs. the legacy `output_path=`) and its actual CLI
  (`subprocess`-invoked: `-r`/`--report`, `--no-fuse`, error handling
  when neither output form is given).
- `tests/test_browser_download.py` (+ `tests/browser/check_download.cjs`)
  — the one test that opens a real headless browser: builds a report,
  clicks the "Download data" button, and diffs the downloaded file
  against the source YAML byte-for-byte. This is what caught both
  client-side gotchas listed under Data fusion above; a pure-Python
  round-trip test passed while the actual feature was broken in the
  browser, which is why this test exists as its own layer rather than
  being considered redundant with `test_fuse.py`.
- `tests/test_capture_screenshots.py` — the screenshot automation
  itself: `capture_screenshots.SCENE_NAMES` matches `screenshots.cjs`'s
  `SCENES`, every scene produces a valid PNG of plausible dimensions
  (parsed straight out of the PNG `IHDR` chunk with `struct`, no image
  library needed), the light and dark scenes are byte-different from
  each other (a coarse but dependency-free check that theming actually
  took effect), capturing a named subset only writes those files, an
  unknown scene name raises, and the CLI writes the expected files on
  disk.

When adding a new item content-shape (beyond `body`/`facts`/`table`/
`stats`/`kv`) or a new top-level section field, add it to
`tests/fixtures/sample.yaml` and a matching assertion in
`test_build_report.py` first (red), then implement it in
`report_data.py`/`report.html` (green) — don't skip straight to the
implementation. The same applies to `builder/` behavior changes: write
or extend the failing test in `tests/` first.

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter when something
that changes the produced newsletter or its tooling changes: a part
added, removed, or reordered in `assets/PROMPT.md`; a changed sourcing or
editorial rule; a changed audience; a schema, CLI, or template change
that changes what a rendered report looks like, accepts, or writes. Not
for pure typo fixes or file moves with no content/behavior change.
