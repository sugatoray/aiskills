# WISDOM.md — Constraints, Traps, Ditches, and Wisdom

Hard-won lessons for this project. Read this LAST, right before editing code, so it's freshest in mind.

## Constraints — respect and conform to them
Things you must respect or conform to (external requirements, API contracts, platform limits).

- **Dates:** use the user's date (US Eastern), not the server's. On 2026-11-13 the user corrected a reply that used the server date, 2026-11-14.
- **History:** keep it clean. Rebase PR branches onto `master`; never merge `master` into them.
- **Force pushes** need the user's explicit approval each time. The session's classifier blocks them otherwise.
- **Nothing from the user's private data goes into this public repo:** not their session logs, chats or private artifacts (not even an artifact ID in a note), and not their real repo or project names used as samples. Demo and test data must be visibly fictional and generic. Check new fixtures, demos, scrolls and PR text for this before pushing.
- **Every memory folder under `src/skills/` links to its `meta/`.** `src/skills/<group>/` (or `src/skills/development/<subgroup>/`) has a `meta` symlink to `skills/<group>/meta` (relative: one `../` per level, e.g. `../../../skills/productivity/meta`), and its `SCROLLS.md` and `STARTER.md` say which file that reaches: "`meta/MAINTAINERS.md` here opens `skills/<group>/meta/MAINTAINERS.md`". `src/skills/development/meta` links to `skills/development/meta`. Do the same when setting up scrolls for another family, and check with `realpath <folder>/meta/MAINTAINERS.md`.
- **The root scrolls route; dedicated scroll sets hold the detail.** If work touches a folder with its own scroll set (see `STARTER.md` → "Where memory lives"), update that set, and keep at most a pointer here. One change can belong in several sets (the group `meta/` packaging change touched the package and every family); record each part where it belongs. Before this rule, the root `HANDOFF.md` collected family detail and grew to 30 lines.
- **PRs:** don't open one unless asked. Edit an existing PR description minimally, and keep its `- Closes #N -- title` issue list in sync.

## Traps — avoid them always
Specific bugs that have bitten this project before — avoid repeating them.

- **Moving a folder that holds relative symlinks breaks them silently.** `git mv` keeps the link text, so after moving `src/{scrolls,development,productivity}` one level deeper, every link into `skills/` needed one more `../`. After any such move, list the links (`find <dir> -type l`), re-point them, and check each resolves (`[ -e link ]`), then run `make check-skill-links`.
- **Two open branches can take the same ticket numbers.** #314 and #320 both used ROOT-16 and AIS-28; the rebase surfaced it. When rebasing onto a `master` that gained scrolls tickets, renumber this branch's tickets (and every scrolls and PR line that cites them).
- **A rebase onto a release can move CHANGELOG entries into the released section, with no conflict.** When #265 was rebased onto `1.4.0-dev`, its package CHANGELOG entries matched context lines inside `## [1.3.0] - 2026-11-17` and merged there silently. After rebasing package work onto a new `-dev` version, check that every new entry sits under `## [x.y.z] - Unreleased`, not under a dated section.
- After a squash merge, a branch stacked on the merged one must be rebased with `--onto`. The family scrolls hold the exact recipe: `src/skills/development/review/docs/.scrolls/WISDOM.md` and `src/packages/aiskills/docs/.scrolls/WISDOM.md`.

- **Cloud sessions can push branches but not tags** (HTTP 403 from the git proxy), and the GitHub tools here can't create tags either. Make the tags locally, check them, and give the user one command to recreate and push them from their own clone. Then verify what reached GitHub.
- **This session's network can't reach `sugatoray.github.io`** (403 at the proxy). To verify a docs deploy, read the workflow's build job log (`get_job_logs`): `build-site.mjs` prints each page it wrote and a `site:` summary line, and the artifact step lists every file. Then ask the user to look at the live pages.
- **GitHub strips `<...>` from issue and PR titles** as if it were an HTML tag: "under v/<version>/" became "under v//". Write placeholders as `x.y.z` or `VERSION` in titles; bodies with backticks are safe. Read a title back after creating it.
- **The package tests only see git-tracked skills.** `sandbox({ realSkills: true })` copies the tracked skills, so a new skill is invisible to `npm run docs` and `npm test` until it is `git add`ed. Stage it first. Then expect hardcoded counts to fail in `banner.test.mjs` and `docs-html.test.mjs` (skills, skills per group, explainer tabs) and the docs examples' expected output in the Markdown pages: update them, and regenerate with `npm run docs` and `npm run banner:png`.
- **Adding a control to the docs header breaks the phone layout.** The search input can't render narrower than its padding (about 68px), so it overlaps the next button rather than shrinking. Check the header at iPhone width for sideways scroll and overlap; the docs browser tests do this for the version menu.

- **A new skill or group changes hard-coded numbers in the package tests and docs.** After `npm run docs` and `npm run banner:png`, expect to update `banner.test.mjs` (skill and group counts, the `#pills` counts), the `<!-- verify -->` outputs that list groups or skills (`guides/use-from-an-agent.md`, `reference/cli.md`, `tutorial/01`, `02`, `04`), and, for a new `.skillsignore`, the one-line `"ignored"` sample in `reference/files.md`. The package suite only counts git-tracked skills, so `git add` the skill first.
- **Never write a literal closing script tag inside an inline `<script>`, even in a comment.** It ends the block. Details and other HTML-deck traps are in `src/skills/productivity/docs/.scrolls/WISDOM.md`.

## Ditches — bad patterns or decisions to avoid
Bad patterns or decisions to never take, and why they were rejected.

- **Don't ship TDD logs inside a skill.** `npx skills add` copies the whole skill folder, nobody using the skill reads the logs, and they go stale with the next change (`*.log` is gitignored anyway). Keep the tests as the proof, and put the red/green story in the PR description and commit messages. The user decided this for `meeting-agenda` on 2026-11-16.

## Wisdom — best practices and Red/Green TDD
Best practices worth reusing.

- Always use Red/Green TDD while developing or fixing code.
- Edit a skill at its source under `skills/`, and make it available here with `make link-skills SKILL=<path>`. Check links with `make check-skill-links`. Claude Code picks up a new link live, within the running session.
- **When two PRs touch the same generated files, stack them.** Rebase the second onto the first and point it at the first's branch, so each diff is its own work. Regenerate conflicting generated files (`npm run docs`) instead of hand-merging them. Put later scrolls notes on the top branch, so the lower one doesn't move and force another rebase.
- **Before bumping a GitHub action's major version, read what the new major changes.** `actions/setup-node@v5` turns on dependency caching automatically when `package.json` has a `packageManager` field (and caching needs a lockfile). `actions/checkout@v5` needs runner 2.327.1+. Check the repo against each change (here: no `packageManager`, runner 2.338.2), and pin the versions with a test in `docs-workflow.test.mjs`.
- **A page that shows real command output stays reproducible by running the commands in the docs examples' sandbox.** Use the stand-in `npx`/`npm`, the sample registry data, a fixed `AISKILLS_TODAY` and a fresh home, then normalize sandbox paths to what a real install shows. Values that differ per machine (the Node.js version, save times) are masked in the up-to-date check, and an unchanged page isn't rewritten, so `npm run docs` causes no churn. Example: `create-cli-outputs.mjs`.
- **Docs that show real output stay true when a test replays them.** For a skill's examples, build the demo repository from fixed authors, dates and content, pin the clock, run each documented prompt, and compare every output exactly (`skills/scrolls/scrolls-compact/tests/check_examples.py`). Write a new example with its output left blank, watch the test fail, then **read** the real output before pasting it: doing that found three bugs in `/scrolls-compact`.
- **Keep files an agent reads under 2,000 lines.** The Read tool stops there by default, so the end of a longer file is silently missed. Split large reference material into a small index plus one file per entry, and let a test keep the index and the files in step (as `scrolls-compact`'s examples do).
- **Each npm release maps to a commit through `gitHead`** (`npm view @sugatoray-ai/aiskills@<v> gitHead`). Use it for tags and for anything that needs "the source of release X"; don't guess from dates.
- Repo-wide lessons go here. A lesson about one family goes in that family's scrolls under `src/`; point to it from here rather than copying it.
