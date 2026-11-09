# SPEC.md — Feature Spec

What @sugatoray-ai/aiskills does, feature by feature. Add a section per feature when it ships — describe *what* it does and *why* it matters to a user, not the implementation detail (that belongs in code comments or `WISDOM.md`).

> **Release status:** everything below is implemented, tested end to end, and merged to `master` ([sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122), [#146](https://github.com/sugatoray/aiskills/pull/146), [#147](https://github.com/sugatoray/aiskills/pull/147)). Version `0.4.0` is **published to npm** (2026-11-09, `latest`): `npm install -g @sugatoray-ai/aiskills`. It is the first published version (`0.3.0`, `0.2.0` and `0.1.0` never were). Update this note with each release.

## Bundled skills in an npm package
Every file under the repo's `skills/` folder ships, together with `.claude-plugin/marketplace.json` and the package's own `LICENSE` (Apache-2.0; each skill keeps the license in its `SKILL.md`, MIT today). At `npm pack`/`npm publish` time the skills are flattened to `skills/<skill-name>/`; `.aiskills/layout.json` records each skill's original folder and `.aiskills/nested/` holds the files outside any skill folder, so nothing is lost (mapped back, the shipped files equal `git ls-files skills` byte for byte, minus anything a `.skillsignore` excludes). Never committed under the package folder. (`src/scripts/pack/vendor-skills.mjs`)

## Works with `npx skills experimental_sync`
Because `skills/` is flat, a project that installs the package as a dependency can run `npx skills experimental_sync` to copy all its skills into the project, without `aiskills` or `~/.config`.

## Flat or nested install folder
`~/.config/sugatoray/aiskills/skills/` is flat by default; `--nested` (before the command, or on `install`/`sync`; also `AISKILLS_LAYOUT=nested`) rebuilds the repo's exact nested layout, including group READMEs, `plugin.json` and `meta/`. The choice is remembered until `--flat`. Groups and installs behave the same in both.

## Install: `npm install -g`, then `aiskills install`
`npm install` (or pnpm, or bun) only installs the `aiskills`, `ais` and `aix` commands: the package has no install step, so it makes no network calls, writes nothing to `~` and changes no agent. `aiskills install` (or `npx @sugatoray-ai/aiskills install`, without a global install) saves the skills to `~/.config/sugatoray/aiskills/skills/` (replacing any older copy) and runs `npx skills add ~/.config/sugatoray/aiskills --global --skill '*' --yes`, registering them with every agent `npx skills` detects. (Until 0.4.0 a `postinstall` step did this on `npm install`; removed by AIS-7.)

## `aiskills` CLI (also `ais`, and `aix` for route mode)
`install` (alias `i`), `uninstall` (`r`, `rm`, `remove`), `installed` (`ls`), `groups` (`g`), `find` (`f`), `sync`, `list`, `path` (`p`), `help` (`h`), and `skills <args>` (passthrough to `npx skills`, with `:root` replaced by the install folder). Anything after `--` is appended to the underlying `npx skills` command. (`src/scripts/core/cli.mjs`, shared logic in `src/scripts/core/installer.mjs`)

## Choosing what to install: scope, agents, skills
`-g/--global` (default) or `-p/--project` (installs into the current folder), `-a/--agent`, `-s/--skill`, `--copy`. Every option has an `AISKILLS_*` environment variable that sets its default.

## Uninstall
`aiskills uninstall` removes, through `npx skills remove`, exactly the skills `npx skills list` says came from `~/.config/sugatoray/aiskills`. It also supports partial (`-s`, `-G`), per-agent (`-a`) and project (`-p`) removal, `--purge` to delete the local folder after a full uninstall, `-n/--dry-run` (prints the exact `npx` command, pinned version included), and `-f/--force` for names the package doesn't provide.

## Skill groups from marketplace.json
Each plugin entry in the bundled `marketplace.json` is a group: its `name` is the group name, and its skills are those whose original folder (per `.aiskills/layout.json`) is under its `source` folder. `-G/--group` accepts the name or an alias the CLI derives by stripping `-skills` (`scrolls-skills` → `scrolls`), plus the built-in `all`. `aiskills groups [--json]` lists them. No Claude Code plugin is installed; the file is only read for grouping.

## Glob patterns for `-s`, `-G` and `-a`
`*`, `?`, `[abc]`, `[a-z]`, `[!abc]`; case-insensitive, whole-name, mixable with plain names, on both install and uninstall and in the matching env vars. Skills match the package's skills, groups match names and aliases, and agents match the list `npx skills` itself reports as valid. A pattern that matches nothing stops the command before anything changes.

## External skills via `--route`
With `--route` (before or after the command, or `AISKILLS_ROUTE=1`), or always when run as `aix`, `-s` entries that aren't bundled go to `npx skills`. A bare name is looked up with `npx skills find` and installed only on a unique exact-name match; `owner/repo[@skill]`, URLs and paths go straight to `npx skills add`. `uninstall --route` also matches skills from other sources, while a full uninstall stays bundled-only. `installed --route` lists every skill with its source. `aiskills find <query>` searches the registry.

## Safety checks
`npx` always runs a pinned `skills@1.7.6` (override: `AISKILLS_SKILLS_VERSION`); `--route` ignores registry results with anything but letters, digits, `.`, `_`, `-`; on Windows no `cmd.exe` shell characters ever reach `npx`; `sync`/`install`/`uninstall --purge` refuse to replace or delete a folder that isn't an aiskills folder. See `SECURITY.md`.

## User documentation
Full user docs live in the repo at `src/packages/aiskills/docs/docsite/` (not in the npm package): getting started, a page for every bundled skill, a 5-step tutorial, how-to guides (including use from AI agents and scripts), concepts with diagrams, an exhaustive reference (every command, option, environment variable, file format, and error with its cause and fix), and an FAQ. The same docs come as one HTML page with tabs, search and 11 colour themes (`index.html`; gear menu, Lights Out by default), and as `llms.txt` / `llms-full.txt` for AI agents. Every example that shows output was run, and the tests fail if the docs drift from the code or the skills.

## Banner
The package README and the docs' landing page open with a banner (1280 × 640): the version, Node range, license, skill and group counts, the install command, a terminal demo of real `ais`/`aix` output, and the skill groups. Its values come from the package and the bundled skills, so it stays accurate across releases. Maintainers edit it in `docs/banner/config.yaml`, or in the browser (`docs/banner/aiskills-banner.html`), and export PNGs for dark, white, black or transparent backgrounds; text that wouldn't be readable on a background can't be chosen.

## Themes
The docs page and the banner editor each have a gear menu with 11 themes (Lights Out, the default, plus Teal, Ink & Paper, Phosphor, Grimoire, Signal, Frost, Dusk, Blueprint, Matcha and Rosé), each in light and dark. The choice is remembered in the reader's browser, every theme keeps text, links and buttons at 4.5:1 contrast or better, and the banner shown on the README and the docs landing page follows the chosen (or configured) theme.

## `.skillsignore`
A `.skillsignore` (`.gitignore` syntax) in the repo's `skills/` or any folder below leaves matching files, folders or whole skills out of the package, and so out of every install and the `--nested` rebuild. The ignore files never ship; ignoring only a `SKILL.md` is refused; what was left out is listed in `.aiskills/layout.json` (`ignored`).

## Confirm external skills found by a lookup (`aix`, `--route`)
When `--route` looks up a bare name and finds a unique exact match, `aiskills install` lists it (`owner/repo@skill`, install count, the name typed) and asks `Install <n> external skill(s) from the registry? [y/N]` before installing anything, bundled skills included; only `y`/`yes` proceeds. Without a terminal it stops (exit 1) unless `-y`/`--yes` is given. Pinned `owner/repo@skill`, URLs and paths aren't asked about. `install -n`/`--dry-run` shows what would be installed and the exact `npx skills add` commands. (`src/scripts/core/cli.mjs`, `confirm()` in `installer.mjs`)

## License
The package is Apache-2.0: `package.json` `"license"` and a committed `LICENSE` with the official Apache License 2.0 text (the pack step no longer copies the repo's MIT `LICENSE` over it). Each bundled skill keeps the license in its `SKILL.md` (all MIT). The docs have a License page (`docs/docsite/license.md`, a License tab in `index.html`), generated by `npm run docs:skills`: the package's license, and a table of every bundled skill with its group, license and `SKILL.md` link.

## `newsletter-ai` left out of the package
`skills/newsletters/.skillsignore` (`newsletter-ai/`) keeps `newsletter-ai` out of the npm package, so `aiskills` bundles 12 skills, all in groups, and `aiskills install` never installs it. The repo keeps the skill: `npx skills add sugatoray/aiskills --skill newsletter-ai` (the `skills` CLI ignores `.skillsignore`) or `aix install -s sugatoray/aiskills@newsletter-ai` installs it.

## skills.sh install count
`npx skills add` counts an install on skills.sh only for GitHub sources, so `aiskills install` (a local folder) was never counted. After a successful install of bundled skills, `aiskills` runs `npx -y skills@1.7.6 add sugatoray/aiskills --skill <each installed skill> --agent <-a, or universal> --copy --yes` in a new temp folder, in a detached background process (stopped after 2 minutes), then deletes the folder: the official CLI sends its usual install event. One line is printed; without github.com nothing is counted or shown; the exit status is the install's. Not for failed installs, `-n` (shows the command), `--route` externals, or `sync`. Off with `--no-stats` (remembered in `aiskills.json` until `--stats`; also on `sync`), `AISKILLS_STATS=0`, and always with `DO_NOT_TRACK`, `DISABLE_TELEMETRY`, `CI`, `GITHUB_ACTIONS`. `AISKILLS_STATS_FOREGROUND=1` waits and shows the output. Unreleased (after `0.4.0`). (`countInstall()`/`resolveStats()` in `src/scripts/core/installer.mjs`)
