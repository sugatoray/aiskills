# HANDOFF.md — Change of Guard

## Current state

Release 1.6.0 is prepared in [#344](https://github.com/sugatoray/aiskills/pull/344) on `codex/aiskills-1.6.0`. The version, changelog date, README, SECURITY table, version examples and generated docs were updated. The release includes `agent-sessions-insight` and scrolls 2.7.0. npm reported 1.5.0 as latest on 2026-11-22; 1.6.0 was not published or tagged.

The docs site build now adds Open Graph and X/Twitter social cards using the latest release banner. It will reach the live site when the docs workflow deploys after merge.

## Firewall work (2026-11-26, `claude/ecstatic-knuth-vmtilj`, AIS-32)

A user hit a firewall policy blocking git-like behaviour. The package itself was never a git dependency; the runtime was: the default skills.sh count `git clone`s github.com in a detached process, and every command downloaded `skills` with `npx -y` at run time. Now the count is off by default behind a mirror or proxy, `skills@1.7.6` is a pinned dependency run from `node_modules`, and `--route` failures explain GitHub/skills.sh. `npm test` 544 pass, `npm run test:e2e` 8 pass (run with `CI`/`GITHUB_ACTIONS` unset), `audit:skills` OK; a real `npm pack` + global install through this container's proxy ran `skills@1.7.6 (bundled)` and skipped the count ("npm uses a network proxy"). Not committed yet. Version bump undecided (see PLAN AIS-32).

## Validation and remaining work

- GitHub Actions run 45116511551 verified the committed banner and docs: `npm test` passed 522 tests, `npm run test:e2e` passed 8 tests, and `npm run audit:skills` passed. The test process omitted `GITHUB_ACTIONS`, and the end-to-end process also omitted `CI` so the upstream skills CLI did not impose a frozen lockfile; the end-to-end fixture keeps telemetry disabled.
- Social-card site and workflow tests: 19 passed; the built root page has absolute social metadata and the published image matches the current release banner.
- The docs checker reported 55 pages and no problems; the package dry run listed 421 files. The banner is rendered at 2560 × 1280 and its source fingerprint passes.
- After merge, follow `docs/meta/MAINTAINERS.md` → Releasing: publish from clean, up-to-date `master` and tag npm's recorded `gitHead`.
