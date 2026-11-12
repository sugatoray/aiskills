# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` **`1.0.0` is published on npm** (dist-tag `latest`; published 2026-11-12T01:06Z, i.e. the evening of 2026-11-11 US Eastern, so the CHANGELOG date `2026-11-11` stands; checked with `npm view` 2026-11-12). It is the first stable release (strict SemVer from here). It came from [#141](https://github.com/sugatoray/aiskills/pull/141) (the `image-styles-skills` group with `artwallbg` and `commentdrop`, AIS-16; `AISKILLS_SKILLS_VERSION` removed, AIS-11), squash-merged to `master` as `28aee02`, and bundles **15 skills in 8 groups**. Published versions: `0.4.0`–`0.9.0`, `1.0.0` (plus npm's hidden `0.0.0-stage` placeholder). Source in `src/packages/aiskills/`. `npm test`: 421 offline tests, all pass. Docs live at https://sugatoray.github.io/aiskills/, redeployed by `.github/workflows/aiskills-docs.yml` on pushes to `master`.

**On `claude/brave-mccarthy-m6aut0`: `1.1.0`** (the user's call: bundle the new skill, MINOR). It adds **`scrolls-explainer`** to the `scrolls-skills` group (**16 skills in 8 groups**; the scrolls family moves to 2.5.0 in lockstep). Package changes: `package.json`, CHANGELOG `[1.1.0] - 2026-11-12`, SECURITY `1.1.x` current, README and docs group lists, `DOCS_VIEW` (1.0.0 on 2026-11-18, 1.1.0 latest on 2026-11-20), version and upgrade examples (now 1.0.0 → 1.1.0, "new in 1.1.0: scrolls-explainer"), banner + PNG, `npm run docs`. `npm test`: 422 pass. `npm run pack:dry`: 1.1.0, 236 files, 969 kB. In [#206](https://github.com/sugatoray/aiskills/pull/206) (opened 2026-11-12); not merged or published.

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
- **Recorded `1.0.0` as published** (`npm view`: latest, 2026-11-12T01:06Z).
- **Built `/scrolls-explainer`** in `skills/scrolls/` (see `src/scrolls/docs/.scrolls/` for the skill's own story) and **bumped the package to `1.1.0`** to bundle it. The package tests led the doc changes: banner counts first (`16 skills`, `bundled: scrolls-explainer, … (8)`), then every `<!-- verify -->` example that changed.
- **Follow-up in the same branch** (`242345c`): a bare `/scrolls-explainer` now opens the bundled page in place (= `--show`), `-o` copies it, and `--build` regenerates it from the scrolls skills. Only the skill's docs page in the package changed (`npm run docs`); `npm test` still 422 pass.
- **The explainer in the docs** (the user's request): `npm run docs:skills` copies the skill's `assets/scrolls-explainer.html` to `docs/docsite/explainers/` (`EXPLAINERS` in `build-skills-docs.mjs`); the hand-written `explainers/scrolls.md` (Skills tab, after the generated list) embeds it in an iframe and links it full-size. `build-docs-html.mjs` lists such HTML pages as `DATA.static` and embeds them (base64, `DATA.staticHtml`): the iframe (`<iframe data-page=…>`, no `src`) renders the embedded copy (`srcdoc`), and "Open the explainer full-size" opens it in a full-screen overlay (✕ / `Esc`), so `index.html` works on its own and nothing ever requests the file (the user saw an empty frame, then a 404 on their phone, before this). They are still copied next to `site/index.html` for Pages. Red/Green: 3 new tests (copy is current; bundle lists/embeds it; `docs:site` publishes it), plus a browser test that the embedded page loads; 425 pass.
- **PR opened:** [#206](https://github.com/sugatoray/aiskills/pull/206), the whole branch (1.0.0 record, the skill, 1.1.0).
- Two traps hit (see WISDOM): the sandbox copies only git-tracked skills, and the repo `.gitignore` ignores `build/` folders.

## Known issues / open threads
- **Publish `1.1.0` after the branch merges:** `npm run audit:skills`, `npm test` + `npm run test:e2e`, `npm run pack:dry`, `npm publish`, `npm stage approve`; update SPEC's release note; re-date the CHANGELOG if it ships later than 2026-11-12.
- **Try `aiskills upgrade` for real:** on a machine with `0.9.0` installed, run `aiskills upgrade --check`, then `aiskills upgrade`; it should go to `1.0.0` and list `artwallbg` and `commentdrop` with install commands (see GAP_CONTEXT).
- **Try by hand on a real machine:** `aiskills install -i` (the real pickers were never driven; with `-p`, `npx skills` also asks for the scope).
- **`info --full` has no detected-agents list** (not exposed by `npx skills`); `--downloads` behind a proxy needs Node 22.21+/24+ (see GAP_ANALYSIS).
- **Windows is untested** (incl. `npm.cmd` for `releases`): run `aiskills skills --version` with `AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]'` in PowerShell and `set "AISKILLS_SKILLS_LIB_VERSION=(..., 1.7.6]"` in Command Prompt.
- **The user's `~/.npmrc`:** `skills` in their `min-release-age-exclude[]` line does nothing for `npx`; they can drop it.
- **Awaiting the user:** delete the leftover remote branch `claude/focused-faraday-nqvduf`? Should the bundled skills move from MIT too (repo-wide; not done)?
- `--route` lookups still only tested against a fake registry (AIS-2).
- `/scrolls-update`, `/create-lib-docs` and `/create-issues-update-pr` aren't installed commands in these sessions; follow their `SKILL.md` files from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
