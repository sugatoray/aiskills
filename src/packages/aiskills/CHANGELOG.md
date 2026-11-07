# Changelog

All notable changes to the `@sugatoray-ai/aiskills` npm package are listed
here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR** (`x.0.0`): a change that can break existing use, such as a removed
  or renamed command or option, a changed default, or a different install
  folder or layout.
- **MINOR** (`0.x.0`): something new that keeps existing use working, such as a
  new command, option, alias or skill group. New or updated **skills** in the
  bundle are a minor change too.
- **PATCH** (`0.0.x`): a fix that changes nothing else.

While the version is `0.y.z`, a minor bump may still include breaking changes;
they are listed under **Changed** or **Removed** with a note.

This file covers the package and its `aiskills` CLI. Each bundled skill keeps
its own `CHANGELOG.md` inside its folder under `skills/`.

## [Unreleased]

## [0.3.0] - Unreleased

First release to be published to npm; this section gets its date when it is.
It includes everything listed under 0.2.0 and 0.1.0 below.

### Added

- **User documentation** in the repo at
  [`src/packages/aiskills/docs/docsite/`](https://github.com/sugatoray/aiskills/tree/master/src/packages/aiskills/docs/docsite):
  getting started, a page for every bundled skill (generated from the
  skills, `npm run docs:skills`), a tutorial, how-to guides, concepts, a full
  reference (commands, options, environment variables, files, errors), an
  FAQ, and `llms.txt` / `llms-full.txt` for AI agents, plus the same docs as
  one HTML page with tabs and search (`docs/docsite/index.html`,
  `npm run docs:html`). Not shipped in the package. `npm test` checks it
  against the code, runs its examples, and opens every page of the HTML in a
  browser.
- **A banner** at the top of the README and of the docs' landing page,
  built from `docs/banner/config.yaml` by `npm run banner` /
  `npm run banner:png`, with an in-browser editor and PNG export
  (`docs/banner/`). Not shipped in the package.
- **Themes for the docs page and the banner**: a gear menu at the top right
  of `docs/docsite/index.html`, and in the banner editor's toolbar, switches
  between 11 themes (light and dark each), remembered per browser. The
  default is **Lights Out**; the banner's theme is `theme` in
  `docs/banner/config.yaml`. One list, `src/scripts/themes.mjs`, feeds both.

### Changed

- The README opens with the banner image and links to the full
  documentation.

### Fixed

- `uninstall -n` now prints the `npx` command that would really run,
  including the pinned `skills` version (`npx -y skills@1.7.6 remove ...`).

## [0.2.0] - Never published

Superseded by 0.3.0 before it was published to npm, so it can't be installed
on its own.

### Added

- **`.skillsignore`** (`.gitignore` syntax) anywhere under the repo's
  `skills/` leaves files, folders or whole skills out of the package. What
  was left out is listed in `.aiskills/layout.json` (`ignored`).
- **`SECURITY.md`**: how to report a vulnerability, what the package writes
  and which network calls happen, and the protections below.

### Security

- `npx` always runs a pinned, tested `skills` CLI (`skills@1.7.6`);
  `AISKILLS_SKILLS_VERSION` overrides it.
- `--route` / `aix` ignore `npx skills find` results whose
  `owner/repo@skill` contains anything but letters, digits, `.`, `_` and `-`.
- On Windows, `npx` is never started with arguments containing `cmd.exe`
  shell characters; arguments with spaces are quoted.
- `sync`, `install` and `uninstall --purge` refuse to replace or delete an
  existing folder that isn't an aiskills folder (no `aiskills.json`).

## [0.1.0] - Never published

The first version of the package. It was superseded by 0.2.0 before it was
published to npm, so it can't be installed on its own.

### Added

- **Bundled skills.** Every skill from
  [sugatoray/aiskills](https://github.com/sugatoray/aiskills) ships inside the
  package, flattened to one folder per skill (`skills/<skill-name>/`).
  `.aiskills/layout.json` and `.aiskills/nested/` keep the original nested
  layout and every file outside the skill folders, so nothing is lost.
- **Install on `npm install -g`.** A `postinstall` step saves the skills to
  `~/.config/sugatoray/aiskills/skills/` and runs `npx skills add` on that
  folder. It never fails the npm install. Opt-outs: `AISKILLS_SKIP_POSTINSTALL`,
  `AISKILLS_SKIP_SKILLS_ADD` and `CI`.
- **Three commands:** `aiskills`, `ais` (the same) and `aix` (the same as
  `aiskills --route`).
- **`aiskills` subcommands:** `install`, `uninstall`, `installed`, `groups`,
  `find`, `sync`, `list`, `path`, `help`, and `skills <args>`, which passes
  its arguments to `npx skills` with `:root` replaced by the install folder.
- **Short aliases:** `i` (install), `r`/`rm`/`remove` (uninstall), `ls`
  (installed), `g` (groups), `f` (find), `p` (path), `h` (help).
- **Choosing what to install:** `-g`/`-p` (global or project), `-a` (agents),
  `-s` (skills), `--copy`, and anything after `--` passed on to `npx skills`.
  Every option has an `AISKILLS_*` environment variable, which the
  `postinstall` step also reads.
- **Uninstall.** Full, partial (`-s`, `-G`), per agent (`-a`) or per project
  (`-p`), with `--purge` to delete the install folder, `-n`/`--dry-run`, and
  `-f`/`--force`. A full uninstall only removes skills installed from
  `~/.config/sugatoray/aiskills`.
- **Skill groups** (`-G`/`--group`) from the bundled
  `.claude-plugin/marketplace.json`: a group's name, or an alias without
  `-skills` (e.g. `scrolls`), or `all`. `aiskills groups [--json]` lists them.
- **Glob patterns** (`*`, `?`, `[abc]`, `[a-z]`, `[!abc]`) for `-s`, `-G` and
  `-a`, on install and uninstall and in the matching environment variables.
- **External skills with `--route`** (or `aix`, or `AISKILLS_ROUTE=1`): skills
  that aren't bundled are looked up with `npx skills find` and installed only
  on a unique exact match; `owner/repo@skill`, URLs and paths go straight to
  `npx skills add`. `uninstall --route` and `installed --route` also cover
  skills from other sources.
- **Layouts:** `--flat` (default) or `--nested` (or `AISKILLS_LAYOUT`) for
  `~/.config/sugatoray/aiskills/skills/`. Nested rebuilds the repo's `skills/`
  folder byte for byte. The choice is remembered.
- **Works with `npx skills experimental_sync`** when the package is a project
  dependency, thanks to the flat `skills/` folder.
- **Test suite** (`npm test`, and `npm run test:e2e` with network) using the
  built-in `node:test` runner.

[Unreleased]: https://github.com/sugatoray/aiskills/tree/master/src/packages/aiskills
[0.3.0]: https://github.com/sugatoray/aiskills/pull/122
[0.2.0]: https://github.com/sugatoray/aiskills/pull/122
[0.1.0]: https://github.com/sugatoray/aiskills/pull/122
