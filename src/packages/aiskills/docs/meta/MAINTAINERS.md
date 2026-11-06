# Maintainers

How to work on, test and release `@sugatoray-ai/aiskills`. How it's built is in
[ARCHITECTURE.md](ARCHITECTURE.md); what it does is in
[FEATURES.md](FEATURES.md).

## Before you start

- **Read the project memory first.** `SCROLLS.md` points at
  `docs/.scrolls/STARTER.md`, which gives the reading order for the current
  state (`HANDOFF.md`), known gaps, the backlog (`PLAN.md`) and hard-won
  lessons (`WISDOM.md`). Run `/scrolls-update` at the end of a session.
- **Requirements:** Node.js 18.17+ and npm. No other dependencies. The
  end-to-end tests also need network access (npm registry and GitHub).
- **Work from the package folder:** `cd src/packages/aiskills`.

## Layout

```text
package.json, README.md, CHANGELOG.md, SECURITY.md
bin/aiskills.mjs, bin/aix.mjs          entry points (keep them thin)
src/scripts/                           cli.mjs, installer.mjs, postinstall.mjs, vendor-skills.mjs
src/test/                              node:test suite
docs/meta/                             ARCHITECTURE, FEATURES, MAINTAINERS (not published)
docs/.scrolls/, SCROLLS.md, CLAUDE.md, AGENTS.md   project memory (not published)
skills/, .aiskills/, .claude-plugin/, LICENSE      vendored at pack time (git-ignored)
```

This layout was chosen deliberately by the repo owner. Don't move files
around without asking.

## Everyday commands

```sh
npm test               # unit + CLI + packaging tests, offline, a few seconds
npm run test:e2e       # adds real npm installs and the real `npx skills` (network)
npm run vendor         # build skills/ + .aiskills/ here, to inspect them
npm run pack:dry       # list exactly what would be published
npm run clean          # remove everything `vendor` created
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
   - What ships: `src/test/packaging.test.mjs` (uses `repoCopy()`).
2. **Make it pass**, then run `npm test` (and `npm run test:e2e` if it touches
   installs, packaging or `npx skills`).
3. **Prove the new test can fail:** break the code it guards on purpose, see
   it go red, restore. Don't commit while a file is deliberately broken.
4. **Update the docs** that the change affects: the README, `--help` in
   `cli.mjs`, [FEATURES.md](FEATURES.md), and [ARCHITECTURE.md](ARCHITECTURE.md)
   if the structure changed.
5. **Add a line under `## [Unreleased]` in `CHANGELOG.md`** for anything a
   user would notice.

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
- `postinstall` must never fail `npm install`.
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
- Run `npm test` here afterwards: the packaging tests compare the package
  with every git-tracked file under `skills/` that no `.skillsignore`
  excludes.

## Updating the pinned `skills` CLI

`SKILLS_CLI_VERSION` in `src/scripts/installer.mjs` is the `skills` version
every `npx` call runs. To move to a newer one:

1. `AISKILLS_SKILLS_VERSION=<new> npm run test:e2e` to try it.
2. Read the new version's changes, especially the output of `find`, the
   "Valid agents:" message and `list --json`, which `aiskills` parses.
3. Update `SKILLS_CLI_VERSION`, run `npm test` and `npm run test:e2e`, and add
   a CHANGELOG line.

## Releasing

1. Make sure `npm test` and `npm run test:e2e` pass.
2. In `CHANGELOG.md`, move the `Unreleased` entries under a new version with
   today's date. Pick the version with the rules at the top of that file:
   MAJOR breaks existing use, MINOR adds (including new or updated skills),
   PATCH fixes.
3. `npm version <major|minor|patch>` (or edit `package.json`), and commit.
4. `npm run pack:dry` and check the file list.
5. `npm publish`, logged in as a member of the `sugatoray-ai` npm org.
   `prepack` vendors the skills automatically; `publishConfig.access` is
   `public`.
6. `npm run clean`, then update the release note in
   `docs/.scrolls/SPEC.md` and run `/scrolls-update`.

The first release (`0.1.0`) is ticket AIS-1 in `docs/.scrolls/PLAN.md`.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `skills: not found` from the postinstall step | npm's `npm_config_*` variables reached the nested `npx` | They're stripped in `childEnv()`; if it comes back, check new npm variables |
| A skill's `.gitignore` missing after install | npm drops `.gitignore` files | Vendor renames them to `_gitignore`; `syncSkills()` renames them back |
| `no ancestor ... contains skills/` from `npm run vendor` | The package was moved out of the repo | The vendor step needs the repo's `skills/` and `.claude-plugin/marketplace.json` above it |
| `-a 'claude*'` says it can't read the agent list | `npx skills` changed its "Valid agents:" message | Update `knownAgents()` |
| `--route` finds nothing | `npx skills find` output changed, or no network to skills.sh | Update `findSkill()`; test offline with `SKILLS_API_URL` |
| `spawnSync npx ENOENT` | Running from a folder that no longer exists | `runSkills()` falls back to `$HOME`; check new callers pass a real `cwd` |

## Security

See [`../../SECURITY.md`](../../SECURITY.md) for how to report problems, what
the package touches, and the protections that must stay in place (pinned
`skills` CLI, registry text checks, Windows shell-character check, install
folder guard).
