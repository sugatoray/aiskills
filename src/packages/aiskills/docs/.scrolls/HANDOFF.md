# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` **`0.4.0` is published on npm** (2026-11-09, dist-tag `latest`; the first published version): `npm install -g @sugatoray-ai/aiskills`, then `aiskills install`. Source in `src/packages/aiskills/`; everything is on `master` ([sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122), [#146](https://github.com/sugatoray/aiskills/pull/146), [#147](https://github.com/sugatoray/aiskills/pull/147), [#153](https://github.com/sugatoray/aiskills/pull/153)). The package bundles 12 skills in 6 groups, is Apache-2.0 (the skills keep MIT in their `SKILL.md`), and has no install step. `npm test` runs 291 offline tests (all pass, about 60 s), `npm run test:e2e` 8 with the real `npx skills` (network), `python3 -m pytest -q skills/docs/create-lib-docs/tests` 9 (needs `pip install pytest`). Docs live at https://sugatoray.github.io/aiskills/, redeployed by `.github/workflows/aiskills-docs.yml` on pushes to `master`.

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
- **0.4.0 published.** The maintainer ran `npm publish` on their laptop; npm **staged** it (the npm page showed a `0.0.0-stage` "Temporary Holding Version" placeholder, license "none") until they approved it (`npm stage approve`, or Staged Packages → Approve; 2FA, no npm-side review). Now `npm view @sugatoray-ai/aiskills version` → `0.4.0`. The `0.0.0-stage` placeholder version stays in the registry's version list.
- This branch (`claude/aiskills-0.4.0-published`, fresh from `master` after #153): `CHANGELOG.md` `## [0.4.0] - 2026-11-09`; MAINTAINERS release steps and the README publish block explain staged publishing; SPEC release status, PLAN AIS-1 `[x]`, GAP_ANALYSIS (dropped "not published"), WISDOM versions rule updated.
- Earlier: #146 (Apache-2.0, License page, create-lib-docs 1.2.0) and #147 (`newsletter-ai` left out) merged, then #153 (scrolls). Details: `CHANGELOG.md` and `git log`.

## Known issues / open threads
- New work goes under `## [Unreleased]` in `CHANGELOG.md`; the next release is a new version (`npm version <patch|minor|major>`; MAINTAINERS → Releasing). Expect npm to stage it again.
- **Awaiting the user:** delete the leftover remote branch `claude/focused-faraday-nqvduf` (its only commit is on `master`)? Should the bundled skills move from MIT too (repo-wide; not done)?
- `--route` lookups still only tested against a fake registry (AIS-2) — now testable against the published package.
- `/scrolls-update` isn't an installed command in these sessions; follow `skills/scrolls/scrolls-update/SKILL.md` from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
