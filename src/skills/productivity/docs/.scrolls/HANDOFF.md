# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`meeting-agenda` 1.0.0** shipped: PR [#272](https://github.com/sugatoray/aiskills/pull/272) merged as `f27b875`, released in the package's 1.5.0 ([#310](https://github.com/sugatoray/aiskills/pull/310), `b8ad785`).
- **`agent-sessions-insight` 1.0.0** (unreleased) is in [#320](https://github.com/sugatoray/aiskills/pull/320) (PROD-6), on `claude/wonderful-ptolemy-my8ha8`, rebased onto `master`'s `1.6.0-dev`. Issues: epic #321 with #322–#328. Registered in `skills/productivity/.claude-plugin/plugin.json` (1.1.0), `.claude-plugin/marketplace.json`, both READMEs and the package README, and linked into `.claude/skills/` and `.agents/skills/`.
- **The family:** `skills/productivity/meta/MAINTAINERS.md` (new) holds what the two skills share and the plugin's version rule; `src/skills/productivity/meta` links to it. It stays out of the npm package (`skills/.skillsignore`).
- **Tests:** `agent-sessions-insight` 82 pass (33 collector, 24 build script and template, 7 demo generator, 18 Playwright; `pip install playwright` in cloud sessions). The package's `npm test` passes 522.

## What just happened
- Built `agent-sessions-insight` on #320, red/green at every step: the user's patch (renamed from `agent-session-insight`), a Devin CLI adapter, a report template plus `build_report.py` (PROD-8), five report features (PROD-9), the demo generator `scripts/make_demo.py` (PROD-10) and a Grok CLI adapter (PROD-11). Each step's red/green story is in the PR description.
- Made all demo and fixture data fictional, with neutral sample names (`billing-api`, `taskq-cli`, `sample-app`, `demo-app`).
- Added the family's `meta/MAINTAINERS.md` and the `meta` link here.

## Known issues / open threads
- **Screenshots churn:** running the tests rewrites the four to six tracked screenshots in `meta/screenshots/` with tiny pixel differences. Restore them (`git checkout -- skills/productivity/meeting-agenda/meta/screenshots`) unless the UI really changed. The user was offered a fix (save screenshots only when asked) and hasn't answered.
- **agent-sessions-insight:** the Copilot CLI, Devin CLI, Grok CLI and OpenCode SQLite adapters are unverified against real logs (PROD-7).
