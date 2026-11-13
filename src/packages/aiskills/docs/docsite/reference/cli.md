# CLI reference

Every command, alias and option of `aiskills`, `ais` and `aix`; this page is exhaustive.

```text
aiskills <command> [options] [-- <extra npx skills arguments>]
```

- **`aiskills`** and **`ais`** are the same command.
- **`aix`** is `aiskills --route`: `aix i -s pdf` = `aiskills --route install -s pdf`.
- With no command, `aiskills` runs `install`.
- `--route`, `--nested` and `--flat` can also go **before** the command: `aiskills --route installed`, `aiskills --nested` (= `install --nested`).
- Options are checked per command. An option a command doesn't take fails with `option <x> is not valid here`.

## Commands

| Command | Aliases | Does |
| --- | --- | --- |
| [`install`](#install) | `i` | Save the skills and run `npx skills add` on them (the default command) |
| [`uninstall`](#uninstall) | `r`, `rm`, `remove` | Remove skills with `npx skills remove` |
| [`installed`](#installed) | `ls` | Show installed skills |
| [`groups`](#groups) | `g` | List the skill groups |
| [`find`](#find) | `f` | Search the skills registry |
| [`sync`](#sync) | | Only save or refresh the skills folder |
| [`list`](#list) | | List the skills in the saved folder, via `npx skills` |
| [`path`](#path) | `p` | Print the install folder |
| [`info`](#info) | | Show this setup: versions, folders, settings and where each comes from |
| [`releases`](#releases) | `rel` | Show the latest releases on npm, optionally with download counts |
| [`upgrade`](#upgrade) | | Install the latest aiskills globally and update the skills your agents have |
| [`skills`](#skills) | | Pass arguments to `npx skills` |
| [`help`](#help) | `h`, `-h`, `--help` | Show the help |
| [`-v`, `--version`](#-v---version) | | Print the version |

`sync`, `skills` and `list` have no one-letter alias on purpose: `s` would be ambiguous, and `l` looks like `ls`.

### `install`

Save the skills to the install folder (see [`sync`](#sync)), then run `npx skills add <install folder>` with the selected skills and agents.

```text
aiskills install [-g|-p] [-a agents] [-s skills] [-G groups] [-i] [-l] [--copy] [--route] [-y] [-n] [--nested|--flat] [-- <extra>]
```

| | |
| --- | --- |
| Alias | `i` |
| Options | [`-g`](#-g---global), [`-p`](#-p---project), [`-a`](#-a---agent), [`-s`](#-s---skill), [`-G`](#-g---group---groups), [`-i`](#-i---interactive), [`-l`](#-l---last-agents), [`--copy`](#--copy), [`--route`](#--route), [`-y`](#-y---yes), [`-n`](#-n---dry-run), [`--nested`](#--nested), [`--flat`](#--flat), [`--`](#--) |
| Default | Every skill, `--global`, agents detected by `npx skills` |
| Exit code | `1` if a name, pattern or lookup fails, or an external skill isn't confirmed (nothing is installed); otherwise the exit code of `npx skills add` |

<!-- verify -->
```bash
aiskills install
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill '*' --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

With `-s`/`-G`, it prints `bundled: <names>` first. With `--route`, names that aren't bundled are looked up; each skill the lookup found is shown and must be confirmed (see [`-y`](#-y---yes)) before anything, bundled skills included, is installed. External skills are installed after the bundled ones (`external: <spec>`).

See: [1. Install a group](../tutorial/01-install-a-group.md) · [2. Pick skills and agents](../tutorial/02-pick-skills-and-agents.md)

### `uninstall`

Remove skills with `npx skills remove <names> --yes`.

```text
aiskills uninstall [-g|-p] [-a agents] [-s skills] [-G groups] [--route] [--purge] [-f] [-n] [-- <extra>]
```

| | |
| --- | --- |
| Aliases | `r`, `rm`, `remove` |
| Options | [`-g`](#-g---global), [`-p`](#-p---project), [`-a`](#-a---agent), [`-s`](#-s---skill), [`-G`](#-g---group---groups), [`--route`](#--route), [`--purge`](#--purge), [`-f`](#-f---force), [`-n`](#-n---dry-run), [`--`](#--) |
| Default | A **full uninstall**: every skill `npx skills list --json` reports as installed from the install folder |
| Exit code | `1` on a refused name or option; otherwise the exit code of `npx skills remove` (`0` if there was nothing to remove) |

- **Full** (no `-s`/`-G`): removes exactly the skills recorded as installed from the install folder, even with `--route`. If `npx skills list` can't be read, it falls back to every skill in the folder, with a warning.
- **Partial** (`-s`/`-G`): names this package doesn't provide are refused, unless `--route` or `-f`. Skills reached through a pattern or group are removed only if installed.
- **`-a`** removes the skills from those agents only.
- The skill files stay in the install folder unless `--purge`.

<!-- verify: list=prodigy,stata-recipes -->
```bash
aiskills uninstall -G stata -n
```

```text
[aiskills] [dry-run] would remove (global): stata-recipes
[aiskills] [dry-run] npx -y skills@1.7.6 remove stata-recipes --global --yes
```

See: [5. Uninstall](../tutorial/05-uninstall.md) · [Remove everything](../guides/remove-everything.md)

### `installed`

List the skills `npx skills` reports as installed from the install folder, one per line: name, group, agents.

```text
aiskills installed [-g|-p] [--route]
```

| | |
| --- | --- |
| Alias | `ls` |
| Options | [`-g`](#-g---global), [`-p`](#-p---project), [`--route`](#--route) (all skills, with a source column) |
| Exit code | `1` if `npx skills list` can't be read |

<!-- verify: list=scrolls-setup,owner/repo@pdf -->
```bash
aiskills ls
```

```text
scrolls-setup              scrolls-skills         Claude Code
```

Only skills installed from the install folder are listed; `pdf`, installed from `owner/repo`, is left out (add `--route` to list it). A `-` in the group column means the skill belongs to no group.

### `groups`

List the skill groups from the bundled `marketplace.json`, with their aliases and skills, and the skills in no group. Syncs the install folder first, quietly.

```text
aiskills groups [--json]
```

| | |
| --- | --- |
| Alias | `g` |
| Options | [`--json`](#--json) |

Output: see [1. Install a group](../tutorial/01-install-a-group.md#see-the-groups); JSON shape: [Files and schemas](files.md#aiskills-groups---json).

### `find`

Search the skills registry: `aiskills find <query>` runs `npx skills find <query>`. Every argument is passed on.

| | |
| --- | --- |
| Alias | `f` |
| Exit code | The exit code of `npx skills find` |

### `sync`

Save or refresh `<install folder>/skills/` from the package, without running `npx skills add`. Also writes `marketplace.json`, `layout.json` and `aiskills.json` next to it.

```text
aiskills sync [--nested|--flat]
```

| | |
| --- | --- |
| Options | [`--nested`](#--nested), [`--flat`](#--flat) |

<!-- verify -->
```bash
aiskills sync
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
```

### `list`

Sync, then run `npx skills add <install folder> --list`, which lists the skills there without installing them. Takes no options.

<!-- verify -->
```bash
aiskills list
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --list
```

### `path`

Print the install folder: `~/.config/sugatoray/aiskills`, or `AISKILLS_HOME` if set. Changes nothing.

| | |
| --- | --- |
| Alias | `p` |

<!-- verify -->
```bash
aiskills p
```

```text
~/.config/sugatoray/aiskills
```

### `info`

Show this setup, like `conda info`: the aiskills version, where npm installed it, Node, the install folder and its saved skills, every setting with where its value comes from, the `npx skills` lock file and the agents last picked in it, and every `AISKILLS_*` variable that is set. It reads local files only: no network, no `npx`, so it is instant and works offline.

```text
aiskills info [--full] [--json]
```

| | |
| --- | --- |
| Options | [`--full`](#--full), [`--json`](#--json) |
| Exit code | `0` |

<!-- verify -->
```bash
aiskills info
```

```text
  aiskills version : 1.2.0
…
      install root : ~/.config/sugatoray/aiskills  (AISKILLS_HOME)
      saved skills : 17 skills in 9 groups, flat layout
…
        skills CLI : skills@1.7.6  (pinned, tested)
             scope : global  (default)
            layout : flat  (remembered)
             stats : on  (default)
             route : off  (default)

  skills lock file : ~/.agents/.skill-lock.json  (not created yet)
last-picked agents : none  (used by install -l)
…
```

(The examples on these pages run with `AISKILLS_HOME` set, so the install root's source shows as `AISKILLS_HOME`; without it, it is `default`.)

What each line means:

| Line | Shows | Where it comes from (in brackets) |
| --- | --- | --- |
| `aiskills version`, `package path`, `node version` | This package, the folder npm installed it in, Node and the platform | |
| `install root` | The install folder; `not created yet` before the first `install` or `sync` | `default` or `AISKILLS_HOME` |
| `saved skills`, `saved by` | What the last `install`/`sync` saved, and which aiskills version saved it; `not this version` means run `aiskills install` again | `aiskills.json` |
| `skills CLI` | The `skills` package `npx` runs | `pinned, tested`, or the variable that overrides it |
| `scope`, `layout`, `stats`, `route` | The defaults `install` would use with no options | `default`, an `AISKILLS_*` variable, `remembered` (in `aiskills.json`), or, for stats, `DO_NOT_TRACK`, `DISABLE_TELEMETRY`, `CI` or `GITHUB_ACTIONS` |
| `skills lock file`, `last-picked agents` | The lock file `npx skills` keeps, and the agents [`-l`](#-l---last-agents) would use | |
| `env overrides` | Every `AISKILLS_*` variable that is set, one per line | |

With [`--full`](#--full) it also asks npm and `npx skills` (a few seconds; needs network), and adds:

```text
     latest on npm : 1.0.0  (up to date)
  installed skills : 15 from the install root, 2 from other sources  (global)
         per agent : Claude Code 15, Codex 15
```

`latest on npm` says `up to date`, `update available: run aiskills upgrade`, or that this version is not published; if npm can't be reached it says `unavailable` and why, and the command still succeeds. `installed skills` counts what `npx skills list` reports for the current scope.

See also: [Use aiskills from an AI agent or a script](../guides/use-from-an-agent.md)

### `releases`

Show the package's latest releases on npm, newest first, like the Versions tab on npmjs.com: the version, when it was published (date and age), its dist-tag, and which one you have installed. Read with `npm view`, so your npm registry and proxy settings apply.

```text
aiskills releases [<n>|all] [-L|--last <n|all>] [--downloads [period]] [--chart|--table] [--by day|week|month] [--ascii] [--json]
```

| | |
| --- | --- |
| Alias | `rel` |
| Options | [`-L`, `--last`](#-l---last), [`--downloads`](#--downloads), [`--chart`](#--chart), [`--table`](#--table), [`--by`](#--by), [`--ascii`](#--ascii), [`--json`](#--json) |
| Default | The latest 5 releases, no download counts |
| Exit code | `1` if the count or period is invalid (checked before any network call), or npm or api.npmjs.org can't be reached; otherwise `0` |

The examples below run against sample registry data, with today set to 2026-11-21.

<!-- verify -->
```bash
aiskills rel 3
```

```text
@sugatoray-ai/aiskills: latest 3 of 9 releases

  VERSION  PUBLISHED                TAG
  1.2.0    2026-11-21 (today)       latest  ← installed
  1.1.0    2026-11-20 (1 day ago)
  1.0.0    2026-11-18 (3 days ago)

more: aiskills rel all

changelog: /usr/local/lib/node_modules/@sugatoray-ai/aiskills/CHANGELOG.md
           https://github.com/sugatoray/aiskills/blob/master/src/packages/aiskills/CHANGELOG.md
```

- How many: a number or `all` right after the command (`aiskills rel 10`, `aiskills rel all`), or the same with [`-L`/`--last`](#-l---last). Default: 5.
- An older installed version gets `update available: <installed> → <latest>  (npm install -g @sugatoray-ai/aiskills@latest)`; one that isn't on npm gets `installed: <version> (not published on npm)`.
- npm's staged-publish placeholder (`0.0.0-stage`) is not a release and is never listed.
- The last line points to the changelog twice: the copy inside the installed package (readable offline, and behind a firewall that blocks GitHub) and the one on GitHub (which also covers newer versions).
- **Behind a registry mirror** (Artifactory, Nexus, Verdaccio, …) the list comes from the mirror, because `npm view` uses your npm config. A mirror that doesn't pass on npm's publish times still gets every version, newest first by version number, with `–` as the date and the note `publish dates: not reported by <registry>`. [`--downloads`](#--downloads) needs api.npmjs.org itself, which registry mirrors don't serve. See [FAQ: firewalls and mirrors](../faq.md#does-aiskills-work-behind-a-firewall-or-with-an-npm-mirror).

With [`--downloads`](#--downloads), a 7-day download column is added, then the package's total over the period and a breakdown, as a chart by default:

<!-- verify -->
```bash
aiskills rel --downloads
```

```text
@sugatoray-ai/aiskills: latest 5 of 9 releases

  VERSION  PUBLISHED                TAG     DOWNLOADS (7 DAYS)
  1.2.0    2026-11-21 (today)       latest                   –  ← installed
  1.1.0    2026-11-20 (1 day ago)                            –
  1.0.0    2026-11-18 (3 days ago)                           –
  0.9.0    2026-11-15 (6 days ago)                           –
  0.8.0    2026-11-12 (9 days ago)                           –

more: aiskills rel all

downloads, all versions: 424 all time (2026-11-09 → 2026-11-10)
per-version counts cover the last 7 days only (npm keeps no older ones); – = no count yet
the total includes versions not listed here (0.0.0-stage)

  2026-11-09 ██████████████████████████████ 402  0.4.0, 0.5.0 published
  2026-11-10 █▋                              22

changelog: /usr/local/lib/node_modules/@sugatoray-ai/aiskills/CHANGELOG.md
           https://github.com/sugatoray/aiskills/blob/master/src/packages/aiskills/CHANGELOG.md
```

How to read it:

- **`DOWNLOADS (7 DAYS)`** is per version, and only for the last 7 days: npm keeps no older per-version counts, so per-version all-time numbers don't exist anywhere. `–` means npm has no count for that version yet (its counts lag a day or two).
- **The total line** covers the whole package (every version) over the period you chose, `all time` by default. It includes versions the table hides, such as `0.0.0-stage`.
- **The breakdown** has one row per day for periods up to 31 days, per week up to 183 days, and per month beyond that ([`--by`](#--by) overrides it). Each row names the versions published in it. Bars are scaled to the busiest row; a run of 3 or more empty rows is shortened to its first and last row. A week or month the period only partly covers says `(partial: <n> of <m> days)`. Days after npm's latest data (usually yesterday) are left out.

The same breakdown as a plain table, with [`--table`](#--table):

<!-- verify -->
```bash
aiskills rel 1 --downloads 7d --table
```

```text
@sugatoray-ai/aiskills: latest 1 of 9 releases

  VERSION  PUBLISHED           TAG     DOWNLOADS (7 DAYS)
  1.2.0    2026-11-21 (today)  latest                   –  ← installed

more: aiskills rel all

downloads, all versions: 424 in the last 7 days (2026-11-04 → 2026-11-10)
per-version counts cover the last 7 days only (npm keeps no older ones); – = no count yet
the total includes versions not listed here (0.0.0-stage)

  DAY         DOWNLOADS  RELEASED
  2026-11-04          0
  2026-11-05          0
  2026-11-06          0
  2026-11-07          0
  2026-11-08          0
  2026-11-09        402  0.4.0, 0.5.0
  2026-11-10         22

changelog: /usr/local/lib/node_modules/@sugatoray-ai/aiskills/CHANGELOG.md
           https://github.com/sugatoray/aiskills/blob/master/src/packages/aiskills/CHANGELOG.md
```

JSON (`--json`), for scripts: `{ "package", "registry", "installed", "latest", "total", "releases": [{ "version", "published", "tags": [string], "installed": boolean, "downloadsLastWeek"?: number|null }], "downloads"?: { "start", "end", "label", "total", "by", "rows": [{ "start", "end", "downloads", "partial": boolean, "published": [string] }] } }`. Dates are `YYYY-MM-DD`; `published` on a release is npm's ISO 8601 timestamp, or `null` when the registry doesn't report it. `registry` is the registry `npm view` asked (`npm config get registry`).

See also: [FAQ: Which agents…](../faq.md) · [Errors: Releases and downloads](errors.md#releases-and-downloads)

### `upgrade`

Install a newer aiskills (the latest, or the version or tag you name) with the package manager that installed it globally, then re-add the skills installed from the install folder, for the same agents, by running the new version. Without that second step your agents would keep the old skills: `npx skills` copies each skill into its own folder.

```text
aiskills upgrade [<version>|<tag>] [--check [--json]] [--no-refresh] [-n] [-y]
```

| | |
| --- | --- |
| Options | [`--check`](#--check), [`--json`](#--json), [`--no-refresh`](#--no-refresh), [`-n`](#-n---dry-run), [`-y`](#-y---yes) |
| Default | Upgrade to the `latest` tag, then refresh the skills (global) |
| Exit code | `0` if upgraded, already up to date, or with `--check` (whatever it finds); `1` if aiskills can't upgrade itself, the version is unknown, or a downgrade isn't confirmed; otherwise the package manager's exit code |

Check first, without changing anything (the examples here run with 1.0.0 installed and 1.1.0 on the registry):

<!-- verify: version=1.0.0 -->
```bash
aiskills upgrade --check
```

```text
[aiskills] installed: 1.0.0 (npm, global) · latest: 1.2.0 (published 2026-11-21)
[aiskills] update available: run 'aiskills upgrade'
```

Then upgrade:

<!-- verify: version=1.0.0 list=scrolls-setup,scrolls-update -->
```bash
aiskills upgrade
```

```text
[aiskills] installed: 1.0.0 (npm, global) · latest: 1.2.0 (published 2026-11-21)
[aiskills] changes: https://github.com/sugatoray/aiskills/blob/master/src/packages/aiskills/CHANGELOG.md
[aiskills] running: npm install -g @sugatoray-ai/aiskills@1.2.0
changed 1 package in 1s
[aiskills] refreshing 2 skills for claude-code (global) with aiskills 1.2.0
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: scrolls-setup, scrolls-update
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill scrolls-setup --skill scrolls-update --agent claude-code --yes
[aiskills] project installs aren't refreshed: run 'aiskills install -p' in each project that uses them
[aiskills] upgraded 1.0.0 → 1.2.0
```

What it does, in order:

1. **Picks the target** from `npm view` (your npm config applies): `latest`, or the `<version>` or `<tag>` you give (`aiskills upgrade 1.0.1`, `aiskills upgrade next`). If you already have it: `already up to date (<version>)`, and nothing changes.
2. **Finds out how aiskills was installed**, from where its files are. Only a global install can upgrade itself:

   | Installed with | `upgrade` runs |
   | --- | --- |
   | `npm install -g` | `npm install -g @sugatoray-ai/aiskills@<version>` |
   | `pnpm add -g` | `pnpm add -g @sugatoray-ai/aiskills@<version>` |
   | `bun add -g` | `bun add -g @sugatoray-ai/aiskills@<version>` |
   | `yarn global add` | `yarn global add @sugatoray-ai/aiskills@<version>` |
   | `npx @sugatoray-ai/aiskills …` | nothing; says to run `npx @sugatoray-ai/aiskills@latest install` |
   | a project's dependency | nothing; says to run `npm install -D @sugatoray-ai/aiskills@latest` |
   | a source checkout | nothing; says to `git pull` or install the package |

3. **Installs it**, showing the package manager's output. A permission error gets a hint (don't use `sudo`; give npm a folder you own); npm's release-age refusal gets the [usual explanation](errors.md#npms-release-age-rule-blocked-the-skills-cli).
4. **Refreshes the skills**: for each set of agents, runs the new version's `aiskills install -g -s <skills> -a <agents>` for the skills `npx skills list` reports as installed from the install folder. Agent names are mapped to ids (`Claude Code` → `claude-code`); one that can't be mapped is reported with the command to use, never guessed. The refresh doesn't add to the [skills.sh count](../concepts/install-count.md).
5. **Tells you what changed in the bundle:** skills new in this version are listed, not installed, with the commands to add them; skills the new version no longer has are listed with the command to remove them:

   ```text
   [aiskills] new in 1.1.0, not installed: scrolls-explainer
     to install them:      aiskills install -s scrolls-explainer -a claude-code,codex
     or pick from a list:  aiskills install -i
   [aiskills] no longer in 1.1.0 but still installed: old-skill
     to remove:  aiskills uninstall -s old-skill
   ```

Only global installs from the install folder are refreshed; skills installed into a project (`-p`) are not, as aiskills can't know every project: run `aiskills install -p` in each. A **downgrade** (`aiskills upgrade 0.7.0`) asks `[y/N]` first, or needs [`-y`](#-y---yes); without a terminal it stops. Preview everything with [`-n`](#-n---dry-run):

<!-- verify: version=1.0.0 list=scrolls-setup,scrolls-update -->
```bash
aiskills upgrade -n
```

```text
[aiskills] installed: 1.0.0 (npm, global) · latest: 1.2.0 (published 2026-11-21)
[aiskills] changes: https://github.com/sugatoray/aiskills/blob/master/src/packages/aiskills/CHANGELOG.md
[aiskills] [dry-run] npm install -g @sugatoray-ai/aiskills@1.2.0
[aiskills] [dry-run] then: aiskills install -g -s scrolls-setup,scrolls-update -a claude-code
```

JSON (`--check --json`), for scripts: `{ "installed", "target", "tag": string|null, "change": "upgrade"|"downgrade"|"none", "upgradable": boolean, "method": "npm"|"pnpm"|"bun"|"yarn"|"npx"|"project"|"source", "global": boolean, "published": "YYYY-MM-DD"|null }`. The exit code is `0` either way, so read `upgradable`.

See also: [FAQ: How do I update the skills?](../faq.md#how-do-i-update-the-skills) · [Errors: Upgrade](errors.md#upgrade)

### `skills`

Run `npx -y skills@<pinned version> <args>` with every argument unchanged, except that `:root` is replaced by the install folder. Exit code: that of `npx skills`.

<!-- verify -->
```bash
aiskills skills remove prodigy -a codex -g -y
```

```text
[aiskills] running: npx -y skills@1.7.6 remove prodigy -a codex -g -y
```

See: [Run any `npx skills` command](../guides/run-npx-skills-directly.md)

### `help`

Print the help to stdout. Aliases: `h`, `-h`, `--help`. An unknown command prints `unknown command: <name>` and the help to stderr, and exits with `1`.

<!-- verify -->
```bash
aiskills --help
```

```text
aiskills 1.2.0 — Sugato Ray's agent skills

Usage: aiskills <command> [options]
       ais <command> [options]     (same as aiskills)
       aix <command> [options]     (same as aiskills --route)

Commands:
  install, i     Save skills to ~/.config/sugatoray/aiskills/skills and run 'npx skills add' on it (default)
  uninstall, r   Remove skills installed from ~/.config/sugatoray/aiskills via 'npx skills remove' (also: rm, remove)
  installed, ls  Show skills currently installed from ~/.config/sugatoray/aiskills
  groups, g      List skill groups (from .claude-plugin/marketplace.json) and their skills
  sync           Only save/refresh the skills folder; do not run 'npx skills add'
  list           List the skills available in the saved folder
  path, p        Print the folder that holds skills/
  info           Show this setup: versions, folders, settings and where each comes from
                 (offline); --full also asks npx skills and npm; --json for scripts
  releases, rel  Show the latest releases on npm (default 5): rel 10, rel all, -L/--last <n|all>
  upgrade        Install the latest aiskills (or <version|tag>) globally, then re-add the
                 installed skills for the same agents with the new version
  find, f <q>    Search the skills registry (= npx skills find <query>)
  skills <args>  Pass <args> straight to 'npx skills'; ':root' is replaced by ~/.config/sugatoray/aiskills
  help, h        Show this help

Scope/selection options (install, uninstall, installed):
  -g, --global           User-level (default)
  -p, --project          Current project instead of user-level
  -a, --agent <names>    Comma-separated agents (e.g. claude-code,codex); default: auto-detect
  -s, --skill <names>    Comma-separated skill names; default: all skills from this package
  -G, --group <names>    Comma-separated skill groups (e.g. scrolls-skills or just scrolls;
                         'all' = everything). Combines with -s. See 'aiskills groups'.
  -s/-G/-a may be repeated; values accumulate.
  -s/-G/-a accept glob patterns: * (any text), ? (one character), [abc] / [a-z] / [!a]
  (one of / range / not). Matching ignores case. A pattern that matches nothing is an
  error. Quote patterns so your shell doesn't expand them: -s 'scrolls-*'.

Routing (install, uninstall, installed; may also go before the command):
      --route            Hand skills that are NOT bundled to 'npx skills'.
                         The 'aix' command is 'aiskills --route' (e.g. 'aix i -s pdf'):
                           install:   -s <name>             -> npx skills find <name>, then add owner/repo@<name>
                                                                 after you confirm (shows the match first; see -y)
                                      -s owner/repo[@skill] -> npx skills add owner/repo[@skill] (also URLs/paths)
                           uninstall: -s <name|pattern>     -> also matches skills from other sources
                           installed: lists every installed skill with its source

Layout of ~/.config/sugatoray/aiskills/skills (install, sync; may also go before the command):
      --flat             skills/<skill>/...          one folder per skill, as the npm package ships it
      --nested           skills/<group>/<skill>/...  the repo's original layout, incl. group READMEs etc.
                         The choice is remembered for later commands; default: flat. Either way,
                         'npx skills add' installs the same skills.

install only:
  -i, --interactive      Let 'npx skills add' ask which skills and agents to install for
                         (its own pickers; agents you picked last time are pre-checked,
                         and it remembers this pick). -s/-G/-a skip the matching picker.
                         Needs a terminal.
  -l, --last-agents      Install for the agents you last picked in 'npx skills add'
                         (its lastSelectedAgents), instead of every detected agent.
                         Combines with -a.
      --copy             Copy files into agent dirs instead of symlinking
      --no-stats         Don't add this install to the skills.sh install count. By default, after
                         installing bundled skills, aiskills runs 'npx skills add sugatoray/aiskills' for
                         them in a temp folder, in the background, so skills.sh counts the install
                         (needs github.com; skipped silently without it). Remembered until --stats;
                         also accepted by sync. Always off with DO_NOT_TRACK, DISABLE_TELEMETRY or CI.
      --stats            Count installs on skills.sh again (the default)
  -y, --yes              Install skills that --route found by a registry lookup without asking
                         (needed when there is no terminal to ask in); pinned owner/repo@skill never asks
  -n, --dry-run          Show what would be installed, and the exact commands; install nothing

releases only:
  <n|all>, -L, --last <n|all>  How many releases to show (default 5)
      --downloads [period]     Add download counts: a 7-day column per version (the only
                               per-version counts npm keeps), the package total over <period>,
                               and a breakdown. period: all (default), <N><d|w|m|y> (7d, 2w,
                               1m = 30 days, 1y = 365 days), <YYYY-MM-DD>:<YYYY-MM-DD> or <YYYY-MM-DD>:
      --chart                  Show the breakdown as a bar chart (the default)
      --table                  Show the breakdown as a plain table
      --by day|week|month      Row size of the breakdown; default: by the period's length
      --ascii                  Draw the bars with # instead of block characters
  --chart, --table, --by and --ascii imply --downloads.

upgrade only:
  <version|tag>          What to install instead of latest: 0.9.1, next
      --check            Only say whether an upgrade is available; change nothing (exit 0)
      --json             With --check: the result as JSON
      --no-refresh       Upgrade the package only; print how to refresh the skills
  -n, --dry-run          Print what would run; change nothing
  -y, --yes              Allow a downgrade without asking

uninstall only:
      --purge            Also delete ~/.config/sugatoray/aiskills (only with a full uninstall)
  -f, --force            Allow -s names that this package does not provide
  -n, --dry-run          Print what would run; change nothing

Anything after '--' is appended to the underlying 'npx skills' command.

Examples:
  aiskills groups                             # what groups exist
  aiskills install --group scrolls --global --agent claude-code
  aiskills install -G scrolls,personas -s create-lib-docs -a claude-code,codex
  aiskills install -i                         # pick skills and agents interactively
  aiskills install -l                         # only the agents picked last time (--last-agents)
  aiskills uninstall                          # remove every skill this package installed
  aiskills uninstall -G stata                 # remove one group
  aiskills install -G 'scroll*,d*' -a 'claude*,codex'
  aiskills install -s 'scrolls-*' -a 'cursor,qoder*'
  aiskills uninstall -s 'scrolls-[hu]*'       # scrolls-hide, -unhide, -update
  aiskills --route install -s scrolls-setup,pdf -a claude-code      # bundled + registry lookup
  aiskills install --route -s anthropics/skills@pdf -g              # external, pinned
  aiskills --route uninstall -s pdf                                 # remove an external skill
  aiskills --route installed                                        # bundled + external
  aiskills --nested                                                 # install, keeping the repo's nested folders
  aiskills uninstall -s scrolls-hide,prodigy  # remove just these
  aiskills uninstall -a codex                 # unlink from Codex only
  aiskills uninstall --purge                  # remove all, then delete ~/.config/sugatoray/aiskills
  aiskills info                               # this setup, offline
  aiskills rel 10 --downloads 1m              # latest 10 releases, downloads of the last 30 days
  aiskills upgrade --check                    # is there a newer aiskills?
  aiskills upgrade                            # install it, and update the skills your agents have
  aiskills skills list -g                     # = npx skills list -g
  aiskills skills add :root -s prodigy -g -y  # = npx skills add ~/.config/sugatoray/aiskills -s prodigy -g -y

Environment:
  AISKILLS_HOME          Override the install root (default ~/.config/sugatoray/aiskills)
  AISKILLS_SCOPE, AISKILLS_AGENTS, AISKILLS_SKILLS, AISKILLS_GROUPS, AISKILLS_COPY
                         Defaults for the options above
  AISKILLS_ROUTE=1              Same as --route
  AISKILLS_LAYOUT=flat|nested   Same as --flat / --nested
  AISKILLS_SKILLS_LIB_VERSION   The skills CLI library version npx runs (default 1.7.6, tested): a version,
                                latest, next, an npm range (~1.7.4, 1.7.x) or an interval, where one of
                                "...", "?" or "*" is an open end: [1.7.4, ...) >=1.7.4   (1.7.4, *) >1.7.4
                                [1.7.4, 1.8.0) >=1.7.4 <1.8.0   (..., 1.7.6] <=1.7.6. With a range, npm picks
                                the newest version its rules (e.g. min-release-age) allow.
                                Quote it: AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]'
  AISKILLS_STATS=0|1            Same as --no-stats / --stats (not remembered)
  AISKILLS_STATS_FOREGROUND=1   Wait for the skills.sh count and show its output
```

### `-v`, `--version`

Print the package version.

<!-- verify -->
```bash
ais -v
```

```text
1.2.0
```

## Options

Values for `-a`, `-s` and `-G` are comma-separated, may be [glob patterns](patterns.md), and accumulate when the option is repeated: `-s a,b` = `-s a -s b`. Options on the command line replace the matching [`AISKILLS_*`](environment.md) default.

| Option | install | uninstall | installed | groups | sync |
| --- | --- | --- | --- | --- | --- |
| `-g`, `-p` | ✓ | ✓ | ✓ | | |
| `-a`, `-s`, `-G` | ✓ | ✓ | | | |
| `--route` | ✓ | ✓ | ✓ | | |
| `--nested`, `--flat` | ✓ | | | | ✓ |
| `--stats`, `--no-stats` | ✓ | | | | ✓ |
| `--copy`, `-y`, `-i`, `-l` | ✓ | | | | |
| `-n` | ✓ | ✓ | | | |
| `--purge`, `-f` | | ✓ | | | |
| `--json` | | | | ✓ | |

`info` takes `--full` and `--json`; `upgrade` takes `--check`, `--json`, `--no-refresh`, `-n` and `-y`; `releases` takes `-L`, `--downloads`, `--chart`, `--table`, `--by`, `--ascii` and `--json` (see their headings below).
| `--` | ✓ | ✓ | | | |

### `-g`, `--global`

User-level scope: skills apply in every project. The default. Env: [`AISKILLS_SCOPE`](environment.md#aiskills_scope).

### `-p`, `--project`

Project scope: install, list or remove in the current folder. `npx skills` runs from the current folder without `--global`. Env: `AISKILLS_SCOPE=project`. See [3. Install into a project](../tutorial/03-install-into-a-project.md).

### `-a`, `--agent`

Agents to install to or remove from, e.g. `claude-code,codex`. Default: the agents `npx skills` detects (install) or every agent (uninstall). Plain names are passed to `npx skills`, which checks them. Patterns (`'claude*'`) are expanded against the agent list `npx skills` reports, and the result is printed as `agents: ...`. `-a '*'` is passed on as is, meaning all agents. Env: [`AISKILLS_AGENTS`](environment.md#aiskills_agents).

### `-s`, `--skill`

Skills, by name or pattern. Default: every skill. `-s '*'` is the same as no `-s`. Install matches against the bundled skills; uninstall also against the skills installed from the install folder. A name that isn't bundled is refused unless [`--route`](#--route) (or `-f` on uninstall). With `--route`, `-s` also takes `owner/repo@skill`, `owner/repo`, URLs and paths. Env: [`AISKILLS_SKILLS`](environment.md#aiskills_skills).

### `-G`, `--group`, `--groups`

Skill groups, by name (`scrolls-skills`), alias (`scrolls`), pattern, or `all`. Combines with `-s` (union). See [Skill groups](../concepts/skill-groups.md). Env: [`AISKILLS_GROUPS`](environment.md#aiskills_groups).

### `--route`

Hand skills that aren't bundled to `npx skills`: look up bare names with `npx skills find` (install only on a unique exact match), pass `owner/repo@skill` and other sources to `npx skills add`, let uninstall match any source, and make `installed` list every skill with its source. The `aix` command always sets it. Env: [`AISKILLS_ROUTE`](environment.md#aiskills_route). See [Bundled and external skills](../concepts/bundled-and-external.md).

### `--nested`

Write `<install folder>/skills/` in the repo's nested layout. Remembered for later commands. Env: [`AISKILLS_LAYOUT`](environment.md#aiskills_layout). See [Layouts](../concepts/layouts.md).

### `--flat`

Write `<install folder>/skills/` flat, one folder per skill (the default). Remembered for later commands.

### `--stats`

Add installs to the [skills.sh install count](../concepts/install-count.md) (the default). Undoes a remembered `--no-stats`. Has no effect when `DO_NOT_TRACK`, `DISABLE_TELEMETRY`, `CI` or `GITHUB_ACTIONS` is set.

### `--no-stats`

Don't add this install to the skills.sh count: no background `npx skills add sugatoray/aiskills`, no temp folder, no call to github.com or skills.sh for it. Remembered in `aiskills.json` until `--stats`; `aiskills sync --no-stats` sets it without installing. Env: [`AISKILLS_STATS=0`](environment.md#aiskills_stats). See [The skills.sh install count](../concepts/install-count.md).

### `-i`, `--interactive`

Run `npx skills add` without `--yes`, so it shows its own pickers: which skills (all pre-checked), which agents, and how to install (symlink or copy). In the agent picker, the agents you picked last time are pre-checked, and `npx skills` remembers the new pick for next time (see [`-l`](#-l---last-agents)). `-s`/`-G` and `-a` are still passed on and skip the skill or agent picker. With `-p`, `npx skills` also asks for the scope; pick *Project*. Needs a terminal: without one, `aiskills` stops before installing anything.

Without `-i`, `npx skills add --yes` installs to every agent it detects (an agent counts as detected when its config folder exists, e.g. `~/.claude` or `~/.codex`) plus the universal `.agents/skills` agents, and, when it detects none, to every agent it supports.

### `-l`, `--last-agents`

Install for the agents you last picked in the agent picker of `npx skills add` (run directly or via [`-i`](#-i---interactive)), instead of every detected agent. They are read from `lastSelectedAgents` in the lock file `npx skills` keeps: `$XDG_STATE_HOME/skills/.skill-lock.json`, else `~/.agents/.skill-lock.json`. Adds to any `-a` agents. If none were ever picked, it stops with [No agents recorded](errors.md#no-agents-recorded---last-agents).

### `--copy`

Pass `--copy` to `npx skills add`: copy the files into agent folders instead of symlinking them. Env: [`AISKILLS_COPY`](environment.md#aiskills_copy).

### `-y`, `--yes`

On install with [`--route`](#--route), install the skills that a registry lookup found without asking. Without it, `aiskills` lists each one (`owner/repo@skill`, its install count, and the name you gave), then:

- in a terminal, asks `Install <n> external skill(s) from the registry? [y/N]`; only `y` or `yes` installs, and anything else stops with `nothing installed: not confirmed` (exit `1`);
- with no terminal (a script, CI, an agent), stops with `not installing external skills without confirmation` (exit `1`).

Either way nothing is installed, not even the bundled skills, until the external ones are confirmed. A skill given as `owner/repo@skill`, a URL or a path is never asked about: you named its source. Bundled skills never ask. See [Security model](../concepts/security.md).

On [`upgrade`](#upgrade), allow a downgrade (a target older than the installed version) without asking. Without it, a terminal asks `Downgrade aiskills <installed> → <target>? [y/N]`, and with no terminal it stops with `not downgrading ... without confirmation` (exit `1`). An upgrade never asks.

### `--purge`

After a full uninstall, delete the install folder. Refused with `-s`/`-G`, and refused for a folder that isn't an aiskills folder (checked before anything is removed).

### `-f`, `--force`

On uninstall, pass `-s` names to `npx skills remove` even if this package doesn't provide them.

### `-n`, `--dry-run`

On uninstall, print what would be removed and the exact `npx skills` command, and change nothing.

On [`upgrade`](#upgrade), print the package manager's install command and each `aiskills install` refresh command as `[dry-run]` lines, and change nothing.

On install, show what would be installed: the skills a `--route` lookup found (no confirmation is asked) and each exact `npx skills add` command, as `[dry-run] npx -y skills@1.7.6 add ...` lines, and the [skills.sh count](../concepts/install-count.md) command as a `[dry-run] skills.sh count: ...` line. Nothing is installed or counted. The saved copy in the install folder is still refreshed, as [`sync`](#sync) does.

### `--json`

On `groups`, print the groups as JSON. Schema: [Files and schemas](files.md#aiskills-groups---json). On [`info`](#info) and [`releases`](#releases), print what they show as JSON; on [`upgrade`](#upgrade), only with `--check` (schemas in their sections).

### `--check`

On [`upgrade`](#upgrade), only say whether a newer version is available (`update available: run 'aiskills upgrade'`, `up to date`, or `installed <version> is newer than <target>`), and change nothing. Exits `0` whatever it finds; with [`--json`](#--json), read `upgradable`.

### `--no-refresh`

On [`upgrade`](#upgrade), install the new package but leave the skills your agents have as they are, and print the `aiskills install` commands that would update them.

### `--full`

On [`info`](#info), also ask npm for the latest version and `npx skills list` for what is installed (a few seconds; needs network). Without it, `info` is offline.

### `-L`, `--last`

On [`releases`](#releases), how many releases to show: a whole number of 1 or more, or `all`. The same as giving the number right after the command (`aiskills rel 10` = `aiskills rel -L 10`). Default: 5. Anything else stops with [Invalid number of releases](errors.md#invalid-number-of-releases).

### `--downloads`

On [`releases`](#releases), add download counts from api.npmjs.org: a `DOWNLOADS (7 DAYS)` column per version, the package's total over a period, and a breakdown by day, week or month. `--downloads` alone means `all`; a value right after it, or after `=`, is the period:

```text
period  := all                         since the first publish (the default)
         | <N><unit>                   the last N units, ending on npm's latest day of data
         | <YYYY-MM-DD>:<YYYY-MM-DD>   an exact range (npm's own notation)
         | <YYYY-MM-DD>:               from a date until npm's latest day

unit    := d (days) | w (weeks: 7 days) | m (months: 30 days) | y (years: 365 days)
N       := a whole number, 1 or more
```

Examples: `--downloads 7d`, `--downloads 2w`, `--downloads=1m`, `--downloads 1y`, `--downloads 2026-11-01:2026-11-10`, `--downloads 2026-11-01:`. Units ignore case; a month is 30 days and a year 365, matching npm's own "last month" and "last year". A bare number after `--downloads` is not a period, so `aiskills rel --downloads 10` shows 10 releases with all-time counts. Periods longer than npm's 18-month limit are fetched in pieces and added up; npm has counts from 2015-01-10 on. An invalid period stops with [Invalid period](errors.md#invalid-period) before any network call.

### `--chart`

On [`releases`](#releases), show the downloads breakdown as a bar chart (the default). Implies `--downloads` (all time) if it isn't given. Can't be combined with `--table`.

### `--table`

On [`releases`](#releases), show the downloads breakdown as a plain table (`DAY`/`WEEK`/`MONTH`, `DOWNLOADS`, `RELEASED`), with every row and no bars. Implies `--downloads`.

### `--by`

On [`releases`](#releases), the row size of the downloads breakdown: `day`, `week` or `month`. Default: by the period's length (day up to 31 days, week up to 183, month beyond). Weeks run in 7-day steps from the period's first day; months follow the calendar. Implies `--downloads`.

### `--ascii`

On [`releases`](#releases), draw the chart's bars with `#` instead of block characters, for terminals or fonts without them. Also used when `TERM=dumb`. Implies `--downloads`.

### `--`

Everything after `--` is appended to the `npx skills add` (install) or `npx skills remove` (uninstall) command. See [Run any `npx skills` command](../guides/run-npx-skills-directly.md#extra-flags-on-install-and-uninstall).

See also: [Environment variables](environment.md) · [Errors and exit codes](errors.md) · [Patterns](patterns.md)
