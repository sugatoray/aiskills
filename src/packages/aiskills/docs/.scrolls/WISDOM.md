# WISDOM.md — Constraints, Traps, Ditches, and Wisdom

Hard-won lessons for this project. Read this LAST, right before editing code, so it's freshest in mind.

## Constraints — respect and conform to them
Things you must respect or conform to (external requirements, API contracts, platform limits).

- The install folder is `~/.config/sugatoray/aiskills/` (skills in `skills/`, the marketplace file in `.claude-plugin/`), as the user specified. Only `AISKILLS_HOME` overrides it. Keep it even though the npm scope is `sugatoray-ai`.
- Package name is `@sugatoray-ai/aiskills` (the user's npm org). Commands: `aiskills`, `ais` (same) and `aix` (= `aiskills --route`). Don't add or rename commands unasked: each is a public name users script against. `ask` is taken by Amazon's Alexa Skills Kit CLI.
- The package ships `skills/` **flat**; `.aiskills/layout.json` + `.aiskills/nested/` must keep every other repo file so `--nested` can rebuild the repo's `skills/` byte for byte. Skill folder names come from `SKILL.md` `name:`, which must be unique and folder-safe (`vendor()` refuses otherwise).
- `marketplace.json` is used **only** to define skill groups. Never install anything as a Claude Code plugin from it; all installs go through `npx skills add`.
- Group name = the plugin entry's `name`, exactly. The alias (name minus `-skills`) and the `all` group are CLI inventions; the README must keep saying so.
- npm never runs uninstall lifecycle scripts, so `aiskills uninstall` has to be run before `npm uninstall -g`.
- npm 7+ hides postinstall output unless `--foreground-scripts`; pnpm and bun skip postinstall unless allowed; `--ignore-scripts` skips it too. `aiskills install` is the fallback for all of these.
- `bin/aiskills.mjs` is a thin entry point; the code (incl. `cli.mjs`) is in `src/scripts/` and tests in `src/test/`; `package.json`, README and docs stay at the package root. `"bin"` points at `bin/aiskills.mjs`, which only imports `src/scripts/cli.mjs`.
- **Layout is the user's call; don't rearrange it unasked.** It was changed four times in one session before settling: `bin/aiskills.mjs` (thin entry point at the package root) → `src/scripts/cli.mjs`; all other code in `src/scripts/`; tests in `src/test/`; `package.json`, README and docs at the package root.
- The `files` list in `package.json` decides what ships. The scrolls files, `CLAUDE.md` etc. must stay out of the tarball. Anything `"files"` lists can't be excluded by `.npmignore` (npm's documented rule), so `.npmignore` only matters for paths outside `"files"`; its root-anchored memory-file entries (`/CLAUDE.md`, …) are a safety net for if `"files"` is removed. Keep the leading `/`, or same-named files inside bundled skills would be dropped too.

## Traps — avoid them always
Specific bugs that have bitten this project before — avoid repeating them.

- **npm drops nested `.gitignore`/`.npmignore` files** from the tarball and applies them as ignore rules while packing. The vendor step renames them to `_gitignore`/`_npmignore`; `syncSkills` renames them back. (Hit by `skills/newsletters/newsletter-ai/.gitignore`.)
- **The package's own `.gitignore` ignores `/skills/`.** Without a `.npmignore` present, npm would fall back to `.gitignore` and ship no skills. Keep `.npmignore`.
- **Nested `npx` inside postinstall fails with "skills: not found"** because npm exports `npm_config_global`, `npm_config_prefix` and friends. `childEnv()` strips `npm_*` variables except the registry, proxy and cert ones.
- **`spawnSync` with a deleted `cwd` throws ENOENT.** After `--purge` the install folder is gone; `runSkills` falls back to `$HOME`.
- **An env default of `skills: ['*']` meant "everything"** and silently overrode `-G`. The default is now `[]`; "everything" is `null` from `selectedSkills`.
- **A blanket find-and-replace of paths also rewrites history.** Replacing `src/aiskills/` → `src/scripts/` across the scrolls changed a `HANDOFF.md` line about the earlier `src/aiskills/` → `src/packages/aiskills/` move. Replace paths file by file and re-read history lines.
- **`sed` with `|` as its delimiter can't use `\|` alternation**: `s|^/\(A\|B\)|...|` silently changes nothing. Use another delimiter or Python for regex edits, and check the edit actually happened before trusting a test result that depends on it.
- **A static `import` runs before the code above it.** `bin/aix.mjs` must set `AISKILLS_ROUTE` and then `await import(...)` the CLI; with `import "..."` the CLI would read its options before the variable exists.
- **Don't commit while a background check has a file deliberately broken.** A mutation check that edits a source file and restores it afterwards leaves the tree wrong until it ends; wait for it (e.g. the Stop hook asked for a commit mid-run) before `git add`.
- **Hardcoded repo-root depth** broke when the package moved. `vendor-skills.mjs` walks up to the first folder with `skills/` and `.claude-plugin/marketplace.json`.
- **`export HOME=<tmp>` in a test shell** also breaks the next `git commit` (no identity). Set `HOME` per command, not with `export`.

## Ditches — bad patterns or decisions to avoid
Bad patterns or decisions to never take, and why they were rejected.

- Never let the postinstall step fail `npm install`. Catch everything, warn, and point at `aiskills install`.
- Don't add `s`, `l` or `u` as command aliases: `s` could mean `sync` or `skills`, `l` reads as `list` but sits next to `ls` (= `installed`), and many CLIs use `u` for "update". Prefer `npm`'s own short forms (`i`, `r`, `ls`).
- Don't make install-time behaviour opt-in through an env var. The install script stays (so scanners and pnpm still flag it), the hint it prints is hidden by npm 7+, and users lose the one-step install. Either keep the script doing its job or remove it entirely (AIS-7).
- Never run `npx skills` interactively from scripts; always pass `--yes` (postinstall has no TTY).
- Never auto-pick among several registry matches for a name under `--route`. List them and make the user pin `owner/repo@skill`; it's third-party code with full agent permissions.
- A full `uninstall` (no `-s`/`-G`) must only remove skills whose recorded source is the install folder, even with `--route`.
- Don't copy a reference repo's layout without checking it actually has the shape asked for; `sugatoray/pptxdiff`'s `src/packages/*` have no inner `src/` (only its root package does). Say what you found and which part you're copying.
- Don't commit the vendored `skills/`, `.claude-plugin/` or `LICENSE` copies in the package folder; `npm run clean` removes them.

## Wisdom — best practices and Red/Green TDD
Best practices worth reusing.

- Always use Red/Green TDD while developing or fixing code.
- **Run `npm test` before every change and after it.** New behaviour gets a test in `src/test/cli.test.mjs` (stand-in `npx` on `PATH`; assert the exact `npx skills` args via `skillsArgs`) or `src/test/unit.test.mjs`. Add a failing test first (Red/Green).
- Tests must never touch the real `HOME` or write vendored files into the package folder: use `sandbox()` / `repoCopy()` from `src/test/helpers.mjs`.
- **End-to-end recipe** (now automated as `npm run test:e2e`): `npm pack --pack-destination <tmp>` → `HOME=<tmp>/home npm install -g --prefix <tmp>/prefix <tgz>` → drive `<tmp>/prefix/bin/aiskills` with `HOME=<tmp>/home` → `npm run clean`.
- **Check the tarball:** compare `npm pack --dry-run --json` (with `_gitignore` mapped back) against `git ls-files skills`; they should be identical.
- `npx skills list --json` gives `source` and `sourceType` per skill. Bundled rows are `sourceType: "local"` with `source` equal to the install folder.
- `npx skills add <empty dir> --list --agent <bogus>` prints "Valid agents: ..." and installs nothing; that's how agent patterns get their list.
- `SKILLS_API_URL=http://127.0.0.1:<port>` points `npx skills find` at a local fake (`GET /api/search?q=` → `{"skills":[{name,id,source,installs}]}`), so `--route` can be tested offline.
- Do every lookup and validation before the first install, so a bad entry changes nothing.
- **Prove a new test can fail.** Temporarily break the thing it guards (remove the line, change the condition), see the test go red, then restore. The first `.npmignore` test passed even with the entries broken, because `"files"` was doing the work; only the deliberate break showed it.
- npm only needs `"bin"` to point at a file with a `#!/usr/bin/env node` first line; the `bin/` folder is just a convention. A thin `bin/` wrapper keeps the real CLI module free of the shebang and makes the command's entry point easy to find.
- Group membership is computed from each skill's *original* folder in `layout.json`, never from where the skill sits now, so it's independent of the flat/nested choice. Without `layout.json` (an old package or the test fixtures used as an install root), it falls back to scanning `skills/` under each group's `source`.
- **Shipping skills in npm packages** (checked in `skills` CLI 1.7.6): `npx skills experimental_sync` reads skills from a project's `node_modules` packages at `<pkg>/SKILL.md`, `<pkg>/skills/<name>/SKILL.md` or `<pkg>/dist/skills/<name>/SKILL.md`, one level only, and a project can list packages under `"skills": ["npm:<pkg>"]` in its own `package.json`. Usual practice: skills are data in a flat `skills/` folder, code in `src/`, a strict `files` list, and no side effects at install time (pnpm and bun skip install scripts unless allowed, `--ignore-scripts` skips them, and security scanners flag them).
