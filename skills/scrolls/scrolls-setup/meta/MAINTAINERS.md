# Maintaining scrolls-setup

For people developing this skill — not read as part of answering a
`/scrolls-setup` request (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the only file read at invocation time.
- `../assets/templates/` — source templates for the seven scaffolded files
  (`STARTER.md`, `SPEC.md`, `HANDOFF.md`, `GAP_ANALYSIS.md`,
  `GAP_CONTEXT.md`, `PLAN.md`, `WISDOM.md`) plus `CLAUDE_MD_BLOCK.md` and
  `AGENTS_MD_BLOCK.md` (the two pointer blocks written into `CLAUDE.md` and
  `AGENTS.md`, not into the scrolls folder itself). Edit these directly to
  change what gets scaffolded — the skill only ever copies *from* them,
  never the reverse.
- `../agents/openai.yaml` — OpenAI-agent interface metadata.

Unlike the other four scrolls skills, this one has no bundled `.sh`/`.ps1`
script and no `tests/` — file creation goes through Read/Write/Edit tools
directly at invocation time, not a script, so there's nothing to
regression-test the way the others do.

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter when something
visible to a `/scrolls-setup` invocation changes (new flag, changed
default, changed template content) — not for pure documentation changes.
