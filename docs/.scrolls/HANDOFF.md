# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` is at `90a835c`:** [#306](https://github.com/sugatoray/aiskills/pull/306) squash-merged, so the package is `1.5.0-dev`. Before it, #302 (release 1.4.0, `1780fd5`) and #265 (`/scrolls-compact`, `57188d0`).
- **npm:** `@sugatoray-ai/aiskills` **1.4.0 is published** (`latest`, 2026-11-18T01:25Z; npm `gitHead` `1780fd5`). The user pushed the tag `aiskills-v1.4.0` on it, which rebuilds the docs site with 1.4.0 at the root.
- **`claude/sweet-hawking-7u1fpc`** → PR [#272](https://github.com/sugatoray/aiskills/pull/272) (ROOT-14), rebased onto `90a835c` on 2026-11-18: the new `productivity` group with `meeting-agenda`. Its package changes land in `## [1.5.0] - Unreleased` (19 skills in 10 groups); 520 package tests pass. The skill's own state is in `src/productivity/docs/.scrolls/HANDOFF.md`.

## What just happened
- The user merged #302, published 1.4.0 and pushed `aiskills-v1.4.0`; checked against npm (`gitHead`) and the remote tag. ROOT-12 ticked; the tag range in `SPEC.md` runs to `aiskills-v1.4.0`.
- At the user's request, started `1.5.0-dev` on `claude/aiskills-1.5.0-dev`, ran `/scrolls-update` on the root, package and scrolls-family scrolls, fixed two stale "#265 not merged" notes, and opened [#306](https://github.com/sugatoray/aiskills/pull/306) like #291 with its issues (#307 → #308, #309).

## Known issues / open threads
- **The 1.4.0 CHANGELOG date** is 2026-11-18, npm's UTC date. In US Eastern time the publish was the evening of 2026-11-17 (the 1.3.0 note judged by US Eastern). The user was asked; no answer yet, so it stays.
- Nobody has looked at the rebuilt docs site since the tag push (this session can't reach `sugatoray.github.io`): `/` should be 1.4.0 and `/v/` the releases before it; `/dev/` shows 1.5.0-dev once the branch merges.
- **`tests/test_compact.ps1` has never run** (no `pwsh` in these sessions).
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered (ROOT-3).
- Branches holding only merged history, deletable at the user's call: `claude/clever-mendel-k9n73h` (#265), `claude/aiskills-1.4.0` (#302), `claude/keen-babbage-2khhu9` (#215 era).
