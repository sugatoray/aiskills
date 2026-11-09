# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` `0.4.0` (folder `src/packages/aiskills/`) is ready for its first release, and everything is on `master`: [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122) (the package), [#146](https://github.com/sugatoray/aiskills/pull/146) (Apache-2.0 + License page + create-lib-docs 1.2.0) and [#147](https://github.com/sugatoray/aiskills/pull/147) (`newsletter-ai` left out by `skills/newsletters/.skillsignore`), all squash-merged; their issues (#123–#151) are closed. The package bundles 12 skills in 6 groups, is licensed Apache-2.0 (the skills keep MIT in their `SKILL.md`), and has no install step (`npm install` only adds `aiskills`/`ais`/`aix`; `aiskills install` does the work). `npm test` runs 291 offline tests (about 60 s; the docs and banner tests open Chromium when Playwright and cdnjs/jsDelivr are available), `npm run test:e2e` runs 8 with the real `npx skills` (network), and `python3 -m pytest -q skills/docs/create-lib-docs/tests` runs 9 (needs `pip install pytest`). All pass. Nothing has been published to npm. The docs are live at https://sugatoray.github.io/aiskills/, redeployed by `.github/workflows/aiskills-docs.yml` on every push to `master` that touches them.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { aiskills, ais -> bin/aiskills.mjs; aix -> bin/aix.mjs }; scripts incl. docs, docs:skills, docs:html
CHANGELOG.md            Keep a Changelog + SemVer; ships with the package
SECURITY.md             reporting + what the package touches + protections; ships
docs/docsite/           user docs (not published): 43 Markdown pages incl. license.md (GENERATED), images/*.svg, llms.txt, llms-full.txt, index.html
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
LICENSE                 Apache-2.0, the package's own (committed; never vendored)
(vendored, git-ignored) skills/<name>/ (flat), .aiskills/{layout.json,nested/}, .claude-plugin/
```

## What just happened
- **#146 and #147 merged** (squash). #147 was stacked on #146's branch; after #146's squash-merge it conflicted, and was fixed without a force push by merging `master` into it with `-s ours` (master's files were identical to its old base, so nothing was lost; diff unchanged). The docs site redeployed on both merges (runs #3, #4).
- **Issues for both PRs**: #148 (parent) with #149 (license) and #150 (License page + create-lib-docs) for #146; #151 for #147. All closed by the merges.
- **Before that, this session**: package license MIT → Apache-2.0 (committed official `LICENSE`, SHA-256 tested; the pack step no longer copies the repo's MIT one); a generated License page/tab (package license + a row per bundled skill) and create-lib-docs 1.2.0 requiring `license.md` (`check_docs.py`: `missing` / `no table`); `newsletter-ai` left out of the package (`npx skills add` still finds it in the repo); the `layout.json` sample in the Files reference tied to the real `ignored` list by a test. Earlier: no install step (AIS-7), the `aix` confirmation (`[y/N]`, `-y`, `install -n`), the banner with both install steps and the prompt, the GitHub Pages workflow (AIS-8), the `src/scripts/` core/pack/docs split, the themes. Details: `CHANGELOG.md` (0.4.0) and `git log`.
- Current work goes on `claude/aiskills-after-merges` (from `master` after #147), per the new-branch rule in `WISDOM.md`.
- Review links (private artifacts): the docs page https://claude.ai/artifact/6EDgyyQAxAK4ch324V9KNb (Version 8; the live site is now newer: 12 skills); the theme mockup https://claude.ai/artifact/AWW2bzv19QjvMaz7iHpupi (superseded).

## Known issues / open threads
- **Next: publish `0.4.0` (AIS-1)** from the maintainer's machine: date `## [0.4.0]` in `CHANGELOG.md`, `npm test` + `npm run test:e2e`, `npm run pack:dry`, `npm publish`. Then update SPEC.md's release status.
- **Awaiting the user:** whether to delete the leftover remote branch `claude/focused-faraday-nqvduf` (recreated by a push after #122 merged; its only commit is already on `master` via #146; GitHub deleted the #146/#147 branches); and whether the 12 bundled skills (plus `newsletter-ai`) should move from MIT too (repo-wide; not done).
- `--route` lookups still only tested against a fake registry (AIS-2).
- `/scrolls-update` isn't an installed command in these sessions; follow `skills/scrolls/scrolls-update/SKILL.md` from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
