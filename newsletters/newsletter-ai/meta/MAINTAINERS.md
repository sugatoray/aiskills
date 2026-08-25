# Maintaining newsletter-ai

For people developing this skill — not read as part of producing a
`/newsletter-ai` edition (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the only file read at invocation time. Frontmatter
  (`name`, `description`, `metadata.version`) plus the steps for using
  `assets/PROMPT.md` to produce one edition, in markdown or YAML.
- `../CHANGELOG.md` — this skill's version history; update it alongside
  `metadata.version` in `SKILL.md`.
- `assets/PROMPT.md` — the editorial brief itself: role, audience,
  research window, sourcing rules, the 15-part structure, editorial
  rules, and writing style. This is the single source of truth for what
  the newsletter *contains* — `SKILL.md` only points at it and never
  duplicates its content.
- `assets/templates/report.html` — the Jinja2 template for the
  interactive, multi-tab, light/dark HTML report. Renders a validated
  report data dict (see Schema below) into a self-contained HTML file:
  sidebar nav + tab panels per section, accordions per item, an
  auto-generated References accordion per section, and a print
  stylesheet with a cover/TOC for the browser's own "Save as PDF".
- `assets/example/sample-report.yaml` — a complete, valid, real edition
  (Week of Aug 19-25, 2026) in the YAML schema. Doubles as the reference
  example for `SKILL.md`'s YAML-output step and as a test fixture
  (`tests/test_example_data.py` renders it and checks link integrity on
  every change).
- `scripts/report_data.py` — loads and validates report YAML
  (`load_yaml`, `validate`), and dedupes each standard section's item
  `sources` by URL into a numbered reference list, annotating each item
  with the shared reference numbers (`compute_references`,
  `build_context`). This is what makes citation links unbreakable by
  construction: the citation number and the References-accordion entry
  it points at are computed from the same data in the same pass, so they
  can't drift apart.
- `scripts/build_report.py` — CLI + library (`render_html`, `build`)
  that renders validated data through `report.html` via Jinja2.
  ```
  python scripts/build_report.py <input>.yaml <output>.html [--template PATH]
  ```
- `scripts/requirements.txt` — `pyyaml` and `jinja2`, the only runtime
  dependencies (`build_report.py`/`report_data.py` are otherwise stdlib).
  This is a deliberate departure from the `scrolls-*` family's
  stdlib-only convention: hand-rolling a YAML parser or a Jinja2-grade
  templating engine would be worse than depending on two extremely
  stable, common libraries. Install with
  `pip install -r scripts/requirements.txt`.
- `tests/` — pytest suite; see Testing below.

## The report YAML schema

Authoritative definition: `scripts/report_data.py`'s `validate()`
function and module docstring. Authoritative example:
`assets/example/sample-report.yaml` — copy its shape for a new edition
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
`ico-horizon`, `ico-eye`, `ico-alert`, `ico-building`) — adding a new
icon means adding a `<g id="ico-...">` there. Badge names come from the
`.b-*` classes next to them (`red`, `orange`, `green`, `mint`, `teal`,
`cyan`, `indigo`, `purple`, `gray`).

## Updating `assets/PROMPT.md`

Edit it directly when the editorial brief needs to change — new or
reordered parts, different sourcing rules, a different audience, a
different tone. If a part is added, removed, or reordered, update
`SKILL.md`'s step numbering and, if you also maintain
`assets/example/sample-report.yaml`, keep its `sections` order matching.

## Updating `assets/templates/report.html`

It's plain Jinja2 — no build step of its own. One gotcha worth knowing:
`section.items` in Jinja2 resolves to `dict.items()` (the method), not
the `items` key, because `section` is a plain dict — always write
`section['items']` in the template, never `section.items`. After any
template change, re-render the example (`python scripts/build_report.py
assets/example/sample-report.yaml /tmp/out.html`) and re-run the test
suite; the link-integrity and theme-token tests catch most regressions
(a class rename that silently breaks the References-accordion selector,
a missing `data-theme` block, a broken citation anchor).

## Testing

Red/Green pytest suite, no network access needed:

```
pip install -r scripts/requirements.txt pytest
pytest newsletters/newsletter-ai/tests -q
```

- `tests/test_report_data.py` — schema validation and reference-dedup
  logic in isolation (synthetic dicts, no template involved).
- `tests/test_build_report.py` — renders `tests/fixtures/sample.yaml`
  (a small fixture exercising every item content-shape: `body`, `facts`,
  `table`, `stats`, `kv`) through the real template and asserts: one nav
  item and one tab panel per section, home cards target real section
  ids, **no internal `#anchor` link lacks a matching `id`** (the
  no-broken-links guarantee), citation links never point outside their
  own section, References accordions exist exactly where — and only
  where — a section has sourced items, light *and* dark theme tokens are
  present, print CSS forces every tab panel and accordion panel visible
  (the truncation-bug regression from this skill's first HTML pass), and
  each content shape renders.
- `tests/test_example_data.py` — the same link-integrity and structural
  checks, but against the real shipped content
  (`assets/example/sample-report.yaml`) rather than a synthetic fixture,
  so a bad edit to the real data fails CI even if the fixture still
  passes.

When adding a new item content-shape (beyond `body`/`facts`/`table`/
`stats`/`kv`) or a new top-level section field, add it to
`tests/fixtures/sample.yaml` and a matching assertion in
`test_build_report.py` first (red), then implement it in
`report_data.py`/`report.html` (green) — don't skip straight to the
implementation.

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter when something
that changes the produced newsletter or its tooling changes: a part
added, removed, or reordered in `assets/PROMPT.md`; a changed sourcing or
editorial rule; a changed audience; a schema or template change that
changes what a rendered report looks like or accepts. Not for pure typo
fixes or file moves with no content/behavior change.
