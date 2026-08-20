# Scrolls — Project Memory

Before doing ANY work in this project, read `docs/.scrolls/STARTER.md` first — it tells you which of the other `docs/.scrolls/*.md` files to read, in what order, and when to update each of them.

**Quick summary for the `docs/.scrolls/` directory**:

Start with **`docs/.scrolls/STARTER.md`** — it explains the reading order for the rest of `docs/.scrolls/` (`SPEC.md` for the full feature list, `HANDOFF.md` for the latest session's state, `GAP_ANALYSIS.md`/`GAP_CONTEXT.md` for known gaps and why, `PLAN.md` for the prioritized backlog, `WISDOM.md` for hard-won lessons and traps to avoid). These files are the project's working memory across sessions and are kept up to date as the app evolves.

## Symlinks into the real skill artifacts

This directory also holds three symlinks into the actual `scrolls-*` skill sources at `skills/scrolls/`, so the family's own governance docs are reachable from here without duplicating them:

- `meta` → `../../skills/scrolls/meta` (family-wide `MAINTAINERS.md`)
- `README.md` → `../../skills/scrolls/README.md`
- `CHANGELOG.md` → `../../skills/scrolls/CHANGELOG.md`

These are symlinks, not copies — editing through them edits the real files at `skills/scrolls/`. `src/scrolls/CLAUDE.md` remains the one file that's genuinely local to this directory (a hand-written install pointer, not part of the skill artifacts).
