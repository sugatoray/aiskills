# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
The package (`@sugatoray-ai/aiskills` `0.1.0`, folder `src/packages/aiskills/`) is feature-complete for its first release: bundling, postinstall, and the `aiskills` CLI with install / uninstall / installed / groups / find / passthrough, skill groups, glob patterns and `--route`. Everything is on branch `claude/focused-faraday-nqvduf`, in the open PR [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122). Nothing has been published to npm yet.

## What just happened
One long session built the package from scratch (see `SPEC.md`). Along the way it was:
- renamed from `@sugatoray/aiskills` to `@sugatoray-ai/aiskills` (the user owns the `sugatoray-ai` npm org);
- moved from `src/aiskills/` to `src/packages/aiskills/` (git rename; `vendor-skills.mjs` now finds the repo root by walking up instead of assuming a depth);
- given its scrolls memory (`/scrolls-setup`, then this `/scrolls-update`).

There is now a `node:test` suite (`npm test`: 83 offline tests, about 6 seconds; `npm run test:e2e`: a real install with the real `npx skills`, needs network). Both pass. A deliberate-bug check confirmed the suite catches regressions in env scrubbing, dotfile restoring, full-uninstall scope and ambiguous `--route` matches.

## Known issues / open threads
- PR #122 is open; publishing (`cd src/packages/aiskills && npm publish`) should wait until it's merged.
- `--route` lookups were only tested against a local fake of the skills.sh search API (`SKILLS_API_URL`), because the sandbox network blocks skills.sh. Real GitHub installs and removals were tested.
- See `GAP_ANALYSIS.md` for the rest.
