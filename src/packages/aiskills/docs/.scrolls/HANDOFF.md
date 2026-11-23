# HANDOFF.md — Change of Guard

## Current state

Release 1.6.0 is prepared in [#344](https://github.com/sugatoray/aiskills/pull/344) on `codex/aiskills-1.6.0`. The version, changelog date, README, SECURITY table, version examples and generated docs were updated. The release includes `agent-sessions-insight` and scrolls 2.7.0. npm reported 1.5.0 as latest on 2026-11-22; 1.6.0 was not published or tagged.

## Validation and remaining work

- Documentation checker: 55 pages, no problems. `npm run pack:dry`: passed, 421 files. `npm run audit:skills`: passed for `skills@1.7.6`, no advisories.
- Regenerate `docs/banner/banner_2x.png` with `npm run banner:png`: Chromium could not create a socket in the execution environment. The full test suite did not complete cleanly and browser tests failed to launch.
- `npm run test:e2e`: 7 passed, 1 failed because an npm environment warning changed expected output. Rerun the suite in a suitable environment and investigate any remaining failures.
- After checks and merge, follow `docs/meta/MAINTAINERS.md` → Releasing: publish from clean, up-to-date `master` and tag npm's recorded `gitHead`.
