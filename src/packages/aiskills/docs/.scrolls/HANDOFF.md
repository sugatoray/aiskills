# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` `0.1.0` (folder `src/packages/aiskills/`) is feature-complete for a first release: bundling, postinstall, and the `aiskills` CLI with install / uninstall / installed / groups / find / passthrough (short aliases `i`, `r`, `ls`, `g`, `f`, `p`, `h`), skill groups, glob patterns and `--route`. `npm test` runs 108 offline tests (about 7 s) and `npm run test:e2e` runs 7 tests that use the real `npx skills` (they need network). Both pass. Everything is on branch `claude/focused-faraday-nqvduf` in the open PR [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122). Nothing has been published to npm.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { aiskills, ais -> bin/aiskills.mjs; aix -> bin/aix.mjs }
CHANGELOG.md            Keep a Changelog + SemVer; ships with the package
bin/aiskills.mjs        thin entry point: imports ../src/scripts/cli.mjs
bin/aix.mjs             sets AISKILLS_ROUTE=1, then imports the same CLI (aix = aiskills --route)
src/scripts/            cli.mjs, installer.mjs, postinstall.mjs, vendor-skills.mjs
src/test/               node:test suite
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/, LICENSE
```

## What just happened
- **Added `CHANGELOG.md`** (Keep a Changelog 1.1.0 + SemVer 2.0.0). It defines MAJOR/MINOR/PATCH for this package (new or updated bundled skills count as MINOR), has an empty `## [Unreleased]`, and lists the whole first release under `## [0.1.0] - Unreleased`, to be dated at publish time. It's in `"files"`, so it ships; the packaging test checks that. The README's publish steps and AIS-1 include dating it.
- Just before: the `ais` and `aix` commands, the single-letter aliases, AIS-7 rewritten, AIS-6 (flat `skills/` + `--nested`).

## Known issues / open threads
- PR #122 is open; publish only after it's merged (AIS-1).
- Awaiting the user's decision on AIS-7: keep the automatic install during `npm install` (A) or remove the `postinstall` script entirely (B). The env-var opt-in was dropped; see `PLAN.md` for the trade-offs.
- `--route` lookups were only tested against a local fake of the skills.sh search API (AIS-2).
- See `GAP_ANALYSIS.md` for the rest.
