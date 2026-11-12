# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` **`0.9.0` is published on npm** (dist-tag `latest`; checked with `npm view` 2026-11-12). It came from [#193](https://github.com/sugatoray/aiskills/pull/193) (`aiskills upgrade`, AIS-15), squash-merged to `master` as `ec6648b`, and bundles **13 skills in 7 groups**. Source in `src/packages/aiskills/`.

**In flight: [#141](https://github.com/sugatoray/aiskills/pull/141)** adds the `image-styles-skills` group (`artwallbg`, `commentdrop`) → **15 skills in 8 groups** (AIS-16). The rebased version lives on **`claude/stoic-feynman-8s83ui`** (tip `dac1314` + this scrolls/CHANGELOG commit); #141's own branch `feat/image-styles-artwallbg-commentdrop` still has the 6 original, un-rebased commits (conflicting with `master`). On the rebased branch `npm test` runs 420 offline tests, all pass. Docs live at https://sugatoray.github.io/aiskills/, redeployed by `.github/workflows/aiskills-docs.yml` on pushes to `master`.

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
- **Rebased #141 onto `master`** (0.9.0). Conflicts in the repo-root `README.md` and `.claude-plugin/marketplace.json` (both appended a section/plugin at the end): kept both, `video-related` first, then `image-styles`.
- **Package catch-up** (commit `1156342`): 17 package tests failed after the rebase (counts in `banner.test.mjs`, doc examples snapshotting `aiskills groups` / `available:` lists, generated skill pages, `license.md`, "every group mentioned"). Updated the docs from real CLI output (`npm run vendor`, run `bin/aiskills.mjs` with a temp `AISKILLS_HOME`, `npm run clean`), the group tables, `npm run docs` + `npm run banner:png`, and the hardcoded counts (13→15, 7→8 groups, pills 8→9 / 7→8).
- **Skill docs** (commit `dac1314`): `artwallbg` and `commentdrop` `SKILL.md` and `README.md` now link their `assets/EXAMPLE.md` (the user's request). Skill versions left at `1.0.0` (unreleased).
- **History** (the user's request): `Co-authored-by: Codex <noreply@openai.com>` added to #141's three oldest commits (`2c82e6f`, `c7ad360`, `be4e04a`); trees unchanged; force-pushed with lease to `claude/stoic-feynman-8s83ui`.
- **This `/scrolls-update`:** found the intro group lists in `README.md` and `docs/docsite/README.md` still said "…, video" (the WISDOM trap again) and added "image styles"; added the CHANGELOG `Unreleased` entry for the new group.

## Known issues / open threads
- **#141 isn't updated yet:** ask the user before `git push --force-with-lease origin claude/stoic-feynman-8s83ui:feat/image-styles-artwallbg-commentdrop` (it replaces the PR's 6 commits with the rebased ones).
- **Next release after #141 merges:** MINOR bump (`0.10.0`; new skills/group per the CHANGELOG rules): `package.json`, CHANGELOG `Unreleased` → `[0.10.0]` (+ link ref), SECURITY supported versions, banner, docs version examples; then `npm run audit:skills`, `npm test` + `npm run test:e2e`, `npm run pack:dry`, `npm publish`, `npm stage approve`; update SPEC's release note. First real chance to check `aiskills upgrade` 0.9.0 → 0.10.0 by hand (see GAP_ANALYSIS); it should list the two new skills with install commands.
- **Try by hand on a real machine:** `aiskills install -i` (the real pickers were never driven; with `-p`, `npx skills` also asks for the scope).
- **`info --full` has no detected-agents list** (not exposed by `npx skills`); `--downloads` behind a proxy needs Node 22.21+/24+ (see GAP_ANALYSIS).
- **Windows is untested** (incl. `npm.cmd` for `releases`): run `aiskills skills --version` with `AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]'` in PowerShell and `set "AISKILLS_SKILLS_LIB_VERSION=(..., 1.7.6]"` in Command Prompt.
- **The user's `~/.npmrc`:** `skills` in their `min-release-age-exclude[]` line does nothing for `npx`; they can drop it.
- **Awaiting the user:** delete the leftover remote branch `claude/focused-faraday-nqvduf`? Should the bundled skills move from MIT too (repo-wide; not done)?
- **1.0.0:** remove the `AISKILLS_SKILLS_VERSION` fallback (AIS-11). `--route` lookups still only tested against a fake registry (AIS-2).
- `/scrolls-update`, `/create-lib-docs` and `/create-issues-update-pr` aren't installed commands in these sessions; follow their `SKILL.md` files from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
