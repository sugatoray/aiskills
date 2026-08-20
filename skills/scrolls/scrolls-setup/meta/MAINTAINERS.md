# Maintaining scrolls-setup

For people developing this skill — not read as part of answering a
`/scrolls-setup` request (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the only file read at invocation time.
- `../CHANGELOG.md` — this skill's version history; update it alongside
  `metadata.version` in `SKILL.md`.
- `../assets/templates/` — source templates for the seven scaffolded files
  (`STARTER.md`, `SPEC.md`, `HANDOFF.md`, `GAP_ANALYSIS.md`,
  `GAP_CONTEXT.md`, `PLAN.md`, `WISDOM.md`) plus three pointer blocks
  written outside the scrolls folder itself: `SCROLLS_MD_BLOCK.md` (the
  path-bearing content installed as `SCROLLS.md`), `CLAUDE_MD_BLOCK.md`
  (a fixed pointer installed as `CLAUDE.md`, referencing `SCROLLS.md`
  rather than the scrolls path directly), and `AGENTS_MD_BLOCK.md` (a
  fixed pointer installed as `AGENTS.md`, referencing `CLAUDE.md`). Edit
  these directly to change what gets scaffolded — the skill only ever
  copies *from* them, never the reverse. `scrolls-update` also reads
  these three directly (for its own idempotent backfill, see its
  `meta/MAINTAINERS.md`) rather than keeping its own copies — a change
  here propagates there automatically.
- `../agents/openai.yaml` — OpenAI-agent interface metadata.

Unlike the other four scrolls skills, this one has no bundled `.sh`/`.ps1`
script and no `tests/` — file creation goes through Read/Write/Edit tools
directly at invocation time, not a script, so there's nothing to
regression-test the way the others do.

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter when something
visible to a `/scrolls-setup` invocation changes (new flag, changed
default, changed template content) — not for pure documentation changes.

This skill's version is locked in step with the other four `scrolls-*`
skills — see `../../meta/MAINTAINERS.md`'s Versioning entry. Any bump
here means bumping all five to the same new number in the same commit,
even the ones with nothing of their own to report that release.
