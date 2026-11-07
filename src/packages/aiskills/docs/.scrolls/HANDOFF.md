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
- **Version bumped to `0.4.0`** (`0.3.0` marked "Never published", like `0.2.0` and `0.1.0`). CHANGELOG `## [0.4.0] - Unreleased` holds the `src/scripts/` reorganization and the anchored `"files"` fix; `[0.3.0]` keeps the docs, banner, themes and the `uninstall -n` fix. The package README's tests row and maintainer links were brought up to date. 261 offline + 7 e2e tests pass; `npm pack` builds `sugatoray-ai-aiskills-0.4.0.tgz`.
- **Docs refreshed with `/create-lib-docs --update`**: the reference, examples, Skills pages and links still matched the code; a read-through added "Ways to read these docs" to the landing page (Markdown, `index.html` with search and the 11-theme gear menu, `llms.txt`) and a note in `reference/files.md` on what stays out of the npm package.
- Earlier this session: `src/scripts/` split into `core/` (ships), `pack/` (`npm pack`) and `docs/` (docs/banner builders), explained in `src/scripts/README.md`; the theme switcher (11 themes, Lights Out default) on the docs page and banner editor; `banner_2x.png` fingerprinted with its theme and source-page SHA-256.
- Review links (private artifacts): the docs page https://claude.ai/artifact/6EDgyyQAxAK4ch324V9KNb (current); the theme mockup https://claude.ai/artifact/AWW2bzv19QjvMaz7iHpupi (superseded).

## Known issues / open threads
- **Awaiting the user (AIS-8):** publish the docs on GitHub Pages like callai (`sugatoray.github.io/callai`)? callai's `.github/workflows/docs.yml` builds and deploys with `actions/deploy-pages`; the aiskills repo has no workflows. Open question: site root or a subpath such as `/aiskills/npm/`.
- PR #122 is open; publish only after it's merged (AIS-1). Until it's on `master`, the README's banner image URL returns 404 (on GitHub and npm).
- Awaiting the user's decision on AIS-7 (keep `postinstall` or remove it).
- `--route` lookups still only tested against a fake registry (AIS-2). This session's network reached the npm registry and cdnjs, but `sugatoray.github.io` was blocked; skills.sh wasn't tried.
- `/scrolls-update` isn't an installed command in these sessions; follow `skills/scrolls/scrolls-update/SKILL.md` from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
