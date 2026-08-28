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

Unlike the `scrolls-*` skills, this one has no bundled `.sh`/`.ps1`
script, no `agents/openai.yaml`, and no `tests/` directory — it's pure
markdown guidance and code-generation instructions with nothing
executable of its own to regression-test. Recipes are demonstrated
against Stata's own `webuse`/`sysuse` datasets so they're genuinely
runnable *as Stata code*, but nothing in this skill's own toolchain
executes them — see `../SKILL.md`'s "What this skill doesn't do"
section for that caveat as it applies to a live request.

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter (and add a
matching `../CHANGELOG.md` entry, same commit) whenever something a
Stata-code-writing request would actually see changes: a new or
reworded workflow step, a new/changed footgun in
`good-bad-examples.md`, a new/changed interop pattern, or a new/edited
recipe. Pure typo fixes or formatting-only edits don't need a bump.

This is currently the only skill under `skills/stata/`, so its version
moves independently — there's no family-wide lockstep the way the five
`scrolls-*` skills share one (see
[`../../../scrolls/meta/MAINTAINERS.md`](../../../scrolls/meta/MAINTAINERS.md)
for what that looks like). If `skills/stata/` grows a second skill,
revisit whether shared versioning makes sense here too, rather than
assuming it does or doesn't — it depends on how tightly the new skill's
release cadence actually tracks this one's.

## Writing a new recipe

Don't duplicate that guidance here — `../references/recipes/README.md`
is the source of truth for a recipe's required sections, the
`models/`/`tests/` split, and the naming pattern (`<topic>.md` under
`models/`, `test-<name>.md` under `tests/`). This file only covers where
things live and when to bump the version; that one covers how to write
the recipe itself. After adding a recipe file, three other places need
the same one-line addition: the reference-file table and the recipe
library table in `../SKILL.md`, and the recipe list in `../README.md`.
