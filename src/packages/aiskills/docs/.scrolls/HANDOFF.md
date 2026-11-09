# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` `0.4.0` (folder `src/packages/aiskills/`) is feature-complete for a first release, and now has full user documentation. `npm test` runs 282 offline tests (about 60 s; the docs and banner tests open Chromium when Playwright and cdnjs/jsDelivr are available) and `npm run test:e2e` runs 8 tests with the real `npx skills` (network). All pass. Everything is on branch `claude/focused-faraday-nqvduf` in the open PR [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122). Nothing has been published to npm. The docs have a GitHub Pages workflow but aren't live until it reaches `master`.

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
src/scripts/core/       cli.mjs, installer.mjs (published; there is no install step)
src/scripts/pack/       vendor-skills.mjs, skillsignore.mjs (run at npm pack; never published)
src/scripts/docs/       build-skills-docs.mjs, build-docs-html.mjs, create-banner.mjs, themes.mjs, templates/ (build time only)
src/test/               node:test suite, incl. docs.test.mjs, docs-skills.test.mjs, docs-html.test.mjs, banner.test.mjs, themes.test.mjs
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/, LICENSE
```

## What just happened
- **`aix` safety confirmation (user's request)**: skills a `--route` lookup found are listed and confirmed (`[y/N]`, default no) before anything is installed; no terminal → stop unless `-y`/`--yes`; pinned specs skip it; new `install -n`. Red/Green: 8 CLI tests (3 run in a pseudo-terminal via `sandbox().tty()`, which waits for `[y/N] ` before typing — typing ahead made the pty echo the answer before the prompt); 4 existing lookup tests now pass `-y`. Docs runner gained `<!-- verify: tty=<answer> -->`, so tutorial 4's terminal example is verified. CLI/errors references, concepts, security, agent guide, README, SECURITY.md, docs/meta, CHANGELOG (0.4.0 Added, marked breaking for unattended lookups) updated.
- **Banner: two install steps (user-approved mockup, Option A modified)**: install box = `npm install -g …` + `aiskills install   # save + register` (comment dimmed via `<span class="cmt">`, sharing `.term-body .c`'s colour, because the box keeps the terminal background in every ink); terminal opens with `ais sync   # save only` + `skills saved to ~/.config/…/skills`; tagline "…in one npm package." (README alt and `BANNER_ALT` follow it, tested). Red/Green: 3 new banner tests; the browser contrast tests caught `--muted` failing on white/dark ink (2.94:1) before the colour was switched. `banner_2x.png`, the banner page and `index.html` rebuilt; 273 tests pass.
- **Docs refresh after AIS-7 (`/create-lib-docs --update`, by hand)**: checker 0 problems, 95 docs tests and 270 overall pass. A read-through found two leftovers the Markdown-only test missed: the caption of `images/install-flow.svg` (still described the npm install step; re-rendered and checked) and "Updates come with the package" in `concepts/how-it-works.md`. The no-install-step docs test now also scans the SVG diagrams (red first).
- **No install step (AIS-7, option B, the user's choice)**: removed `src/scripts/core/postinstall.mjs` and the `postinstall` script. `npm install` only installs the commands; `aiskills install` (or `npx @sugatoray-ai/aiskills install`) does the work. Gone: `AISKILLS_SKIP_POSTINSTALL`, `AISKILLS_SKIP_SKILLS_ADD`, `CI`, `INIT_CWD`. Red/Green: packaging test forbids `preinstall`/`install`/`postinstall`/`prepare`; CLI tests moved to `aiskills install`; docs tests require the environment reference to list only variables the code reads and no page to describe an install step; e2e asserts `npm install -g` writes nothing to `~` or agent folders (8 e2e pass). Docs: `guides/configure-npm-install.md` → `guides/set-defaults.md`; installation, tutorial 3, environment/errors/files/cli references, FAQ, security, how-it-works, README, SECURITY.md, docs/meta and CHANGELOG (0.4.0 **Removed**, marked breaking vs the unpublished 0.1–0.3) updated.
- **GitHub Pages workflow (AIS-8 done)**: `.github/workflows/aiskills-docs.yml` at the repo root, modelled on sugatoray/callai's `docs.yml`, builds the single page with the new `npm run docs:site -- --ref <branch>` (writes git-ignored `site/index.html`) and deploys it with `actions/deploy-pages` to `https://sugatoray.github.io/aiskills/` (site root) on pushes to `master` touching the docs, banner, docs builders, `package.json` or the workflow; also by hand, with an opt-out *deploy* input. TDD: `src/test/docs-workflow.test.mjs` (8 tests, red first; a mutation of the upload path fails it). README, docs landing, MAINTAINERS, `src/scripts/README.md` and CHANGELOG (0.4.0 Added) link the site.
- **Issues filed for PR #122**: epic #123 with children #124–#140 and #142–#144 (one per step; #142 install-step removal, #143 banner install steps, #144 `aix` confirmation, #140 Pages workflow; #141 belongs to something else). The PR body lists them all with `Closes` and describes the current install flow, the `aix` confirmation and 282 tests.
- **CHANGELOG caught up**: `## [0.4.0]` → Changed now also lists the user-docs refresh ("Ways to read these docs", the files reference) and the `docs/meta/` update, so every change on this branch since 0.3.0 is in the CHANGELOG. 261 offline tests pass.
- **`docs/meta/` brought up to date** after a full read against the code: ARCHITECTURE (module table with the `pack/` and `docs/` modules, a "Docs and banner" flow, five new design decisions), FEATURES (user-docs column now links `docs/docsite/` pages; new "Code layout" row), MAINTAINERS (Python/Playwright requirements, docs/banner commands, the current release flow, new troubleshooting rows). All links and anchors resolve; every function named in the module table exists.
- **Version bumped to `0.4.0`** (`0.3.0` marked "Never published", like `0.2.0` and `0.1.0`). CHANGELOG `## [0.4.0] - Unreleased` holds the `src/scripts/` reorganization and the anchored `"files"` fix; `[0.3.0]` keeps the docs, banner, themes and the `uninstall -n` fix. The package README's tests row and maintainer links were brought up to date. 261 offline + 7 e2e tests pass; `npm pack` builds `sugatoray-ai-aiskills-0.4.0.tgz`.
- **Docs refreshed with `/create-lib-docs --update`**: the reference, examples, Skills pages and links still matched the code; a read-through added "Ways to read these docs" to the landing page (Markdown, `index.html` with search and the 11-theme gear menu, `llms.txt`) and a note in `reference/files.md` on what stays out of the npm package.
- Earlier this session: `src/scripts/` split into `core/` (ships), `pack/` (`npm pack`) and `docs/` (docs/banner builders), explained in `src/scripts/README.md`; the theme switcher (11 themes, Lights Out default) on the docs page and banner editor; `banner_2x.png` fingerprinted with its theme and source-page SHA-256.
- Review links (private artifacts): the docs page https://claude.ai/artifact/6EDgyyQAxAK4ch324V9KNb (Version 6: current, with the `aix` confirmation and the new banner); the theme mockup https://claude.ai/artifact/AWW2bzv19QjvMaz7iHpupi (superseded).

## Known issues / open threads
- **To go live:** the owner sets Settings → Pages → Build and deployment → Source: "GitHub Actions", then merges PR #122; the push to `master` deploys. A workflow_dispatch run also needs the file on `master` first.
- PR #122 is open; publish only after it's merged (AIS-1). Until it's on `master`, the README's banner image URL returns 404 (on GitHub and npm).
- `--route` lookups still only tested against a fake registry (AIS-2). This session's network reached the npm registry and cdnjs, but `sugatoray.github.io` was blocked; skills.sh wasn't tried.
- `/scrolls-update` isn't an installed command in these sessions; follow `skills/scrolls/scrolls-update/SKILL.md` from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
