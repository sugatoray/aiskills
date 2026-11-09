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
| [`skills`](#skills) | | Pass arguments to `npx skills` |
| [`help`](#help) | `h`, `-h`, `--help` | Show the help |
| [`-v`, `--version`](#-v---version) | | Print the version |

`sync`, `skills` and `list` have no one-letter alias on purpose: `s` would be ambiguous, and `l` looks like `ls`.

### `install`

Save the skills to the install folder (see [`sync`](#sync)), then run `npx skills add <install folder>` with the selected skills and agents.

```text
aiskills install [-g|-p] [-a agents] [-s skills] [-G groups] [--copy] [--route] [-y] [-n] [--nested|--flat] [-- <extra>]
```

| | |
| --- | --- |
| Alias | `i` |
| Options | [`-g`](#-g---global), [`-p`](#-p---project), [`-a`](#-a---agent), [`-s`](#-s---skill), [`-G`](#-g---group---groups), [`--copy`](#--copy), [`--route`](#--route), [`-y`](#-y---yes), [`-n`](#-n---dry-run), [`--nested`](#--nested), [`--flat`](#--flat), [`--`](#--) |
| Default | Every skill, `--global`, agents detected by `npx skills` |
| Exit code | `1` if a name, pattern or lookup fails, or an external skill isn't confirmed (nothing is installed); otherwise the exit code of `npx skills add` |

<!-- verify -->
```bash
aiskills install
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill '*' --yes
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
aiskills 0.4.0 — Sugato Ray's agent skills

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
      --copy             Copy files into agent dirs instead of symlinking
  -y, --yes              Install skills that --route found by a registry lookup without asking
                         (needed when there is no terminal to ask in); pinned owner/repo@skill never asks
  -n, --dry-run          Show what would be installed, and the exact commands; install nothing

uninstall only:
      --purge            Also delete ~/.config/sugatoray/aiskills (only with a full uninstall)
  -f, --force            Allow -s names that this package does not provide
  -n, --dry-run          Print what would run; change nothing

Anything after '--' is appended to the underlying 'npx skills' command.

Examples:
  aiskills groups                             # what groups exist
  aiskills install --group scrolls --global --agent claude-code
  aiskills install -G scrolls,personas -s create-lib-docs -a claude-code,codex
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
  aiskills skills list -g                     # = npx skills list -g
  aiskills skills add :root -s prodigy -g -y  # = npx skills add ~/.config/sugatoray/aiskills -s prodigy -g -y

Environment:
  AISKILLS_HOME          Override the install root (default ~/.config/sugatoray/aiskills)
  AISKILLS_SCOPE, AISKILLS_AGENTS, AISKILLS_SKILLS, AISKILLS_GROUPS, AISKILLS_COPY
                         Defaults for the options above
  AISKILLS_ROUTE=1              Same as --route
  AISKILLS_LAYOUT=flat|nested   Same as --flat / --nested
```

### `-v`, `--version`

Print the package version.

<!-- verify -->
```bash
ais -v
```

```text
0.4.0
```

## Options

Values for `-a`, `-s` and `-G` are comma-separated, may be [glob patterns](patterns.md), and accumulate when the option is repeated: `-s a,b` = `-s a -s b`. Options on the command line replace the matching [`AISKILLS_*`](environment.md) default.

| Option | install | uninstall | installed | groups | sync |
| --- | --- | --- | --- | --- | --- |
| `-g`, `-p` | ✓ | ✓ | ✓ | | |
| `-a`, `-s`, `-G` | ✓ | ✓ | | | |
| `--route` | ✓ | ✓ | ✓ | | |
| `--nested`, `--flat` | ✓ | | | | ✓ |
| `--copy`, `-y` | ✓ | | | | |
| `-n` | ✓ | ✓ | | | |
| `--purge`, `-f` | | ✓ | | | |
| `--json` | | | | ✓ | |
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

### `--copy`

Pass `--copy` to `npx skills add`: copy the files into agent folders instead of symlinking them. Env: [`AISKILLS_COPY`](environment.md#aiskills_copy).

### `-y`, `--yes`

On install with [`--route`](#--route), install the skills that a registry lookup found without asking. Without it, `aiskills` lists each one (`owner/repo@skill`, its install count, and the name you gave), then:

- in a terminal, asks `Install <n> external skill(s) from the registry? [y/N]`; only `y` or `yes` installs, and anything else stops with `nothing installed: not confirmed` (exit `1`);
- with no terminal (a script, CI, an agent), stops with `not installing external skills without confirmation` (exit `1`).

Either way nothing is installed, not even the bundled skills, until the external ones are confirmed. A skill given as `owner/repo@skill`, a URL or a path is never asked about: you named its source. Bundled skills never ask. See [Security model](../concepts/security.md).

### `--purge`

After a full uninstall, delete the install folder. Refused with `-s`/`-G`, and refused for a folder that isn't an aiskills folder (checked before anything is removed).

### `-f`, `--force`

On uninstall, pass `-s` names to `npx skills remove` even if this package doesn't provide them.

### `-n`, `--dry-run`

On uninstall, print what would be removed and the exact `npx skills` command, and change nothing.

On install, show what would be installed: the skills a `--route` lookup found (no confirmation is asked) and each exact `npx skills add` command, as `[dry-run] npx -y skills@1.7.6 add ...` lines. Nothing is installed. The saved copy in the install folder is still refreshed, as [`sync`](#sync) does.

### `--json`

On `groups`, print the groups as JSON. Schema: [Files and schemas](files.md#aiskills-groups---json).

### `--`

Everything after `--` is appended to the `npx skills add` (install) or `npx skills remove` (uninstall) command. See [Run any `npx skills` command](../guides/run-npx-skills-directly.md#extra-flags-on-install-and-uninstall).

See also: [Environment variables](environment.md) · [Errors and exit codes](errors.md) · [Patterns](patterns.md)
