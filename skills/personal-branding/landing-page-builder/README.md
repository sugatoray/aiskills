# landing-page-builder

Researches a named person on the web and turns the findings into a
polished, single-page personal landing page — a tasteful, professional
one-pager, not a generic template. The research is captured first as a
structured, sourced YAML data file, then rendered into a self-contained
HTML/CSS page designed to fit that specific person.

See [`SKILL.md`](SKILL.md) for the skill's runtime instructions. This
file is a human-facing pointer, not read at invocation time.

## What's here

- [`SKILL.md`](SKILL.md) — the workflow: scope the request, research,
  structure into YAML, get it reviewed, design and build the page,
  self-review, then iterate from the data on any later change.
- [`references/research-guidelines.md`](references/research-guidelines.md) —
  what counts as a usable public source, cross-checking specific
  claims, and the image-sourcing rule (person-controlled or official
  source only, otherwise no photo).
- [`references/data-schema.md`](references/data-schema.md) — the YAML
  schema every researched fact gets structured into: person, socials,
  career, education, skills, projects, achievements,
  publications/talks, testimonials, sources, and research metadata.
- [`references/design-guidelines.md`](references/design-guidelines.md) —
  typography, color, layout, motion, and a concrete list of generic
  "AI-slop" patterns to avoid (purple gradients, emoji headers,
  fabricated stats, dead social icons, stock photography).
- [`references/page-structure.md`](references/page-structure.md) — the
  section-by-section content plan, each section mapped to the YAML
  field(s) that back it — a section with no data doesn't render.
- [`assets/example-person.yaml`](assets/example-person.yaml) — a worked
  example of the schema, filled in for a fictional person. Illustrates
  the format only; never reuse its facts or testimonial as real content.
- [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md) — development notes:
  layout and versioning. Not read at invocation time.
- [`CHANGELOG.md`](CHANGELOG.md) — this skill's version history.

## Installing as a Claude Code plugin

This directory is a self-contained Claude Code plugin: `SKILL.md` sits
at the plugin root with no `skills/` subfolder needed, and
[`.claude-plugin/plugin.json`](.claude-plugin/plugin.json) carries the
plugin manifest. Load it locally with:

```
claude --plugin-dir skills/personal-branding/landing-page-builder
```

`agents/claude-code.yaml` and `agents/openai.yaml` carry per-agent-
harness interface metadata for the `npx skills add --agent <name>`
install path, matching the pattern the other skill families in this
repo use.

This skill is also installable via the repo's marketplace, as part of
the `personal-branding-skills` plugin:

```
/plugin marketplace add sugatoray/aiskills
/plugin install personal-branding-skills@sugatoray
```

See [`../meta/MAINTAINERS.md`](../meta/MAINTAINERS.md) for how that
family-level manifest relates to this skill's own
`.claude-plugin/plugin.json` above.

## A note on the YAML-first approach

The schema exists so the page is built from *reviewable, sourced* data
rather than prose the model wrote once and never re-derives from. If a
fact on the page turns out to be wrong, or the person wants their
career history updated, the fix is: edit the YAML, regenerate the
affected section — not a freehand edit to the HTML that the YAML no
longer describes.
