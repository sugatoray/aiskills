# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` **`0.9.0` is published on npm** (dist-tag `latest`; checked with `npm view` 2026-11-12). It came from [#193](https://github.com/sugatoray/aiskills/pull/193) (`aiskills upgrade`, AIS-15), squash-merged to `master` as `ec6648b`, and bundles **13 skills in 7 groups**. Source in `src/packages/aiskills/`.

**In flight: [#141](https://github.com/sugatoray/aiskills/pull/141) is now `1.0.0`** (the user's call): the `image-styles-skills` group (`artwallbg`, `commentdrop`) → **15 skills in 8 groups** (AIS-16), and `AISKILLS_SKILLS_VERSION` removed (AIS-11). It lives on **`claude/stoic-feynman-8s83ui`**; #141's own branch `feat/image-styles-artwallbg-commentdrop` still has the 6 original, un-rebased commits (conflicting with `master`). On the branch `npm test` runs 421 offline tests, all pass. Docs live at https://sugatoray.github.io/aiskills/, redeployed by `.github/workflows/aiskills-docs.yml` on pushes to `master`.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { aiskills, ais -> bin/aiskills.mjs; aix -> bin/aix.mjs }; scripts incl. docs, docs:skills, docs:html
CHANGELOG.md            Keep a Changelog + SemVer; ships with the package
SECURITY.md             reporting + what the package touches + protections; ships
docs/docsite/           user docs (not published): 47 Markdown pages incl. license.md (GENERATED), images/*.svg, llms.txt, llms-full.txt, index.html
docs/docsite/skills/    GENERATED: one page per bundled skill + overview (npm run docs:skills)
docs/banner/            banner: config.yaml, GENERATED aiskills-banner.html (editor page), banner_2x.png, README (not published)
docs/meta/              ARCHITECTURE, FEATURES, MAINTAINERS (not published)
bin/aiskills.mjs        thin entry point: imports ../src/scripts/core/cli.mjs
bin/aix.mjs             sets AISKILLS_ROUTE=1, then imports the same CLI (aix = aiskills --route)
src/scripts/README.md   what each scripts folder is for, the import rule (docs/ -> pack/ -> core/), what is published
src/scripts/core/       cli.mjs, installer.mjs, releases.mjs, upgrade.mjs (published; there is no install step)
src/scripts/pack/       vendor-skills.mjs, skillsignore.mjs (run at npm pack; never published)
src/scripts/docs/       build-skills-docs.mjs, build-docs-html.mjs, create-banner.mjs, themes.mjs, templates/ (build time only)
src/test/               node:test suite, incl. docs.test.mjs, docs-skills.test.mjs, docs-html.test.mjs, banner.test.mjs, themes.test.mjs
LICENSE                 Apache-2.0, the package's own (committed; never vendored)
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/
```

## What just happened (this session, for #141)
- **Rebased #141 onto `master`** (0.9.0); conflicts in the repo-root `README.md` and `.claude-plugin/marketplace.json` resolved by keeping both (`video-related`, then `image-styles`). Caught the package up (17 failing tests: counts, doc examples, generated pages; then the intro group lists missed by the tests). Linked each skill's `assets/EXAMPLE.md` from its `SKILL.md`/`README.md`. Added `Co-authored-by: Codex <noreply@openai.com>` to #141's three oldest commits (the user's request).
- **1.0.0 bump** (the user's request): `package.json`; CHANGELOG `Unreleased` → `[1.0.0] - 2026-11-12` (stable-release note + Added image-styles + **Removed** `AISKILLS_SKILLS_VERSION`; link ref → #141); SECURITY `1.0.x` current; README new **Upgrading** section (`aiskills upgrade`, strict SemVer from 1.0.0, notes for 0.x); docs: `info`/`--version`/`--help`/`rel` examples, upgrade examples now 0.9.0 → 1.0.0 (illustrative "new in 1.0.0: artwallbg, commentdrop"), `files.md`, `info --full` sample, `update available: run aiskills upgrade` wording; `npm run docs` + `banner:png` (banner shows v1.0.0 · 15 skills · 8 groups).
- **AIS-11** (Red/Green in `skills-version.test.mjs`): the old variable is no longer read anywhere (installer, `info`, `--help`); its errors-page section is gone, `environment.md` keeps one sentence.

## Known issues / open threads
- **#141 isn't updated yet:** ask the user before `git push --force-with-lease origin claude/stoic-feynman-8s83ui:feat/image-styles-artwallbg-commentdrop` (it replaces the PR's 6 commits with the rebased ones); the PR title/body should then mention 1.0.0.
- **Publish 1.0.0 after #141 merges:** `npm run audit:skills`, `npm test` + `npm run test:e2e`, `npm run pack:dry`, `npm publish`, `npm stage approve`; update SPEC's release note; re-date the CHANGELOG if it ships after 2026-11-12. First real chance to check `aiskills upgrade` 0.9.0 → 1.0.0 by hand (see GAP_ANALYSIS); it should list the two new skills with install commands.
- **Try by hand on a real machine:** `aiskills install -i` (the real pickers were never driven; with `-p`, `npx skills` also asks for the scope).
- **`info --full` has no detected-agents list** (not exposed by `npx skills`); `--downloads` behind a proxy needs Node 22.21+/24+ (see GAP_ANALYSIS).
- **Windows is untested** (incl. `npm.cmd` for `releases`): run `aiskills skills --version` with `AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]'` in PowerShell and `set "AISKILLS_SKILLS_LIB_VERSION=(..., 1.7.6]"` in Command Prompt.
- **The user's `~/.npmrc`:** `skills` in their `min-release-age-exclude[]` line does nothing for `npx`; they can drop it.
- **Awaiting the user:** delete the leftover remote branch `claude/focused-faraday-nqvduf`? Should the bundled skills move from MIT too (repo-wide; not done)?
- `--route` lookups still only tested against a fake registry (AIS-2).
- `/scrolls-update`, `/create-lib-docs` and `/create-issues-update-pr` aren't installed commands in these sessions; follow their `SKILL.md` files from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
