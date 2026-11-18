# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` is at `f27b875`:** [#272](https://github.com/sugatoray/aiskills/pull/272) squash-merged: the new `productivity` group with `meeting-agenda` (19 skills in 10 groups). It closed #273–#286. Before it, #306 (`90a835c`, `1.5.0-dev`) and #302 (release 1.4.0, `1780fd5`).
- **npm:** `@sugatoray-ai/aiskills` **1.4.0 is published** (`latest`, 2026-11-18T01:25Z; npm `gitHead` `1780fd5`), tagged `aiskills-v1.4.0`.
- **`claude/aiskills-1.5.0`** (from `f27b875`; release 1.5.0, ROOT-15): `package.json` `1.5.0`, `## [1.5.0] - 2026-11-18`, `SECURITY.md` `1.5.x`, the seven docs version examples, and the banner and docs regenerated (`7ad1450`). `npm test`: 520 pass. Open as [#310](https://github.com/sugatoray/aiskills/pull/310), like #287, with issues #311 → #312, #313; it carries this scrolls update too.

## What just happened
- The user merged #272 (the `meeting-agenda` work, rebased onto `1.5.0-dev`); its issues are closed. ROOT-14 ticked.
- At the user's request, started the 1.5.0 release on `claude/aiskills-1.5.0`, following `src/packages/aiskills/docs/meta/MAINTAINERS.md` → Releasing, steps 2–3, as #287 and #302 did.

## Known issues / open threads
- **The 1.4.0 CHANGELOG date** is 2026-11-18, npm's UTC date. In US Eastern time the publish was the evening of 2026-11-17 (the 1.3.0 note judged by US Eastern). The user was asked; no answer yet, so it stays.
- Nobody has looked at the rebuilt docs site since the tag push (this session can't reach `sugatoray.github.io`): `/` should be 1.4.0 and `/v/` the releases before it; `/dev/` shows the development version.
- **`tests/test_compact.ps1` has never run** (no `pwsh` in these sessions).
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered (ROOT-3).
- Branches holding only merged history, deletable at the user's call: `claude/clever-mendel-k9n73h` (#265), `claude/aiskills-1.4.0` (#302), `claude/aiskills-1.5.0-dev` (#306), `claude/sweet-hawking-7u1fpc` (#272), `claude/keen-babbage-2khhu9` (#215 era). The pre-rebase copy of #272 exists only as a local branch, `backup/pre-rebase-272`, in that session.
