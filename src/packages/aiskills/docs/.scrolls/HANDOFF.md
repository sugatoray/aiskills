# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` **`0.4.0` is published on npm** (2026-11-09, dist-tag `latest`; the first published version): `npm install -g @sugatoray-ai/aiskills`, then `aiskills install`. Source in `src/packages/aiskills/`; everything is on `master` ([sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122), [#146](https://github.com/sugatoray/aiskills/pull/146), [#147](https://github.com/sugatoray/aiskills/pull/147), [#153](https://github.com/sugatoray/aiskills/pull/153), [#154](https://github.com/sugatoray/aiskills/pull/154)). The package bundles 12 skills in 6 groups, is Apache-2.0 (the skills keep MIT in their `SKILL.md`), and has no install step. `npm test` runs 311 offline tests (all pass, about 60 s), `npm run test:e2e` 8 with the real `npx skills` (network), `python3 -m pytest -q skills/docs/create-lib-docs/tests` 9 (needs `pip install pytest`). Docs live at https://sugatoray.github.io/aiskills/, redeployed by `.github/workflows/aiskills-docs.yml` on pushes to `master`.

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
- **skills.sh install count (AIS-9): [#155](https://github.com/sugatoray/aiskills/pull/155), open**, branch `claude/aiskills-install-stats`, one commit (`e6526e8`) on top of `master`. It was stacked on #154; after #154's squash-merge it was rebased onto `master` at the user's request (`git rebase --onto origin/master <old #154 commit>`, master's tree was identical to #154's, so no conflicts; 311/311 re-run) and pushed with `--force-with-lease=<branch>:<old sha>`. The user asked that installs through `aiskills` count on skills.sh like `npx skills add` does, skipped silently without github.com, and that users can turn it off entirely. Found in `skills@1.7.6`'s `dist/cli.mjs`: install events go to `https://www.skills.sh/tele/t` only for GitHub sources (local folders get `null` from `getOwnerRepo`) and only after `api.github.com` says the repo is public; `DISABLE_TELEMETRY`/`DO_NOT_TRACK` stop them. Built (Red/Green): after a successful bundled install, `countInstall()` spawns a detached node process that runs `npx skills add sugatoray/aiskills --skill … --agent <-a or universal> --copy --yes` in a new temp folder, then deletes it. `--no-stats`/`--stats` (remembered), `AISKILLS_STATS`, `AISKILLS_STATS_FOREGROUND`; `DO_NOT_TRACK`/`DISABLE_TELEMETRY`/`CI`/`GITHUB_ACTIONS` always off. New `src/test/stats.test.mjs` (20 tests); the docs examples now show the extra line; new docs page `concepts/install-count.md`; README, SECURITY.md, FAQ, references, CHANGELOG `[Unreleased]` updated. `npm test` 311/311, `npm run test:e2e` 8/8. Checked the real command once with `DISABLE_TELEMETRY=1`: it installed only into the temp folder.
- **Version bumped to `0.5.0`** (on #155's branch): `package.json`, `## [0.5.0] - Unreleased` in `CHANGELOG.md` (holds the skills.sh count), SECURITY.md supported versions (`0.5.x` current, `0.4.x` upgrade), the docs' `--version`/`--help`/`aiskills.json` examples, `banner_2x.png` and `index.html` regenerated. Also documented the optional `stats` field of `aiskills.json` in `reference/files.md` (the docs test now syncs with `--no-stats`, so the field can't go undocumented again).
- **0.4.0 published** (2026-11-09): staged by npm, approved by the maintainer; #154 (merged) records it (dates the CHANGELOG section, MAINTAINERS explains staged publishing).
- Earlier: #146, #147, #153 merged. Details: `CHANGELOG.md` and `git log`.

## Known issues / open threads
- The count is the first user-visible change since 0.4.0: release it as `0.5.0` (minor). New work goes under `## [Unreleased]` in `CHANGELOG.md`; the next release is a new version (`npm version <patch|minor|major>`; MAINTAINERS → Releasing). Expect npm to stage it again.
- **Next:** review/merge #155, then publish `0.5.0` from the maintainer's machine: date `## [0.5.0]` in `CHANGELOG.md`, `npm test` + `npm run test:e2e`, `npm run pack:dry`, `npm publish`, approve the staged release (`npm stage approve`), then update SPEC's release note.
- **Awaiting the user:** delete the leftover remote branch `claude/focused-faraday-nqvduf` (its only commit is on `master`)? Should the bundled skills move from MIT too (repo-wide; not done)?
- `--route` lookups still only tested against a fake registry (AIS-2) — now testable against the published package.
- `/scrolls-update` isn't an installed command in these sessions; follow `skills/scrolls/scrolls-update/SKILL.md` from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
