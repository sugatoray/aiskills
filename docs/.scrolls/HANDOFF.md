# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` is at `a92ab00`:** #287 (release 1.3.0) squash-merged; issues #288–#290 closed by it.
- **npm:** `@sugatoray-ai/aiskills` **1.3.0 is published** (`latest`, 2026-11-17T23:07Z; npm `gitHead` `a92ab00`). The user pushed the tag `aiskills-v1.3.0`, which rebuilds the docs site with 1.3.0 at the root.
- **`claude/aiskills-1.4.0-dev`** (from `a92ab00`; pushed; **no PR yet**): the package's next version, `1.4.0-dev`, with an empty `## [1.4.0] - Unreleased` section and the docs regenerated (`0576950`), plus this scrolls update. 515 package tests pass.

## What just happened
- Prepared 1.3.0 in #287; the user merged, published and tagged it. ROOT-6 ticked; the tag range in `SPEC.md` now runs to `aiskills-v1.3.0`.
- Set the package to `1.4.0-dev` at the user's request. Package detail is in `src/packages/aiskills/docs/.scrolls/`.

## Known issues / open threads
- **No PR for `claude/aiskills-1.4.0-dev` yet.** Open one when the user asks.
- **`claude/awesome-knuth-8n4u00`** (#287's branch) holds only merged history and can be deleted.
- Nobody has looked at the rebuilt docs site since the tag push (this session can't reach `sugatoray.github.io`): `/` should be 1.3.0 and `/v/` the releases before it; `/dev/` shows 1.4.0-dev once the branch merges.
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered.
- `claude/keen-babbage-2khhu9` still holds merged #215-era history. Reusing it needs a reset from `master` and a force push, which the user must approve.
