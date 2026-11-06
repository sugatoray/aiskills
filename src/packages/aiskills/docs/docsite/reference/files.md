# Files and schemas reference

What `aiskills` writes and where, and the exact fields of every file and JSON output it produces or reads; this page is exhaustive.

## The install folder

`~/.config/sugatoray/aiskills/` (or [`AISKILLS_HOME`](environment.md#aiskills_home)), written by every sync (`install`, `sync`, `list`, `groups` and the npm install step):

```text
~/.config/sugatoray/aiskills/
├── aiskills.json                     marks the folder as an aiskills folder; last sync
├── skills/                           the skills, flat or nested; replaced on every sync
├── .aiskills/layout.json             each skill's original folder
└── .claude-plugin/marketplace.json   the repo's marketplace file, used for groups
```

`skills/` is built in a temporary `.skills.tmp-<pid>` folder next to it, then swapped in.

## `aiskills.json`

```json
{
  "package": "@sugatoray-ai/aiskills",
  "version": "0.2.0",
  "layout": "flat",
  "installedAt": "2026-11-06T10:26:01.152Z",
  "skills": "/home/me/.config/sugatoray/aiskills/skills"
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `package` | string | Always `@sugatoray-ai/aiskills`. Its presence is what makes a folder safe for `aiskills` to replace or delete. |
| `version` | string | The package version that wrote the folder. |
| `layout` | `"flat"` \| `"nested"` | The layout of `skills/`, reused by the next sync unless overridden. |
| `installedAt` | string (ISO 8601) | When the folder was last synced. |
| `skills` | string (absolute path) | The `skills/` folder. |

## `.aiskills/layout.json`

Written when the package is built, and copied to the install folder.

```json
{
  "format": 1,
  "description": "skills/ is flat (skills/<name>/). …",
  "skills": {
    "create-lib-docs": "docs/create-lib-docs",
    "scrolls-setup": "scrolls/scrolls-setup"
  },
  "extras": ["scrolls/README.md", "scrolls/.claude-plugin/plugin.json"],
  "ignored": []
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `format` | number | Version of this file's shape; currently `1`. |
| `description` | string | A note for people reading the file. |
| `skills` | object: skill name → string | Each skill's original folder, relative to the repo's `skills/`. Used for `--nested` and for groups. |
| `extras` | string[] | Files outside any skill folder (READMEs, `plugin.json`, `meta/`), stored in the package under `.aiskills/nested/` at these paths. |
| `ignored` | string[] | Paths a `.skillsignore` left out of the package. Folders end with `/`. |

## The package

```text
@sugatoray-ai/aiskills/
├── bin/aiskills.mjs, bin/aix.mjs     the commands (aiskills and ais share one file)
├── src/scripts/                      cli.mjs, installer.mjs, postinstall.mjs
├── skills/<skill>/                   the skills, flat
├── .aiskills/layout.json, .aiskills/nested/
├── .claude-plugin/marketplace.json
└── README.md, CHANGELOG.md, SECURITY.md, LICENSE, package.json
```

Files named `.gitignore` and `.npmignore` inside the skills are stored as `_gitignore` and `_npmignore`, because npm drops the real names; every sync renames them back. The package has no JavaScript API: only the commands are public.

## `aiskills groups --json`

```json
{
  "groups": [
    {
      "name": "scrolls-skills",
      "alias": "scrolls",
      "description": "Scrolls: a git-native markdown system …",
      "skills": ["scrolls-help", "scrolls-hide", "…"]
    }
  ],
  "ungrouped": ["newsletter-ai"]
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `groups[].name` | string | The group name from `marketplace.json`. |
| `groups[].alias` | string | The name without a trailing `-skills`. |
| `groups[].description` | string | From `marketplace.json`; may be empty. |
| `groups[].skills` | string[] | Skill names, sorted. |
| `ungrouped` | string[] | Bundled skills in no group, sorted. |

## `npx skills list --json` rows

`aiskills` reads these (from `npx skills list --json [--global]`) to know what is installed. It never writes them. Fields as reported by `skills@1.7.6`:

| Field | Type | Used for |
| --- | --- | --- |
| `name` | string | The skill name. |
| `source` | string | Where it was installed from: a folder path, or `owner/repo`. |
| `sourceType` | string | `local` for a folder, `github` for GitHub. |
| `scope` | string | `global` or `project`. |
| `agents` | string[] | Agents it's installed for, as display names such as `Claude Code` (shown by `installed`). |
| `path`, `sourceUrl`, `status` | string | Also present in `skills@1.7.6`; not used by `aiskills`. |

A row is **from this package** when `sourceType` is `local` and `source` is the install folder.

## Written by `npx skills`

The agents' skill folders (`~/.claude/skills/`, `~/.agents/skills/`, …, or the project's with `-p`) and `npx skills`' own records, such as a project's `skills-lock.json`. `aiskills` doesn't touch them directly.

See also: [How aiskills works](../concepts/how-it-works.md) · [Layouts](../concepts/layouts.md)
