# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` is at `57188d0`:** [#265](https://github.com/sugatoray/aiskills/pull/265) squash-merged: `/scrolls-compact` (scrolls family 2.6.0), its example viewer and docs page, embedded docs pages following the light/dark button, and the `EXAMPLES.md` rename. The merge closed all 13 of its issues, #266–#271 and #295–#301 (checked).
- **npm:** `@sugatoray-ai/aiskills` **1.3.0** is the latest. `master` is `1.4.0-dev`.
- **`claude/aiskills-1.4.0`** (from `57188d0`): prepares the **1.4.0** release, as #287 did for 1.3.0 (Releasing steps 2–3 in `src/packages/aiskills/docs/meta/MAINTAINERS.md`):
  - `package.json` `1.4.0`, CHANGELOG `## [1.4.0] - 2026-11-18`, `SECURITY.md` `1.4.x`;
  - the seven docs version examples updated, and the banner (v1.4.0, 18 skills in 9 groups) and docs regenerated (`012f4bb`);
  - `npm test` 519 and `npm run test:e2e` 8, all pass.

## What just happened
- The user merged #265. At their request: created `claude/aiskills-1.4.0` from `master`, bumped the package to 1.4.0, and ran `/scrolls-update` (this update). Next, in their order: open a release PR like #287, then `/create-issues-update-pr`.

## Known issues / open threads
- **After the release PR merges** (ROOT-12): `npm run pack:dry`, `npm publish`, then tag `aiskills-v1.4.0` on its `gitHead` (steps 4–7). If it isn't published on 2026-11-18, change the CHANGELOG date first. Then extend the tag range in `SPEC.md` to `aiskills-v1.4.0`.
- **The package and scrolls-family scrolls still describe #265 as open** (AIS-23 in `src/packages/aiskills/docs/.scrolls/`, and `src/scrolls/docs/.scrolls/`). This run updated only the root scrolls. Run `/scrolls-update -p src/packages/aiskills/docs` and `/scrolls-update -p src/scrolls/docs` to record the merge and add `/scrolls-compact` to their `SPEC.md`.
- **`tests/test_compact.ps1` has never run** (no `pwsh` in these sessions).
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered (ROOT-3).
- `claude/keen-babbage-2khhu9` still holds merged #215-era history, and `claude/clever-mendel-k9n73h` (#265's branch) only merged history. Deleting or reusing them is the user's call.
