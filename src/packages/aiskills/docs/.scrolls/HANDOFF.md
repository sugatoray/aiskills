# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` `0.2.0` (folder `src/packages/aiskills/`) is feature-complete for a first release: bundling, postinstall, and the `aiskills` CLI with install / uninstall / installed / groups / find / passthrough (short aliases `i`, `r`, `ls`, `g`, `f`, `p`, `h`), skill groups, glob patterns and `--route`. `npm test` runs 137 offline tests (about 7 s) and `npm run test:e2e` runs 7 tests that use the real `npx skills` (they need network). Both pass. Everything is on branch `claude/focused-faraday-nqvduf` in the open PR [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122). Nothing has been published to npm.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { aiskills, ais -> bin/aiskills.mjs; aix -> bin/aix.mjs }
CHANGELOG.md            Keep a Changelog + SemVer; ships with the package
SECURITY.md             reporting + what the package touches + protections; ships
docs/meta/              ARCHITECTURE, FEATURES, MAINTAINERS (not published)
bin/aiskills.mjs        thin entry point: imports ../src/scripts/cli.mjs
bin/aix.mjs             sets AISKILLS_ROUTE=1, then imports the same CLI (aix = aiskills --route)
src/scripts/            cli.mjs, installer.mjs, postinstall.mjs, vendor-skills.mjs, skillsignore.mjs (pack time only)
src/test/               node:test suite
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/, LICENSE
```

## What just happened
- **`.skillsignore`** (Red/Green TDD): `.gitignore`-syntax files anywhere under the repo's `skills/` keep files, folders or whole skills out of the package (`src/scripts/skillsignore.mjs`, used by `vendor()`). The ignore files never ship; ignoring only a `SKILL.md` is refused; `layout.json` lists `ignored`; skills are now copied file by file from the filtered list. The repo itself has **no** `.skillsignore` yet, so nothing shipped changed. Packaging/e2e comparisons now subtract ignored files.
- **Version bumped to `0.2.0`.** `0.1.0` was never published: the CHANGELOG now has `## [0.2.0] - Unreleased` (`.skillsignore`, `SECURITY.md`, the four security protections) above `## [0.1.0] - Never published` (everything else). AIS-1 now publishes `0.2.0`.
- Just before: `SECURITY.md` + `docs/meta/`, and the three security fixes (pinned `skills@1.7.6`, registry-text check + Windows shell check, install-folder guard).

## Known issues / open threads
- PR #122 is open; publish only after it's merged (AIS-1).
- Awaiting the user's decision on AIS-7: keep the automatic install during `npm install` (A) or remove the `postinstall` script entirely (B). The env-var opt-in was dropped; see `PLAN.md` for the trade-offs.
- `--route` lookups were only tested against a local fake of the skills.sh search API (AIS-2).
- See `GAP_ANALYSIS.md` for the rest.
