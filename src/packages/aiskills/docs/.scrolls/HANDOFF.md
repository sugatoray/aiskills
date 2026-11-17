# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` **`1.0.0` is published on npm** (dist-tag `latest`; published 2026-11-12T01:06Z, i.e. the evening of 2026-11-11 US Eastern, so the CHANGELOG date `2026-11-11` stands; checked with `npm view` 2026-11-12). It is the first stable release (strict SemVer from here). It came from [#141](https://github.com/sugatoray/aiskills/pull/141) (the `image-styles-skills` group with `artwallbg` and `commentdrop`, AIS-16; `AISKILLS_SKILLS_VERSION` removed, AIS-11), squash-merged to `master` as `28aee02`, and bundles **15 skills in 8 groups**. Published versions: `0.4.0`–`0.9.0`, `1.0.0` (plus npm's hidden `0.0.0-stage` placeholder). Source in `src/packages/aiskills/`. `npm test`: 421 offline tests, all pass. Docs live at https://sugatoray.github.io/aiskills/, redeployed by `.github/workflows/aiskills-docs.yml` on pushes to `master`.

**`1.2.0` is published on npm** (`latest`, published 2026-11-14T02:22Z, i.e. the evening of 2026-11-13 US Eastern, so the CHANGELOG date `2026-11-13` stands; checked with `npm view`). It came from [#223](https://github.com/sugatoray/aiskills/pull/223) (squash `089f938`), which bundles `/run-code-review` (from #215, `7c0afec`) and its 1.2.0 `-o` reports in the new `review-skills` group: **17 skills in 9 groups**. Release changes: `package.json`, CHANGELOG `[1.2.0] - 2026-11-13`, SECURITY `1.2.x` current, banner and docs, `DOCS_VIEW` with 1.2.0 as `latest` and the docs examples it drives. `1.1.0` (from #206) was published 2026-11-12.

**On `master` (`904e593`), not yet released:** `## [1.3.0]` holds `run-code-review` 1.3.0 (starts only when typed), colored output and the CLI outputs page (#245, `73af49b`), and `aiskills config` with the grouped Skills tab (#250, `904e593`). The versioned docs website (#234) is live: 1.2.0 at the root, 1.1.0–0.8.0 under `/v/`, 1.3.0-dev at `/dev/`.

**Release 1.3.0 is prepared in [#287](https://github.com/sugatoray/aiskills/pull/287)** (branch `claude/awesome-knuth-8n4u00`, `0122db5`; AIS-20 steps 2–3):
- `package.json` `1.3.0-dev` → `1.3.0`; CHANGELOG `## [1.3.0] - 2026-11-17` (the "In development" note removed); SECURITY `1.3.x` current.
- The seven docs examples that printed `1.3.0-dev` (`reference/cli.md`, `getting-started/installation.md`) now print `1.3.0`; `npm run banner:png` and `npm run docs` regenerated the banner, `index.html`, `llms-full.txt` and `cli-outputs.html`.
- `npm test`: 515 tests, all pass. `npm run test:e2e` not run. Not merged, published or tagged.

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
- The user asked to bump the version from `1.3.0-dev` to `1.3.0`. Followed MAINTAINERS → Releasing steps 2–3 (see above); the docs tests flagged the seven version examples, as WISDOM → Constraints predicts.
- `docs/.scrolls/` caught up with the merges of #245 and #250: AIS-22 ticked, config and the grouped Skills pane added to `SPEC.md`.

## Known issues / open threads
- **Finish 1.3.0 (AIS-20):** run `npm run test:e2e`, merge #287, then from an up-to-date `master`: `npm run pack:dry`, `npm publish` (approve if staged), tag `aiskills-v1.3.0` on its `gitHead`, `npm run clean`, and update the release note at the top of `SPEC.md`. If the release isn't on 2026-11-17, re-date the CHANGELOG section. Watching #287 was offered; no answer yet.
- **#250's docs-site commits** (counts, tab numbers, grouped Skills pane) may still lack issues; it merged without this being confirmed.
- **Installing from a local pack:** `npm pack` names the tarball after `package.json`'s version (it was `sugatoray-ai-aiskills-1.3.0-dev.tgz` before #287). The user hit npm's misleading "seems to be corrupted" (`ENOENT`) by typing `…-1.3.0.tgz`. `npm i -g "$(npm pack --silent)"` avoids that.
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
