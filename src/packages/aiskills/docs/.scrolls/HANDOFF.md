# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
**`@sugatoray-ai/aiskills` `1.3.0` is published on npm** (`latest`, 2026-11-17T23:07Z, still 2026-11-17 US Eastern, so the CHANGELOG date stands; checked with `npm view`). npm's `gitHead` is `a92ab00`, the squash merge of [#287](https://github.com/sugatoray/aiskills/pull/287) on `master`, and the user pushed the tag `aiskills-v1.3.0` there. It adds colored output and the CLI outputs page (#245), `aiskills config` and the grouped Skills tab (#250), and `run-code-review` 1.3.0; still **17 skills in 9 groups**. Published versions: `0.4.0`–`0.9.0`, `1.0.0`–`1.3.0` (plus npm's hidden `0.0.0-stage` placeholder), each tagged `aiskills-v<version>`. Source in `src/packages/aiskills/`. Docs live at https://sugatoray.github.io/aiskills/, rebuilt on pushes to `master` and on release tags.

**Next version `1.4.0-dev`** on branch `claude/aiskills-1.4.0-dev` (from `a92ab00`, commit `0576950`; no PR yet): `package.json` `1.4.0-dev`, a new `## [1.4.0] - Unreleased` section with the "In development" note and no entries yet, the seven version examples in `reference/cli.md` and `getting-started/installation.md`, and the regenerated banner (`v1.4.0-dev`, checked by eye), `index.html`, `llms-full.txt` and `cli-outputs.html`. SECURITY.md keeps `1.3.x` current until 1.4.0 is released. `npm test`: 515 tests, all pass.

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
src/scripts/core/       cli.mjs, colors.mjs, config.mjs, installer.mjs, releases.mjs, upgrade.mjs (published; there is no install step)
examples/               sample_aiskillsconfig.json (ships; sync copies it to the install folder)
src/scripts/pack/       vendor-skills.mjs, skillsignore.mjs (run at npm pack; never published)
src/scripts/docs/       build-skills-docs.mjs, build-docs-html.mjs, create-banner.mjs, themes.mjs, templates/ (build time only)
src/test/               node:test suite, incl. docs.test.mjs, docs-skills.test.mjs, docs-html.test.mjs, banner.test.mjs, themes.test.mjs
LICENSE                 Apache-2.0, the package's own (committed; never vendored)
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/
```

## What just happened (this session)
- Prepared 1.3.0 in #287 (bump, CHANGELOG dated 2026-11-17, SECURITY `1.3.x`, docs regenerated; issues #288 → #289, #290). The user merged it, published 1.3.0 and pushed `aiskills-v1.3.0`; checked with `npm view` (`gitHead` = `a92ab00`).
- At the user's request, set the next version to `1.4.0-dev`, the same way `1.3.0-dev` was set (see above).
- Scrolls: AIS-20 ticked; the `SPEC.md` release note and the 1.3.0 feature entries marked published.

## Known issues / open threads
- **Open a PR for `claude/aiskills-1.4.0-dev`** when the user asks; it also carries this scrolls update.
- **#250's docs-site commits** (counts, tab numbers, grouped Skills pane) may still lack issues; it merged without this being confirmed.
- **Installing from a local pack:** `npm pack` names the tarball after `package.json`'s version (`sugatoray-ai-aiskills-1.4.0-dev.tgz` once `1.4.0-dev` merges). The user hit npm's misleading "seems to be corrupted" (`ENOENT`) by typing `…-1.3.0.tgz`. `npm i -g "$(npm pack --silent)"` avoids that.
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
