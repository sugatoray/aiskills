# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` `0.3.0` (folder `src/packages/aiskills/`) is feature-complete for a first release, and now has full user documentation. `npm test` runs 245 offline tests (about 40 s; the docs and banner tests open Chromium when Playwright and cdnjs/jsDelivr are available) and `npm run test:e2e` runs 7 tests with the real `npx skills` (network). All pass. Everything is on branch `claude/focused-faraday-nqvduf` in the open PR [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122). Nothing has been published to npm, and the docs aren't on the web yet.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { aiskills, ais -> bin/aiskills.mjs; aix -> bin/aix.mjs }; scripts incl. docs, docs:skills, docs:html
CHANGELOG.md            Keep a Changelog + SemVer; ships with the package
SECURITY.md             reporting + what the package touches + protections; ships
docs/docsite/           user docs (not published): 43 Markdown pages, images/*.svg, llms.txt, llms-full.txt, index.html
docs/docsite/skills/    GENERATED: one page per bundled skill + overview (npm run docs:skills)
docs/banner/            banner: config.yaml, GENERATED aiskills-banner.html (editor page), banner_2x.png, README (not published)
docs/meta/              ARCHITECTURE, FEATURES, MAINTAINERS (not published)
bin/aiskills.mjs        thin entry point: imports ../src/scripts/cli.mjs
bin/aix.mjs             sets AISKILLS_ROUTE=1, then imports the same CLI (aix = aiskills --route)
src/scripts/            cli.mjs, installer.mjs, postinstall.mjs (published); vendor-skills.mjs, skillsignore.mjs,
                        build-skills-docs.mjs, build-docs-html.mjs + docs-template.html,
                        create-banner.mjs + banner-template.html (build time only)
src/test/               node:test suite, incl. docs.test.mjs, docs-skills.test.mjs, docs-html.test.mjs, banner.test.mjs
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/, LICENSE
```

## What just happened
- **Banner**, modelled on sugatoray/callai's `src/tools/banner/` (mockup first, then approved): `npm run banner` builds `docs/banner/aiskills-banner.html` from `src/scripts/banner-template.html` + `docs/banner/config.yaml`; `"auto"` values come from `package.json`, the bundled skills (counts, group aliases in `marketplace.json` order) and `SKILLS_CLI_VERSION`, and the terminal demo is built from the real bundled skills. `npm run banner:png` renders `banner_2x.png` (Playwright). The page is callai's editor (edit text and pills, save in browser, Save HTML, Reset, background/ink preview, PNG export) plus two fixes the user's screenshot prompted: unreadable ink is disabled (light on white, dark on dark), and transparent PNGs export with both inks ("Export all 15").
- **Where it shows:** line 1 of the package README is `banner_2x.png` by an absolute `raw.githubusercontent.com/.../master/...` URL (so npmjs.com can show it); `docs/docsite/index.html` opens with the live banner on the Home tab (copied between the `banner:html`/`banner:css` markers, editing hooks stripped, wordmark `<h1>` → `<div>`; `--no-banner`). The Markdown landing page has no banner, as in callai. `npm run docs` rebuilds the banner page first.
- Tests (`banner.test.mjs`, new `docs-html.test.mjs` cases) were written first; banner builder errors are in `reference/errors.md`.
- Earlier this session: the user docs in `docs/docsite/` (Skills tab generated from the bundled skills, single-page `index.html`, `llms.txt`), and the `uninstall -n` pinned-version fix.

## Known issues / open threads
- **Awaiting the user (AIS-8):** publish the docs on GitHub Pages like callai (`sugatoray.github.io/callai`)? callai's `.github/workflows/docs.yml` builds and deploys with `actions/deploy-pages`; the aiskills repo has no workflows. Open question: site root or a subpath such as `/aiskills/npm/`.
- PR #122 is open; publish only after it's merged (AIS-1). Until it's on `master`, the README's banner image URL returns 404 (on GitHub and npm).
- Awaiting the user's decision on AIS-7 (keep `postinstall` or remove it).
- `--route` lookups still only tested against a fake registry (AIS-2). This session's network reached the npm registry and cdnjs, but `sugatoray.github.io` was blocked; skills.sh wasn't tried.
- `/scrolls-update` isn't an installed command in these sessions; follow `skills/scrolls/scrolls-update/SKILL.md` from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
