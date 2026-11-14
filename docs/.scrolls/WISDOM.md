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

- **Cloud sessions can push branches but not tags** (HTTP 403 from the git proxy), and the GitHub tools here can't create tags either. Make the tags locally, check them, and give the user one command to recreate and push them from their own clone. Then verify what reached GitHub.
- **GitHub strips `<...>` from issue and PR titles** as if it were an HTML tag: "under v/<version>/" became "under v//". Write placeholders as `x.y.z` or `VERSION` in titles; bodies with backticks are safe. Read a title back after creating it.
- **Adding a control to the docs header breaks the phone layout.** The search input can't render narrower than its padding (about 68px), so it overlaps the next button rather than shrinking. Check the header at iPhone width for sideways scroll and overlap; the docs browser tests do this for the version menu.

## Ditches — bad patterns or decisions to avoid
Bad patterns or decisions to never take, and why they were rejected.

- (none recorded yet)

## Wisdom — best practices and Red/Green TDD
Best practices worth reusing.

- Always use Red/Green TDD while developing or fixing code.
- Edit a skill at its source under `skills/`, and make it available here with `make link-skills SKILL=<path>`. Check links with `make check-skill-links`. Claude Code picks up a new link live, within the running session.
- **When two PRs touch the same generated files, stack them.** Rebase the second onto the first and point it at the first's branch, so each diff is its own work. Regenerate conflicting generated files (`npm run docs`) instead of hand-merging them. Put later scrolls notes on the top branch, so the lower one doesn't move and force another rebase.
- **Each npm release maps to a commit through `gitHead`** (`npm view @sugatoray-ai/aiskills@<v> gitHead`). Use it for tags and for anything that needs "the source of release X"; don't guess from dates.
- Repo-wide lessons go here. A lesson about one family goes in that family's scrolls under `src/`; point to it from here rather than copying it.
