# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` **`0.7.0` is published on npm** (dist-tag `latest`; `0.4.0`–`0.6.0` before it; checked with `npm view` on 2026-11-11): `npm install -g @sugatoray-ai/aiskills`, then `aiskills install`. It bundles **13 skills in 7 groups** (#161 merged to `master`). Source in `src/packages/aiskills/`. **Open:** [#184](https://github.com/sugatoray/aiskills/pull/184) (`claude/happy-ramanujan-yf66t0`, AIS-13) adds `install -i`/`--interactive` and `install --last-agents`, and bumps the package to **`0.8.0`** (CHANGELOG `## [0.8.0] - 2026-11-11`, SECURITY supported `0.8.x`, banner v0.8.0, docs version examples). On that branch `npm test` runs 350 offline tests, all pass. Docs live at https://sugatoray.github.io/aiskills/, redeployed by `.github/workflows/aiskills-docs.yml` on pushes to `master`.

Layout (decided by the user; see `WISDOM.md` → Constraints):

```text
package.json            "bin": { aiskills, ais -> bin/aiskills.mjs; aix -> bin/aix.mjs }; scripts incl. docs, docs:skills, docs:html
CHANGELOG.md            Keep a Changelog + SemVer; ships with the package
SECURITY.md             reporting + what the package touches + protections; ships
docs/docsite/           user docs (not published): 45 Markdown pages incl. license.md (GENERATED), images/*.svg, llms.txt, llms-full.txt, index.html
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
- **The user asked** whether `aiskills install` creates a folder for every agent. Answer (from `skills@1.7.6`'s `dist/cli.mjs`): `--yes` without `--agent` installs to the *detected* agents (config folder exists) plus the universal `.agents/skills` agents, and to **all** agents only when none is detected; `--yes` also hides the `npx skills` pickers.
- **AIS-13 (#184):** `install -i` runs `npx skills add <root> [--global]` without `--yes` and without `--skill '*'` (`-s`/`-G`/`-a` still passed), interactively (stdin/stderr on the terminal); refuses without a TTY. The agent picker pre-checks `lastSelectedAgents` and saves the new pick. With stats on, the count uses the skills `npx skills list` then shows from the install folder. `install -l`/`--last-agents` reads `lastSelectedAgents` (`skillsLockPath()`: `$XDG_STATE_HOME/skills/.skill-lock.json`, else `~/.agents/.skill-lock.json`) and adds it to `-a`; errors if empty. 5 new tests in `cli.test.mjs`; `reference/cli.md` (option headings, help copy, table), `reference/errors.md` (2 new errors), README summary line, CHANGELOG, regenerated `index.html`/`llms-full.txt`.
- The PR was opened from the Claude Code UI, not by this session.
- **Docs refresh** (create-lib-docs `--update`, by hand): tutorial 02 (`-i`, `-l` with verified output), FAQ "which agents", `use-from-an-agent` (no `-i` in scripts), installation, landing page (`video` group was missing from the intro). `docs.test.mjs` examples take a new `last=a,b` param (writes `~/.agents/.skill-lock.json`). `npm run docs` + `banner:png` rerun; banner unchanged. 350 tests pass.

## Known issues / open threads
- **0.8.0 bump done in #184** (the user's request): `package.json`, CHANGELOG (also added link refs for 0.5.0–0.8.0), SECURITY, README install examples (`-i`, `-l`), `reference/cli.md`/`files.md`/`installation.md` version output; `npm run docs` + `banner:png` regenerated.
- **Next:** merge #184, then publish `0.8.0`: `npm run audit:skills`, `npm test` + `npm run test:e2e`, `npm run pack:dry`, `npm publish`, `npm stage approve`, update SPEC's release note.
- **Try `aiskills install -i` once by hand** on a real machine: the real pickers were never driven (see GAP_ANALYSIS). With `-p`, `npx skills` asks for the scope (no `--project` flag on `add`).
- **Windows is untested:** run `aiskills skills --version` with `AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]'` in PowerShell and `set "AISKILLS_SKILLS_LIB_VERSION=(..., 1.7.6]"` in Command Prompt.
- **The user's `~/.npmrc`:** `skills` in their `min-release-age-exclude[]` line does nothing for `npx`; they can drop it.
- **Awaiting the user:** delete the leftover remote branch `claude/focused-faraday-nqvduf`? Should the bundled skills move from MIT too (repo-wide; not done)?
- **1.0.0:** remove the `AISKILLS_SKILLS_VERSION` fallback (AIS-11).
- `--route` lookups still only tested against a fake registry (AIS-2).
- `/scrolls-update` and `/create-issues-update-pr` aren't installed commands in these sessions; follow their `SKILL.md` files from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
