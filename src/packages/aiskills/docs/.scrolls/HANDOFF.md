# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` `0.1.0` (folder `src/packages/aiskills/`) is feature-complete for a first release: bundling, postinstall, and the `aiskills` CLI with install / uninstall / installed / groups / find / passthrough (short aliases `i`, `r`, `ls`, `g`, `f`, `p`, `h`), skill groups, glob patterns and `--route`. `npm test` runs 119 offline tests (about 7 s) and `npm run test:e2e` runs 7 tests that use the real `npx skills` (they need network). Both pass. Everything is on branch `claude/focused-faraday-nqvduf` in the open PR [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122). Nothing has been published to npm.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { aiskills, ais -> bin/aiskills.mjs; aix -> bin/aix.mjs }
CHANGELOG.md            Keep a Changelog + SemVer; ships with the package
SECURITY.md             reporting + what the package touches + protections; ships
docs/meta/              ARCHITECTURE, FEATURES, MAINTAINERS (not published)
bin/aiskills.mjs        thin entry point: imports ../src/scripts/cli.mjs
bin/aix.mjs             sets AISKILLS_ROUTE=1, then imports the same CLI (aix = aiskills --route)
src/scripts/            cli.mjs, installer.mjs, postinstall.mjs, vendor-skills.mjs
src/test/               node:test suite
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/, LICENSE
```

## What just happened
- **Added `SECURITY.md`** (ships) and **`docs/meta/{ARCHITECTURE,FEATURES,MAINTAINERS}.md`** (not published), linked from the README. Writing the threat model turned up three real weaknesses.
- **Fixed all three, Red/Green TDD** (11 tests written first; they failed for the real reasons, then passed):
  1. `--route` used `npx skills find` text unchecked, and on Windows that text goes through `cmd.exe` (`ev&il/tools@ext` was installed). Now only `owner/repo@skill` made of `[A-Za-z0-9._-]` is used (`isSafeRegistrySpec`), others are ignored with a warning; and on Windows `runSkills` refuses any argument with `& | < > ^ % ! " ( )` and quotes ones with spaces.
  2. `--purge` (and `sync` replacing `skills/`) would delete/replace whatever `AISKILLS_HOME` pointed at. Now `assertInstallFolder` refuses an existing non-empty folder without our `aiskills.json`; `--purge` checks before removing anything.
  3. `npx -y skills` ran the latest `skills`. Now pinned: `skills@1.7.6` (`SKILLS_CLI_VERSION`), overridable with a validated `AISKILLS_SKILLS_VERSION`.
- Docs updated to match: SECURITY "Protections", MAINTAINERS (how to bump the pin), ARCHITECTURE, FEATURES, README env table, CHANGELOG "Security" under 0.1.0, SPEC.
- Just before: `CHANGELOG.md`, the `ais`/`aix` commands and single-letter aliases.

## Known issues / open threads
- PR #122 is open; publish only after it's merged (AIS-1).
- Awaiting the user's decision on AIS-7: keep the automatic install during `npm install` (A) or remove the `postinstall` script entirely (B). The env-var opt-in was dropped; see `PLAN.md` for the trade-offs.
- `--route` lookups were only tested against a local fake of the skills.sh search API (AIS-2).
- See `GAP_ANALYSIS.md` for the rest.
