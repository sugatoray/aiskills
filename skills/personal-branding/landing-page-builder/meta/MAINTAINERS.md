# Maintaining landing-page-builder

For people developing this skill — not read as part of answering a live
"build a landing page" request (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the only file read at invocation time: the workflow
  and the reference-file table.
- `../README.md` — minimal, human-facing pointer to the files below;
  not read at invocation time.
- `../CHANGELOG.md` — this skill's version history; update it alongside
  `metadata.version` in `SKILL.md`.
- `../references/research-guidelines.md` — sourcing rules: what counts
  as usable, cross-checking, the image rule. Loaded during the research
  step.
- `../references/data-schema.md` — the YAML schema. Loaded whenever the
  YAML file is written or updated.
- `../references/design-guidelines.md` — typography/color/layout/motion
  guidance and the anti-slop checklist. Loaded during the design/build
  step.
- `../references/page-structure.md` — section-to-field mapping and
  ordering guidance. Loaded alongside `design-guidelines.md`.
- `../assets/example-person.yaml` — a fictional worked example of the
  schema, referenced from `SKILL.md`'s table and `README.md`.
- `../.claude-plugin/plugin.json` — the Claude Code plugin manifest
  (name, version, description, author, license, keywords). Not read
  during a normal skill invocation; only Claude Code's plugin loader
  reads it, when this directory is loaded as a plugin (see "Claude Code
  plugin packaging" below).
- `../agents/claude-code.yaml`, `../agents/openai.yaml` — per-agent-
  harness interface metadata (`display_name`, `short_description`,
  `allow_implicit_invocation`) for the `npx skills add --agent <name>`
  packaging, same shape as the `stata-recipes` and `scrolls-*` skills'
  own `agents/*.yaml` files. Claude Code's own plugin loader only reads
  `.md` files from `agents/` as custom-agent definitions, so these
  `.yaml` files are silently ignored by it — no conflict between the
  two uses of this directory name.

This skill has no bundled script and no `tests/` directory — it's
markdown guidance plus a YAML schema and a worked example, with nothing
executable of its own to regression-test. The actual output (researched
YAML, rendered HTML) is produced live per request and isn't something
this repo can pre-generate or snapshot-test meaningfully, since it
depends on live web research.

## Claude Code plugin packaging

`../SKILL.md` sits directly at this skill's root with no `skills/`
subfolder — Claude Code's "single-skill plugin" layout already, so
`../.claude-plugin/plugin.json` is enough to make this directory a
self-contained, loadable Claude Code plugin with no restructuring. Test
it locally with:

```
claude --plugin-dir skills/personal-branding/landing-page-builder
```

This individual manifest is separate from, and in addition to, the
family-level `skills/personal-branding/.claude-plugin/plugin.json` that
groups every `personal-branding`-family skill (currently just this one)
into a single `personal-branding-skills` plugin listed in the repo-root
`.claude-plugin/marketplace.json` — see `../meta/MAINTAINERS.md` (family
level) for that manifest's design and its own keep-in-sync rules.

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter (and add a
matching `../CHANGELOG.md` entry, same commit) whenever something a live
"build a landing page" request would actually see changes: a new or
reworded workflow step, a new/changed rule in any `references/` file, a
schema change, or a new asset. Pure typo fixes or formatting-only edits
don't need a bump.

Keep `../.claude-plugin/plugin.json`'s `version` field, **and**
`../../.claude-plugin/plugin.json`'s (the family-level manifest)
`version` field, equal to `SKILL.md`'s `metadata.version` — bump all
three in the same commit.

This is currently the only skill under `skills/personal-branding/`, so
its version moves independently — there's no family-wide lockstep to
maintain yet. If a second `personal-branding` skill is ever added,
revisit whether shared versioning makes sense (see
`../../scrolls/meta/MAINTAINERS.md` for what that looks like at scale)
rather than assuming it does or doesn't.

## Changing the YAML schema

`references/data-schema.md` is the contract between the research step
and the build step — a change here should stay backward-readable when
practical (adding an optional field is free; renaming or removing a
field that existing generated YAML files may already use is a breaking
change worth calling out explicitly in the changelog entry). Keep
`assets/example-person.yaml` in sync with the schema in the same commit
that changes it — a stale example is worse than no example.

## Changing design guidance

`references/design-guidelines.md`'s anti-slop list
("Content presentation — avoid these specifically") is the part most
worth protecting from drift: it exists because those are the specific
patterns that make an AI-built page look templated. Adding to that list
when a new tell is identified is encouraged; loosening it to make a
particular page easier to build is not — fix the guidance that produced
the pressure to loosen it instead.
