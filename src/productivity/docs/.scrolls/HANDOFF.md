# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`meeting-agenda` 1.0.0** shipped: PR [#272](https://github.com/sugatoray/aiskills/pull/272) merged as `f27b875`, released in the package's 1.5.0 ([#310](https://github.com/sugatoray/aiskills/pull/310), `b8ad785`).
- **`agent-sessions-insight` 1.0.0** (unreleased) is on `claude/wonderful-ptolemy-my8ha8`, open as PR [#320](https://github.com/sugatoray/aiskills/pull/320) (PROD-6). It's registered in `skills/productivity/.claude-plugin/plugin.json` (1.1.0), `.claude-plugin/marketplace.json`, both READMEs, the package README, and as links in `.claude/skills/` and `.agents/skills/`.
- **Tests:** `agent-sessions-insight` 82 pass (33 collector, 24 build script and template, 7 demo generator, 18 Playwright browser tests; `pip install playwright` in cloud sessions). The npm package's 521 pass after regenerating its docs and banner for 20 skills in 10 groups.

## What just happened
- Applied the user's `agent-session-insight` patch as `agent-sessions-insight` (renamed throughout: folder, frontmatter, slash commands, output files).
- Added a Devin CLI adapter red/green: five `DevinAdapter` tests plus Devin in the `Discover` test failed first (5 errors, 1 failure), then passed once `parse_devin` was in. The red/green summary is in the PR description.
- Regenerated the package docs site (`npm run docs`, `npm run banner:png`), fixed the four hand-written CLI examples and the `banner.test.mjs` counts, added a `## [1.6.0] - Unreleased` package CHANGELOG entry, and updated these, the root and the package scrolls.

- Replaced the hand-written report with a template plus build script (PROD-8), red/green. Red: the new test modules failed on import (no `build_report`), then 20 errors and 1 failure with the script but no template. Green: all 58 pass after the template and its demo data. Checked the page by eye in light, dark and at 375 px, and fixed wrapped timeline labels, mid-word breaks in phone tables, and the demo's kinds counts.
- The demo generator is now in the skill as `scripts/make_demo.py` (PROD-10), red/green: 6 tests, including one that fails when the shipped demo differs from a fresh build (checked by changing the seed).

- Added five report features at the user's request (PROD-9), red/green: 14 tests failed first; two of those were test bugs (a hidden `<details>` table read with `inner_text()`), then all 70 passed.

- Added a Grok CLI adapter (PROD-11), red/green, from the session layout other usage tools report.

## Known issues / open threads
- **Screenshots churn:** running the tests rewrites the four to six tracked screenshots in `meta/screenshots/` with tiny pixel differences. Restore them (`git checkout -- skills/productivity/meeting-agenda/meta/screenshots`) unless the UI really changed. The user was offered a fix (save screenshots only when asked) and hasn't answered.
- **agent-sessions-insight:** the Copilot CLI, Devin CLI, Grok CLI and OpenCode SQLite adapters are unverified against real logs (PROD-7).
