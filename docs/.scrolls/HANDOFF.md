# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` is at `b8ad785`:** [#310](https://github.com/sugatoray/aiskills/pull/310) (release 1.5.0) squash-merged; it closed #311–#313. Before it, #272 (`meeting-agenda`, `f27b875`).
- **npm:** `@sugatoray-ai/aiskills` **1.5.0 is published** (`latest`, 2026-11-18T03:01Z; npm `gitHead` `b8ad785`). The user pushed the annotated tag `aiskills-v1.5.0` on it, which rebuilds the docs site with 1.5.0 at the root.
- **`claude/aiskills-1.6.0-dev`** (from `b8ad785`; pushed; no PR yet, ROOT-16): the package's next version, `1.6.0-dev`, as #291 set `1.4.0-dev`: an empty `## [1.6.0] - Unreleased` section, the seven docs version examples, and the banner and docs regenerated (`5bdcc58`). `SECURITY.md` keeps `1.5.x`. 520 package tests pass. This scrolls update is on it too.

## What just happened
- The user merged #310, published 1.5.0 and pushed `aiskills-v1.5.0`; checked against the npm registry (`gitHead`) and the remote tag. ROOT-15 ticked; the tag range in `SPEC.md` runs to `aiskills-v1.5.0`. (The first check, right after the user said it was published, still showed 1.4.0; the release appeared a few minutes later, so check npm before tagging.)
- At the user's request, started `1.6.0-dev` on `claude/aiskills-1.6.0-dev` and ran the step-7 scrolls updates, like #291.

## Known issues / open threads
- **The 1.4.0 and 1.5.0 CHANGELOG dates** are 2026-11-18, npm's UTC date. In US Eastern time both were published on the evening of 2026-11-17 (01:25Z and 03:01Z; the 1.3.0 note judged by US Eastern). The user was asked about 1.4.0; no answer yet, so both stay.
- Nobody has looked at the rebuilt docs site since the tag push (this session can't reach `sugatoray.github.io`): `/` should be 1.5.0 and `/v/` the releases before it; `/dev/` shows the development version.
- **`tests/test_compact.ps1` has never run** (no `pwsh` in these sessions).
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered (ROOT-3).
- Branches holding only merged history, deletable at the user's call: `claude/clever-mendel-k9n73h` (#265), `claude/aiskills-1.4.0` (#302), `claude/aiskills-1.5.0-dev` (#306), `claude/sweet-hawking-7u1fpc` (#272), `claude/aiskills-1.5.0` (#310), `claude/keen-babbage-2khhu9` (#215 era). The pre-rebase copy of #272 exists only as a local branch, `backup/pre-rebase-272`, in that session.
