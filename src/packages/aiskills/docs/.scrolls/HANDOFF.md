# HANDOFF.md — Change of Guard

## Current state

Release 1.6.0 is prepared on `codex/aiskills-1.6.0`: package version and release date updated, README highlights and SECURITY support table refreshed, and user docs regenerated. It includes `agent-sessions-insight` and scrolls 2.7.0. The release has not been published or tagged. Follow `docs/meta/MAINTAINERS.md` → Releasing after completing the checks below.

## Remaining checks

- Regenerate `docs/banner/banner_2x.png` with `npm run banner:png` in an environment where Playwright's Chromium can launch; this environment's Chromium fails to create a socket.
- Run the full offline tests and network-dependent `npm run test:e2e` and `npm run audit:skills`; verify the npm registry and package before publishing. Publish from a clean, up-to-date `master`, then tag the npm `gitHead` as described in MAINTAINERS.
