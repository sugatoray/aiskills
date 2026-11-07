# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` `0.4.0` (folder `src/packages/aiskills/`) is feature-complete for a first release, and now has full user documentation. `npm test` runs 261 offline tests (about 60 s; the docs and banner tests open Chromium when Playwright and cdnjs/jsDelivr are available) and `npm run test:e2e` runs 7 tests with the real `npx skills` (network). All pass. Everything is on branch `claude/focused-faraday-nqvduf` in the open PR [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122). Nothing has been published to npm, and the docs aren't on the web yet.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { aiskills, ais -> bin/aiskills.mjs; aix -> bin/aix.mjs }; scripts incl. docs, docs:skills, docs:html
CHANGELOG.md            Keep a Changelog + SemVer; ships with the package
SECURITY.md             reporting + what the package touches + protections; ships
docs/docsite/           user docs (not published): 43 Markdown pages, images/*.svg, llms.txt, llms-full.txt, index.html
docs/docsite/skills/    GENERATED: one page per bundled skill + overview (npm run docs:skills)
docs/banner/            banner: config.yaml, GENERATED aiskills-banner.html (editor page), banner_2x.png, README (not published)
docs/meta/              ARCHITECTURE, FEATURES, MAINTAINERS (not published)
bin/aiskills.mjs        thin entry point: imports ../src/scripts/core/cli.mjs
bin/aix.mjs             sets AISKILLS_ROUTE=1, then imports the same CLI (aix = aiskills --route)
src/scripts/README.md   what each scripts folder is for, the import rule (docs/ -> pack/ -> core/), what is published
src/scripts/core/       cli.mjs, installer.mjs, postinstall.mjs (published)
src/scripts/pack/       vendor-skills.mjs, skillsignore.mjs (run at npm pack; never published)
src/scripts/docs/       build-skills-docs.mjs, build-docs-html.mjs, create-banner.mjs, themes.mjs, templates/ (build time only)
                        create-banner.mjs + banner-template.html, themes.mjs (build time only)
src/test/               node:test suite, incl. docs.test.mjs, docs-skills.test.mjs, docs-html.test.mjs, banner.test.mjs, themes.test.mjs
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/, LICENSE
```

## What just happened
- **`src/scripts/` split into three groups** (user's request, dry run first): `core/` (the three published runtime files), `pack/` (`vendor-skills.mjs`, `skillsignore.mjs`, run at `npm pack`), `docs/` (docs and banner builders, `themes.mjs`, `templates/`). Moved with `git mv`; `PKG_DIR` now goes three levels up. `src/scripts/README.md` explains the groups for future sessions. `packaging.test.mjs` pins the layout, the downward import rule, and that the README describes every file.
- **`package.json` `"files"` now anchors the root docs** (`/README.md`, `/CHANGELOG.md`, `/SECURITY.md`, `/LICENSE`): a plain `README.md` matched `src/scripts/README.md` too and would have published it. `npm pack` ships `bin/`, the three `core/` files and the root docs.
- **Themes** (chosen from a mockup of 11; the user picked **Lights Out**: X-style pure black + shadcn zinc + Geist): `src/scripts/docs/themes.mjs` is one list (Lights Out first, `DEFAULT_THEME = "lightsout"`), feeding a **gear menu** at the top right of `docs/docsite/index.html` and a **⚙ Theme** menu in the banner editor. Choices are remembered per browser (docs: applied in `<head>` before paint; unknown names fall back to the default); only the default's fonts load up front, the rest on demand. The banner's theme is `theme` in `docs/banner/config.yaml` (default `lightsout`), and its theme CSS sits inside the `banner:css` markers so the docs landing banner follows the page's theme.
- **`banner_2x.png` is now checked**: it carries PNG `tEXt` chunks with its theme and the SHA-256 of the page it was rendered from, so a stale PNG fails `banner.test.mjs`.
- **Finishing pass**: default listed first in both menus, Teal's fonts no longer always downloaded, banner hint explains the Theme menu; generated pages rebuilt.
- **Version bumped to `0.3.0`** (`0.2.0` marked "Never published", like `0.1.0`); CHANGELOG `## [0.3.0] - Unreleased` holds the docs, banner, themes and the `uninstall -n` fix. `npm test` (259) and `npm run test:e2e` (7) pass.
- Published for review as private artifacts: the docs page (https://claude.ai/artifact/6EDgyyQAxAK4ch324V9KNb) and the older theme mockup (https://claude.ai/artifact/AWW2bzv19QjvMaz7iHpupi, now superseded).

## Known issues / open threads
- **Awaiting the user (AIS-8):** publish the docs on GitHub Pages like callai (`sugatoray.github.io/callai`)? callai's `.github/workflows/docs.yml` builds and deploys with `actions/deploy-pages`; the aiskills repo has no workflows. Open question: site root or a subpath such as `/aiskills/npm/`.
- PR #122 is open; publish only after it's merged (AIS-1). Until it's on `master`, the README's banner image URL returns 404 (on GitHub and npm).
- Awaiting the user's decision on AIS-7 (keep `postinstall` or remove it).
- `--route` lookups still only tested against a fake registry (AIS-2). This session's network reached the npm registry and cdnjs, but `sugatoray.github.io` was blocked; skills.sh wasn't tried.
- `/scrolls-update` isn't an installed command in these sessions; follow `skills/scrolls/scrolls-update/SKILL.md` from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
