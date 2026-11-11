# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
`@sugatoray-ai/aiskills` **`0.5.0` is published on npm** (2026-11-09, dist-tag `latest`; `0.4.0` was the first): `npm install -g @sugatoray-ai/aiskills`, then `aiskills install`. Source in `src/packages/aiskills/`. `master` has everything up to [sugatoray/aiskills#160](https://github.com/sugatoray/aiskills/pull/160). **`0.6.0` is ready but not merged or published:** [#162](https://github.com/sugatoray/aiskills/pull/162) (`claude/aiskills-skills-version-range`, 6 commits; issues #163 parent, #164–#170). The package bundles 12 skills in 6 groups, is Apache-2.0 (skills keep MIT in their `SKILL.md`), and has no install step. On #162's branch: `npm test` 342 offline tests (all pass, about 60 s), `npm run test:e2e` 8 with the real `npx skills` (network), `python3 -m pytest -q skills/docs/create-lib-docs/tests` 9 (needs `pip install pytest`). Docs live at https://sugatoray.github.io/aiskills/, redeployed by `.github/workflows/aiskills-docs.yml` on pushes to `master`.

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
- **0.5.0 published** (2026-11-09) after #155 (skills.sh install count) and #160 (shorter npm description, docs-site homepage, keywords) merged. npm staged it; the maintainer approved it.
- **The user's `min-release-age=7` broke it on release day:** first the package itself (fixed on their side with `min-release-age-exclude[]=@sugatoray-ai/aiskills`, npm ≥ 11.21), then every command running `npx -y skills@1.7.6` (published 2026-11-03). `npx` ignores `min-release-age-exclude` (tested npm 11.21.2 and 12.2.2), and aiskills stripped `npm_config_*`, so nothing helped but waiting.
- **#162 (0.6.0, AIS-10), all Red/Green, as the user chose:**
  - npm's release-age variables reach `npx` (`npm_config_min_release_age=0 aiskills …` works once);
  - npm's refusal is explained (`explainReleaseAge`; npx stderr is now read and printed at the end);
  - `AISKILLS_SKILLS_LIB_VERSION` takes npm ranges and interval notation (`[x, ...)`, `(x, ...)`, `[x, y)`, `(..., x]`; an open end is exactly one of `...`, `?`, `*`; `…` read as `...`); plain spaces only; empty intervals refused; quoted for `cmd.exe`;
  - an override is announced once per command;
  - renamed from `AISKILLS_SKILLS_VERSION` (it's the skills CLI *library's* version); the old name still works with a warning and is **removed in 1.0.0** (AIS-11);
  - `npm run audit:skills [version]` (age ≥ 7 days, no high/critical advisory) and the MAINTAINERS checklist;
  - version `0.6.0`, CHANGELOG dated 2026-11-11 (Added, Deprecated, Changed), banner and docs regenerated.
- **Checked for real:** with `npm_config_before=2026-11-02` the pin is refused and explained; `(..., 1.7.6]`, `(?, 1.7.6]`, `(*, 1.7.6]` and the old variable name each ran `skills@<=1.7.6` → 1.7.4; `npm run audit:skills` on 1.7.6: 8 days old, 0 advisories in 8 packages.
- Earlier: #146, #147, #153, #154, #155, #160 merged. Details: `CHANGELOG.md` and `git log`.

## Known issues / open threads
- **Next:** merge #162, then publish `0.6.0`: `npm run audit:skills`, `npm test` + `npm run test:e2e`, `npm run pack:dry`, `npm publish`, approve the staged release (`npm stage approve`), then update SPEC's release note. The CHANGELOG section is dated 2026-11-11; re-date it if it ships later.
- **Windows is untested:** run `aiskills skills --version` with `AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]'` in PowerShell and `set "AISKILLS_SKILLS_LIB_VERSION=(..., 1.7.6]"` in Command Prompt before or soon after publishing 0.6.0.
- **The user's `~/.npmrc`:** `skills` in their `min-release-age-exclude[]` line does nothing for `npx`; they can drop it.
- **Awaiting the user:** delete the leftover remote branch `claude/focused-faraday-nqvduf` (its only commit is on `master`)? Should the bundled skills move from MIT too (repo-wide; not done)?
- **1.0.0:** remove the `AISKILLS_SKILLS_VERSION` fallback (AIS-11).
- `--route` lookups still only tested against a fake registry (AIS-2); now testable against the published package.
- `/scrolls-update` and `/create-issues-update-pr` aren't installed commands in these sessions; follow their `SKILL.md` files from the repo by hand.
- See `GAP_ANALYSIS.md` for the rest.
