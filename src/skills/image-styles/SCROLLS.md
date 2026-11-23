# Scrolls — Project Memory

Before doing ANY work in this project, read `docs/.scrolls/STARTER.md` first — it tells you which of the other `docs/.scrolls/*.md` files to read, in what order, and when to update each of them.

**Quick summary for the `docs/.scrolls/` directory**:

Start with **`docs/.scrolls/STARTER.md`** — it explains the reading order for the rest of `docs/.scrolls/` (`SPEC.md` for the full feature list, `HANDOFF.md` for the latest session's state, `GAP_ANALYSIS.md`/`GAP_CONTEXT.md` for known gaps and why, `PLAN.md` for the prioritized backlog, `WISDOM.md` for hard-won lessons and traps to avoid). These files are the project's working memory across sessions and are kept up to date as the app evolves.

## Symlinks into the real skill artifacts

The image-styles skills live at `skills/image-styles/`, not here. One symlink reaches the family's maintainer notes from `src/` without duplicating them:

- `meta` → `../../../skills/image-styles/meta`, so `meta/MAINTAINERS.md` here opens `skills/image-styles/meta/MAINTAINERS.md` (the family's maintainer notes)

It is a symlink, not a copy: editing through it edits the real file at `skills/image-styles/meta/`. Each skill keeps its own `CHANGELOG.md` and `meta/MAINTAINERS.md` inside its folder.
