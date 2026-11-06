# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` `0.1.0` (folder `src/packages/aiskills/`) is feature-complete for a first release: bundling, postinstall, and the `aiskills` CLI with install / uninstall / installed / groups / find / passthrough (short aliases `i`, `r`, `ls`, `g`, `f`, `p`, `h`), skill groups, glob patterns and `--route`. `npm test` runs 103 offline tests (about 7 s) and `npm run test:e2e` runs 5 tests that use the real `npx skills` (they need network). Both pass. Everything is on branch `claude/focused-faraday-nqvduf` in the open PR [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122). Nothing has been published to npm.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { "aiskills": "bin/aiskills.mjs" }
bin/aiskills.mjs        thin entry point: imports ../src/scripts/cli.mjs
src/scripts/            cli.mjs, installer.mjs, postinstall.mjs, vendor-skills.mjs
src/test/               node:test suite
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/, LICENSE
```

## What just happened
- **CLI aliases:** `i` (install), `r` (uninstall; `rm`/`remove` already worked and are now documented), `ls` (installed), `g` (groups), `f` (find), `p` (path), `h` (help). Mostly `npm`'s own short forms. `sync`, `skills` and `list` deliberately have none (see `WISDOM.md` → Ditches). Shown in `--help`, the README alias table and `SPEC.md`; a test checks every alias gives the same output and `npx skills` calls as its full command.
- **AIS-7 rewritten** after discussing its downsides: the env-var opt-in is dropped; the choice is now A (keep the automatic install) or B (remove the `postinstall` script entirely). Still the user's call.
- **Explained `aiskills sync`** to the user: it only refreshes `~/.config/sugatoray/aiskills/` (layout, marketplace.json, layout.json, aiskills.json); agents keep their own copies under `~/.agents/skills/` until `aiskills install` runs `npx skills add` again.
- Just before: AIS-6 (flat `skills/`, `.aiskills/layout.json` + `nested/`, `--nested`/`--flat`; `npx skills experimental_sync` now works). Details in `SPEC.md` and the README.

## Known issues / open threads
- PR #122 is open; publish only after it's merged (AIS-1).
- Awaiting the user's decision on AIS-7: keep the automatic install during `npm install` (A) or remove the `postinstall` script entirely (B). The env-var opt-in was dropped; see `PLAN.md` for the trade-offs.
- `--route` lookups were only tested against a local fake of the skills.sh search API (AIS-2).
- See `GAP_ANALYSIS.md` for the rest.
