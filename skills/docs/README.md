# Docs skills

Skills for writing and maintaining documentation: user guides, tutorials, API and CLI reference,
and the indexes AI agents read (`llms.txt`). Every skill here takes its facts from the code and runs
its examples before publishing them.

## Skills

| Skill | Purpose |
| --- | --- |
| [`create-lib-docs`](create-lib-docs/) | Writes verified user documentation for a library, CLI or framework, structured like FastAPI's, Pydantic's, DuckDB's and Effect's docs: Getting Started, a progressive Tutorial, How-to Guides, Concepts, an exhaustive Reference (one anchor per error), FAQ, SVG diagrams, and `llms.txt` / `llms-full.txt`. Ships a link/anchor checker and the `llms.txt` generator. |

More skills will be added under this folder over time, following the same layout as
`create-lib-docs/`.

## This folder

- `.claude-plugin/plugin.json`: the family-level Claude Code plugin manifest, grouping every skill in
  this folder into one `docs-skills` plugin listed in the repo-root `.claude-plugin/marketplace.json`.
  See [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md) for its keep-in-sync rules; the layout is the same as
  `skills/stata/`.
- `meta/MAINTAINERS.md`: family-wide maintainer notes. Not read at invocation time.

## Layout

Each skill's directory has:

- `SKILL.md`: the skill's runtime instructions.
- `README.md`: a short, human-facing pointer to the files below; not read at invocation time.
- `references/`: detailed content loaded on demand (patterns from the reference projects, page
  templates).
- `scripts/` and `tests/`: deterministic helpers the skill runs, with their regression tests.
- `meta/MAINTAINERS.md`: development notes. Not read at invocation time.
- `CHANGELOG.md`: that skill's own version history.
- `agents/`: agent display metadata.
