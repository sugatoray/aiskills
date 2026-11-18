# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
**`@sugatoray-ai/aiskills` `1.5.0` is published on npm** (`latest`, 2026-11-18T03:01Z, the evening of 2026-11-17 US Eastern; checked against the registry). npm's `gitHead` is `b8ad785`, the squash merge of [#310](https://github.com/sugatoray/aiskills/pull/310) on `master`, and the user pushed the annotated tag `aiskills-v1.5.0` there (checked). It bundles the new `productivity` group with `meeting-agenda` (**19 skills in 10 groups**), from [#272](https://github.com/sugatoray/aiskills/pull/272) (`f27b875`).

**Next version `1.6.0-dev`** on branch `claude/aiskills-1.6.0-dev` (from `b8ad785`, commit `5bdcc58`; pushed; AIS-28): `package.json` `1.6.0-dev`, a new `## [1.6.0] - Unreleased` section with the "In development" note and no entries yet, the seven version examples in `reference/cli.md` and `getting-started/installation.md`, and the regenerated banner (`v1.6.0-dev`, checked by eye), `index.html`, `llms-full.txt` and `reference/cli-outputs.html`. `SECURITY.md` keeps `1.5.x`. `npm test`: 520 pass. This scrolls update is on it too.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { aiskills, ais -> bin/aiskills.mjs; aix -> bin/aix.mjs }; scripts incl. docs, docs:skills, docs:html
CHANGELOG.md            Keep a Changelog + SemVer; ships with the package
SECURITY.md             reporting + what the package touches + protections; ships
docs/docsite/           user docs (not published): 53 Markdown pages incl. license.md (GENERATED), images/*.svg, llms.txt, llms-full.txt, index.html
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
- Built #265 on `claude/clever-mendel-k9n73h` and rebased it onto `1.4.0-dev`; the user merged it (`57188d0`).
- Prepared 1.4.0 in #302 (bump, CHANGELOG dated 2026-11-18, SECURITY `1.4.x`, docs regenerated; `npm test` 519, `npm run test:e2e` 8; issues #303 → #304, #305). The user merged it, published 1.4.0 and pushed `aiskills-v1.4.0`.
- At the user's request, set the next version to `1.5.0-dev`, the same way #291 set `1.4.0-dev`.
- Scrolls: AIS-23 and AIS-24 ticked, AIS-25 added; the `SPEC.md` release note records 1.4.0, and the examples docs page and the light/dark sync are in `SPEC.md`.

## Known issues / open threads
- **Open a PR for `claude/aiskills-1.5.0-dev`** when the user asks (AIS-25); it also carries the root scrolls update and this one. The scrolls-family scrolls (`src/scrolls/docs/.scrolls/`) still need their own `/scrolls-update -p src/scrolls/docs`.
- **The 1.4.0 CHANGELOG date** is `2026-11-18`, npm's UTC date; in US Eastern the publish was the evening of 2026-11-17 (1.2.0's note judged by US Eastern). The user was asked; no answer yet, so it stays.
- **#250's docs-site commits** (counts, tab numbers, grouped Skills pane) may still lack issues; it merged without this being confirmed.
- **Installing from a local pack:** `npm pack` names the tarball after `package.json`'s version (`sugatoray-ai-aiskills-1.5.0-dev.tgz` once `1.5.0-dev` merges). The user hit npm's misleading "seems to be corrupted" (`ENOENT`) by typing `…-1.3.0.tgz`. `npm i -g "$(npm pack --silent)"` avoids that.
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
- See `GAP_ANALYSIS.md` for the rest.
