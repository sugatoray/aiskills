---
name: newsletter-ai
description: "Generates the weekly executive AI intelligence newsletter: researches the last 7 days of AI developments (with 30-90 day context where needed) and writes them up as a 15-part executive brief — the Top 20 developments, model intelligence, open-vs-closed, talent, funding/M&A, production deployment, agents, chips/compute, data centers/energy, the global AI race, a company watchlist, key numbers, under-the-radar signals, what changed this week, and a closing synthesis. Defaults to markdown chat output; pass -o/--output yaml (or --yaml) to instead produce a sourced YAML document, and add -r/--report path/to/folder-or-report.html to render it straight into an interactive, light/dark, multi-tab HTML report (with per-tab References accordions, its source YAML fused in for single-file distribution, and a Download-data button) written next to a copy of the YAML. Use when the user runs /newsletter-ai (aliased as the shorthand /nltr-ai — treat both identically), or asks to draft, write, or update this week's AI newsletter/intelligence brief."
license: MIT
metadata:
  - name: newsletter-ai
    type: skill
    author: sugatoray
    version: "1.5.1"
    source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/newsletters/newsletter-ai"
    aliases:
      - nltr-ai
---

# Newsletter: AI Intelligence Brief

This skill's job is to produce one edition of the weekly AI intelligence
newsletter. All of the editorial substance — role, audience, research
window, sourcing rules, the 15-part structure, editorial rules, and
writing style — lives in `assets/PROMPT.md` in this same directory. This
file only says how to use it; `assets/PROMPT.md` is the single source of
truth for what the newsletter contains and how it reads, so don't
reconstruct the brief from memory or summarize it — read the file itself.

## Steps

1. Read `assets/PROMPT.md` in full before writing anything. Treat it as
   the complete editorial brief for this edition, not a template to
   paraphrase.
2. Parse the invocation for flags:
   - **Output format** — `-o`/`--output` followed by `md`, `yaml`, or
     `yml`; or the shorthand `--md` / `--yaml` / `--yml`. No flag means
     `md` (the original behavior). An unrecognized value is an error —
     ask the user to pick `md` or `yaml` rather than guessing.
   - **Report path** (`yaml`/`yml` output only) — `-r`/`--report`
     followed by a path: either a folder (gets `report.html` +
     `report.yaml` inside it) or an explicit `.html`/`.htm` file path
     (gets a `.yaml` sidecar with the same basename next to it). Given
     with `md` output, it's a no-op — say so rather than silently
     ignoring it.
3. Do the research it calls for: AI developments from the last 7 days,
   pulling in 30-90 days of prior context only where a development needs
   it to make sense. Use current web research and prefer the primary
   sources `assets/PROMPT.md` lists (company announcements, papers, model
   cards, technical reports, repos, earnings, regulatory filings) over
   secondary reporting; cross-check important claims across multiple
   sources.
4. Write the newsletter following `assets/PROMPT.md`'s structure and
   rules exactly, in order: the Top 20 Developments, then Parts 2-15
   (Model Intelligence through The Big Picture), applying the Editorial
   Rules and Writing Style sections throughout. Skip a section's content
   honestly ("No material development this week.") rather than
   manufacturing a story to fill it.
5. Keep confirmed fact, company claim, reported information, and analyst
   inference clearly distinguished throughout, as `assets/PROMPT.md`
   requires — don't blur them for narrative flow.
6. **Attach a real source to every sourced claim, and never invent one.**
   Whenever a development traces to an actual URL you found during
   research, carry that URL forward as a citation (see the YAML `sources`
   field below, or an inline link in markdown mode). When no verifiable
   URL exists for a claim, say so in the text instead of fabricating a
   link — a missing citation is honest; a fake one is not.
7. Produce the output in the requested format:
   - **`md` (default):** return the finished edition as markdown chat
     output, structured per `assets/PROMPT.md`, unless the user asks for
     it to be saved to a file. Cite sources as ordinary markdown links.
   - **`yaml`/`yml`:** instead of prose, produce a single YAML document
     conforming exactly to the schema `builder/report_data.py` validates
     (see its module docstring and `validate()` for the authoritative
     field list) — a `meta` block plus an ordered `sections` list (one
     `kind: home` landing section, then one `kind: standard` section per
     Part, each with `items` that carry `title`, an `icon`/`badge` from
     the template's set, and whichever of `body` / `facts` / `table` /
     `stats` / `kv` fits that item's content, plus `sources: [{label,
     url}]` for every claim with a real link). Use
     `assets/templates/sample-report.yaml` as a fully worked example —
     copy its shape rather than inventing a new one. Do **not**
     hand-number citations or write a references list yourself: list
     each item's `sources`, and the render step below dedupes them by
     URL and builds the numbering and per-tab References accordions
     automatically, which is what guarantees every citation link
     actually resolves.
     - **No `-r`/`--report` given:** write the YAML to a file (or
       return it as a fenced code block if the user hasn't said where),
       and mention it can be rendered into the interactive report with:

       ```
       python skills/newsletters/newsletter-ai/builder/build_report.py <file>.yaml <output>.html
       ```

     - **`-r`/`--report PATH` given:** run the render yourself:

       ```
       python skills/newsletters/newsletter-ai/builder/build_report.py <file>.yaml -r PATH
       ```

       This writes the rendered HTML and a copy of the YAML side by
       side (see Report path above for how PATH resolves), and by
       default fuses the source YAML into the HTML too (a hidden,
       base64-encoded `<script>` blob) so the single `.html` file
       remains fully reproducible even without its `.yaml` sidecar — the
       page's "Download data" button in the top bar lets a viewer pull
       that YAML back out. Pass `--no-fuse` only if the user explicitly
       doesn't want the data embedded. Report the paths written back to
       the user.

## Development

See `meta/MAINTAINERS.md` for this skill's layout, the YAML schema, how to
update `assets/PROMPT.md` or `assets/templates/report.html`, how to run
the test suite, and versioning conventions. It is not read as part of
carrying out a `/newsletter-ai` request — don't act on it while producing
an edition.
