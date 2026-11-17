# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` is at `904e593`.** Since the last snapshot:
  - #245 (colored CLI output, the CLI outputs page) was squash-merged as `73af49b`.
  - #250 (`aiskills config`, the grouped Skills tab) was squash-merged as `904e593`.
- **npm:** `@sugatoray-ai/aiskills` 1.2.0 is still the latest.
- **Release 1.3.0 prepared in [#287](https://github.com/sugatoray/aiskills/pull/287)** (branch `claude/awesome-knuth-8n4u00`, `0122db5`): `package.json` `1.3.0`, CHANGELOG dated 2026-11-17, SECURITY `1.3.x`, docs examples, banner and docs regenerated. 515 package tests pass. Not merged, published or tagged.

## What just happened
- The user asked to bump the package from `1.3.0-dev` to `1.3.0`; done per the package's MAINTAINERS → Releasing steps 2–3. The PR was opened from the Claude Code UI.
- Package detail is in `src/packages/aiskills/docs/.scrolls/` (HANDOFF, AIS-20).

## Known issues / open threads
- **Finish 1.3.0 (ROOT-6 / AIS-20):** `npm run test:e2e` (not run), merge #287, then publish from an up-to-date `master` and tag `aiskills-v1.3.0` on its `gitHead`. Change the CHANGELOG date if the release day isn't 2026-11-17.
- **Watching #287:** offered to the user; no answer yet.
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered.
- `claude/keen-babbage-2khhu9` still holds merged #215-era history. Reusing it needs a reset from `master` and a force push, which the user must approve.
