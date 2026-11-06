# @sugatoray-ai/aiskills

All of the agent skills from [sugatoray/aiskills](https://github.com/sugatoray/aiskills)
(scrolls, stata, personas, newsletters, diagrams, docs, development), packaged
for npm. The repo's `skills/` folder ships inside the package unchanged.

## Install

```sh
npm install -g @sugatoray-ai/aiskills
```

During install, the `postinstall` hook:

1. saves the skills to **`~/.config/sugatoray/aiskills/skills/`** and replaces any copy that's already there, and
2. runs `npx skills add ~/.config/sugatoray/aiskills --global --skill '*' --yes`,
   which registers every skill with the agents it detects (Claude Code, Codex, …).

If step 2 fails (for example, offline or `--ignore-scripts`), the npm install
still succeeds. Run step 2 again with:

```sh
npx @sugatoray-ai/aiskills install        # or: aiskills install
```

## CLI

```text
aiskills install   [-g|-p] [-a agents] [-s skills] [-G groups] [--copy] [-- <extra npx skills args>]
aiskills uninstall [-g|-p] [-a agents] [-s skills] [-G groups] [--purge] [-f] [-n] [-- <extra args>]
aiskills installed [-g|-p]   # skills currently installed from ~/.config/sugatoray/aiskills
aiskills groups [--json]     # skill groups and the skills in each
aiskills skills <args...>    # passthrough to `npx skills`; `:root` = ~/.config/sugatoray/aiskills
aiskills sync                # only refresh ~/.config/sugatoray/aiskills/skills
aiskills list                # list the skills available in the saved folder
aiskills path                # print ~/.config/sugatoray/aiskills
```

Install examples:

```sh
aiskills install -a claude-code,codex          # only these agents
aiskills install -s scrolls-setup,scrolls-help # only these skills
aiskills install --project                     # into the current project
aiskills install --group scrolls --global --agent claude-code
```

## Skill groups

The package bundles the repo's `.claude-plugin/marketplace.json` and saves it
to `~/.config/sugatoray/aiskills/.claude-plugin/marketplace.json`, next to
`skills/`. The CLI reads that file only to group the skills. Nothing is
installed as a Claude Code plugin; installs still go through `npx skills add`.

Each plugin entry in the file is a group. Its skills are the `SKILL.md` files
under the entry's `source` folder.

```sh
aiskills groups
```

| Group | Alias | Skills |
| --- | --- | --- |
| `scrolls-skills` | `scrolls` | scrolls-setup, -update, -hide, -unhide, -remove, -restore, -help |
| `stata-skills` | `stata` | stata-recipes |
| `repo-related-skills` | `repo-related` | create-issues-update-pr |
| `docs-skills` | `docs` | create-lib-docs |
| `diagrams-skills` | `diagrams` | network-flow |
| `personas-skills` | `personas` | prodigy |
| `all` | | every skill, including ones in no group (e.g. newsletter-ai) |

You can give a group by its full name or its alias (the name without
`-skills`), in any letter case. `-G/--group` takes a comma-separated list, can
be repeated, and combines with `-s`:

```sh
aiskills install --group scrolls --global --agent claude-code
aiskills install -G scrolls,personas -s newsletter-ai -a claude-code,codex
aiskills install -G stata --project
aiskills uninstall -G scrolls          # remove a whole group
```

The groups update automatically whenever a new plugin entry is added to the
repo's `marketplace.json` and the package is republished.

## Uninstall

`aiskills uninstall` calls `npx skills remove ... --yes`.

- **Full uninstall** (no `-s`): removes every skill that `npx skills list`
  says was installed from `~/.config/sugatoray/aiskills`. Skills with the same
  name from other sources aren't touched.
- **Partial uninstall** (`-s a,b` and/or `-G group`): removes only the named
  skills, or every installed skill in the named groups. Names this
  package doesn't provide are rejected unless you pass `-f/--force`.
- **Per agent** (`-a codex`): unlinks the skills from those agents only.
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
| `AISKILLS_AGENTS` | Comma-separated agent list passed as `--agent` |
| `AISKILLS_SKILLS` | Comma-separated skill list passed as `--skill` (default: all) |
| `AISKILLS_GROUPS` | Comma-separated skill groups (combined with `AISKILLS_SKILLS`) |
| `AISKILLS_COPY=1` | Pass `--copy` to `npx skills add` |
| `AISKILLS_SKIP_SKILLS_ADD=1` | Postinstall saves the files but skips `npx skills add` (also skipped when `CI` is set) |
| `AISKILLS_SKIP_POSTINSTALL=1` | Skip the postinstall hook entirely |

## Maintainers: building & publishing

The package source lives in `src/aiskills/` of the repo. The skills are **not**
committed here. `prepack` (`scripts/vendor-skills.mjs`) copies `<repo>/skills`,
`<repo>/.claude-plugin/marketplace.json` and `LICENSE` into this folder right
before `npm pack` / `npm publish`.

```sh
cd src/aiskills
npm run vendor        # optional: vendor locally to inspect
npm run pack:dry      # list what will ship
npm version patch     # bump the version
npm publish           # prepack re-vendors the skills automatically
npm run clean         # remove the vendored copy
```

npm never ships files named `.gitignore`/`.npmignore`. To get around this, the
vendor step renames them to `_gitignore`/`_npmignore`, and the installer
renames them back when it writes to `~/.config/sugatoray/aiskills/skills`.
