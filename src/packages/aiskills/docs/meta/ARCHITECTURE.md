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
    │   └── installer.mjs     all shared logic (no side effects on import)
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
| `pack/vendor-skills.mjs` | Turning the repo's nested `skills/` into the shipped layout | `vendor`, `clean`, `findRepoRoot` |
| `pack/skillsignore.mjs` | `.skillsignore` rules (`.gitignore` syntax) | `parseIgnore`, `isIgnored` |
| `installer.mjs` – sync | The install folder and its layout | `syncSkills`, `resolveLayout`, `installRoot`, `packageLayout` |
| `installer.mjs` – skills | Reading skill names and groups | `readSkillName`, `skillNamesIn`, `packageSkillNames`, `loadGroups` |
| `installer.mjs` – selection | Turning `-s`/`-G`/`-a` into exact names | `globToRegExp`, `expandPatterns`, `skillsForGroups`, `selectedSkills`, `knownAgents`, `expandAgents` |
| `installer.mjs` – `npx skills` | Every call to the `skills` CLI | `runSkills` (the only place `npx` is started; pins `skills@SKILLS_CLI_VERSION`, checks Windows shell characters), `skillsAdd`, `skillsRemove`, `listInstalled`, `installedFromRoot`, `isFromRoot` |
| `installer.mjs` – routing | External skills (`--route`) | `isSourceSpec`, `specSkillName`, `findSkill` (drops results failing `isSafeRegistrySpec`), `resolveExternal` (marks `lookedUp`), `confirm` (the `[y/N]` prompt), `skillsAddExternal` |
| `installer.mjs` – guards | Not damaging what isn't ours | `assertInstallFolder` (used by `syncSkills`, `purgeRoot`, and `uninstall --purge` up front) |
| `cli.mjs` | Commands, aliases, options, help | `main`, `parse`, `uninstall`, `installed`, `groups` |
| `docs/build-skills-docs.mjs` | The Skills pages, from what the package really ships | `bundled` (vendors into a temp folder), `render`, `frontmatter` |
| `docs/build-docs-html.mjs` | `docs/docsite/index.html` | `collect` (tabs from the landing page's `### Section` lists), `bannerParts`, `skinMenuHtml`, `build` |
| `docs/create-banner.mjs` | The banner page and `banner_2x.png` | `parseConfig`, `resolveValues` ("auto" values), `render`, `renderPng`, `addPngText` |
| `docs/themes.mjs` | The 11 themes (default first) | `THEMES`, `DEFAULT_THEME`, `pageSkinCss`, `bannerSkinCss`, `fontsHref` |

The `installer.mjs` and `cli.mjs` rows are `core/`. All
`docs/` builders write only under `docs/`; `src/scripts/README.md` has the
same map in short.

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
aiskills.json                        { package, version, layout, stats?, installedAt, skills }
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
<repo>/.claude-plugin/marketplace.json ──────▶ copied as is
(the package's LICENSE, Apache-2.0, is committed in the package folder; the repo's MIT LICENSE isn't copied)
```

While walking `skills/`, `vendor()` loads each folder's `.skillsignore` (outer
rules first) and skips matching files and folders; an ignored folder is never
entered. It refuses a skill inside another skill, two skills with the same
name, names that aren't safe folder names, and a `.skillsignore` that ignores
a `SKILL.md` but not its folder. Skills are copied file by file from the
filtered list.

### `aiskills install`

`npm install` runs nothing: the package has no install-time scripts. This
flow starts only when the user runs `aiskills install`.

```text
parse options ─▶ syncSkills(layout) ─▶ selectedSkills(-s, -G) ─▶ expandAgents(-a)
             ─▶ [--route: resolveExternal() for names not bundled — all lookups first]
             ─▶ [found by a lookup: list them, then confirm() [y/N] in a terminal, or -y;
                 no terminal and no -y: stop. Pinned owner/repo@skill skips this.]
             ─▶ npx skills add <install folder> --skill … --agent … --yes   (-n: print it instead)
             ─▶ [--route: npx skills add <owner/repo@skill> … for each external]
             ─▶ [bundled install succeeded, resolveStats() on: countInstall() —
                 a detached node process runs npx skills add sugatoray/aiskills --skill …
                 in a new temp folder (the skills.sh install count), then deletes it;
                 failures are swallowed; -n prints it instead]
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

### Docs and banner (`npm run docs`)

```text
docs/banner/config.yaml + templates/banner-template.html + themes.mjs
        ──create-banner──▶ docs/banner/aiskills-banner.html  (──banner:png──▶ banner_2x.png, with theme + page SHA-256 in tEXt)
<repo>/skills (vendored to a temp folder)
        ──build-skills-docs──▶ docs/docsite/skills/*.md + the landing page's Skills list
docs/docsite/*.md  ──build_llms_txt.py (create-lib-docs)──▶ llms.txt, llms-full.txt
docs/docsite/*.md + images/*.svg + templates/docs-template.html + themes.mjs + the banner's markup/CSS
        ──build-docs-html──▶ docs/docsite/index.html
```

Every output is committed and generated: the tests rebuild each one in memory
(or check the PNG's fingerprint) and fail when the committed copy is stale.

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
| No install step (`postinstall`); `aiskills install` does the work (AIS-7) | Installing a package that changes agents' instructions should be explicit. Install scripts are skipped by pnpm, bun and `--ignore-scripts` and their output is hidden by npm 7+, so they failed silently for many users; they also get the package flagged by scanners. Tested: no `preinstall`/`install`/`postinstall`/`prepare` script. |
| Count installs on skills.sh by re-running the real CLI against GitHub, in the background | `npx skills add <local folder>` sends no install event. Running `npx skills add sugatoray/aiskills` in a throwaway temp folder lets the official CLI send its own event (only for a public repo, after its own checks), instead of `aiskills` calling skills.sh's undocumented endpoint. It needs github.com, so it fails silently behind a firewall; detached, so the install doesn't wait. Off with `--no-stats` (remembered), `AISKILLS_STATS=0`, `DO_NOT_TRACK`, `DISABLE_TELEMETRY`, CI. |
| Validate and look up everything before installing | A bad name or ambiguous registry match changes nothing. |
| Confirm skills a lookup found; never assume yes without a terminal | A unique exact match is still the registry's choice of third-party code. Showing it and asking `[y/N]` (default no) lets the user check the source; scripts must opt in with `-y` or pin `owner/repo@skill`. Pinned specs aren't asked: the user named the source. |
| Strip `npm_*` env before `npx` | Run through `npx @sugatoray-ai/aiskills` or `npm exec`, npm's variables can make the nested `npx` resolve into the wrong prefix. |
| Parse `npx skills` text for the agent list and `find` | `skills` has no machine-readable form for these; both fail loudly if the format changes. `list --json` is used everywhere else. |
| No runtime dependencies | Smaller attack surface and faster installs. |
| Pin the `skills` CLI version | A new `skills` release must be tested before users get it. |
| Treat registry text as untrusted | `npx skills find` output decides what gets installed and, on Windows, passes through `cmd.exe`. |
| Refuse to replace or delete a non-aiskills folder | `AISKILLS_HOME` can point anywhere; `aiskills.json` marks folders we own. |
| Code folders by when it runs: `core/`, `pack/`, `docs/` | Only `core/` ships; imports point down (`docs/` → `pack/` → `core/`), so nothing published can depend on build tooling. Tested. |
| `"files"` lists exact paths, root docs with a leading `/` | A plain `README.md` matches at any depth and would publish `src/scripts/README.md`; `.npmignore` can't undo a `"files"` match. |
| Docs generated from the code and the skills, and tested against them | Reference pages, examples, Skills pages and `index.html` can't drift: `npm test` fails first. |
| One themes list for the docs page and the banner | Both gear menus, the page CSS and the banner CSS come from `themes.mjs`; contrast is tested from its values. |
| Fingerprint `banner_2x.png` instead of comparing pixels | Rendering varies across machines; the theme and source-page SHA-256 in PNG `tEXt` chunks make staleness exact. |

See [`../../SECURITY.md`](../../SECURITY.md) for the security side of these.
