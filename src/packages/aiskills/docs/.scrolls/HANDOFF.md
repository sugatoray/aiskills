# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` **`0.6.0` is published on npm** (dist-tag `latest`; `0.4.0` and `0.5.0` before it; checked with `npm view` on 2026-11-11): `npm install -g @sugatoray-ai/aiskills`, then `aiskills install`. Source in `src/packages/aiskills/`. `0.6.0` came from [#162](https://github.com/sugatoray/aiskills/pull/162), merged to `master`. **`0.7.0` is ready but not merged or published:** [#161](https://github.com/sugatoray/aiskills/pull/161) (`claude/festive-allen-qx8lli`, rebased on #162; issues #171 parent, #172–#181) adds the `dynamic-promo-video` skill in a new `video-related-skills` group, so the package bundles **13 skills in 7 groups**; it is Apache-2.0 (skills keep MIT in their `SKILL.md`) and has no install step. On #161's branch: `npm test` 343 offline tests (all pass), `npm run pack:dry` 912 kB / 204 files (the skill's demo voice MP3s are ~670 kB of that), `python3 -m unittest discover -s skills/video-related/dynamic-promo-video/tests` 31. Docs live at https://sugatoray.github.io/aiskills/, redeployed by `.github/workflows/aiskills-docs.yml` on pushes to `master`.

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
- **#162 (0.6.0) merged** to `master` and published: skills CLI version ranges, npm release-age handling, `AISKILLS_SKILLS_LIB_VERSION` (see CHANGELOG 0.6.0, SPEC).
- **#161 (0.7.0, AIS-12):** new bundled skill `dynamic-promo-video` (`skills/video-related/`), plugin `video-related-skills` in `marketplace.json`. The package bump, CHANGELOG `## [0.7.0] - 2026-11-11`, SECURITY supported versions, README intro + group table, `docs/docsite/README.md` and `concepts/skill-groups.md` (13 skills / 7 groups), the `--version`/`--help`/`aiskills.json` examples, banner and generated docs. Earlier commits in #161 had already updated the banner test counts and the docs examples' skill/group lists, but missed those hand-written group tables.
- Earlier: #146, #147, #153, #154, #155, #160 merged. Details: `CHANGELOG.md` and `git log`.

## Known issues / open threads
- **Next:** merge #161, then publish `0.7.0`: `npm run audit:skills`, `npm test` + `npm run test:e2e`, `npm run pack:dry`, `npm publish`, approve the staged release (`npm stage approve`), then update SPEC's release note. The 0.7.0 CHANGELOG section is dated 2026-11-11; re-date it if it ships later.
- **Windows is untested:** run `aiskills skills --version` with `AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]'` in PowerShell and `set "AISKILLS_SKILLS_LIB_VERSION=(..., 1.7.6]"` in Command Prompt; 0.6.0 is out without that check.
- **The user's `~/.npmrc`:** `skills` in their `min-release-age-exclude[]` line does nothing for `npx`; they can drop it.
- **Awaiting the user:** delete the leftover remote branch `claude/focused-faraday-nqvduf` (its only commit is on `master`)? Should the bundled skills move from MIT too (repo-wide; not done)?
- **1.0.0:** remove the `AISKILLS_SKILLS_VERSION` fallback (AIS-11).
- `--route` lookups still only tested against a fake registry (AIS-2); now testable against the published package.
- `/scrolls-update` and `/create-issues-update-pr` aren't installed commands in these sessions; follow their `SKILL.md` files from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
