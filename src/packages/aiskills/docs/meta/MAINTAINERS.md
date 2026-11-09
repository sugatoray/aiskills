# Maintainers

How to work on, test and release `@sugatoray-ai/aiskills`. How it's built is in
[ARCHITECTURE.md](ARCHITECTURE.md); what it does is in
[FEATURES.md](FEATURES.md).

## Before you start

- **Read the project memory first.** `SCROLLS.md` points at
  `docs/.scrolls/STARTER.md`, which gives the reading order for the current
  state (`HANDOFF.md`), known gaps, the backlog (`PLAN.md`) and hard-won
  lessons (`WISDOM.md`). Run `/scrolls-update` at the end of a session.
- **Requirements:** Node.js 18.17+ and npm; the package has no dependencies.
  For the docs: Python 3 (the create-lib-docs checker and `llms.txt` builder,
  run from `skills/docs/create-lib-docs/scripts/`). Optional: Playwright with
  Chromium, for `npm run banner:png` and the browser tests (skipped without
  it, or without access to cdnjs/jsDelivr). The end-to-end tests need network
  access (npm registry and GitHub).
- **Where code goes:** see [`src/scripts/README.md`](../../src/scripts/README.md):
  `core/` ships, `pack/` runs at `npm pack`, `docs/` builds the docs and
  banner; imports only point down.
- **Work from the package folder:** `cd src/packages/aiskills`.

## Layout

```text
package.json, README.md, CHANGELOG.md, SECURITY.md
bin/aiskills.mjs, bin/aix.mjs          entry points (keep them thin)
src/scripts/core/                      cli.mjs, installer.mjs (published; see src/scripts/README.md)
src/scripts/pack/                      vendor-skills.mjs, skillsignore.mjs (run at npm pack; never published)
src/scripts/docs/                      docs and banner builders, themes.mjs, templates/ (never published)
src/test/                              node:test suite
docs/docsite/                          user documentation, llms.txt, index.html (not published)
docs/banner/                           banner: config.yaml, editor page, banner_2x.png (not published)
docs/meta/                             ARCHITECTURE, FEATURES, MAINTAINERS (not published)
docs/.scrolls/, SCROLLS.md, CLAUDE.md, AGENTS.md   project memory (not published)
skills/, .aiskills/, .claude-plugin/, LICENSE      vendored at pack time (git-ignored)
```

This layout was chosen deliberately by the repo owner. Don't move files
around without asking.

## Everyday commands

```sh
npm test               # every offline test (unit, CLI, packaging, docs, banner, themes); about a minute
npm run test:e2e       # adds real npm installs and the real `npx skills` (network)
npm run vendor         # build skills/ + .aiskills/ here, to inspect them
npm run pack:dry       # list exactly what would be published (then npm run clean)
npm run clean          # remove everything `vendor` created
npm run docs           # rebuild every generated doc: banner page, Skills pages, llms.txt, index.html
npm run banner:png     # rebuild the banner page and banner_2x.png (needs Playwright)
npm run banner:check   # is the banner page up to date?
node bin/aiskills.mjs --help
```

To try the real thing without touching your machine, run `npm run test:e2e`,
or by hand:

```sh
npm pack --pack-destination /tmp/ais
HOME=/tmp/ais/home npm install -g --prefix /tmp/ais/prefix /tmp/ais/sugatoray-ai-aiskills-*.tgz
HOME=/tmp/ais/home /tmp/ais/prefix/bin/aiskills installed
npm run clean
```

Set `HOME` per command, not with `export`: an exported `HOME` breaks the next
`git commit`.

## Making a change

1. **Write a failing test first** (Red/Green TDD).
   - CLI behaviour: `src/test/cli.test.mjs`. `sandbox()` gives a fixture
     package and a stand-in `npx` on `PATH`; assert the exact `npx skills`
     arguments with `skillsArgs()`.
   - Pure logic: `src/test/unit.test.mjs`.
   - What ships, and the `src/scripts/` layout: `src/test/packaging.test.mjs` (uses `repoCopy()`).
   - User docs: `src/test/docs.test.mjs`, the Skills pages:
     `docs-skills.test.mjs`, the HTML page: `docs-html.test.mjs` (see
     "Updating the user docs").
   - Banner and themes: `banner.test.mjs`, `themes.test.mjs`.
   - A new file goes in `src/scripts/core/`, `pack/` or `docs/` by when it
     runs ([`src/scripts/README.md`](../../src/scripts/README.md)); a new
     published file must also be added to `"files"` in `package.json`.
2. **Make it pass**, then run `npm test` (and `npm run test:e2e` if it touches
   installs, packaging or `npx skills`).
3. **Prove the new test can fail:** break the code it guards on purpose, see
   it go red, restore. Don't commit while a file is deliberately broken.
4. **Update the docs** that the change affects: the README, `--help` in
   `cli.mjs`, the user docs in [`docs/docsite/`](../docsite/README.md),
   [FEATURES.md](FEATURES.md), and [ARCHITECTURE.md](ARCHITECTURE.md) if the
   structure changed.
5. **Add a line to `CHANGELOG.md`** for anything a user would notice: under
   `## [Unreleased]`, or under the newest version while it is still marked
   "Unreleased" (not yet published).
6. **Regenerate** with `npm run docs` (and `npm run banner:png` if the banner
   changed); the tests fail while anything generated is stale.

### Rules of thumb

- `runSkills()` in `installer.mjs` is the only place that starts `npx`. Keep
  it that way: it pins the `skills` version and does the Windows shell check.
- Treat anything from `npx skills find` (or any other outside source) as
  untrusted: check it like `isSafeRegistrySpec()` does before using it.
- Anything that deletes or replaces files under the install folder must call
  `assertInstallFolder()` first.
- Tests never touch the real `HOME` or write into this folder: always use
  `sandbox()` / `repoCopy()`.
- Check every input and do every lookup before the first install.
- No install-time scripts (`preinstall`, `install`, `postinstall`, `prepare`):
  `npm install` must not change anything outside npm's folder (AIS-7).
  `packaging.test.mjs` enforces it.
- Don't add `s`, `l` or `u` as command aliases (`s` = sync or skills? `l`
  looks like `ls`; `u` usually means update). Command names (`aiskills`, `ais`,
  `aix`) are public: don't rename them.
- When editing with regexes in the shell, `sed` with `|` as its delimiter
  can't use `\|`; check the edit actually happened.

## Adding or changing skills

Skills live in the repo's top-level `skills/` folder, not here. The package
picks them up at the next `npm pack`.

- **A new skill:** add `skills/<group>/<skill>/SKILL.md` with a unique `name:`
  that's a safe folder name (letters, digits, `.`, `_`, `-`). `vendor()`
  refuses duplicates, unsafe names, and a skill inside another skill.
- **A new group:** add a plugin entry to the repo's
  `.claude-plugin/marketplace.json` whose `source` points at the group's
  folder under `skills/`. Its alias is the name minus `-skills`.
- **Leaving files out of the package:** add rules to a `.skillsignore` in
  `skills/` or any folder below it (`.gitignore` syntax; see the README's
  "Leaving files out" section). Ignore a skill's folder to drop the skill.
  Check with `npm run vendor`, then `npm run clean`.
- Run `npm run docs` and `npm run banner:png` afterwards: a new or changed
  skill changes its Skills page, the landing page's Skills list and the
  banner's skill and group counts.
- Then `npm test`: the packaging tests compare the package with every
  git-tracked file under `skills/` that no `.skillsignore` excludes, and the
  docs tests fail if any generated page is stale.

## Updating the user docs

The user docs in `docs/docsite/` follow the repo's `/create-lib-docs` skill
(`skills/docs/create-lib-docs/`). `npm test` fails when they drift from the
code:

- **A new command, option, `AISKILLS_*` variable or error message** must get
  an entry in `reference/cli.md`, `reference/environment.md` or
  `reference/errors.md`.
- **Examples with output** must be marked `<!-- verify -->` (optionally
  `<!-- verify: list=<names> find=<owner/repo@skill> -->` to set what the
  stand-in `npx skills list` / `find` return, and `tty=<answer>` to run it in
  a pseudo-terminal and type `<answer>` at a `[y/N]` prompt; needs util-linux
  `script`). The test runs them against the
  repo's real skills and compares the output exactly; a line holding only
  `…` matches any number of lines. Output after an `aiskills`/`ais`/`aix`
  command without the marker fails the test.
- **After editing any page, or any skill**, regenerate everything that is
  generated (the Skills pages, `llms.txt`, `llms-full.txt`, `index.html`) and
  check links:

  ```sh
  npm run docs
  python3 ../../../skills/docs/create-lib-docs/scripts/check_docs.py docs/docsite
  ```

- **The Skills section** (`docs/docsite/skills/`, and the list between
  `<!-- skills:start -->` and `<!-- skills:end -->` on the landing page) is
  generated from the skills' `SKILL.md` files by `npm run docs:skills`
  (`src/scripts/docs/build-skills-docs.mjs`). Don't edit it by hand; change the
  skill and regenerate. `src/test/docs-skills.test.mjs` fails while it is
  stale, for example after a skill's version or description changes.

- **Rebuild the single-page HTML** (`docs/docsite/index.html`) with
  `npm run docs:html`. `src/test/docs-html.test.mjs` fails while it is stale,
  and opens every page in Chromium to check links and headings (skipped
  without Playwright or access to cdnjs). The builder is
  `src/scripts/docs/build-docs-html.mjs` with `src/scripts/docs/templates/docs-template.html`,
  ported from sugatoray/callai's `docs/site/`; tabs come from the landing
  page's `### Section` lists, so a new page must be listed there.
- **The published site** (<https://sugatoray.github.io/aiskills/>) is built and deployed by
  `.github/workflows/aiskills-docs.yml` (at the repo root) on every push to
  `master` that touches `docs/docsite/`, `docs/banner/`, `src/scripts/docs/`,
  `package.json` or the workflow, the same way as sugatoray/callai's
  `docs.yml`. It runs `npm run docs:site -- --ref <branch>`, which writes
  `site/index.html` (git-ignored) from the Markdown, so the site never depends
  on the committed `index.html` being current. Run it by hand from the
  Actions tab ("Run workflow"; untick *deploy* to only build). One-time setup:
  Settings → Pages → Build and deployment → Source: **GitHub Actions**.
  `src/test/docs-workflow.test.mjs` keeps the workflow pointing at real paths.
- **Themes** live in `src/scripts/docs/themes.mjs`, one list for the docs page's
  gear menu and the banner editor's. `teal` is the base design of the two
  templates; every other theme sets the page variables for light and dark, and
  the banner's colours (including dark-ink accents for white backgrounds).
  `DEFAULT_THEME` (Lights Out) is what the docs page opens in; the banner's
  theme is `theme` in `docs/banner/config.yaml`. After changing a theme, run
  `npm run banner:png` and `npm run docs`; `themes.test.mjs` checks contrast
  from the values, and the browser tests check it on the rendered banner.
- **The banner** (`docs/banner/`, see its README) is built from
  `docs/banner/config.yaml` and `src/scripts/docs/templates/banner-template.html` by
  `npm run banner`; `npm run banner:png` also renders `banner_2x.png` for the
  README (needs Playwright). The PNG carries the theme and the SHA-256 of the
  page it was rendered from (PNG `tEXt` chunks), so `src/test/banner.test.mjs`
  fails while either the page or the PNG is stale.
- **A version bump** changes the `--version` and `--help` examples, the
  banner and the version in `index.html`: run `npm run banner:png` and
  `npm run docs`; the tests show what else to update.
- Diagrams are hand-written SVG in `docs/docsite/images/`; render one to PNG
  and look at it after editing.

## Updating the pinned `skills` CLI

`SKILLS_CLI_VERSION` in `src/scripts/core/installer.mjs` is the `skills` version
every `npx` call runs. To move to a newer one:

1. `AISKILLS_SKILLS_VERSION=<new> npm run test:e2e` to try it.
2. Read the new version's changes, especially the output of `find`, the
   "Valid agents:" message and `list --json`, which `aiskills` parses.
3. Update `SKILLS_CLI_VERSION`, run `npm test` and `npm run test:e2e`, and add
   a CHANGELOG line.

## Releasing

1. **Pick the version** with the rules at the top of `CHANGELOG.md`: MAJOR
   breaks existing use, MINOR adds (including new or updated skills), PATCH
   fixes. If the newest version section is still "Unreleased", it is the one
   to release; otherwise move the `Unreleased` entries under a new version.
2. **Bump** `package.json` (`npm version <major|minor|patch> --no-git-tag-version`,
   or edit it), then `npm run banner:png` and `npm run docs`: the version
   appears in the banner, `index.html` and the docs examples, and the tests
   point at anything else to update (`SECURITY.md`'s supported versions,
   the `aiskills.json` sample).
3. **Date the section** (`## [x.y.z] - YYYY-MM-DD`) and make sure `npm test`
   and `npm run test:e2e` pass. Commit.
4. `npm run pack:dry` and check the file list (only `bin/`, the three
   `src/scripts/core/` files, the skills, metadata and the root docs), then
   `npm run clean`.
5. `npm publish`, logged in as a member of the `sugatoray-ai` npm org.
   `prepack` vendors the skills automatically; `publishConfig.access` is
   `public`.
6. `npm run clean`, then update the release note in
   `docs/.scrolls/SPEC.md` and run `/scrolls-update`.

The first published release (`0.4.0`; `0.3.0`, `0.2.0` and `0.1.0` were never published) is
ticket AIS-1 in `docs/.scrolls/PLAN.md`.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `skills: not found` when run through `npx @sugatoray-ai/aiskills` | npm's `npm_config_*` variables reached the nested `npx` | They're stripped in `childEnv()`; if it comes back, check new npm variables |
| A skill's `.gitignore` missing after install | npm drops `.gitignore` files | Vendor renames them to `_gitignore`; `syncSkills()` renames them back |
| `no ancestor ... contains skills/` from `npm run vendor` | The package was moved out of the repo | The vendor step needs the repo's `skills/` and `.claude-plugin/marketplace.json` above it |
| `-a 'claude*'` says it can't read the agent list | `npx skills` changed its "Valid agents:" message | Update `knownAgents()` |
| `--route` finds nothing | `npx skills find` output changed, or no network to skills.sh | Update `findSkill()`; test offline with `SKILLS_API_URL` |
| `spawnSync npx ENOENT` | Running from a folder that no longer exists | `runSkills()` falls back to `$HOME`; check new callers pass a real `cwd` |
| `... is stale: run npm run docs:html` (or `docs:skills`), `... is out of date: run npm run banner` | A page, skill, template, theme or the version changed and the generated output wasn't rebuilt | `npm run docs` |
| `banner_2x.png is older than aiskills-banner.html` | The banner page was rebuilt but not its PNG | `npm run banner:png` |
| `... output differs` in `docs.test.mjs` | An example on a docs page no longer prints what the page shows (often after a version bump or a CLI change) | Update the page's expected output to the actual output shown in the failure |
| A `README.md` or other file in a subfolder shows up in `npm pack` | A plain name in `"files"` matches at any depth | Anchor root files with a leading `/` (`/README.md`) |
| Browser tests or `banner:png` skipped or failing to launch | No Playwright/Chromium, or no access to cdnjs/jsDelivr | Install Playwright and Chromium; the rest of `npm test` runs without them |

## Security

See [`../../SECURITY.md`](../../SECURITY.md) for how to report problems, what
the package touches, and the protections that must stay in place (pinned
`skills` CLI, registry text checks, Windows shell-character check, install
folder guard).
