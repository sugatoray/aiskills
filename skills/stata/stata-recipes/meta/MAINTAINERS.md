# Maintaining stata-recipes

For people developing this skill — not read as part of answering a
Stata code-writing request (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the only file read at invocation time: the workflow,
  the reference-file table, and the recipe library table.
- `../README.md` — minimal, human-facing pointer to the files below;
  not read at invocation time.
- `../CHANGELOG.md` — this skill's version history; update it alongside
  `metadata.version` in `SKILL.md`.
- `../references/good-bad-examples.md` — the general (not
  recipe-specific) bad/good command pairs, loaded whenever any Stata
  code is being written or reviewed.
- `../references/python-interop.md` — the three directions of
  Stata↔Python interop, loaded whenever Python is in the picture.
- `../references/recipes/` — the recipe library, split by kind:
  - `models/` — a model class to estimate (`ardl.md`,
    `regression-timeseries.md`, `regression-panel.md`).
  - `tests/` — a diagnostic/statistical test (`test-dickey-fuller.md`,
    `test-unit-root.md`, `test-im-pesaran-shin.md`).
  - `README.md` — the template every recipe follows (five required
    sections) and the naming convention for which subfolder a new
    recipe goes in. Read this, not this file, before writing a new
    recipe.
- `../.claude-plugin/plugin.json` — the Claude Code plugin manifest
  (name, version, description, author, license, keywords). Not read
  during a normal skill invocation; only Claude Code's plugin loader
  reads it, when this directory is loaded as a plugin (see "Claude Code
  plugin packaging" below).
- `../agents/claude-code.yaml`, `../agents/openai.yaml` — per-agent-
  harness interface metadata (`display_name`, `short_description`,
  `allow_implicit_invocation`), same shape and purpose as the
  `scrolls-*` skills' `agents/openai.yaml` files, for the multi-agent
  `npx skills add --agent <name>` packaging. Claude Code's own plugin
  loader only reads `.md` files from `agents/` as custom-agent
  definitions, so these `.yaml` files are silently ignored by it — no
  conflict between the two uses of this directory name.

Unlike the `scrolls-*` skills, this one has no bundled `.sh`/`.ps1`
script and no `tests/` directory — it's pure markdown guidance and
code-generation instructions with nothing executable of its own to
regression-test. Recipes are demonstrated against Stata's own
`webuse`/`sysuse` datasets so they're genuinely runnable *as Stata
code*, but nothing in this skill's own toolchain executes them — see
`../SKILL.md`'s "What this skill doesn't do" section for that caveat as
it applies to a live request.

## Claude Code plugin packaging

`../SKILL.md` already sits directly at this skill's root with no
`skills/` subfolder — that's Claude Code's "single-skill plugin" layout
already, so adding `../.claude-plugin/plugin.json` was enough to make
this directory a self-contained, loadable Claude Code plugin with no
restructuring. Test it locally with:

```
claude --plugin-dir skills/stata/stata-recipes
```

This individual manifest is separate from, and in addition to, the
family-level `skills/stata/.claude-plugin/plugin.json` that groups every
`stata-*` skill (currently just this one) into a single `stata-skills`
plugin listed in the repo-root `.claude-plugin/marketplace.json` — see
`../meta/MAINTAINERS.md` for that manifest's design and its own
keep-in-sync rules. Unlike the `scrolls-*` family, which ships **only**
the group-level manifest (no per-skill `plugin.json` under any individual
`scrolls-*` skill directory), `stata-recipes` currently has both. That's
a deliberate difference worth a second look before adding a second
`stata-*` skill: decide then whether the individual manifest stays (two
install paths: the skill alone, or the whole family) or gets dropped for
closer parity with how `scrolls-*` does it — don't let it happen by
default either way.

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter (and add a
matching `../CHANGELOG.md` entry, same commit) whenever something a
Stata-code-writing request would actually see changes: a new or
reworded workflow step, a new/changed footgun in
`good-bad-examples.md`, a new/changed interop pattern, or a new/edited
recipe. Pure typo fixes or formatting-only edits don't need a bump.
Structural additions to the skill itself (a new reference file, this
`meta/MAINTAINERS.md`, the plugin manifest) have also gotten their own
bump in practice, even though they're not something a live request
would see — treat that as the actual working norm here, not just the
letter of the rule above.

Keep `../.claude-plugin/plugin.json`'s `version` field, **and**
`../../.claude-plugin/plugin.json`'s (the family-level manifest) `version`
field, equal to `SKILL.md`'s `metadata.version` — bump all three in the
same commit. Three manifests for the same release, and a mismatch in any
one of them is exactly the kind of inconsistency worth catching before it
ships. See `../meta/MAINTAINERS.md` for the family-level manifest's full
keep-in-sync checklist (the `"skills"` array entry, in particular, if a
second `stata-*` skill is ever added).

This is currently the only skill under `skills/stata/`, so its version
moves independently — there's no family-wide lockstep the way the five
`scrolls-*` skills share one (see
[`../../../scrolls/meta/MAINTAINERS.md`](../../../scrolls/meta/MAINTAINERS.md)
for what that looks like) — even though the family-level plugin manifest
already exists and tracks this skill's version 1:1 by necessity (it's the
only member). If `skills/stata/` grows a second skill, revisit whether
shared versioning makes sense here too, rather than assuming it does or
doesn't — it depends on how tightly the new skill's release cadence
actually tracks this one's.

## Writing a new recipe

Don't duplicate that guidance here — `../references/recipes/README.md`
is the source of truth for a recipe's required sections, the
`models/`/`tests/` split, and the naming pattern (`<topic>.md` under
`models/`, `test-<name>.md` under `tests/`). This file only covers where
things live and when to bump the version; that one covers how to write
the recipe itself. After adding a recipe file, three other places need
the same one-line addition: the reference-file table and the recipe
library table in `../SKILL.md`, and the recipe list in `../README.md`.
