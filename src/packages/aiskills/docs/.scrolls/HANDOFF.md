# HANDOFF.md — Change of Guard

## Current state

Release 1.6.0 is prepared in [#344](https://github.com/sugatoray/aiskills/pull/344) on `codex/aiskills-1.6.0`. The version, changelog date, README, SECURITY table, version examples and generated docs were updated. The release includes `agent-sessions-insight` and scrolls 2.7.0. npm reported 1.5.0 as latest on 2026-11-22; 1.6.0 was not published or tagged.

## Validation and remaining work

- GitHub Actions run 45116511551 verified the committed banner and docs: `npm test` passed 522 tests, `npm run test:e2e` passed 8 tests, and `npm run audit:skills` passed. The test process omitted `GITHUB_ACTIONS`, and the end-to-end process also omitted `CI` so the upstream skills CLI did not impose a frozen lockfile; the end-to-end fixture keeps telemetry disabled.
- The docs checker reported 55 pages and no problems; the package dry run listed 421 files. The banner is rendered at 2560 × 1280 and its source fingerprint passes.
- After merge, follow `docs/meta/MAINTAINERS.md` → Releasing: publish from clean, up-to-date `master` and tag npm's recorded `gitHead`.
