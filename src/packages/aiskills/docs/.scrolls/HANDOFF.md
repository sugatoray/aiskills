# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
**`@sugatoray-ai/aiskills` `1.3.0` is published on npm** (`latest`, 2026-11-17T23:07Z, still 2026-11-17 US Eastern, so the CHANGELOG date stands; checked with `npm view`). npm's `gitHead` is `a92ab00`, the squash merge of [#287](https://github.com/sugatoray/aiskills/pull/287) on `master`, and the user pushed the tag `aiskills-v1.3.0` there. It adds colored output and the CLI outputs page (#245), `aiskills config` and the grouped Skills tab (#250), and `run-code-review` 1.3.0; still **17 skills in 9 groups**. Published versions: `0.4.0`–`0.9.0`, `1.0.0`–`1.3.0` (plus npm's hidden `0.0.0-stage` placeholder), each tagged `aiskills-v<version>`. Source in `src/packages/aiskills/`. Docs live at https://sugatoray.github.io/aiskills/, rebuilt on pushes to `master` and on release tags.

**`master` is `1.4.0-dev`**: [#291](https://github.com/sugatoray/aiskills/pull/291) merged as `715aca5` (`package.json` `1.4.0-dev`, an empty `## [1.4.0] - Unreleased` section, docs and banner regenerated).

**[#265](https://github.com/sugatoray/aiskills/pull/265) (open, `claude/clever-mendel-k9n73h`, rebased onto `715aca5`) is the first 1.4.0 work.** Its package changes:
- **Bundles `scrolls-compact`** (scrolls family 2.6.0): **18 skills in 9 groups**. The banner, docs, README groups table and the tests' hardcoded counts (`banner.test.mjs`, `docs-html.test.mjs`) say 18.
- **Docs page "Browse the scrolls-compact examples"** (`docs/docsite/explainers/scrolls-compact-examples.md`, under Explainers in the Skills tab). It embeds the skill's `assets/example-viewer.html`, copied to `explainers/scrolls-compact-examples.html` through `EXPLAINERS` in `build-skills-docs.mjs`.
- **`docs-template.html`: embedded pages follow the docs' light/dark button.** Each srcdoc frame gets the effective theme as `data-theme` on its `<html>` (`themedHtml`), and open frames are updated when it changes (`themeFrame`). Pages that use that convention follow it: the example viewer and the CLI outputs page; the scrolls explainer doesn't use it.
- **Bundled skills renamed `assets/EXAMPLE.md` → `assets/EXAMPLES.md`** (`run-code-review` 1.3.1, `artwallbg` and `commentdrop` 1.0.1); `docs-skills.test.mjs` fails if one ships `EXAMPLE.md` again.
- **CHANGELOG `[1.4.0] - Unreleased`** lists all of it (Added: the skill, the docs page, the theme sync; Changed: the rename).
- `npm test`: **519** pass on the branch. Issues: epic #266 (#267–#270, plus the viewer epic #295 with #296–#300, and #301 for the rebase) and #271.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { aiskills, ais -> bin/aiskills.mjs; aix -> bin/aix.mjs }; scripts incl. docs, docs:skills, docs:html
CHANGELOG.md            Keep a Changelog + SemVer; ships with the package
SECURITY.md             reporting + what the package touches + protections; ships
docs/docsite/           user docs (not published): 53 Markdown pages on #265's branch (51 on master) incl. license.md (GENERATED), images/*.svg, llms.txt, llms-full.txt, index.html
docs/docsite/skills/    GENERATED: one page per bundled skill + overview (npm run docs:skills)
docs/banner/            banner: config.yaml, GENERATED aiskills-banner.html (editor page), banner_2x.png, README (not published)
docs/meta/              ARCHITECTURE, FEATURES, MAINTAINERS (not published)
bin/aiskills.mjs        thin entry point: imports ../src/scripts/core/cli.mjs
bin/aix.mjs             sets AISKILLS_ROUTE=1, then imports the same CLI (aix = aiskills --route)
src/scripts/README.md   what each scripts folder is for, the import rule (docs/ -> pack/ -> core/), what is published
src/scripts/core/       cli.mjs, colors.mjs, config.mjs, installer.mjs, releases.mjs, upgrade.mjs (published; there is no install step)
examples/               sample_aiskillsconfig.json (ships; sync copies it to the install folder)
src/scripts/pack/       vendor-skills.mjs, skillsignore.mjs (run at npm pack; never published)
src/scripts/docs/       build-skills-docs.mjs, build-docs-html.mjs, create-banner.mjs, themes.mjs, templates/ (build time only)
src/test/               node:test suite, incl. docs.test.mjs, docs-skills.test.mjs, docs-html.test.mjs, banner.test.mjs, themes.test.mjs
LICENSE                 Apache-2.0, the package's own (committed; never vendored)
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/
```

## What just happened (this session)
- Built [#265](https://github.com/sugatoray/aiskills/pull/265) (see above) on `claude/clever-mendel-k9n73h`. At the user's request, rebased it onto `715aca5` for 1.4.0-dev: the package CHANGELOG entries that had merged into the released `[1.3.0]` moved to `[1.4.0]`, and the generated docs and banner were regenerated at each commit.
- Earlier this session (before #291): 1.3.0 was released in #287, and `1.4.0-dev` started in #291 (from `claude/aiskills-1.4.0-dev`).

## Known issues / open threads
- **[#265](https://github.com/sugatoray/aiskills/pull/265) is open, not merged.** Once it merges, add `scrolls-compact`, the examples docs page and the theme sync to `SPEC.md`, and tick AIS-23.
- **At the 1.4.0 release, set `SECURITY.md`'s supported versions to `1.4.x`** (it says `1.3.x`), as for 1.3.0.
- **#250's docs-site commits** (counts, tab numbers, grouped Skills pane) may still lack issues; it merged without this being confirmed.
- **Installing from a local pack:** `npm pack` names the tarball after `package.json`'s version (`sugatoray-ai-aiskills-1.4.0-dev.tgz` on `master` now). The user hit npm's misleading "seems to be corrupted" (`ENOENT`) by typing `…-1.3.0.tgz`. `npm i -g "$(npm pack --silent)"` avoids that.
- **Try `aiskills config` on a real machine:** set a few keys and a shell alias, run `aiskills info`, and clone a repo with a `.aiskills.json` to see the project file win and a `!` alias warn.
- **The CLI outputs page shows the stand-in `npx skills`,** which prints nothing of its own. So `list`, `install` and `skills` show only aiskills's lines; the live artifact shows the real `npx skills` output.
- **Look at the live docs site:** this session can't reach `sugatoray.github.io`. The build log confirms all six pages were built and deployed, but nobody has viewed them in a browser yet. Check the menu, the find box, switching to `/v/0.8.0/` on a `#page`, and the notices.
- **Try `aiskills upgrade` for real:** on a machine with `0.9.0` installed, run `aiskills upgrade --check`, then `aiskills upgrade`; it should go to `1.0.0` and list `artwallbg` and `commentdrop` with install commands (see GAP_CONTEXT).
- **Try by hand on a real machine:** `aiskills install -i` (the real pickers were never driven; with `-p`, `npx skills` also asks for the scope).
- **`info --full` has no detected-agents list** (not exposed by `npx skills`); `--downloads` behind a proxy needs Node 22.21+/24+ (see GAP_ANALYSIS).
- **Windows is untested** (incl. `npm.cmd` for `releases`): run `aiskills skills --version` with `AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]'` in PowerShell and `set "AISKILLS_SKILLS_LIB_VERSION=(..., 1.7.6]"` in Command Prompt.
- **The user's `~/.npmrc`:** `skills` in their `min-release-age-exclude[]` line does nothing for `npx`; they can drop it.
- **Awaiting the user:** delete the leftover remote branch `claude/focused-faraday-nqvduf`? Should the bundled skills move from MIT too (repo-wide; not done)?
- `--route` lookups still only tested against a fake registry (AIS-2).
- Once #230 merges, `/scrolls-*`, `/create-issues-update-pr`, `/create-lib-docs`, `/network-flow` and `/run-code-review` load in this repo through the links in `.claude/skills/`.
- See `GAP_ANALYSIS.md` for the rest.
