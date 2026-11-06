# SPEC.md — Feature Spec

What @sugatoray-ai/aiskills does, feature by feature. Add a section per feature when it ships — describe *what* it does and *why* it matters to a user, not the implementation detail (that belongs in code comments or `WISDOM.md`).

> **Release status:** everything below is implemented, tested by hand end to end, and pushed on branch `claude/focused-faraday-nqvduf` ([sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122), open). Version `0.1.0` has **not** been published to npm yet. Update this note when it is.

## Bundled skills in an npm package
Every file under the repo's `skills/` folder ships, together with `.claude-plugin/marketplace.json` and `LICENSE`. At `npm pack`/`npm publish` time the skills are flattened to `skills/<skill-name>/`; `.aiskills/layout.json` records each skill's original folder and `.aiskills/nested/` holds the files outside any skill folder, so nothing is lost (mapped back, the shipped files equal `git ls-files skills` byte for byte). Never committed under the package folder. (`src/scripts/vendor-skills.mjs`)

## Works with `npx skills experimental_sync`
Because `skills/` is flat, a project that installs the package as a dependency can run `npx skills experimental_sync` to copy all its skills into the project, without `aiskills` or `~/.config`.

## Flat or nested install folder
`~/.config/sugatoray/aiskills/skills/` is flat by default; `--nested` (before the command, or on `install`/`sync`; also `AISKILLS_LAYOUT=nested`) rebuilds the repo's exact nested layout, including group READMEs, `plugin.json` and `meta/`. The choice is remembered until `--flat`. Groups and installs behave the same in both.

## Install on `npm install -g`
Installing the package saves the skills to `~/.config/sugatoray/aiskills/skills/` (replacing any older copy) and runs `npx skills add ~/.config/sugatoray/aiskills --global --skill '*' --yes`, registering them with every agent `npx skills` detects. A failure here never fails the npm install; the user can retry with `aiskills install`. Opt-outs: `AISKILLS_SKIP_POSTINSTALL=1`, `AISKILLS_SKIP_SKILLS_ADD=1`, `CI`. (`src/scripts/postinstall.mjs`)

## `aiskills` CLI (also `ais`, and `aix` for route mode)
`install` (alias `i`), `uninstall` (`r`, `rm`, `remove`), `installed` (`ls`), `groups` (`g`), `find` (`f`), `sync`, `list`, `path` (`p`), `help` (`h`), and `skills <args>` (passthrough to `npx skills`, with `:root` replaced by the install folder). Anything after `--` is appended to the underlying `npx skills` command. (`src/scripts/cli.mjs`, shared logic in `src/scripts/installer.mjs`)

## Choosing what to install: scope, agents, skills
`-g/--global` (default) or `-p/--project` (installs into the current folder), `-a/--agent`, `-s/--skill`, `--copy`. Every option has an `AISKILLS_*` environment variable, which the npm postinstall step also reads.

## Uninstall
`aiskills uninstall` removes, through `npx skills remove`, exactly the skills `npx skills list` says came from `~/.config/sugatoray/aiskills`. It also supports partial (`-s`, `-G`), per-agent (`-a`) and project (`-p`) removal, `--purge` to delete the local folder after a full uninstall, `-n/--dry-run`, and `-f/--force` for names the package doesn't provide.

## Skill groups from marketplace.json
Each plugin entry in the bundled `marketplace.json` is a group: its `name` is the group name, and its skills are those whose original folder (per `.aiskills/layout.json`) is under its `source` folder. `-G/--group` accepts the name or an alias the CLI derives by stripping `-skills` (`scrolls-skills` → `scrolls`), plus the built-in `all`. `aiskills groups [--json]` lists them. No Claude Code plugin is installed; the file is only read for grouping.

## Glob patterns for `-s`, `-G` and `-a`
`*`, `?`, `[abc]`, `[a-z]`, `[!abc]`; case-insensitive, whole-name, mixable with plain names, on both install and uninstall and in the matching env vars. Skills match the package's skills, groups match names and aliases, and agents match the list `npx skills` itself reports as valid. A pattern that matches nothing stops the command before anything changes.

## External skills via `--route`
With `--route` (before or after the command, or `AISKILLS_ROUTE=1`), or always when run as `aix`, `-s` entries that aren't bundled go to `npx skills`. A bare name is looked up with `npx skills find` and installed only on a unique exact-name match; `owner/repo[@skill]`, URLs and paths go straight to `npx skills add`. `uninstall --route` also matches skills from other sources, while a full uninstall stays bundled-only. `installed --route` lists every skill with its source. `aiskills find <query>` searches the registry.

## Safety checks
`npx` always runs a pinned `skills@1.7.6` (override: `AISKILLS_SKILLS_VERSION`); `--route` ignores registry results with anything but letters, digits, `.`, `_`, `-`; on Windows no `cmd.exe` shell characters ever reach `npx`; `sync`/`install`/`uninstall --purge` refuse to replace or delete a folder that isn't an aiskills folder. See `SECURITY.md`.
