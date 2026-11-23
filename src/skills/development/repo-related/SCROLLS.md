# Scrolls — Project Memory

Before doing ANY work in this project, read `docs/.scrolls/STARTER.md` first — it tells you which of the other `docs/.scrolls/*.md` files to read, in what order, and when to update each of them.

**Quick summary for the `docs/.scrolls/` directory**:

Start with **`docs/.scrolls/STARTER.md`** — it explains the reading order for the rest of `docs/.scrolls/` (`SPEC.md` for the full feature list, `HANDOFF.md` for the latest session's state, `GAP_ANALYSIS.md`/`GAP_CONTEXT.md` for known gaps and why, `PLAN.md` for the prioritized backlog, `WISDOM.md` for hard-won lessons and traps to avoid). These files are the project's working memory across sessions and are kept up to date as the app evolves.

## Symlinks into the real skill artifacts

The repo-related skills live at `skills/development/repo-related/`, not here. Two symlinks reach their governance docs from `src/` without duplicating them:

- `README.md` → `../../../../skills/development/repo-related/README.md` (the subgroup's README)
- `meta` → `../../../../skills/development/repo-related/meta` (the subgroup's `MAINTAINERS.md`)

One level up, `src/skills/development/meta` → `../../../skills/development/meta` reaches the development family's own `MAINTAINERS.md`.

These are symlinks, not copies: editing through them edits the real files at `skills/development/repo-related/`. There is no subgroup `CHANGELOG.md` to link; each skill keeps its own (`skills/development/repo-related/create-issues-update-pr/CHANGELOG.md`).
