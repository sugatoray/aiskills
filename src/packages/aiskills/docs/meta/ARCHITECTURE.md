# Architecture

How `@sugatoray-ai/aiskills` is built: the parts, the data each one owns, and
how a command flows through them. For what it does, see
[FEATURES.md](FEATURES.md); for how to work on it, see
[MAINTAINERS.md](MAINTAINERS.md).

## The idea in one paragraph

The package is a thin layer over the [`skills`](https://www.npmjs.com/package/skills)
CLI. It **ships** the repo's skills (flattened, with enough metadata to rebuild
the original layout), **saves** them to a fixed local folder
(`~/.config/sugatoray/aiskills`), and then **asks `npx skills`** to install,
list and remove them. `aiskills` never copies skills into agent folders
itself; `npx skills` does that, and records each skill's source, which
`aiskills` reads back to know what it installed.

## Parts

```text
src/packages/aiskills/
├── bin/aiskills.mjs          entry point for `aiskills` and `ais`
├── bin/aix.mjs               entry point for `aix`: sets AISKILLS_ROUTE=1, then loads the CLI
└── src/scripts/
    ├── README.md             what each folder is for, and the import rule
    ├── core/                 what ships: the runtime code
    │   ├── cli.mjs           argument parsing and the commands
    │   ├── installer.mjs     all shared logic (no side effects on import)
    │   └── postinstall.mjs   npm postinstall hook
    ├── pack/                 packaging, run at npm pack (not published)
    │   ├── vendor-skills.mjs prepack: builds the shipped skills/ and .aiskills/
    │   └── skillsignore.mjs  .skillsignore parser/matcher
    └── docs/                 docs and banner builders (not published)
        ├── build-skills-docs.mjs, build-docs-html.mjs, create-banner.mjs, themes.mjs
        └── templates/        docs-template.html, banner-template.html
```

Imports only point down: `docs/` may use `pack/` and `core/`, `pack/` may use `core/`, and `core/` uses neither (it ships on its own). `packaging.test.mjs` checks this.

| Module | Owns | Main functions |
| --- | --- | --- |
| `vendor-skills.mjs` | Turning the repo's nested `skills/` into the shipped layout | `vendor`, `clean`, `findRepoRoot` |
| `skillsignore.mjs` | `.skillsignore` rules (`.gitignore` syntax) | `parseIgnore`, `isIgnored` |
| `installer.mjs` – sync | The install folder and its layout | `syncSkills`, `resolveLayout`, `installRoot`, `packageLayout` |
| `installer.mjs` – skills | Reading skill names and groups | `readSkillName`, `skillNamesIn`, `packageSkillNames`, `loadGroups` |
| `installer.mjs` – selection | Turning `-s`/`-G`/`-a` into exact names | `globToRegExp`, `expandPatterns`, `skillsForGroups`, `selectedSkills`, `knownAgents`, `expandAgents` |
| `installer.mjs` – `npx skills` | Every call to the `skills` CLI | `runSkills` (the only place `npx` is started; pins `skills@SKILLS_CLI_VERSION`, checks Windows shell characters), `skillsAdd`, `skillsRemove`, `listInstalled`, `installedFromRoot`, `isFromRoot` |
| `installer.mjs` – routing | External skills (`--route`) | `isSourceSpec`, `specSkillName`, `findSkill` (drops results failing `isSafeRegistrySpec`), `resolveExternal`, `skillsAddExternal` |
| `installer.mjs` – guards | Not damaging what isn't ours | `assertInstallFolder` (used by `syncSkills`, `purgeRoot`, and `uninstall --purge` up front) |
| `cli.mjs` | Commands, aliases, options, help | `main`, `parse`, `uninstall`, `installed`, `groups` |
| `postinstall.mjs` | What `npm install` does | `main` (reads only `AISKILLS_*` env) |

`installer.mjs` has no side effects when imported, so the tests import it
directly. `cli.mjs` runs `main()` on import, which is why the entry points in
`bin/` stay separate.

## Data and where it lives

### In the published package

```text
skills/<skill-name>/...              flat: one folder per skill (named after SKILL.md name:)
.aiskills/layout.json                { format, skills: { name: "group/.../name" }, extras: [paths], ignored: [paths] }
.aiskills/nested/<original paths>    files outside any skill folder (READMEs, plugin.json, meta/)
.claude-plugin/marketplace.json      the repo's plugin marketplace file, used only for groups
```

`.gitignore`/`.npmignore` files are stored as `_gitignore`/`_npmignore`,
because npm drops the real names.

### In the install folder (`~/.config/sugatoray/aiskills`, or `AISKILLS_HOME`)

```text
skills/                              flat (default) or nested (the repo's exact layout)
.aiskills/layout.json                copied from the package
.claude-plugin/marketplace.json      copied from the package
aiskills.json                        { package, version, layout, installedAt, skills }
```

### Owned by `npx skills` (read, never written, by aiskills)

- The agents' skill folders (`~/.agents/skills/`, `~/.claude/skills/`, …).
- Its records of what is installed, read with `npx skills list --json`.
  A row whose `sourceType` is `local` and whose `source` is the install folder
  was installed by `aiskills` (`isFromRoot`).

## Flows

### Packing (`npm pack` / `npm publish`)

```text
<repo>/skills/<group>/<skill>/...  ──vendor()──▶  skills/<skill>/...
<repo>/skills/<group>/README.md    ──────────▶  .aiskills/nested/<group>/README.md
                                   ──────────▶  .aiskills/layout.json
<repo>/.claude-plugin/marketplace.json, LICENSE ──▶ copied as is
```

While walking `skills/`, `vendor()` loads each folder's `.skillsignore` (outer
rules first) and skips matching files and folders; an ignored folder is never
entered. It refuses a skill inside another skill, two skills with the same
name, names that aren't safe folder names, and a `.skillsignore` that ignores
a `SKILL.md` but not its folder. Skills are copied file by file from the
filtered list.

### `aiskills install` (and `postinstall`)

```text
parse options ─▶ syncSkills(layout) ─▶ selectedSkills(-s, -G) ─▶ expandAgents(-a)
             ─▶ [--route: resolveExternal() for names not bundled — all lookups first]
             ─▶ npx skills add <install folder> --skill … --agent … --yes
             ─▶ [--route: npx skills add <owner/repo@skill> … for each external]
```

### `aiskills uninstall`

```text
npx skills list --json ─▶ keep rows from the install folder (or any source with --route)
                       ─▶ match -s / -G / patterns against them
                       ─▶ npx skills remove <names> --yes  ─▶ [--purge: delete the install folder]
```

A full uninstall (no `-s`/`-G`) only ever removes rows whose source is the
install folder.

### Groups

`loadGroups()` reads `marketplace.json`. For each plugin entry it takes the
`source` folder (relative to `metadata.pluginRoot`, normally `./skills`) and
collects the skills whose **original** folder in `layout.json` is under it.
This is why groups give the same result whether `skills/` is flat or nested.
Without `layout.json` it falls back to scanning `skills/` under the source.

### Layout choice

`resolveLayout()`: `--nested`/`--flat` > `AISKILLS_LAYOUT` > the `layout` in
`aiskills.json` > `flat`. `syncSkills()` builds the new folder in a staging
folder next to it, then swaps it in.

## Design decisions

| Decision | Why |
| --- | --- |
| Delegate all installs to `npx skills` | One tool owns the agents' folders and records; `aiskills` stays small and gets new agents for free. |
| Ship `skills/` flat | `npx skills experimental_sync` only looks one level deep in `node_modules` packages. |
| Keep `layout.json` + `nested/` | `--nested` can rebuild the repo exactly, and groups don't depend on the current layout. |
| Groups from `marketplace.json`, never plugins | Reuse the repo's existing grouping without installing Claude Code plugins. |
| `postinstall` never fails | A failed `npx` (offline, proxy) must not break `npm install`; `aiskills install` retries. |
| Validate and look up everything before installing | A bad name or ambiguous registry match changes nothing. |
| Strip `npm_*` env before `npx` | Inside `postinstall`, npm's variables make the nested `npx` resolve into the wrong prefix. |
| Parse `npx skills` text for the agent list and `find` | `skills` has no machine-readable form for these; both fail loudly if the format changes. `list --json` is used everywhere else. |
| No runtime dependencies | Smaller attack surface and faster installs. |
| Pin the `skills` CLI version | A new `skills` release must be tested before users get it. |
| Treat registry text as untrusted | `npx skills find` output decides what gets installed and, on Windows, passes through `cmd.exe`. |
| Refuse to replace or delete a non-aiskills folder | `AISKILLS_HOME` can point anywhere; `aiskills.json` marks folders we own. |

See [`../../SECURITY.md`](../../SECURITY.md) for the security side of these.
