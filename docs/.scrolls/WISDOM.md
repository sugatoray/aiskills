# WISDOM.md — Constraints, Traps, Ditches, and Wisdom

Hard-won lessons for this project. Read this LAST, right before editing code, so it's freshest in mind.

## Constraints — respect and conform to them
Things you must respect or conform to (external requirements, API contracts, platform limits).

- **Dates:** use the user's date (US Eastern), not the server's. On 2026-11-13 the user corrected a reply that used the server date, 2026-11-14.
- **History:** keep it clean. Rebase PR branches onto `master`; never merge `master` into them.
- **Force pushes** need the user's explicit approval each time. The session's classifier blocks them otherwise.
- **PRs:** don't open one unless asked. Edit an existing PR description minimally, and keep its `- Closes #N -- title` issue list in sync.

## Traps — avoid them always
Specific bugs that have bitten this project before — avoid repeating them.

- After a squash merge, a branch stacked on the merged one must be rebased with `--onto`. The family scrolls hold the exact recipe: `src/development/review/docs/.scrolls/WISDOM.md` and `src/packages/aiskills/docs/.scrolls/WISDOM.md`.

## Ditches — bad patterns or decisions to avoid
Bad patterns or decisions to never take, and why they were rejected.

- (none recorded yet)

## Wisdom — best practices and Red/Green TDD
Best practices worth reusing.

- Always use Red/Green TDD while developing or fixing code.
- Edit a skill at its source under `skills/`, and make it available here with `make link-skills SKILL=<path>`. Check links with `make check-skill-links`. Claude Code picks up a new link live, within the running session.
- Repo-wide lessons go here. A lesson about one family goes in that family's scrolls under `src/`; point to it from here rather than copying it.
