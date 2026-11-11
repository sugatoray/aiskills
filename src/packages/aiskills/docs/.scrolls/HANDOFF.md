# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` **`0.7.0` is published on npm** (dist-tag `latest`; checked with `npm view` on 2026-11-11). It bundles **13 skills in 7 groups**. Source in `src/packages/aiskills/`. **Open: [#184](https://github.com/sugatoray/aiskills/pull/184)** (`claude/happy-ramanujan-yf66t0`) is **`0.8.0`**, not merged or published: `install -i`/`-l` (AIS-13), `aiskills info` and `aiskills releases`/`rel` with `--downloads` (AIS-14), mirror/firewall hardening, and the docs for all of it. On that branch `npm test` runs 395 offline tests, all pass; `releases` was also run live against npm and api.npmjs.org. Docs live at https://sugatoray.github.io/aiskills/, redeployed by `.github/workflows/aiskills-docs.yml` on pushes to `master`.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { aiskills, ais -> bin/aiskills.mjs; aix -> bin/aix.mjs }; scripts incl. docs, docs:skills, docs:html
CHANGELOG.md            Keep a Changelog + SemVer; ships with the package
SECURITY.md             reporting + what the package touches + protections; ships
docs/docsite/           user docs (not published): 45 Markdown pages incl. license.md (GENERATED), images/*.svg, llms.txt, llms-full.txt, index.html
docs/docsite/skills/    GENERATED: one page per bundled skill + overview (npm run docs:skills)
docs/banner/            banner: config.yaml, GENERATED aiskills-banner.html (editor page), banner_2x.png, README (not published)
docs/meta/              ARCHITECTURE, FEATURES, MAINTAINERS (not published)
bin/aiskills.mjs        thin entry point: imports ../src/scripts/core/cli.mjs
bin/aix.mjs             sets AISKILLS_ROUTE=1, then imports the same CLI (aix = aiskills --route)
src/scripts/README.md   what each scripts folder is for, the import rule (docs/ -> pack/ -> core/), what is published
src/scripts/core/       cli.mjs, installer.mjs, releases.mjs (published; there is no install step)
src/scripts/pack/       vendor-skills.mjs, skillsignore.mjs (run at npm pack; never published)
src/scripts/docs/       build-skills-docs.mjs, build-docs-html.mjs, create-banner.mjs, themes.mjs, templates/ (build time only)
src/test/               node:test suite, incl. docs.test.mjs, docs-skills.test.mjs, docs-html.test.mjs, banner.test.mjs, themes.test.mjs
LICENSE                 Apache-2.0, the package's own (committed; never vendored)
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/
```

## What just happened (this session, all in #184)
- **Agents question → AIS-13.** `npx skills add --yes` without `--agent` installs to *detected* agents (+ universal), all agents only if none is detected (read from `skills@1.7.6`'s source). Added `install -i` (no `--yes`/`--skill '*'`: the `npx skills` pickers, last pick pre-checked; needs a TTY) and `install -l`/`--last-agents` (`lastSelectedAgents` from `skillsLockPath()`).
- **0.8.0 bump** (user's request): `package.json`, CHANGELOG `[0.8.0] - 2026-11-11` (+ link refs 0.5.0–0.8.0), SECURITY `0.8.x`, banner, docs version examples.
- **AIS-14, designed with the user over several turns** (see PLAN): `info` (offline; `--full`; `--json`) and `releases`/`rel` (`<n>|all`, `-L`/`--last`; `--downloads [period]`, `--chart`/`--table`, `--by`, `--ascii`, `--json`). New `src/scripts/core/releases.mjs` (shipped). Tests: `releases.test.mjs` (unit), `info-releases.test.mjs` (fake `npm` + fake api.npmjs.org server process in `helpers.mjs`); docs examples use `SAMPLE_VIEW`/`SAMPLE_API`, `AISKILLS_TODAY=2026-11-12`, sandbox package path shown as `/usr/local/lib/node_modules/@sugatoray-ai/aiskills`.
- **Firewall/mirror hardening** (Red/Green): `npm view` also reads `versions` (mirrors that strip `time` still list versions, `–` dates, a note); errors and `--json` name the registry; footer gives the local `CHANGELOG.md` + URL; FAQ table and `NODE_EXTRA_CA_CERTS` note.
- **Docs:** tutorial 02, FAQ, agent guide, installation, landing page (the `video` group was missing), reference cli/environment/errors, README, ARCHITECTURE/MAINTAINERS, `src/scripts/README.md`; `index.html`/`llms*.txt` regenerated each time.

## Known issues / open threads
- **0.9.0 / AIS-15 on branch `claude/aiskills-upgrade-v0.9.0`** (stacked on #184; its own PR): `aiskills upgrade` (`src/scripts/core/upgrade.mjs`, `upgrade()` in `cli.mjs`); tests `upgrade.test.mjs` (unit) and `upgrade-cli.test.mjs` (sandbox with `globalNpm: true`: fake `npm root -g` / `install -g` that rewrites the package, `FAKE_NPM_NEW_SKILL`/`_DROP_SKILL`/`_INSTALL_ERROR`, `sb.npmCalls()`, `sb.setVersion()`); docs examples now run in a global-npm sandbox with `DOCS_VIEW` (adds 0.9.0), `AISKILLS_TODAY=2026-11-21`, and a `version=` verify param. Bumped to 0.9.0 (CHANGELOG `[0.9.0] - 2026-11-11`, SECURITY `0.9.x`, banner, docs). 418 tests pass.
- **Next:** merge #184, then publish `0.8.0`: `npm run audit:skills`, `npm test` + `npm run test:e2e`, `npm run pack:dry`, `npm publish`, `npm stage approve`; then update SPEC's release note and re-date `[0.8.0]` if it ships later than 2026-11-11.
- **Issues filed** (create-issues-update-pr, by hand): epic [#185](https://github.com/sugatoray/aiskills/issues/185) with children #186 (`-i`/`-l`), #187 (docs), #188 (0.8.0 bump), #189 (`info`), #190 (`releases`), #191 (mirrors, Bug), #192 (scrolls). #184 retitled to match the epic; its body (Summary/Details/Issues) closes all eight on merge.
- **Try by hand on a real machine:** `aiskills install -i` (the real pickers were never driven; with `-p`, `npx skills` also asks for the scope).
- **`info --full` has no detected-agents list** (not exposed by `npx skills`); `--downloads` behind a proxy needs Node 22.21+/24+ (see GAP_ANALYSIS).
- **Windows is untested** (incl. `npm.cmd` for `releases`): run `aiskills skills --version` with `AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]'` in PowerShell and `set "AISKILLS_SKILLS_LIB_VERSION=(..., 1.7.6]"` in Command Prompt.
- **The user's `~/.npmrc`:** `skills` in their `min-release-age-exclude[]` line does nothing for `npx`; they can drop it.
- **Awaiting the user:** delete the leftover remote branch `claude/focused-faraday-nqvduf`? Should the bundled skills move from MIT too (repo-wide; not done)?
- **1.0.0:** remove the `AISKILLS_SKILLS_VERSION` fallback (AIS-11). `--route` lookups still only tested against a fake registry (AIS-2).
- `/scrolls-update`, `/create-lib-docs` and `/create-issues-update-pr` aren't installed commands in these sessions; follow their `SKILL.md` files from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
