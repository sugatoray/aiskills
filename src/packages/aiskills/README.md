# @sugatoray-ai/aiskills

All of the agent skills from [sugatoray/aiskills](https://github.com/sugatoray/aiskills)
(scrolls, stata, personas, newsletters, diagrams, docs, development), packaged
for npm. Every file under the repo's `skills/` folder ships. The skills are
flattened to one folder per skill (`skills/<skill-name>/`), and the repo's
nested layout can be rebuilt with `--nested` (see [Layouts](#layouts---flat-and---nested)).

## Install

```sh
npm install -g @sugatoray-ai/aiskills
```

This adds three commands:

| Command | Same as |
| --- | --- |
| `aiskills` | |
| `ais` | `aiskills` (shorter to type) |
| `aix` | `aiskills --route`: also handles skills that aren't bundled (see [`--route`](#bundled-and-external-skills---route)) |

So `ais i -G scrolls` is `aiskills install -G scrolls`, and `aix i -s pdf` is
`aiskills --route install -s pdf`. The rest of this README uses `aiskills`.

During install, the `postinstall` hook:

1. saves the skills to **`~/.config/sugatoray/aiskills/skills/`** and replaces any copy that's already there, and
2. runs `npx skills add ~/.config/sugatoray/aiskills --global --skill '*' --yes`,
   which registers every skill with the agents it detects (Claude Code, Codex, …).

If step 2 fails (for example, offline or `--ignore-scripts`), the npm install
still succeeds. Run step 2 again with:

```sh
npx @sugatoray-ai/aiskills install        # or: aiskills install
```

### As a project dependency, with `npx skills experimental_sync`

Because the package ships its skills flat (`skills/<skill-name>/SKILL.md`), it
also works with the `skills` CLI's own way of installing skills from a
project's `node_modules`:

```sh
npm install --save-dev --ignore-scripts @sugatoray-ai/aiskills
npx skills experimental_sync --agent claude-code --yes   # copies all of its skills into the project
```

This doesn't use `aiskills` or `~/.config/sugatoray/aiskills` at all, and the
skills are pinned to the version in your lockfile. `experimental_sync` is
marked experimental by the `skills` CLI.

## Layouts: `--flat` and `--nested`

`~/.config/sugatoray/aiskills/skills/` can be written in one of two layouts.
Either way, `npx skills add` installs exactly the same skills; only the folder
shape differs.

| Layout | `~/.config/sugatoray/aiskills/skills/` | Use it when |
| --- | --- | --- |
| **`--flat`** (default) | `skills/<skill-name>/...`, one folder per skill, as the npm package ships it | You just want the skills |
| **`--nested`** | `skills/<group>/<skill-name>/...` plus the group-level files (READMEs, `.claude-plugin/plugin.json`, `meta/`, …): the repo's `skills/` folder, byte for byte | You browse or edit the skills, or a tool expects the repo's layout |

```sh
aiskills --nested                 # install, writing the nested layout
aiskills install --nested -G scrolls
aiskills sync --nested            # just rewrite the folder, no npx skills add
aiskills sync --flat              # back to flat
AISKILLS_LAYOUT=nested npm i -g @sugatoray-ai/aiskills
```

- **Placement:** `--nested` / `--flat` go before the command or after
  `install` / `sync`. `aiskills --nested` on its own means `install --nested`.
- **The choice is remembered** in `~/.config/sugatoray/aiskills/aiskills.json`
  and reused by later `install`, `sync`, `list` and `groups` runs until you
  pass the other flag.
- **Precedence:** a flag beats `AISKILLS_LAYOUT`, which beats the remembered
  choice. With none of them, the layout is flat.
- **How nesting is rebuilt:** the package carries
  `.aiskills/layout.json`, which records each skill's original folder (e.g.
  `scrolls-setup` → `scrolls/scrolls-setup`), and `.aiskills/nested/`, which
  holds the files that sit outside any skill folder. Both are copied next to
  `skills/`.
- **Groups work the same in both layouts.** A group's skills are the ones
  whose *original* folder is under the group's `source` in `marketplace.json`.

## CLI

```text
# -a/-s/-G accept comma-separated names and glob patterns ('scrolls-*', 'claude*')
aiskills install   [-g|-p] [-a agents] [-s skills] [-G groups] [--copy] [--nested|--flat] [-- <extra npx skills args>]   # alias: i
aiskills uninstall [-g|-p] [-a agents] [-s skills] [-G groups] [--purge] [-f] [-n] [-- <extra args>]   # aliases: r, rm, remove
aiskills installed [-g|-p]   # skills currently installed from ~/.config/sugatoray/aiskills   (alias: ls)
aiskills groups [--json]     # skill groups (from marketplace.json) and their skills   (alias: g)
aiskills find <query>        # search the skills registry (= npx skills find)   (alias: f)
# --route (before or after the command) hands non-bundled skills to npx skills
aiskills --route install|uninstall|installed ...
aiskills skills <args...>    # passthrough to `npx skills`; `:root` = ~/.config/sugatoray/aiskills
aiskills sync [--nested|--flat]   # only refresh ~/.config/sugatoray/aiskills/skills
aiskills list                # list the skills available in the saved folder
aiskills path                # print ~/.config/sugatoray/aiskills   (alias: p)
```

Short aliases, mostly following `npm`'s own:

| Alias | Command | Like |
| --- | --- | --- |
| `i` | `install` | `npm i` |
| `r` (also `rm`, `remove`) | `uninstall` | `npm r` |
| `ls` | `installed` | `npm ls` |
| `g` | `groups` | |
| `f` | `find` | |
| `p` | `path` | |
| `h` (also `-h`, `--help`) | `help` | |

Options work the same with an alias: `aiskills i -G scrolls -a claude-code`.
`sync`, `skills` and `list` have no single-letter alias on purpose: `s` would
be ambiguous between `sync` and `skills`, and `l` too easily confused with
`ls` (= `installed`).

Install examples:

```sh
aiskills install -a claude-code,codex          # only these agents
aiskills install -s scrolls-setup,scrolls-help # only these skills
aiskills install --project                     # into the current project
aiskills install --group scrolls --global --agent claude-code
```

## Skill groups

### Where the groups come from

The package bundles the repo's `.claude-plugin/marketplace.json` (the Claude
Code plugin marketplace file) and saves it next to the skills:

```text
~/.config/sugatoray/aiskills/
├── .claude-plugin/marketplace.json   <- read only to define groups
├── .aiskills/layout.json             <- each skill's original nested folder
└── skills/                           <- what `npx skills add` installs from
```

The file is only used to group the skills. Nothing is installed as a Claude
Code plugin, and installs still go through `npx skills add ... --skill <name>`.

### How a group is built

Each entry under `plugins` is one group. Its `source` points into the repo's
nested layout; `.aiskills/layout.json` maps that to the skills, so groups work
whether `skills/` is [flat or nested](#layouts---flat-and---nested):

```jsonc
{
  "metadata": { "pluginRoot": "./skills" },
  "plugins": [
    {
      "name": "scrolls-skills",   // -> group name: scrolls-skills (alias: scrolls)
      "source": "./scrolls",      // -> group skills: every SKILL.md under skills/scrolls/
      ...
    }
  ]
}
```

| Part | Where it comes from |
| --- | --- |
| **Group name** | The entry's `name` field, used exactly as written in `marketplace.json`, e.g. `scrolls-skills`. |
| **Skills in the group** | Every `SKILL.md` under the entry's `source` folder (relative to `metadata.pluginRoot`). A skill's name is the `name:` in its `SKILL.md` frontmatter. |
| **Alias** | **Not in the file.** The CLI makes it by removing a trailing `-skills` from the group name, so `scrolls-skills` can also be written `scrolls`. A name that doesn't end in `-skills` has an alias equal to the name itself. |
| **`all`** | **Not in the file.** A built-in group that means every skill in the package, including skills that belong to no group. |

Entries whose `source` isn't a local folder (for example a git URL) are
skipped, because those skills aren't in the package.

### Current groups

Run `aiskills groups` (or `aiskills groups --json`) to see the list for your
installed version. At the time of writing:

| Group name (from `marketplace.json`) | Alias (made by the CLI) | Skills |
| --- | --- | --- |
| `scrolls-skills` | `scrolls` | scrolls-setup, scrolls-update, scrolls-hide, scrolls-unhide, scrolls-remove, scrolls-restore, scrolls-help |
| `stata-skills` | `stata` | stata-recipes |
| `repo-related-skills` | `repo-related` | create-issues-update-pr |
| `docs-skills` | `docs` | create-lib-docs |
| `diagrams-skills` | `diagrams` | network-flow |
| `personas-skills` | `personas` | prodigy |
| `all` (built in) | | every skill |

`newsletter-ai` isn't in any `marketplace.json` entry. It shows up in
`aiskills groups` as ungrouped, and you can install it with
`-s newsletter-ai` or `-G all`.

### Choosing groups on the command line

- `-G` / `--group` accepts the group name **or** its alias, in any letter case:
  `scrolls-skills`, `scrolls`, and `Scrolls` all select the same group.
- Give several groups as a comma-separated list (`-G scrolls,personas`) or
  repeat the option (`-G scrolls -G personas`).
- `-G` combines with `-s`. You get the union of the named skills and every
  skill in the named groups.
- Glob patterns work too, matched against both the group name and the alias:
  `-G 'scroll*'`, `-G '*-skills'`, `-G 'd*'` (docs and diagrams). See
  [Patterns](#patterns-for--s--g-and--a).
- An unknown group name, or a pattern that matches no group, fails before
  anything is installed and lists the valid names.

```sh
aiskills install --group scrolls-skills --global --agent claude-code   # full group name
aiskills install --group scrolls --global --agent claude-code          # same, via alias
aiskills install -G scrolls,personas -s newsletter-ai -a claude-code,codex
aiskills install -G stata --project
aiskills uninstall -G scrolls          # remove every installed skill in the group
```

At npm install time, `AISKILLS_GROUPS` does the same thing:
`AISKILLS_GROUPS=scrolls,personas npm i -g @sugatoray-ai/aiskills`.

### Adding a group

Add a plugin entry to the repo's `.claude-plugin/marketplace.json` that points
at a folder under `skills/`, then publish a new version of this package. The
new group appears automatically; no CLI code needs to change.

## Patterns for `-s`, `-G` and `-a`

`-s/--skill`, `-G/--group` and `-a/--agent` all accept
[glob](https://en.wikipedia.org/wiki/Glob_(programming)) patterns, on both
`install` and `uninstall`. The same applies to `AISKILLS_SKILLS`,
`AISKILLS_GROUPS` and `AISKILLS_AGENTS` in the npm postinstall step.

| Pattern | Matches | Example |
| --- | --- | --- |
| `*` | any text, including none | `scrolls-*` |
| `?` | exactly one character | `?????-recipes` |
| `[abc]` | one of the listed characters | `scrolls-[hu]*` → scrolls-help, -hide, -unhide, -update |
| `[a-z]` | one character in the range | `scrolls-[r-u]*` |
| `[!abc]` or `[^abc]` | one character **not** listed | `scrolls-[!hu]*` → scrolls-remove, -restore, -setup |

Rules:

- **Ignores case.** This applies to patterns and plain names alike.
- **Whole-name match.** `scroll*` matches `scrolls-skills`; `croll` alone
  matches nothing.
- **Mix freely.** Patterns and plain names can share one comma-separated list
  (`-s 'scrolls-*,prodigy'`), and `-s/-G/-a` can each be repeated.
- **No match is an error.** A pattern that matches nothing stops the command
  before anything changes, and lists the valid values.
- **Quote patterns** (`'scrolls-*'`). Otherwise your shell may expand them
  into file names first.

What each option matches against:

| Option | Matched against |
| --- | --- |
| `-s/--skill` | **install:** every skill in the package. **uninstall:** every skill in the package plus every skill installed from `~/.config/sugatoray/aiskills`. |
| `-G/--group` | Group names **and** aliases from [Skill groups](#skill-groups). `all` is a built-in group; `-G '*'` means the same. |
| `-a/--agent` | The agent ids `npx skills` accepts (`claude-code`, `codex`, `cursor`, `qoder`, `qoder-cn`, …). The CLI reads this list from `npx skills` itself, so it always matches your installed version. |

Special cases:

- **`-s '*'`** means every skill, just as if you gave no `-s`.
- **`-a '*'`** is passed straight to `npx skills`, which reads it as "all
  agents". It isn't expanded.
- **Plain agent names** aren't checked by `aiskills`. They go to
  `npx skills`, which reports invalid ones.
- **Uninstall with patterns or groups** only removes skills that are actually
  installed from `~/.config/sugatoray/aiskills`. Names typed out in full are
  always passed to `npx skills remove`, so `-f` can still remove a skill that
  came from somewhere else.
- **Check first.** `-n` on uninstall shows what a pattern expands to, and
  install prints `selected: ...` and `agents: ...` before running.

```sh
aiskills install -G 'scroll*,d*' -a 'claude*,codex'      # scrolls + docs + diagrams -> claude-code, codex
aiskills install -s 'stata-*' -a 'cursor,qoder*'         # -> cursor, qoder, qoder-cn
aiskills install -s 'scrolls-*,prodigy' --project
aiskills uninstall -s 'scrolls-[hu]*' -n                 # preview: help, hide, unhide, update
aiskills uninstall -s 'scrolls-[hu]*' -a 'claude*'
aiskills uninstall -G 'd*'                               # docs-skills + diagrams-skills
AISKILLS_GROUPS='pers*' AISKILLS_AGENTS='claude-c*' npm i -g @sugatoray-ai/aiskills
```

## Bundled and external skills (`--route`)

Without `--route`, `aiskills` only manages the **bundled** skills, the ones in
`~/.config/sugatoray/aiskills/skills/`. It rejects any other skill name and
suggests adding `--route`.

With `--route`, every `-s` entry that isn't bundled is handed to `npx skills`. The `aix` command
always works this way: `aix ...` is `aiskills --route ...`.
That lets you manage bundled and external (registry / GitHub) skills from one
CLI. `--route` can go before or after the command, or you can set
`AISKILLS_ROUTE=1`.

```sh
aiskills --route install -s scrolls-setup,pdf -a claude-code
aiskills install --route -s scrolls-setup,pdf -a claude-code   # same
```

### `install --route`

Each `-s` entry is handled as follows:

| `-s` entry | What happens |
| --- | --- |
| A bundled skill name, or a pattern | Installed from `~/.config/sugatoray/aiskills`, the same as without `--route`. |
| A bare name that isn't bundled, e.g. `pdf` | Looked up with `npx skills find pdf`. If **exactly one** result has that exact name, `npx skills add <owner/repo>@pdf` installs it. |
| `owner/repo@skill` | Passed straight to `npx skills add owner/repo@skill`, with no lookup. |
| `owner/repo`, a git URL, or a local path | Passed straight to `npx skills add <spec>`, which installs the skills found there. |

- **Same flags.** External installs get the same `-g/-p`, `-a` (patterns
  included) and `--copy` as the bundled ones.
- **Lookups first.** Every external lookup runs before anything is installed.
  If one fails, nothing is installed.
- **Several matches.** If more than one skill has the exact name, the command
  stops and lists them, e.g. `a/one@dupe` and `b/two@dupe`. Pick one with
  `-s owner/repo@skill`. `aiskills` never chooses for you.
- **No exact match.** The command stops and shows the closest results from
  `npx skills find`.
- **Patterns and groups** (`-s 'x*'`, `-G`) only match bundled skills. The
  registry can't be searched with a pattern, so use `aiskills find <query>` to
  browse it.

```sh
aiskills find pdf                                    # browse the registry
aiskills --route install -s pdf -a claude-code       # look up + install
aiskills --route install -s anthropics/skills@docx   # pinned, no lookup
aiskills --route install -G scrolls -s pdf -p        # bundled group + external skill, project scope
```

External skills are installed straight from their source, the same way
`npx skills add` would install them. They aren't copied into
`~/.config/sugatoray/aiskills`.

### `uninstall --route`

- **Any source.** `-s` names and patterns also match skills installed from
  other sources, not only bundled ones. For example,
  `aiskills --route uninstall -s 'pdf,do*'` removes the external `pdf` and
  `docx`.
- **`owner/repo@skill`** is reduced to `skill`. A bare `owner/repo` is
  rejected, because it doesn't name a skill.
- **Not installed.** Names that aren't installed in that scope are skipped
  with a warning.
- **Full uninstall** (no `-s`/`-G`) still removes **only bundled** skills,
  even with `--route`. External skills are removed only when you name them.
- **Same name from two sources.** `npx skills remove` removes by name, so
  `--route uninstall -s <name>` removes the skill whichever source it came
  from.

```sh
aiskills --route uninstall -s pdf -n           # preview
aiskills --route uninstall -s pdf,docx
aiskills --route uninstall -s anthropics/skills@pdf
```

### `installed --route`

Lists **every** installed skill in that scope, with a source column:
`bundled` for skills from `~/.config/sugatoray/aiskills`, otherwise the
source `npx skills` recorded (e.g. `anthropics/skills`).

```text
$ aiskills --route installed
docx                       anthropics/skills              -                      Claude Code
scrolls-setup              bundled                        scrolls-skills         Claude Code
```

## Uninstall

`aiskills uninstall` calls `npx skills remove ... --yes`.

- **Full uninstall** (no `-s`): removes every skill that `npx skills list`
  says was installed from `~/.config/sugatoray/aiskills`. Skills with the same
  name from other sources aren't touched.
- **Partial uninstall** (`-s a,b` and/or `-G group`, either may use
  [patterns](#patterns-for--s--g-and--a)): removes only the named skills, or
  every installed skill that matches or belongs to the named groups. Names this
  package doesn't provide are rejected unless you pass `-f/--force`.
- **Per agent** (`-a codex`, or a pattern like `-a 'qoder*'`): unlinks the
  skills from those agents only.
- **`--purge`**: after a full uninstall, also deletes
  `~/.config/sugatoray/aiskills`. Without it, the files are kept so that
  `aiskills install` can re-add them offline.
- **`-n/--dry-run`**: prints the exact `npx skills` command without running it.

```sh
aiskills uninstall -n                          # preview
aiskills uninstall -s scrolls-hide,prodigy     # partial
aiskills uninstall -a codex                    # unlink from Codex only
aiskills uninstall -p                          # project-level installs in $PWD
aiskills uninstall --purge                     # everything, plus the local folder
npm uninstall -g @sugatoray-ai/aiskills        # then remove the npm package
```

npm does not run uninstall hooks, so run `aiskills uninstall` **before**
`npm uninstall -g`. If the CLI is already gone, either of these does the same
job:

```sh
npx @sugatoray-ai/aiskills uninstall --purge
npx skills remove <skill...> --global --yes && rm -rf ~/.config/sugatoray/aiskills
```

### Using `npx skills` directly

`aiskills skills ...` forwards every argument to `npx skills` and replaces
`:root` with the install folder, so you can use any `skills` command or flag:

```sh
aiskills skills list -g                         # npx skills list -g
aiskills skills add :root -s prodigy -g -y      # npx skills add ~/.config/sugatoray/aiskills -s prodigy -g -y
aiskills skills remove prodigy -a codex -g -y   # npx skills remove prodigy -a codex -g -y
aiskills skills update -g                       # npx skills update -g
```

`install` and `uninstall` also pass anything after `--` through to
`npx skills`.

## Environment variables

| Variable | Effect |
| --- | --- |
| `AISKILLS_HOME` | Override the install root (default `~/.config/sugatoray/aiskills`) |
| `AISKILLS_SCOPE=project` | Install to the project npm was invoked from instead of globally |
| `AISKILLS_AGENTS` | Comma-separated agents or [patterns](#patterns-for--s--g-and--a), passed as `--agent` |
| `AISKILLS_SKILLS` | Comma-separated skills or [patterns](#patterns-for--s--g-and--a), passed as `--skill` (default: all) |
| `AISKILLS_GROUPS` | Comma-separated group names, aliases or [patterns](#patterns-for--s--g-and--a) (see [Skill groups](#skill-groups)); combined with `AISKILLS_SKILLS` |
| `AISKILLS_COPY=1` | Pass `--copy` to `npx skills add` |
| `AISKILLS_LAYOUT=flat\|nested` | Same as `--flat` / `--nested` (see [Layouts](#layouts---flat-and---nested)) |
| `AISKILLS_ROUTE=1` | Same as `--route`. Also lets the postinstall step route non-bundled names in `AISKILLS_SKILLS` |
| `AISKILLS_SKILLS_VERSION` | Version of the `skills` CLI that `npx` runs (default: the tested, pinned version; e.g. `latest`) |
| `AISKILLS_SKIP_SKILLS_ADD=1` | Postinstall saves the files but skips `npx skills add` (also skipped when `CI` is set) |
| `AISKILLS_SKIP_POSTINSTALL=1` | Skip the postinstall hook entirely |

## Security

Skills are code that your agent may run with your permissions. See
[SECURITY.md](SECURITY.md) for what this package writes, which network calls
happen (and how to turn off the `skills` CLI's telemetry), known limitations,
and how to report a vulnerability.

## Maintainers: building & publishing

Maintainer docs: [docs/meta/MAINTAINERS.md](docs/meta/MAINTAINERS.md) (workflow
and releases), [docs/meta/ARCHITECTURE.md](docs/meta/ARCHITECTURE.md) (how it's
built) and [docs/meta/FEATURES.md](docs/meta/FEATURES.md) (every feature, with
where it's documented and tested).

The package source lives in `src/packages/aiskills/` of the repo. The skills are **not**
committed here. `prepack` (`src/scripts/vendor-skills.mjs`) runs right before
`npm pack` / `npm publish` and:

- flattens `<repo>/skills/<group>/<skill>/` into `skills/<skill>/` (the folder
  is named after the skill's `name:`);
- writes `.aiskills/layout.json` (each skill's original folder, plus the list
  of files outside any skill folder) and copies those files to
  `.aiskills/nested/` at their original paths;
- copies `<repo>/.claude-plugin/marketplace.json` and `LICENSE`.

It stops with an error if two skills share a name, a skill sits inside
another skill, or a name can't be used as a folder name.

```sh
cd src/packages/aiskills
npm test              # run the test suite first
npm run vendor        # optional: vendor locally to inspect
npm run pack:dry      # list what will ship
# move the CHANGELOG.md "Unreleased" entries under the new version, with today's date
npm version patch     # bump the version (patch/minor/major, see CHANGELOG.md)
npm publish           # prepack re-vendors the skills automatically
npm run clean         # remove the vendored copy
```

### Layout

```text
src/packages/aiskills/
├── package.json              # "bin": { aiskills, ais -> bin/aiskills.mjs; aix -> bin/aix.mjs }
├── README.md
├── CHANGELOG.md              # Keep a Changelog + SemVer
├── SECURITY.md               # reporting + what the package touches
├── bin/
│   ├── aiskills.mjs          # thin entry point: imports src/scripts/cli.mjs
│   └── aix.mjs               # the same, in --route mode
├── src/
│   ├── scripts/              # the code
│   │   ├── cli.mjs           # the `aiskills` command
│   │   ├── installer.mjs     # shared logic (sync, npx skills calls, groups, patterns, --route)
│   │   ├── postinstall.mjs   # npm postinstall hook
│   │   └── vendor-skills.mjs # prepack: copies <repo>/skills in (not published)
│   └── test/                 # node:test suite (not published)
├── docs/meta/                # ARCHITECTURE, FEATURES, MAINTAINERS (not published)
├── docs/.scrolls/, SCROLLS.md, CLAUDE.md, AGENTS.md   # project memory (not published)
└── skills/, .aiskills/, .claude-plugin/, LICENSE      # vendored at pack time (git-ignored)
```

### Tests

The suite uses the built-in `node:test` runner and has no dependencies.

```sh
npm test            # unit + CLI + packaging tests: offline, a few seconds
npm run test:e2e    # also a real install with the real `npx skills` (needs network)
```

| File | What it covers |
| --- | --- |
| `src/test/unit.test.mjs` | The pure helpers: glob matching, pattern expansion, reading skill names, groups and aliases, skill selection, `--route` spec parsing, `AISKILLS_*` env parsing. |
| `src/test/cli.test.mjs` | `bin/aiskills.mjs` → `src/scripts/cli.mjs` (the `aiskills` command) and `src/scripts/postinstall.mjs`, run as real processes against a small fixture package. A stand-in `npx` placed first on `PATH` records every call and returns canned `list`, `find` and agent-list output, so the tests check the exact `npx skills` commands issued. |
| `src/test/packaging.test.mjs` | `npm run vendor` / `clean` and `npm pack --dry-run`: `skills/` is flat with a `SKILL.md` in every folder; mapped back through `layout.json`, the shipped files equal every git-tracked file under the repo's `skills/`, byte for byte (with `.gitignore` files renamed); `src/test/`, the vendor script, `docs/` and the scrolls files don't ship. |
| `src/test/e2e.test.mjs` | Skipped unless `AISKILLS_E2E=1`. Packs the package, installs it with `npm install -g` into a throwaway prefix and `HOME`, and drives the real `npx skills`: postinstall with a group, group and pattern installs, partial uninstall, `--nested` rebuilding the repo's folder exactly, `npx skills experimental_sync` from a project's `node_modules`, `--purge`. |

Every test works in a temporary folder with its own `HOME` and `AISKILLS_HOME`. The packaging and e2e tests use a temporary copy of the repo, so nothing is written into this folder or your real home folder. The CLI tests are skipped on Windows because the stand-in `npx` is a POSIX script, and `npm run test:e2e` uses POSIX syntax to set the variable.

npm never ships files named `.gitignore`/`.npmignore`. To get around this, the
vendor step renames them to `_gitignore`/`_npmignore` (in `skills/` and
`.aiskills/nested/`), and the installer renames them back when it writes to
`~/.config/sugatoray/aiskills/skills`.
