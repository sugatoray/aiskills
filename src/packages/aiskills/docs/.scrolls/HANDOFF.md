# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` `0.1.0` (folder `src/packages/aiskills/`) is feature-complete for a first release: bundling, postinstall, and the `aiskills` CLI with install / uninstall / installed / groups / find / passthrough, skill groups, glob patterns and `--route`. `npm test` runs 85 offline tests (about 6 s) and `npm run test:e2e` runs 3 tests that use the real `npx skills` (they need network). Both pass. Everything is on branch `claude/focused-faraday-nqvduf` in the open PR [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122). Nothing has been published to npm.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { "aiskills": "bin/aiskills.mjs" }
bin/aiskills.mjs        thin entry point: imports ../src/scripts/cli.mjs
src/scripts/            cli.mjs, installer.mjs, postinstall.mjs, vendor-skills.mjs
src/test/               node:test suite
```

## What just happened
- Added `/AGENTS.md`, `/CLAUDE.md`, `/SCROLLS.md` and `/docs/.scrolls/` to the package's `.npmignore`, anchored to the package root. They change nothing today, because the `"files"` list already keeps these out and npm never lets `.npmignore` exclude anything `"files"` lists. They're a safety net in case `"files"` is ever removed. A new packaging test drops `"files"` in a scratch copy and checks both directions (memory files out, same-named files inside a skill still in); it fails if the entries are missing or unanchored.
- Earlier this session: the test suite, the final layout (`bin/aiskills.mjs` → `src/scripts/`, tests in `src/test/`), and the research on how npm packages ship skills (see `WISDOM.md`).

## Known issues / open threads
- PR #122 is open; publish only after it's merged (AIS-1).
- Awaiting the user's decision on AIS-6 (flat `skills/` so `npx skills experimental_sync` can find the skills) and AIS-7 (make the automatic install at npm-install time opt-in).
- `--route` lookups were only tested against a local fake of the skills.sh search API (AIS-2).
- See `GAP_ANALYSIS.md` for the rest.
