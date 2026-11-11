# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` **`0.5.0` is published on npm** (2026-11-09, dist-tag `latest`; `0.4.0` was the first): `npm install -g @sugatoray-ai/aiskills`, then `aiskills install`. Source in `src/packages/aiskills/`; everything is on `master` ([sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122), [#146](https://github.com/sugatoray/aiskills/pull/146), [#147](https://github.com/sugatoray/aiskills/pull/147), [#153](https://github.com/sugatoray/aiskills/pull/153), [#154](https://github.com/sugatoray/aiskills/pull/154)). The package bundles 12 skills in 6 groups, is Apache-2.0 (the skills keep MIT in their `SKILL.md`), and has no install step. `npm test` runs 331 offline tests (all pass, about 60 s), `npm run test:e2e` 8 with the real `npx skills` (network), `python3 -m pytest -q skills/docs/create-lib-docs/tests` 9 (needs `pip install pytest`). Docs live at https://sugatoray.github.io/aiskills/, redeployed by `.github/workflows/aiskills-docs.yml` on pushes to `master`.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { aiskills, ais -> bin/aiskills.mjs; aix -> bin/aix.mjs }; scripts incl. docs, docs:skills, docs:html
CHANGELOG.md            Keep a Changelog + SemVer; ships with the package
SECURITY.md             reporting + what the package touches + protections; ships
docs/docsite/           user docs (not published): 43 Markdown pages incl. license.md (GENERATED), images/*.svg, llms.txt, llms-full.txt, index.html
docs/docsite/skills/    GENERATED: one page per bundled skill + overview (npm run docs:skills)
docs/banner/            banner: config.yaml, GENERATED aiskills-banner.html (editor page), banner_2x.png, README (not published)
docs/meta/              ARCHITECTURE, FEATURES, MAINTAINERS (not published)
bin/aiskills.mjs        thin entry point: imports ../src/scripts/core/cli.mjs
bin/aix.mjs             sets AISKILLS_ROUTE=1, then imports the same CLI (aix = aiskills --route)
src/scripts/README.md   what each scripts folder is for, the import rule (docs/ -> pack/ -> core/), what is published
src/scripts/core/       cli.mjs, installer.mjs (published; there is no install step)
src/scripts/pack/       vendor-skills.mjs, skillsignore.mjs (run at npm pack; never published)
src/scripts/docs/       build-skills-docs.mjs, build-docs-html.mjs, create-banner.mjs, themes.mjs, templates/ (build time only)
src/test/               node:test suite, incl. docs.test.mjs, docs-skills.test.mjs, docs-html.test.mjs, banner.test.mjs, themes.test.mjs
LICENSE                 Apache-2.0, the package's own (committed; never vendored)
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/
```

## What just happened
- **AIS-10, `0.6.0`, on `claude/aiskills-skills-version-range`** (from `master` after #160; no PR yet). After `0.5.0` was published (2026-11-09), the user's `~/.npmrc` (`min-release-age=7`) blocked first the package itself (fixed with `min-release-age-exclude[]=@sugatoray-ai/aiskills` in npm ≥ 11.21) and then `npx -y skills@1.7.6` (published 2026-11-03; `npx` ignores the exclude list). The user chose all four fixes and asked for interval notation: `[x, …)` >=x, `(x, …)` >x, `[x, y)` >=x <y, `(…, x]` <=x. Built Red/Green: `skillsVersionSpec`, `cmdArgs`, `explainReleaseAge`, npm release-age env pass-through, `src/scripts/pack/audit-skills.mjs` (`npm run audit:skills`), new `src/test/skills-version.test.mjs` (19 tests). Docs: rewritten guide `choose-the-skills-cli-version.md`, environment/errors/CLI references, FAQ, README, SECURITY.md, MAINTAINERS (audit step, 7-day rule), ARCHITECTURE, FEATURES, `src/scripts/README.md`. Version `0.6.0`, CHANGELOG dated 2026-11-11, banner and docs regenerated. `npm test` 331/331, `npm run test:e2e` 8/8. Checked against the real registry with `npm_config_before=2026-11-02`: the pin is refused and explained; `AISKILLS_SKILLS_VERSION='(…, 1.7.6]'` ran `skills@<=1.7.6` → 1.7.4. `npm run audit:skills` on 1.7.6: 8 days old, 0 advisories in 8 packages.
- **0.5.0 published** (2026-11-09) after #155 and #160 merged (#160: shorter npm description, docs-site homepage, keywords).
- Earlier: #146, #147, #153, #154 merged. Details: `CHANGELOG.md` and `git log`.

## Known issues / open threads
- The count is the first user-visible change since 0.4.0: release it as `0.5.0` (minor). New work goes under `## [Unreleased]` in `CHANGELOG.md`; the next release is a new version (`npm version <patch|minor|major>`; MAINTAINERS → Releasing). Expect npm to stage it again.
- **Next:** open/merge the PR for `claude/aiskills-skills-version-range`, then publish `0.6.0`: `npm run audit:skills`, `npm test` + `npm run test:e2e`, `npm run pack:dry`, `npm publish`, approve the staged release, then update SPEC's release note. (CHANGELOG already dated 2026-11-11; re-date if it ships later.)
- **Awaiting the user:** delete the leftover remote branch `claude/focused-faraday-nqvduf` (its only commit is on `master`)? Should the bundled skills move from MIT too (repo-wide; not done)?
- `--route` lookups still only tested against a fake registry (AIS-2) — now testable against the published package.
- `/scrolls-update` isn't an installed command in these sessions; follow `skills/scrolls/scrolls-update/SKILL.md` from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
