# Features

Every feature of `@sugatoray-ai/aiskills`, in one place, with where it's
documented and tested. The user guide is [`docs/docsite/`](../docsite/README.md)
(the package [README](../../README.md) is the overview); release history is in
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
`AISKILLS_SKILLS_VERSION` (the `skills` CLI version `npx` runs; pinned by default).

## Feature list

| Feature | Summary | User docs | Tests |
| --- | --- | --- | --- |
| License | Package Apache-2.0 (`LICENSE`, `package.json`); each bundled skill keeps its `SKILL.md` license (MIT); a generated License page with a table of both | [License](../docsite/license.md) | `packaging.test.mjs`, `docs-skills.test.mjs` |
| Bundled skills | All repo skills ship flat, with `.aiskills/layout.json` + `nested/` keeping the original layout | [How it works](../docsite/concepts/how-it-works.md), [Layouts](../docsite/concepts/layouts.md) | `packaging.test.mjs` |
| No install step | `npm install` runs no script; `aiskills install` (or `npx @sugatoray-ai/aiskills install`) saves and registers the skills; `AISKILLS_*` variables set defaults | [Installation](../docsite/getting-started/installation.md), [Set default choices](../docsite/guides/set-defaults.md), [Security model](../docsite/concepts/security.md) | `packaging.test.mjs`, `cli.test.mjs` → no install step, `e2e.test.mjs` |
| Project dependency + `experimental_sync` | Flat `skills/` lets `npx skills experimental_sync` install from `node_modules` | [Use with `experimental_sync`](../docsite/guides/use-experimental-sync.md) | `e2e.test.mjs` |
| Scope, agents, skills | `-g`/`-p`, `-a`, `-s`, `--copy`, `--` passthrough | [CLI reference](../docsite/reference/cli.md#options), [Tutorial 2–3](../docsite/tutorial/02-pick-skills-and-agents.md) | `cli.test.mjs` |
| Uninstall | Full / partial / per agent / per project, `--purge`, `--dry-run`, `--force` | [Tutorial 5](../docsite/tutorial/05-uninstall.md), [Remove everything](../docsite/guides/remove-everything.md) | `cli.test.mjs`, `e2e.test.mjs` |
| Skill groups | From `marketplace.json`; name or alias (minus `-skills`); `all` | [Skill groups](../docsite/concepts/skill-groups.md), [Bundled skills](../docsite/skills/README.md) | `unit.test.mjs`, `cli.test.mjs` |
| Glob patterns | `*`, `?`, `[abc]`, `[a-z]`, `[!abc]` for `-s`, `-G`, `-a` | [Patterns reference](../docsite/reference/patterns.md) | `unit.test.mjs`, `cli.test.mjs` |
| External skills (`--route`, `aix`) | Registry lookup with unique-exact-match rule, then a `[y/N]` confirmation of what was found (`-y` to pre-confirm; stops without a terminal); `install -n` preview; pinned specs skip both; any-source uninstall | [Bundled and external skills](../docsite/concepts/bundled-and-external.md), [Tutorial 4](../docsite/tutorial/04-add-external-skills.md) | `cli.test.mjs` |
| `.skillsignore` | `.gitignore`-style rules under `skills/` keep files, folders or skills out of the package | [`.skillsignore` reference](../docsite/reference/skillsignore.md), [Leave files out](../docsite/guides/leave-files-out.md) | `skillsignore.test.mjs`, `packaging.test.mjs` |
| Layouts (`--flat` / `--nested`) | Flat default; nested rebuilds the repo byte for byte (minus `.skillsignore`d files); remembered | [Layouts](../docsite/concepts/layouts.md), [Keep the nested layout](../docsite/guides/keep-the-nested-layout.md) | `cli.test.mjs`, `unit.test.mjs`, `e2e.test.mjs` |
| Short commands | `ais`, `aix`, and aliases `i`, `r`, `ls`, `g`, `f`, `p`, `h` | [CLI reference](../docsite/reference/cli.md#commands) | `cli.test.mjs`, `e2e.test.mjs` |
| Safety checks | Pinned `skills` CLI; unsafe registry results ignored; no shell characters to `cmd.exe`; only aiskills folders replaced or purged | [SECURITY.md](../../SECURITY.md), [Security model](../docsite/concepts/security.md) | `cli.test.mjs`, `unit.test.mjs` |
| `npx skills` passthrough | `aiskills skills <args>` with `:root` | [Run any `npx skills` command](../docsite/guides/run-npx-skills-directly.md) | `cli.test.mjs` |
| Themes | 11 themes (light and dark) for the docs page and the banner, chosen with a gear menu and remembered per browser; default Lights Out; one list in `src/scripts/docs/themes.mjs` | [FAQ](../docsite/faq.md#how-do-i-change-how-these-docs-look), [docs/banner/README.md](../banner/README.md#themes) | `themes.test.mjs`, `docs-html.test.mjs`, `banner.test.mjs` |
| Banner | README image and docs landing-page banner from `docs/banner/config.yaml`, with an in-browser editor and PNG export; the PNG is fingerprinted so a stale one fails the tests (not published) | [docs/banner/README.md](../banner/README.md) | `banner.test.mjs`, `docs-html.test.mjs` |
| User documentation | Tutorial, guides, concepts, full reference, FAQ, `llms.txt`, a generated page per bundled skill, and a single-page HTML (`index.html`), in `docs/docsite/` (not published) | [docs/docsite/](../docsite/README.md) | `docs.test.mjs`, `docs-skills.test.mjs`, `docs-html.test.mjs` |
| Code layout | `src/scripts/core/` (published), `pack/` (`npm pack`), `docs/` (docs and banner), imports pointing down only | [src/scripts/README.md](../../src/scripts/README.md) | `packaging.test.mjs` |

## Not features (on purpose)

- Installing anything as a Claude Code plugin. `marketplace.json` is read only
  for grouping.
- Picking one of several registry matches for a bare name under `--route`.
- Installing a skill a registry lookup found without the user's confirmation (`y` at the prompt, or `-y`).
- Removing external skills in a full uninstall.
- Single-letter aliases `s`, `l`, `u` (ambiguous; see MAINTAINERS).

## Planned or under discussion

See the backlog in [`../.scrolls/PLAN.md`](../.scrolls/PLAN.md), e.g. whether
`npm install` should keep running the install (AIS-7), and known gaps in
[`../.scrolls/GAP_ANALYSIS.md`](../.scrolls/GAP_ANALYSIS.md).
