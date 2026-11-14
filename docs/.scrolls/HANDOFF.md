# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- `master` is at `089f938`: `/run-code-review` 1.2.0 (#215, #223) is merged, and `@sugatoray-ai/aiskills` 1.2.0 is published to npm as `latest`.
- [#230](https://github.com/sugatoray/aiskills/pull/230) (`claude/skill-symlinks`) is open and mergeable, with 6 commits directly on `master`:
  1. `make link-skills`: `scripts/link-skills.sh`, the `Makefile` and 59 tests.
  2. 18 symlinks that put the scrolls family and `create-issues-update-pr` into `.agents/skills/` and `.claude/skills/`.
  3. One scrolls commit with three parts: the 1.2.0 release record (package and review-skill scrolls); these root scrolls and their first update; and the npm package's scrolls update (the links leave the package unchanged).
  4. Two more symlinks for `create-lib-docs`, which the user asked for, with the scrolls lines that list linked skills.
  5. Two more for `network-flow`, the same way.
  6. Two more for `run-code-review`, the same way, plus a note in the review family's `HANDOFF`: 24 links in all.

  Issues #231 (parent), #232 and #233 cover commits 1 and 2.
- The root `docs/.scrolls/` were set up on 2026-11-13 with `/scrolls-setup -t`, run through the new `.claude/skills/scrolls-setup` link. Until #230 merges they live only on that branch.

## What just happened
- Ran `/scrolls-setup -t` and committed the result to #230, the branch the user chose.
- Ran `/scrolls-update` here and for `src/packages/aiskills/`.
- Kept #230's description in step. With the user's OK, squashed its five scrolls commits into one and force-pushed.
- Linked `create-lib-docs`, then `network-flow`, then `run-code-review`. `npx skills@1.7.6 add . --list` still finds 18 skills, with no duplicates.

## Known issues / open threads
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered.
- `claude/keen-babbage-2khhu9` (this session's designated branch) still holds merged #215-era history. Reusing it needs a reset from `master` and a force push, which the user must approve.
