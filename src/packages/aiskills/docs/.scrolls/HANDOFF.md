# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` **`1.0.0` is published on npm** (dist-tag `latest`; published 2026-11-12T01:06Z, i.e. the evening of 2026-11-11 US Eastern, so the CHANGELOG date `2026-11-11` stands; checked with `npm view` 2026-11-12). It is the first stable release (strict SemVer from here). It came from [#141](https://github.com/sugatoray/aiskills/pull/141) (the `image-styles-skills` group with `artwallbg` and `commentdrop`, AIS-16; `AISKILLS_SKILLS_VERSION` removed, AIS-11), squash-merged to `master` as `28aee02`, and bundles **15 skills in 8 groups**. Published versions: `0.4.0`–`0.9.0`, `1.0.0` (plus npm's hidden `0.0.0-stage` placeholder). Source in `src/packages/aiskills/`. `npm test`: 421 offline tests, all pass. Docs live at https://sugatoray.github.io/aiskills/, redeployed by `.github/workflows/aiskills-docs.yml` on pushes to `master`.

**`1.2.0` is published on npm** (`latest`, published 2026-11-14T02:22Z, i.e. the evening of 2026-11-13 US Eastern, so the CHANGELOG date `2026-11-13` stands; checked with `npm view`). It came from [#223](https://github.com/sugatoray/aiskills/pull/223) (squash `089f938`), which bundles `/run-code-review` (from #215, `7c0afec`) and its 1.2.0 `-o` reports in the new `review-skills` group: **17 skills in 9 groups**. Release changes: `package.json`, CHANGELOG `[1.2.0] - 2026-11-13`, SECURITY `1.2.x` current, banner and docs, `DOCS_VIEW` with 1.2.0 as `latest` and the docs examples it drives. `1.1.0` (from #206) was published 2026-11-12.

**On `master` (`73af49b`), not yet released:** `package.json` is `1.3.0-dev`, and `## [1.3.0] - Unreleased` holds `run-code-review` 1.3.0 (starts only when typed), colored output and the CLI outputs page.
- **#245** was squash-merged as `73af49b`.
- The versioned docs website (#234) is live: 1.2.0 at the root, 1.1.0–0.8.0 under `/v/`, 1.3.0-dev at `/dev/`.
- **#241** moved the docs workflow to `actions/checkout@v5` / `setup-node@v5` and Node 22.

**On `claude/cli-config`, in [#250](https://github.com/sugatoray/aiskills/pull/250)** (issues #251–#257, base `master`): `aiskills config`, like `git config`.
- **Rebased** onto `73af49b` and force-pushed, with the user's approval; GitHub had already retargeted #250 to `master`.
- **The latest fix** is `b8916c0`. `npm test`: 506 tests, all pass.

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
`aiskills config`, built Red/Green on `claude/cli-config` (`src/test/config.test.mjs`, 28 tests; the user's design choices: user and project files, every `AISKILLS_*` default as a key):
- **`1e3724e` settings:** `config <key> [<value>]`, `--unset`, `-l`/`--list` with `--show-origin` and `--json`, and `--global` (the default) / `--project`.
  - Keys: `scope`, `agents`, `skills`, `groups`, `copy`, `route`, `layout`, `stats`, `skills-version`, `color`. Values are checked and normalized when set.
  - Precedence: option > `AISKILLS_*` > project file > user file > remembered (the install folder's `aiskills.json`) > default.
  - Wiring: `config.mjs` is read by `envOptions`, `resolveLayout`, `resolveStats`, `skillsPackageSpec` and `setColorConfig`.
  - `info` shows both files, settings marked `user config` / `project config`, and a new `color` line.
- **`cc9dd0b` aliases:** `alias.<name>` is stored as a flat key and split like a shell. Aliases can use aliases, and a loop is an error. An alias can't take a command's name (`COMMANDS` in `cli.mjs`).
- **`56f986b`, `8c87d14` file name:** the user file went `aiskills.json` → `aiskills-config.json` → `aiskillsconfig.json` (the user's choice). JSON was kept; see WISDOM → Constraints.
- **`0adc935`, `058de0f` shell aliases:**
  - `!` aliases run `sh -c '<cmd> "$@"'` and pass the exit code back. They're allowed only in the user file.
  - In `./.aiskills.json`, `--project` refuses them. One written there by hand is skipped with one warning per run, and running it fails with a hint. `AISKILLS_USER_CONFIG` (new) names a different user file.
- **`b8916c0` fix, from reviewing #250:**
  - `config` now takes an alias value that starts with `-` (`alias.cg "--color groups"`).
  - The options that go before a command are read again after each expansion, so `--color` / `--route` / `--version` at the start of an alias work.
  - A new test keeps `COMMANDS` in step with `main()`'s `switch`.
- **`c0e5510` example file:** `examples/sample_aiskillsconfig.json` sets every key and has each kind of alias. It's in package.json `"files"`, and `syncSkills` copies it to `<root>/sample_aiskillsconfig.json`, where it's never read as config.
- **Docs:**
  - `reference/cli.md`: `### config` plus `#### Aliases`, and the regenerated `--help` block.
  - `errors.md`: Config errors, alias errors and the project-alias warning.
  - `files.md`, `environment.md` (`AISKILLS_USER_CONFIG`), `guides/set-defaults.md`, CHANGELOG `[1.3.0]`, ARCHITECTURE, and a config group in `docs/cli-outputs/commands.json`.
  - Regenerate with `npm run docs`.

## Known issues / open threads
- **#250 awaits review and merge** (AIS-22).
- **Installing from a local pack:** `npm pack` names the tarball after `package.json`'s version (`sugatoray-ai-aiskills-1.3.0-dev.tgz`). The user hit npm's misleading "seems to be corrupted" (`ENOENT`) by typing `…-1.3.0.tgz`. `npm i -g "$(npm pack --silent)"` avoids that.
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
