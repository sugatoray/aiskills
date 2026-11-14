# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` **`1.0.0` is published on npm** (dist-tag `latest`; published 2026-11-12T01:06Z, i.e. the evening of 2026-11-11 US Eastern, so the CHANGELOG date `2026-11-11` stands; checked with `npm view` 2026-11-12). It is the first stable release (strict SemVer from here). It came from [#141](https://github.com/sugatoray/aiskills/pull/141) (the `image-styles-skills` group with `artwallbg` and `commentdrop`, AIS-16; `AISKILLS_SKILLS_VERSION` removed, AIS-11), squash-merged to `master` as `28aee02`, and bundles **15 skills in 8 groups**. Published versions: `0.4.0`–`0.9.0`, `1.0.0` (plus npm's hidden `0.0.0-stage` placeholder). Source in `src/packages/aiskills/`. `npm test`: 421 offline tests, all pass. Docs live at https://sugatoray.github.io/aiskills/, redeployed by `.github/workflows/aiskills-docs.yml` on pushes to `master`.

**`1.2.0` is published on npm** (`latest`, published 2026-11-14T02:22Z, i.e. the evening of 2026-11-13 US Eastern, so the CHANGELOG date `2026-11-13` stands; checked with `npm view`). It came from [#223](https://github.com/sugatoray/aiskills/pull/223) (squash `089f938`), which bundles `/run-code-review` (from #215, `7c0afec`) and its 1.2.0 `-o` reports in the new `review-skills` group: **17 skills in 9 groups**. Release changes: `package.json`, CHANGELOG `[1.2.0] - 2026-11-13`, SECURITY `1.2.x` current, banner and docs, `DOCS_VIEW` with 1.2.0 as `latest` and the docs examples it drives. `1.1.0` (from #206) was published 2026-11-12.

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

## What just happened (this session)
- **`package.json` is `1.3.0-dev`** (on #230; the user's call on 2026-11-13). Changes collect under `## [1.3.0] - Unreleased` until the user releases 1.3.0. npm rejects `1.3.0.dev`, so the version uses SemVer pre-release form. The first entry is `run-code-review` 1.3.0, which now starts only when typed. Regenerated: banner, `index.html` and the version examples in `reference/cli.md` and `installation.md`. `aiskills rel` now prints `installed: 1.3.0-dev (not published on npm)` and marks no row as installed. MAINTAINERS → Releasing documents the `-dev` convention. 428 tests pass.
- **1.2.0 release recorded** (commit `9103d74` on [#230](https://github.com/sugatoray/aiskills/pull/230)): AIS-18 done, along with the `SPEC.md` release note and this file.
- **[#230](https://github.com/sugatoray/aiskills/pull/230) (open, not this package's PR):**
  - adds `make link-skills`, with 24 relative symlinks that put the scrolls family, `create-issues-update-pr`, `create-lib-docs`, `network-flow` and `run-code-review` into the repo root's `.agents/skills/` and `.claude/skills/`;
  - adds repo-wide scrolls at the root `docs/.scrolls/`.
  - Nothing in this package changed. Its file list is the same with the links in place, and `npm test` passes all 428 tests after the rebase onto `master` `089f938`.
- **Root vs. package scrolls:** the root scrolls cover repo-wide work (tooling, cross-family conventions, the overall backlog). This package's own state stays here.

## Known issues / open threads
- **Release tags aren't on GitHub yet.** MAINTAINERS → Releasing step 6 now tags each release as `aiskills-v<version>` on its npm `gitHead`. The nine tags for `0.4.0`–`1.2.0` were made in a cloud session (2026-11-13), but its git access can only push branches (HTTP 403 on tags). The user is to create and push them from their own clone. Each `gitHead` is the `master` head at publish time, 3–16 minutes after the merge (0.6.0: 2 h 18 min). Once they're pushed, check them with `git ls-remote --tags origin 'aiskills-v*'` against `npm view @sugatoray-ai/aiskills@<v> gitHead`.
- **Try `aiskills upgrade` for real:** on a machine with `0.9.0` installed, run `aiskills upgrade --check`, then `aiskills upgrade`; it should go to `1.0.0` and list `artwallbg` and `commentdrop` with install commands (see GAP_CONTEXT).
- **Try by hand on a real machine:** `aiskills install -i` (the real pickers were never driven; with `-p`, `npx skills` also asks for the scope).
- **`info --full` has no detected-agents list** (not exposed by `npx skills`); `--downloads` behind a proxy needs Node 22.21+/24+ (see GAP_ANALYSIS).
- **Windows is untested** (incl. `npm.cmd` for `releases`): run `aiskills skills --version` with `AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]'` in PowerShell and `set "AISKILLS_SKILLS_LIB_VERSION=(..., 1.7.6]"` in Command Prompt.
- **The user's `~/.npmrc`:** `skills` in their `min-release-age-exclude[]` line does nothing for `npx`; they can drop it.
- **Awaiting the user:** delete the leftover remote branch `claude/focused-faraday-nqvduf`? Should the bundled skills move from MIT too (repo-wide; not done)?
- `--route` lookups still only tested against a fake registry (AIS-2).
- Once #230 merges, `/scrolls-*`, `/create-issues-update-pr`, `/create-lib-docs`, `/network-flow` and `/run-code-review` load in this repo through the links in `.claude/skills/`.
- See `GAP_ANALYSIS.md` for the rest.
