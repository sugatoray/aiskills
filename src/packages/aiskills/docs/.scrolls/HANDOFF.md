# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` `0.1.0` (folder `src/packages/aiskills/`) is feature-complete for a first release: bundling, postinstall, and the `aiskills` CLI with install / uninstall / installed / groups / find / passthrough, skill groups, glob patterns and `--route`. `npm test` runs 84 offline tests (about 6 s) and `npm run test:e2e` runs 3 tests that use the real `npx skills` (they need network). Both pass. Everything is on branch `claude/focused-faraday-nqvduf` in the open PR [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122). Nothing has been published to npm.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { "aiskills": "bin/aiskills.mjs" }
bin/aiskills.mjs        thin entry point: imports ../src/scripts/cli.mjs
src/scripts/            cli.mjs, installer.mjs, postinstall.mjs, vendor-skills.mjs
src/test/               node:test suite
```

## What just happened
- Added the `node:test` suite (unit, CLI with a stand-in `npx`, packaging, gated e2e). A deliberate-bug check showed it catches regressions.
- Restructured the package several times at the user's request: everything under `src/aiskills/`, then `src/scripts/` + `src/test/`, then `cli.mjs` in `src/bin/`, and finally the layout above. The user asked to model it on `sugatoray/pptxdiff`; that repo's root package keeps `bin/cli.js` at the top and its code in `src/pptxdiff/`. None of its `src/packages/*` packages has an inner `src/`.
- Researched how npm packages that ship skills are structured (findings in `WISDOM.md`). This produced two proposals the user hasn't answered yet: `PLAN.md` AIS-6 and AIS-7.

## Known issues / open threads
- PR #122 is open; publish only after it's merged (AIS-1).
- Awaiting the user's decision on AIS-6 (flat `skills/` so `npx skills experimental_sync` can find the skills) and AIS-7 (make the automatic install at npm-install time opt-in).
- `--route` lookups were only tested against a local fake of the skills.sh search API (AIS-2).
- See `GAP_ANALYSIS.md` for the rest.
