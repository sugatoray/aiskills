# WISDOM.md — Constraints, Traps, Ditches, and Wisdom

Hard-won lessons for this project. Read this LAST, right before editing code, so it's freshest in mind.

## Constraints — respect and conform to them
Things you must respect or conform to (external requirements, API contracts, platform limits).

- The install folder is `~/.config/sugatoray/aiskills/` (skills in `skills/`, the marketplace file in `.claude-plugin/`), as the user specified. Only `AISKILLS_HOME` overrides it. Keep it even though the npm scope is `sugatoray-ai`.
- Package name is `@sugatoray-ai/aiskills` (the user's npm org); the CLI command is `aiskills`.
- `marketplace.json` is used **only** to define skill groups. Never install anything as a Claude Code plugin from it; all installs go through `npx skills add`.
- Group name = the plugin entry's `name`, exactly. The alias (name minus `-skills`) and the `all` group are CLI inventions; the README must keep saying so.
- npm never runs uninstall lifecycle scripts, so `aiskills uninstall` has to be run before `npm uninstall -g`.
- npm 7+ hides postinstall output unless `--foreground-scripts`; pnpm and bun skip postinstall unless allowed; `--ignore-scripts` skips it too. `aiskills install` is the fallback for all of these.
- The `files` list in `package.json` decides what ships. The scrolls files, `CLAUDE.md` etc. must stay out of the tarball.

## Traps — avoid them always
Specific bugs that have bitten this project before — avoid repeating them.

- **npm drops nested `.gitignore`/`.npmignore` files** from the tarball and applies them as ignore rules while packing. The vendor step renames them to `_gitignore`/`_npmignore`; `syncSkills` renames them back. (Hit by `skills/newsletters/newsletter-ai/.gitignore`.)
- **The package's own `.gitignore` ignores `/skills/`.** Without a `.npmignore` present, npm would fall back to `.gitignore` and ship no skills. Keep `.npmignore`.
- **Nested `npx` inside postinstall fails with "skills: not found"** because npm exports `npm_config_global`, `npm_config_prefix` and friends. `childEnv()` strips `npm_*` variables except the registry, proxy and cert ones.
- **`spawnSync` with a deleted `cwd` throws ENOENT.** After `--purge` the install folder is gone; `runSkills` falls back to `$HOME`.
- **An env default of `skills: ['*']` meant "everything"** and silently overrode `-G`. The default is now `[]`; "everything" is `null` from `selectedSkills`.
- **Hardcoded repo-root depth** broke when the package moved. `vendor-skills.mjs` walks up to the first folder with `skills/` and `.claude-plugin/marketplace.json`.
- **`export HOME=<tmp>` in a test shell** also breaks the next `git commit` (no identity). Set `HOME` per command, not with `export`.

## Ditches — bad patterns or decisions to avoid
Bad patterns or decisions to never take, and why they were rejected.

- Never let the postinstall step fail `npm install`. Catch everything, warn, and point at `aiskills install`.
- Never run `npx skills` interactively from scripts; always pass `--yes` (postinstall has no TTY).
- Never auto-pick among several registry matches for a name under `--route`. List them and make the user pin `owner/repo@skill`; it's third-party code with full agent permissions.
- A full `uninstall` (no `-s`/`-G`) must only remove skills whose recorded source is the install folder, even with `--route`.
- Don't commit the vendored `skills/`, `.claude-plugin/` or `LICENSE` copies in the package folder; `npm run clean` removes them.

## Wisdom — best practices and Red/Green TDD
Best practices worth reusing.

- Always use Red/Green TDD while developing or fixing code.
- **End-to-end recipe:** `npm pack --pack-destination <tmp>` → `HOME=<tmp>/home npm install -g --prefix <tmp>/prefix <tgz>` → drive `<tmp>/prefix/bin/aiskills` with `HOME=<tmp>/home` → `npm run clean`.
- **Check the tarball:** compare `npm pack --dry-run --json` (with `_gitignore` mapped back) against `git ls-files skills`; they should be identical.
- `npx skills list --json` gives `source` and `sourceType` per skill. Bundled rows are `sourceType: "local"` with `source` equal to the install folder.
- `npx skills add <empty dir> --list --agent <bogus>` prints "Valid agents: ..." and installs nothing; that's how agent patterns get their list.
- `SKILLS_API_URL=http://127.0.0.1:<port>` points `npx skills find` at a local fake (`GET /api/search?q=` → `{"skills":[{name,id,source,installs}]}`), so `--route` can be tested offline.
- Do every lookup and validation before the first install, so a bad entry changes nothing.
