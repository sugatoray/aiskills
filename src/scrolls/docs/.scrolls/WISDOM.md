# WISDOM.md — Constraints, Traps, Ditches, and Wisdom

Hard-won lessons for this project. Read this LAST, right before editing code, so it's freshest in mind.

## Constraints — respect and conform to them

- All five `scrolls-*` skills are versioned in lockstep (`skills/scrolls/meta/MAINTAINERS.md`). Never bump one skill's `metadata.version` without bumping all five to the same new number in the same commit.
- `CLAUDE.md` is always assumed to be an exact, direct sibling of the `docs` folder (`dirname(docs_dir)`) across the whole family's rewrite/backfill logic (`scrolls-hide`, `scrolls-unhide`, and now `scrolls-update`'s backfill). This is a deliberate, documented simplifying assumption inherited from the original `scrolls-setup` convention — don't try to generalize it away.
- `SCROLLS.md`/`CLAUDE.md`/`AGENTS.md` content templates live in exactly one place — `scrolls-setup/assets/templates/` — and every other skill that needs that content (`scrolls-update`'s backfill) reads it from there rather than duplicating it, to avoid drift.
- This sandboxed environment has no `pwsh` — never claim a `.ps1` change was "tested," only that it mirrors verified `.sh` behavior.
- `skills.sh` (the domain, not the CLI) is blocked by this environment's egress proxy (org policy 403) — audit pages there have to come from the user as screenshots/pasted text, not fetched directly.

## Traps — avoid them always

- Automated security scanners (specifically: Snyk E004) flag "a scope-restriction claim stated early, paired with a same-document instruction to modify that exact resource later" as prompt injection — **even when the two statements aren't actually in logical conflict** (the modify target was always the documented exception). The fix is structural: move the maintainer-only instruction out of the document the agent reads at invocation time, into a separate file that's only ever *named*, never quoted. Rewording in place does not reliably clear the finding; the shape has to change.
- `find <dir> -type d -exec rm -rf {} +` silently skips symlinks (type `l`, not `d`) — when cleaning up a symlink-heavy tree (e.g. the `skills` CLI's "universal" canonical copy plus dozens of per-agent symlinks), a `-type d` filter leaves every symlink behind looking "already gone" on a naive listing, while `find <dir> -iname "pattern"` (no type filter) still finds them. Verify cleanup with an unfiltered listing, not a `-type d`-filtered one.
- `npx skills add owner/repo --all --global` legitimately fails for a handful of agents that don't support global-scope installs (e.g. Eve, PromptScript as of testing) — the tool reports and skips just those; treat that as expected output, not a test failure, as long as the rest still succeed.

- A leave-alone condition written as "A or B" is only as safe as A and B actually being equivalent outcomes. `scrolls-setup`'s original `CLAUDE.md` rule treated "already references `SCROLLS.md`" and "already points straight at `SCROLLS_PATH/STARTER.md` (the pre-split convention)" as interchangeable reasons to skip insertion — but only the first one actually satisfies "CLAUDE.md points at SCROLLS.md." The second one is exactly the case backfilling exists to fix, and the merged condition silently skipped it forever. When copying a three-way (create/insert/leave-alone) rule into a new context, re-derive the leave-alone condition from the actual goal instead of trusting that the old wording still means what it used to.

- The `skills` CLI's unattended install (`--yes`, no `--agent`) doesn't require or default to a hardcoded agent — it calls its own `detectInstalledAgents()` (checks for markers like `~/.claude`, `~/.cursor`, `~/.cline` etc.) and installs to exactly that detected set, matching what the interactive picker shows pre-checked. Verified by reading the CLI's own bundled source (`node_modules/skills/dist/cli.mjs`, cached locally by `npx`) rather than relying on `--help` text alone — `--help` only lists flag names, not what happens when a flag is *omitted*, and that omitted-flag behavior turned out to be the actually useful thing to document. When a CLI's documented `--help` doesn't answer "what's the default," check whether its source is sitting in the local npm/npx cache before guessing or asking the user to test it live.

## Ditches — bad patterns or decisions to avoid

- Don't leave GitHub issues open-ended prose when the ask is "group some into bigger issues with subtasks" — use the real `sub_issue_write` API (native GitHub sub-issue hierarchy) over markdown checklists when it's available; it's genuinely a different, better-supported feature (progress bars, linked issue views), not just a formatting choice.
- Don't close tracking issues (or mark a PR as done) the moment the code is pushed — a PR that hasn't merged yet means the work isn't actually live; keep issues open and re-verify PR state on each check-in instead of assuming done means merged.

## Wisdom — best practices and Red/Green TDD

- Always use Red/Green TDD while developing or fixing code.
- Before writing "tested" install/CLI instructions into any doc, actually run every documented command form against the real target (in an isolated scratch dir, or with a clear rollback plan) first, verify the outcome, then fully clean up and confirm via `git status` / a directory sweep — never write down an untested command as if it were verified.
- When a family of sibling skills/packages shares content or conventions, put the canonical copy in exactly one of them and have the others reference it (relative path, explicit "single source of truth" note in each `meta/MAINTAINERS.md`) rather than hand-syncing duplicated copies.
- When a breaking change is deliberately introduced (e.g. `scrolls-hide`/`scrolls-unhide`'s rewrite-target change), say so explicitly in the changelog *and* give the concrete, safe remediation step (here: re-running `/scrolls-setup` against an old project is safe and closes the gap) — don't just describe the change and leave the reader to work out what to do about it.
