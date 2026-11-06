# Features

Every feature of `@sugatoray-ai/aiskills`, in one place, with where it's
documented and tested. The user guide is the package
[README](../../README.md); release history is in
[CHANGELOG.md](../../CHANGELOG.md).

## Commands

| Command | Alias | What it does |
| --- | --- | --- |
| `aiskills install` | `i` | Save the skills to the install folder and run `npx skills add` on it. The default command. |
| `aiskills uninstall` | `r`, `rm`, `remove` | Remove skills installed from the install folder with `npx skills remove`. |
| `aiskills installed` | `ls` | List skills installed from the install folder (all sources with `--route`). |
| `aiskills groups [--json]` | `g` | List skill groups and their skills. |
| `aiskills find <query>` | `f` | Search the skills registry (`npx skills find`). |
| `aiskills sync` | | Refresh the install folder only; agents are not touched. |
| `aiskills list` | | List the skills available in the install folder. |
| `aiskills path` | `p` | Print the install folder. |
| `aiskills skills <args>` | | Pass `<args>` to `npx skills`; `:root` becomes the install folder. |
| `aiskills help` | `h`, `-h`, `--help` | Show help. |
| `aiskills --version` | `-v` | Show the version. |

The whole CLI is also available as **`ais`** (identical) and **`aix`**
(identical to `aiskills --route`).

## Options

| Option | Commands | Effect | Env default |
| --- | --- | --- | --- |
| `-g`, `--global` | install, uninstall, installed | User-level scope (default) | `AISKILLS_SCOPE=global` |
| `-p`, `--project` | install, uninstall, installed | Current project instead | `AISKILLS_SCOPE=project` |
| `-a`, `--agent <names>` | install, uninstall | Agents; names or patterns; default: auto-detect | `AISKILLS_AGENTS` |
| `-s`, `--skill <names>` | install, uninstall | Skills; names or patterns; default: all | `AISKILLS_SKILLS` |
| `-G`, `--group <names>` | install, uninstall | Groups; names, aliases, patterns or `all` | `AISKILLS_GROUPS` |
| `--copy` | install | Copy into agent folders instead of linking | `AISKILLS_COPY=1` |
| `--route` | install, uninstall, installed | Hand skills that aren't bundled to `npx skills` | `AISKILLS_ROUTE=1` |
| `--nested`, `--flat` | install, sync | Layout of the install folder | `AISKILLS_LAYOUT` |
| `--purge` | uninstall | Also delete the install folder (full uninstall only) | |
| `-f`, `--force` | uninstall | Allow names the package doesn't provide | |
| `-n`, `--dry-run` | uninstall | Print the `npx skills` command only | |
| `--json` | groups | Machine-readable output | |
| `-- <args>` | install, uninstall | Append `<args>` to the `npx skills` command | |

`--route`, `--nested` and `--flat` may also come **before** the command
(`aiskills --nested i`). `-s`, `-G` and `-a` can be repeated; their values
add up. Command-line values replace the env defaults.

Other environment variables: `AISKILLS_HOME` (install folder),
`AISKILLS_SKILLS_VERSION` (the `skills` CLI version `npx` runs; pinned by default),
`AISKILLS_SKIP_POSTINSTALL=1`, `AISKILLS_SKIP_SKILLS_ADD=1` (also implied by
`CI`).

## Feature list

| Feature | Summary | User docs | Tests |
| --- | --- | --- | --- |
| Bundled skills | All repo skills ship flat, with `.aiskills/layout.json` + `nested/` keeping the original layout | README intro, Maintainers | `packaging.test.mjs` |
| Install on `npm install -g` | `postinstall` saves the skills and runs `npx skills add`; never fails the install | README "Install" | `cli.test.mjs` → postinstall |
| Project dependency + `experimental_sync` | Flat `skills/` lets `npx skills experimental_sync` install from `node_modules` | README "As a project dependency" | `e2e.test.mjs` |
| Scope, agents, skills | `-g`/`-p`, `-a`, `-s`, `--copy`, `--` passthrough | README "CLI" | `cli.test.mjs` |
| Uninstall | Full / partial / per agent / per project, `--purge`, `--dry-run`, `--force` | README "Uninstall" | `cli.test.mjs`, `e2e.test.mjs` |
| Skill groups | From `marketplace.json`; name or alias (minus `-skills`); `all` | README "Skill groups" | `unit.test.mjs`, `cli.test.mjs` |
| Glob patterns | `*`, `?`, `[abc]`, `[a-z]`, `[!abc]` for `-s`, `-G`, `-a` | README "Patterns" | `unit.test.mjs`, `cli.test.mjs` |
| External skills (`--route`, `aix`) | Registry lookup with unique-exact-match rule; pinned specs; any-source uninstall | README "`--route`" | `cli.test.mjs` |
| `.skillsignore` | `.gitignore`-style rules under `skills/` keep files, folders or skills out of the package | README "Leaving files out" | `skillsignore.test.mjs`, `packaging.test.mjs` |
| Layouts (`--flat` / `--nested`) | Flat default; nested rebuilds the repo byte for byte (minus `.skillsignore`d files); remembered | README "Layouts" | `cli.test.mjs`, `unit.test.mjs`, `e2e.test.mjs` |
| Short commands | `ais`, `aix`, and aliases `i`, `r`, `ls`, `g`, `f`, `p`, `h` | README "Install", "CLI" | `cli.test.mjs`, `e2e.test.mjs` |
| Safety checks | Pinned `skills` CLI; unsafe registry results ignored; no shell characters to `cmd.exe`; only aiskills folders replaced or purged | [SECURITY.md](../../SECURITY.md) | `cli.test.mjs`, `unit.test.mjs` |
| `npx skills` passthrough | `aiskills skills <args>` with `:root` | README "Using `npx skills` directly" | `cli.test.mjs` |
| User documentation | Tutorial, guides, concepts, full reference, FAQ, `llms.txt`, a generated page per bundled skill, and a single-page HTML (`index.html`), in `docs/docsite/` (not published) | [docs/docsite/](../docsite/README.md) | `docs.test.mjs`, `docs-skills.test.mjs`, `docs-html.test.mjs` |

## Not features (on purpose)

- Installing anything as a Claude Code plugin. `marketplace.json` is read only
  for grouping.
- Picking one of several registry matches for a bare name under `--route`.
- Removing external skills in a full uninstall.
- Single-letter aliases `s`, `l`, `u` (ambiguous; see MAINTAINERS).

## Planned or under discussion

See the backlog in [`../.scrolls/PLAN.md`](../.scrolls/PLAN.md), e.g. whether
`npm install` should keep running the install (AIS-7), and known gaps in
[`../.scrolls/GAP_ANALYSIS.md`](../.scrolls/GAP_ANALYSIS.md).
