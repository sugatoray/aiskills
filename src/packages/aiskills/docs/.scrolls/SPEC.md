# SPEC.md — Feature Spec

What @sugatoray-ai/aiskills does, feature by feature. Add a section per feature when it ships — describe *what* it does and *why* it matters to a user, not the implementation detail (that belongs in code comments or `WISDOM.md`).

> **Release status:** everything below is implemented, tested by hand end to end, and pushed on branch `claude/focused-faraday-nqvduf` ([sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122), open). Version `0.1.0` has **not** been published to npm yet. Update this note when it is.

## Bundled skills in an npm package
The repo's `skills/` folder ships inside the package unchanged (file-for-file identical to `git ls-files skills`), together with `.claude-plugin/marketplace.json` and `LICENSE`. They are copied in at `npm pack`/`npm publish` time and never committed under the package folder. (`src/aiskills/vendor-skills.mjs`)

## Install on `npm install -g`
Installing the package saves the skills to `~/.config/sugatoray/aiskills/skills/` (replacing any older copy) and runs `npx skills add ~/.config/sugatoray/aiskills --global --skill '*' --yes`, registering them with every agent `npx skills` detects. A failure here never fails the npm install; the user can retry with `aiskills install`. Opt-outs: `AISKILLS_SKIP_POSTINSTALL=1`, `AISKILLS_SKIP_SKILLS_ADD=1`, `CI`. (`src/aiskills/postinstall.mjs`)

## `aiskills` CLI
`install`, `uninstall`, `installed`, `groups`, `find`, `sync`, `list`, `path`, and `skills <args>` (passthrough to `npx skills`, with `:root` replaced by the install folder). Anything after `--` is appended to the underlying `npx skills` command. (`src/aiskills/cli.mjs`, shared logic in `src/aiskills/installer.mjs`)

## Choosing what to install: scope, agents, skills
`-g/--global` (default) or `-p/--project` (installs into the current folder), `-a/--agent`, `-s/--skill`, `--copy`. Every option has an `AISKILLS_*` environment variable, which the npm postinstall step also reads.

## Uninstall
`aiskills uninstall` removes, through `npx skills remove`, exactly the skills `npx skills list` says came from `~/.config/sugatoray/aiskills`. It also supports partial (`-s`, `-G`), per-agent (`-a`) and project (`-p`) removal, `--purge` to delete the local folder after a full uninstall, `-n/--dry-run`, and `-f/--force` for names the package doesn't provide.

## Skill groups from marketplace.json
Each plugin entry in the bundled `marketplace.json` is a group: its `name` is the group name, and its skills are the `SKILL.md` files under its `source` folder. `-G/--group` accepts the name or an alias the CLI derives by stripping `-skills` (`scrolls-skills` → `scrolls`), plus the built-in `all`. `aiskills groups [--json]` lists them. No Claude Code plugin is installed; the file is only read for grouping.

## Glob patterns for `-s`, `-G` and `-a`
`*`, `?`, `[abc]`, `[a-z]`, `[!abc]`; case-insensitive, whole-name, mixable with plain names, on both install and uninstall and in the matching env vars. Skills match the package's skills, groups match names and aliases, and agents match the list `npx skills` itself reports as valid. A pattern that matches nothing stops the command before anything changes.

## External skills via `--route`
With `--route` (before or after the command, or `AISKILLS_ROUTE=1`), `-s` entries that aren't bundled go to `npx skills`. A bare name is looked up with `npx skills find` and installed only on a unique exact-name match; `owner/repo[@skill]`, URLs and paths go straight to `npx skills add`. `uninstall --route` also matches skills from other sources, while a full uninstall stays bundled-only. `installed --route` lists every skill with its source. `aiskills find <query>` searches the registry.
