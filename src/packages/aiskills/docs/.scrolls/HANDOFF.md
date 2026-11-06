# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` `0.2.0` (folder `src/packages/aiskills/`) is feature-complete for a first release, and now has full user documentation. `npm test` runs 224 offline tests (about 20 s; the docs tests open Chromium when Playwright and cdnjs are available) and `npm run test:e2e` runs 7 tests with the real `npx skills` (network). All pass. Everything is on branch `claude/focused-faraday-nqvduf` in the open PR [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122). Nothing has been published to npm, and the docs aren't on the web yet.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { aiskills, ais -> bin/aiskills.mjs; aix -> bin/aix.mjs }; scripts incl. docs, docs:skills, docs:html
CHANGELOG.md            Keep a Changelog + SemVer; ships with the package
SECURITY.md             reporting + what the package touches + protections; ships
docs/docsite/           user docs (not published): 43 Markdown pages, images/*.svg, llms.txt, llms-full.txt, index.html
docs/docsite/skills/    GENERATED: one page per bundled skill + overview (npm run docs:skills)
docs/meta/              ARCHITECTURE, FEATURES, MAINTAINERS (not published)
bin/aiskills.mjs        thin entry point: imports ../src/scripts/cli.mjs
bin/aix.mjs             sets AISKILLS_ROUTE=1, then imports the same CLI (aix = aiskills --route)
src/scripts/            cli.mjs, installer.mjs, postinstall.mjs (published); vendor-skills.mjs, skillsignore.mjs,
                        build-skills-docs.mjs, build-docs-html.mjs + docs-template.html (build time only)
src/test/               node:test suite, incl. docs.test.mjs, docs-skills.test.mjs, docs-html.test.mjs
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/, LICENSE
```

## What just happened
- **User docs in `docs/docsite/`** written with the repo's `/create-lib-docs` skill: landing page, Getting started (3), Skills (14, generated), Tutorial (5), Guides (8), Concepts (5), Reference (6: CLI, patterns, environment, files and schemas, `.skillsignore`, errors and exit codes), FAQ, 3 SVG diagrams, `llms.txt` / `llms-full.txt`. `docs.test.mjs` (written first) holds them to the code: create-lib-docs checker, fresh `llms.txt`, a reference entry for every command/alias/option/env var/error message in `src/scripts/`, real `aiskills.json`/`layout.json` fields, and every `<!-- verify -->` example run against the real skills with exact output.
- **Single-page HTML** `docs/docsite/index.html` (tabs, page list, outline, search, dark theme), built by `npm run docs:html` from a Node port of sugatoray/callai's `docs/site/` builder (no banner). Renders with marked + highlight.js from cdnjs. `docs-html.test.mjs` checks freshness and contents and, in Chromium, renders all 43 pages and checks every link and anchor.
- **Skills tab**: `npm run docs:skills` generates `docs/docsite/skills/` and the landing page's Skills list (between `<!-- skills:start -->` / `<!-- skills:end -->`) from what the package really ships (vendored in a temp folder). `docs-skills.test.mjs` checks it against the vendored skills. `npm run docs` regenerates Skills pages, `llms.txt` and `index.html` together.
- **Bug fix**: `uninstall -n` printed `npx -y skills remove …` without the pinned version; it now prints `npx -y skills@1.7.6 remove …` (CHANGELOG 0.2.0 → Fixed).

## Known issues / open threads
- **Awaiting the user (AIS-8):** publish the docs on GitHub Pages like callai (`sugatoray.github.io/callai`)? callai's `.github/workflows/docs.yml` builds and deploys with `actions/deploy-pages`; the aiskills repo has no workflows. Open question: site root or a subpath such as `/aiskills/npm/`.
- PR #122 is open; publish only after it's merged (AIS-1).
- Awaiting the user's decision on AIS-7 (keep `postinstall` or remove it).
- `--route` lookups still only tested against a fake registry (AIS-2). This session's network reached the npm registry and cdnjs, but `sugatoray.github.io` was blocked; skills.sh wasn't tried.
- `/scrolls-update` isn't an installed command in these sessions; follow `skills/scrolls/scrolls-update/SKILL.md` from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
