# Skill groups

A skill group is a named set of related skills, taken from the repo's `.claude-plugin/marketplace.json`; `-G` installs or removes a whole group at once.

## Where groups come from

The package bundles the repo's `.claude-plugin/marketplace.json` (the Claude Code plugin marketplace file) and saves it to the install folder. `aiskills` reads it only to group the skills. Nothing is installed as a Claude Code plugin.

| Part | Where it comes from |
| --- | --- |
| **Group name** | An entry's `name` under `plugins`, exactly as written, e.g. `scrolls-skills`. |
| **Skills in the group** | Every skill whose original folder in the repo is under the entry's `source` (relative to `metadata.pluginRoot`, `./skills`). |
| **Alias** | Not in the file. `aiskills` removes a trailing `-skills`: `scrolls-skills` → `scrolls`. A name without `-skills` is its own alias. |
| **`all`** | Not in the file. A built-in group with every bundled skill, grouped or not. `-G '*'` is the same. |

Entries whose `source` isn't a local folder (a git URL, say) are skipped, because their skills aren't in the package.

## The groups in this version

| Group | Alias | Skills |
| --- | --- | --- |
| `scrolls-skills` | `scrolls` | scrolls-help, scrolls-hide, scrolls-remove, scrolls-restore, scrolls-setup, scrolls-unhide, scrolls-update |
| `stata-skills` | `stata` | stata-recipes |
| `repo-related-skills` | `repo-related` | create-issues-update-pr |
| `docs-skills` | `docs` | create-lib-docs |
| `diagrams-skills` | `diagrams` | network-flow |
| `personas-skills` | `personas` | prodigy |
| `all` (built in) | | all 12 skills |

Every bundled skill is in a group. A skill in no group would be listed as ungrouped and installed with `-s <name>` or `-G all`. `aiskills groups` always shows the list for the version you have.

## How names are matched

- Name or alias, in any letter case: `scrolls-skills`, `scrolls` and `Scrolls` are the same group.
- Patterns match both the name and the alias: `-G 'd*'` selects `docs-skills` and `diagrams-skills`.
- A name or pattern that matches no group stops the command and lists the valid ones.
- `-G` and `-s` add up: you get the union.

## Why membership uses the original folders

The install folder can be [flat or nested](layouts.md). Group membership is worked out from each skill's original folder, recorded in `.aiskills/layout.json`, so a group has the same skills in either layout.

## Adding a group

For maintainers: add a `plugins` entry to the repo's `.claude-plugin/marketplace.json` whose `source` is a folder under `skills/`, and publish a new package version. No code changes.

See also: [`groups`](../reference/cli.md#groups) · [`-G`, `--group`](../reference/cli.md#-g---group---groups) · [1. Install a group](../tutorial/01-install-a-group.md)
