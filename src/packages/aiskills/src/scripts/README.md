# src/scripts/

The code of `@sugatoray-ai/aiskills`, in three folders by when it runs and whether it ships.

| Folder | Runs | Published to npm |
| --- | --- | --- |
| [`core/`](#core) | On the user's machine: the `aiskills`, `ais` and `aix` commands (the package has no install step) | **Yes**, and nothing else from `src/` is |
| [`pack/`](#pack) | On a maintainer's machine, at `npm pack` / `npm publish`, and before a release (`npm run audit:skills`) | No |
| [`docs/`](#docs) | On a maintainer's machine, when building the docs and the banner | No |

## Rules

- **Imports point down only:** `docs/` → `pack/` → `core/`. `docs/` may import from `pack/` and `core/`, `pack/` may import from `core/`, and `core/` never imports from `pack/` or `docs/`, because it ships on its own and they don't. `src/test/packaging.test.mjs` fails if this is broken.
- **What is published** is the `"files"` list in `package.json`, which names the three `core/` files one by one (plus `bin/`, the vendored skills, and the root `/README.md`, `/CHANGELOG.md`, `/SECURITY.md` and `/LICENSE`, written with a leading `/` so a README in a subfolder, like this one, isn't published too). A new file in `core/` that the CLI needs must be added to that list; the packaging tests show what ships.
- **Where a new file goes:** code a user's machine runs → `core/`; code that builds the package → `pack/`; code that builds documentation, the banner or anything under `docs/` → `docs/`. If none fits, ask before adding a fourth folder.
- **Paths:** the scripts that need the package folder (`core/installer.mjs`, `pack/vendor-skills.mjs` and the three `docs/` builders) find it by going three levels up from their own folder; the others get it from `installer.mjs`. Moving a file to another depth means updating that.
- **Tests** live in `src/test/`, not here. Change behaviour test-first (Red/Green); `npm test` runs them all.

## `core/`

What ships. The entry points in `bin/` (`aiskills.mjs`, `aix.mjs`) only import `core/cli.mjs`.

| File | What it does |
| --- | --- |
| `cli.mjs` | The `aiskills` command: argument parsing, the commands and their aliases, `--help`. Runs `main()` on import. |
| `scan.mjs` | `aiskills scan`: finds the skills under a folder, stages them flat, and runs NVIDIA's SkillSpector on them (from `PATH`, else `uvx` at a pinned commit) in report-only or `--fail-on-findings` mode. |
| `installer.mjs` | All shared logic, with no side effects on import: saving skills to `~/.config/sugatoray/aiskills`, every `npx skills` call (`runSkills`, the only place `npx` starts, with the pinned `skills` version), groups, glob patterns, `--route`, and the install-folder guard. |

## `pack/`

Builds the package's contents from the repo, and checks what it depends on before a release. `npm pack` and `npm publish` run the vendor step through the `prepack` script; `npm run vendor`, `npm run clean` and `npm run audit:skills` run by hand.

| File | What it does |
| --- | --- |
| `vendor-skills.mjs` | Copies the repo's `skills/` into the package, flattened to `skills/<name>/`, writes `.aiskills/layout.json` and `.aiskills/nested/`, and copies `marketplace.json` and `LICENSE`. Refuses duplicate or unsafe skill names and skills inside skills. |
| `skillsignore.mjs` | The `.skillsignore` rules (`.gitignore` syntax) that `vendor-skills.mjs` applies. |
| `audit-skills.mjs` | `npm run audit:skills [version\|range\|interval] [--min-age <days>]`: resolves the `skills` CLI version (default: the pinned one) and its dependency tree into a lockfile without installing, then fails if it was published less than 7 days ago or has a high or critical advisory. Run it before changing `SKILLS_CLI_VERSION`. |

## `docs/`

Builds what lives under the package's `docs/` folder. None of it ships.

| File | What it does | Run with |
| --- | --- | --- |
| `build-skills-docs.mjs` | The Skills pages in `docs/docsite/skills/`, the landing page's Skills list, and `docs/docsite/license.md` (the package's license and each bundled skill's), from the skills the package really ships. | `npm run docs:skills` |
| `build-docs-html.mjs` | `docs/docsite/index.html`: every Markdown page in one page with tabs, search, the banner and the theme menu. | `npm run docs:html`; `npm run docs:site` builds the same page into `site/` for GitHub Pages |
| `create-banner.mjs` | The banner: `docs/banner/aiskills-banner.html` (editor page) from `docs/banner/config.yaml`, and `banner_2x.png`. | `npm run banner`, `banner:png` |
| `themes.mjs` | The 11 themes behind both gear menus (default Lights Out), and the CSS made from them. | (used by the two above) |
| `templates/` | `docs-template.html` (the docs page) and `banner-template.html` (the banner editor). Edit these, never the generated pages. | |

`npm run docs` rebuilds everything generated (banner page, Skills pages, `llms.txt`, `index.html`); the tests fail while any of it is stale. See [`../../docs/meta/MAINTAINERS.md`](../../docs/meta/MAINTAINERS.md) for the full workflow.
