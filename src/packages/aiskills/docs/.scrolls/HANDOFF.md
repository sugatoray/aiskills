# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` `0.1.0` (folder `src/packages/aiskills/`) is feature-complete for a first release: bundling, postinstall, and the `aiskills` CLI with install / uninstall / installed / groups / find / passthrough, skill groups, glob patterns and `--route`. `npm test` runs 100 offline tests (about 7 s) and `npm run test:e2e` runs 5 tests that use the real `npx skills` (they need network). Both pass. Everything is on branch `claude/focused-faraday-nqvduf` in the open PR [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122). Nothing has been published to npm.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { "aiskills": "bin/aiskills.mjs" }
bin/aiskills.mjs        thin entry point: imports ../src/scripts/cli.mjs
src/scripts/            cli.mjs, installer.mjs, postinstall.mjs, vendor-skills.mjs
src/test/               node:test suite
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/, LICENSE
```

## What just happened
- **AIS-6 done: the package now ships `skills/` flat** (`skills/<skill-name>/`), so `npx skills experimental_sync` finds all 13 skills from a project's `node_modules` (verified in the e2e test). `vendor-skills.mjs` writes `.aiskills/layout.json` (skill → original folder, plus the list of files outside any skill folder) and `.aiskills/nested/` (those files). Groups now come from `layout.json`, so they work in both layouts.
- **`--nested` / `--flat`** (before the command or on `install`/`sync`; `AISKILLS_LAYOUT`) choose the layout of `~/.config/sugatoray/aiskills/skills/`. Nested is byte-for-byte the repo's `skills/` (checked by `diff -r` and the e2e test). The choice is remembered in `aiskills.json`; default flat.
- Checked before building: `npx skills add` finds the same 13 skills in a flat folder with or without `marketplace.json` beside it.
- Tests: 15 new ones (vendor flattening and its error checks, both layouts, layout precedence, packaging round-trip, two e2e). Deliberate-bug checks: dropping the group-level files, ignoring `layout.json` for groups, and not renaming `.gitignore` in the extras each turn tests red.
- README: new "Layouts" and "As a project dependency" sections; root README mentions both.

## Known issues / open threads
- PR #122 is open; publish only after it's merged (AIS-1).
- Awaiting the user's decision on AIS-7: keep the automatic install during `npm install` (A) or remove the `postinstall` script entirely (B). The env-var opt-in was dropped; see `PLAN.md` for the trade-offs.
- `--route` lookups were only tested against a local fake of the skills.sh search API (AIS-2).
- See `GAP_ANALYSIS.md` for the rest.
