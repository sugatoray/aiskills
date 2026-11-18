# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` is at `1780fd5`:** [#302](https://github.com/sugatoray/aiskills/pull/302) (release 1.4.0) squash-merged; it closed #303–#305. Before it, #265 (`/scrolls-compact`, `57188d0`).
- **npm:** `@sugatoray-ai/aiskills` **1.4.0 is published** (`latest`, 2026-11-18T01:25Z; npm `gitHead` `1780fd5`). The user pushed the tag `aiskills-v1.4.0` on it, which rebuilds the docs site with 1.4.0 at the root.
- **`claude/aiskills-1.5.0-dev`** (from `1780fd5`; pushed; open as **[#306](https://github.com/sugatoray/aiskills/pull/306)**, mergeable, issues #307 → #308, #309): the package's next version, `1.5.0-dev`, as #291 set `1.4.0-dev`: an empty `## [1.5.0] - Unreleased` section, the seven docs version examples, and the banner and docs regenerated (`1e2ca73`). `SECURITY.md` keeps `1.4.x`. 519 package tests pass. This scrolls update is on it too (ROOT-13).

## What just happened
- The user merged #302, published 1.4.0 and pushed `aiskills-v1.4.0`; checked against npm (`gitHead`) and the remote tag. ROOT-12 ticked; the tag range in `SPEC.md` runs to `aiskills-v1.4.0`.
- At the user's request, started `1.5.0-dev` on `claude/aiskills-1.5.0-dev`, ran `/scrolls-update` on the root, package and scrolls-family scrolls, fixed two stale "#265 not merged" notes, and opened [#306](https://github.com/sugatoray/aiskills/pull/306) like #291 with its issues (#307 → #308, #309).

## Known issues / open threads
- **[#306](https://github.com/sugatoray/aiskills/pull/306) is open, not merged** (ROOT-13). Merging it moves `master` to `1.5.0-dev` and closes #307–#309. This scrolls update is on its branch too.
- **The 1.4.0 CHANGELOG date** is 2026-11-18, npm's UTC date. In US Eastern time the publish was the evening of 2026-11-17 (the 1.3.0 note judged by US Eastern). The user was asked; no answer yet, so it stays.
- Nobody has looked at the rebuilt docs site since the tag push (this session can't reach `sugatoray.github.io`): `/` should be 1.4.0 and `/v/` the releases before it; `/dev/` shows 1.5.0-dev once the branch merges.
- **`tests/test_compact.ps1` has never run** (no `pwsh` in these sessions).
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered (ROOT-3).
- Branches holding only merged history, deletable at the user's call: `claude/clever-mendel-k9n73h` (#265), `claude/aiskills-1.4.0` (#302), `claude/keen-babbage-2khhu9` (#215 era).
