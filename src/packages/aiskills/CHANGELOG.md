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

## [1.3.0] - Unreleased

In development: `package.json` is `1.3.0-dev` (a SemVer pre-release, so it
sorts below `1.3.0`) while changes collect here. At release, set it to `1.3.0`
and date this section.

### Added

- **`aiskills config`**, like `git config`: `aiskills config <key>` prints a
  default, `aiskills config <key> <value>` sets it, `--unset <key>` removes it,
  and `--list` (with `--show-origin` or `--json`) shows what is set. Defaults
  live in `~/.config/sugatoray/aiskills.json`, or with `--project` in
  `./.aiskills.json`, which wins over it. Keys: `scope`, `agents`, `skills`,
  `groups`, `copy`, `route`, `layout`, `stats`, `skills-version` (the same
  defaults as the `AISKILLS_*` variables) and `color`; each value is checked
  when it's set. Order: option > `AISKILLS_*` variable > project file > user
  file > remembered > default. `aiskills info` lists both files and shows when
  a setting comes from one, and has a new `color` line.
- **Colored output.** On a terminal, `aiskills` colors its output: the
  `[aiskills]` prefix dim, errors red, warnings yellow, a finished upgrade
  green, and commands to run cyan; the headings in `--help`, the labels and
  values in `info`, the header row, `latest` tag and `← installed` mark in
  `releases`, and the names in `groups` and `installed`. Piped or redirected
  output stays plain, and `--json` is never colored. New options for every
  command: `--color` (color even when piped, e.g. into `less -R`) and
  `--no-color`. The standard `NO_COLOR` and `FORCE_COLOR` variables work too.
  No new dependencies.

### Changed

- **Bundled skill `run-code-review` 1.3.0:** `/run-code-review` now starts
  only when you type it, like the scrolls skills (`disable-model-invocation:
  true`). Asking your agent to review code no longer starts it on its own. The
  skill's docs page says so.

## [1.2.0] - 2026-11-13

### Added

- **New bundled skill: `run-code-review`**, in a new group, `review-skills`
  (alias `review`). `/run-code-review` runs a thorough code review of a pull
  request, branch, diff, set of files or whole repository at a senior or staff
  engineer's bar, and returns a structured report: a verdict, findings ranked
  by severity with file and line, and suggested code changes. It ships a
  checklist, fix patterns, tool commands, a security scope and review wisdom
  for Python, JavaScript, TypeScript, Rust, shell scripts, PowerShell, SQL,
  HTML, CSS, Markdown, XML, JSON, YAML and TOML. Options choose the languages
  (`-l`), the files (`-p`, `-t`, `--local`, `-r`, `--base`) and a
  security-only review (`-s`); XML, JSON, YAML and TOML are checked with
  tools first. `-o` (skill 1.2.0) also writes the report as a self-contained
  HTML page, Markdown or JSON, each finding linked to its line on GitHub or
  GitLab. The package now bundles
  17 skills in 9 groups: `aiskills install -s run-code-review`, or
  `aiskills install -G review`. See the skill's own `CHANGELOG.md`.

### Changed

- The README, the docs' skill and group lists, the examples that print them,
  the banner and the generated docs pages list the new skill and group.

## [1.1.0] - 2026-11-12

### Added

- **New bundled skill: `scrolls-explainer`**, in the `scrolls-skills` group
  (alias `scrolls`). `/scrolls-explainer` opens `scrolls-explainer.html`, an
  interactive, offline page with one tab per scrolls command that animates
  what the command does, step by step, with a callout for each step and full
  keyboard navigation. The package now bundles 16 skills in 8 groups:
  `aiskills install -s scrolls-explainer`, or `aiskills install -G scrolls`
  for the whole group. See the skill's own `CHANGELOG.md` for its history.

### Changed

- The other scrolls skills ship at their new lockstep version, 2.5.0 (no
  change in behavior; `scrolls-help`'s reference now covers the explainer).
- The README, the docs' skill and group lists, the version examples, the
  banner and the generated docs pages list the new skill. Upgrading from
  1.0.0 with `aiskills upgrade` lists `scrolls-explainer` as new, with the
  command to install it.
- The docs gain **See how the scrolls skills work**
  (`docs/docsite/explainers/scrolls.md`, in the Skills tab), which embeds the
  skill's interactive page. `npm run docs:skills` copies that page from the
  skill into `docs/docsite/explainers/`. The docs bundle embeds it, so it
  shows even when `index.html` is opened on its own (a phone app's preview, a
  single downloaded file): the frame and a full-screen overlay both render the
  embedded copy, and nothing requests the file itself. `npm run docs:site`
  still publishes the file next to `site/index.html`.
  The docs are not part of the npm package.

## [1.0.0] - 2026-11-11

The first stable release. From here on, a change that can break existing use
(a removed or renamed command, option or variable, a changed default, or a
different install folder or layout) only comes in a new major version.
Upgrade from 0.9.0 with `aiskills upgrade`.

### Added

- **New bundled skills: `artwallbg` and `commentdrop`**, in a new group,
  `image-styles-skills` (alias `image-styles`). `/artwallbg` generates a vivid
  illustrated scene of a subject in front of a huge spray-painted wall;
  `/commentdrop` adds floating, simulated social-media comment cards to a
  still image. Both need an image-generation or image-editing tool in the
  agent, and each ships an `assets/EXAMPLE.md` with example prompts and
  outputs. The package now bundles 15 skills in 8 groups:
  `aiskills install -G image-styles` or `aiskills install -s artwallbg`.
  See each skill's own `CHANGELOG.md` for its history.

### Removed

- **`AISKILLS_SKILLS_VERSION`**, the old name (0.4.0 to 0.5.0) of
  `AISKILLS_SKILLS_LIB_VERSION`, deprecated since 0.6.0. It's no longer read:
  if it's still set (in a shell profile, `.envrc` or CI), `aiskills` runs the
  pinned, tested `skills` CLI instead, without a warning. Rename it to
  `AISKILLS_SKILLS_LIB_VERSION` to keep choosing the version.

## [0.9.0] - 2026-11-11

`aiskills upgrade`: one command to get the latest aiskills and update the
skills your agents have.

### Added

- **`aiskills upgrade [<version>|<tag>]`**: installs the latest aiskills (or
  the version or tag you name) with the package manager that installed it
  globally (npm, pnpm, bun or yarn), then re-adds the skills installed from
  the install folder, for the same agents, by running the new version, so
  your agents get the new skills. Skills new in that version are listed (not
  installed) with the commands to add them; skills it dropped are listed with
  the command to remove them. Run through npx, as a project dependency or
  from a source checkout, it says what to do instead. `--check` only says
  whether an upgrade is available (exit `0`; `--json` for scripts),
  `--no-refresh` upgrades the package only, `-n` shows the commands, and a
  downgrade asks first (or needs `-y`).

### Changed

- The update hints of `aiskills releases` and `aiskills info --full` now say
  `aiskills upgrade` instead of `npm install -g @sugatoray-ai/aiskills@latest`.
- The FAQ's "How do I update the skills?" now answers `aiskills upgrade`.

## [0.8.0] - 2026-11-11

Interactive installs (pick the skills and agents from a list, or reuse the
agents you picked last time), plus `aiskills info` and `aiskills releases`.

### Added

- **`aiskills install -i` / `--interactive`**: runs `npx skills add` without
  `--yes`, so you pick the skills, the agents and the install method in its own
  pickers. The agents you picked last time are pre-checked. `-s`/`-G`/`-a`
  still skip the matching picker. Needs a terminal.
- **`aiskills install -l` / `--last-agents`**: installs for the agents you last
  picked in `npx skills add` (its `lastSelectedAgents`), instead of every
  agent it detects.
- **`aiskills info`**: shows this setup, like `conda info`: the versions, the
  install folder and what was saved there, every setting with where its value
  comes from, the `npx skills` lock file and last-picked agents, and the
  `AISKILLS_*` variables that are set. Offline; `--full` also asks npm for the
  latest version and `npx skills` for what is installed; `--json` for scripts.
- **`aiskills releases`** (alias **`rel`**): the latest releases on npm (5 by
  default; `rel 10`, `rel all`, `-L`/`--last`), with publish dates, ages,
  dist-tags, the installed one marked and an update hint. `--downloads [period]`
  adds a 7-day downloads column per version (the only per-version counts npm
  keeps), the package total over a period (`all` by default, or `7d`, `2w`,
  `1m`, `1y`, `<date>:<date>`, `<date>:`) and a breakdown by day, week or month
  as a bar chart (`--chart`, the default) or table (`--table`); `--by`,
  `--ascii`, `--json`.
- **Firewalls and npm mirrors:** `aiskills rel` reads the releases through
  your npm config, lists every version even when a mirror doesn't report
  publish times (`–` and a `publish dates: not reported by <registry>` note),
  names the registry in its errors and `--json`, and points to the changelog
  inside the installed package as well as on GitHub. The docs say what works
  behind a firewall, and how to use `--downloads` behind a TLS-inspecting proxy.
- New environment variables `AISKILLS_TODAY` (fixes "today" for reproducible
  output) and `AISKILLS_NPM_API_URL` (the download counts API, for tests).

### Changed

- **Docs:** tutorial step 2 shows `-i` and `-l` (with verified output), the
  FAQ answers which agents `aiskills install` installs for, the agent guide
  warns against `-i` in scripts, and the landing page lists the `video` group.

## [0.7.0] - 2026-11-11

### Added

- **New bundled skill: `dynamic-promo-video`**, in a new group,
  `video-related-skills` (alias `video-related`). It builds a short narrated
  promo or intro video for a library, app or product: animated HTML scenes
  rendered frame by frame with Playwright, encoded with ffmpeg, an ElevenLabs
  voiceover and synthesized background music that ducks under the voice. It
  ships its scripts, a scene template, two ready-made demos (`--demo`,
  `--demo=self`) and their approved voice recordings (about 670 KB of MP3s).
  The package now bundles 13 skills in 7 groups:
  `aiskills install -G video-related` or `aiskills install -s dynamic-promo-video`.
  See the skill's own `CHANGELOG.md` for its history.

### Changed

- The README, the docs' skill and group lists, the banner and the generated
  docs pages list the new group and skill.

## [0.6.0] - 2026-11-11

### Added

- **`AISKILLS_SKILLS_LIB_VERSION` takes a range.** Besides an exact version,
  `latest` and `next`, it accepts an npm range (`~1.7.4`, `1.7.x`,
  `>=1.7.4 <1.8.0`, `1.7.4 - 1.7.6`, `||`) and interval notation, turned into
  an npm range: `[x, ...)` is `>=x`, `(x, ...)` is `>x`, `[x, y)` is `>=x <y`,
  `(..., x]` is `<=x`, and the other mixes of `[ ( ) ]` (exactly one of `...`,
  `?` or `*` for an open end, never a combination like `?*`; all plain
  ASCII, so they type the same in every shell). With a range, npm picks the newest version its own rules allow,
  so `AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]'` gets past a `min-release-age`
  rule that refuses the pinned version. The default stays the exact, tested
  `skills@1.7.6`. Values are still limited to version characters, and an
  interval no version fits is refused. Only plain spaces may separate a
  range's parts (tabs, line breaks and Unicode spaces are refused), and a
  typographic `…` is read as `...`. Whenever it overrides the pinned
  version, every command says so once:
  `using skills@<spec> from AISKILLS_SKILLS_LIB_VERSION, not the tested 1.7.6`.
  On Windows, the `skills@<range>` argument is passed to `cmd.exe` in double
  quotes.
- **npm's release-age rule is explained.** When `npx` fails with
  "No matching version found for skills@… with a date before …" (npm's
  `min-release-age` or `before`), `aiskills` says the `skills` CLI version is
  newer than the rule allows, and how to proceed: wait, relax the rule for one
  run, or allow an older version with `AISKILLS_SKILLS_LIB_VERSION`. To spot it,
  `aiskills` now reads `npx`'s error output and prints it when `npx` ends,
  instead of letting it stream (the `aiskills skills ...` passthrough still
  streams, since it can be interactive).
- **`npm run audit:skills [version|range|interval]`** (maintainers): resolves
  a `skills` CLI version and its dependency tree into a lockfile without
  installing, and fails if it was published less than 7 days ago
  (`--min-age <days>`) or has a high or critical advisory. MAINTAINERS now
  runs it before changing the pinned version and before publishing.

### Deprecated

- **`AISKILLS_SKILLS_VERSION` is now `AISKILLS_SKILLS_LIB_VERSION`.** The old
  name read as if it set the version of the bundled skills; it sets the
  version of the `skills` CLI library that `npx` runs. The old name still
  works, with a warning (`AISKILLS_SKILLS_VERSION is deprecated and will be
  removed in 1.0.0: use AISKILLS_SKILLS_LIB_VERSION ...`); the new one wins
  when both are set. `AISKILLS_SKILLS_VERSION` will be removed in 1.0.0.

### Changed

- **npm's release-age settings reach `npx`.** `npm_config_min_release_age`,
  `npm_config_min_release_age_exclude` and `npm_config_before` are no longer
  removed from the environment, so `npm_config_min_release_age=0 aiskills
  installed` relaxes the rule for one run. Other `npm_config_*` variables are
  still removed, except registry, proxy and certificate settings.

## [0.5.0] - 2026-11-09

### Added

- **Installs through `aiskills` count on skills.sh.** `npx skills add` counts
  an install on [skills.sh](https://skills.sh) only when it installs from
  GitHub, so `aiskills install` (which installs from
  `~/.config/sugatoray/aiskills`) never showed up there. After a successful
  install of bundled skills, `aiskills` now runs
  `npx -y skills@1.7.6 add sugatoray/aiskills --skill <each> --agent <your -a, or universal> --copy --yes`
  in a new temp folder, in the background, and deletes the folder afterwards;
  that run sends skills.sh the usual install event. It prints one line
  (`adding this install to the skills.sh count in the background (turn off: --no-stats)`).
  Without access to github.com nothing is counted and nothing is shown; the
  install's exit status never changes. Not run for failed installs,
  `-n/--dry-run` (which shows the command), external `--route` skills or
  `sync`. See *The skills.sh install count* in the README and docs.
- **`--no-stats` / `--stats`** on `install` and `sync`: turn the count off or
  back on, remembered in `aiskills.json`. **`AISKILLS_STATS=0|1`** does the same
  for as long as it's set. `DO_NOT_TRACK`, `DISABLE_TELEMETRY`, `CI` and
  `GITHUB_ACTIONS` always turn it off. **`AISKILLS_STATS_FOREGROUND=1`** waits
  for the count and shows its output.

### Changed

- **npm package page:** a shorter `description` ("Curated agent skills
  (scrolls agentic memory and more) for every coding agent, in one npm
  package."), more `keywords` (`agentic-memory`, `visualization`,
  `developer-tools`), and `homepage` now points at the docs site,
  <https://sugatoray.github.io/aiskills/>, instead of the GitHub README.

## [0.4.0] - 2026-11-09

First release published to npm.
It includes everything listed under 0.3.0, 0.2.0 and 0.1.0 below, except the
npm install step (see **Removed**).

### Added

- **The docs are published on GitHub Pages** at <https://sugatoray.github.io/aiskills/>. A GitHub Actions
  workflow (`.github/workflows/aiskills-docs.yml`, modelled on
  sugatoray/callai's) builds the single-page docs with the new
  `npm run docs:site` on every push to `master` that changes them, and
  deploys them with `actions/deploy-pages`. It can also be run by hand.
- **`aix` (and `--route`) confirm external skills before installing.** A
  skill that a registry lookup found for a bare name (`aix i -s pdf`) is now
  listed with its `owner/repo@skill`, install count and the name you typed,
  then `aiskills` asks `Install <n> external skill(s) from the registry?
  [y/N]` (default no). Nothing is installed, not even bundled skills, until
  you answer `y`/`yes`. With no terminal (scripts, CI, agents) it stops with
  `not installing external skills without confirmation` unless you pass the
  new `-y`/`--yes`. A pinned `owner/repo@skill`, URL or path isn't asked
  about, since you named the source. **Breaking** for scripts that ran
  `--route` lookups unattended: add `-y`, or pin the skill.
- **`install -n` / `--dry-run`** shows what would be installed, including
  what a `--route` lookup found, and the exact `npx skills add` commands,
  without installing anything (the saved copy is still refreshed, as `sync`
  does). Before, `-n` was an `uninstall` option only.

- **A License page in the docs** (`docs/docsite/license.md`, and a License
  tab in the single-page docs): the package's license, and a table of every
  bundled skill with its group, its license and the `SKILL.md` that declares
  it (all MIT today). Generated from `package.json` and the skills by
  `npm run docs:skills`, so it can't go stale.

### Changed

- **The package is licensed Apache-2.0** (was MIT). `package.json` says
  `"license": "Apache-2.0"`, and the package ships its own `LICENSE` with
  the Apache License 2.0 text instead of a copy of the repo's MIT `LICENSE`.
  Each bundled skill keeps the license in its `SKILL.md` (all MIT today).
  Nothing has been published under MIT, so no installed copy is affected.

- **The code is organized by when it runs.** The files that ship moved
  from `src/scripts/` to `src/scripts/core/` (`cli.mjs` and `installer.mjs`). The scripts that build the package
  are in `src/scripts/pack/`, and the docs and banner builders in
  `src/scripts/docs/`; neither is published. `src/scripts/README.md`
  explains the three folders and the rule that imports only point down
  (`docs/` → `pack/` → `core/`). The `aiskills`, `ais` and `aix` commands
  work exactly as before.
- **User docs refreshed for 0.4.0.** The docs landing page has a new
  "Ways to read these docs" section: the Markdown pages, the single-page
  `index.html` (tabs, search, 11 themes from the gear menu, Lights Out by
  default, light/dark toggle), and `llms.txt` / `llms-full.txt` for AI
  agents. The files reference now says what the npm package contains and
  what stays in the repo (`src/scripts/pack/`, `src/scripts/docs/`,
  `src/test/`, `docs/`). Every command, option, environment variable and
  error message is still covered, and the checked examples still print what
  the pages show.
- **The banner shows the two install steps.** The install box reads
  `npm install -g @sugatoray-ai/aiskills`, then
  `aiskills install   # save + register`; the terminal demo opens with
  `ais sync   # save only`. The tagline is now "Agent skills for every coding
  agent, in one npm package." (it said "in one npm install", which stopped
  being true when the install step was removed). A trailing `# comment` in
  a banner install command is shown dimmed. The `aix i -s pdf` demo ends
  with the confirmation prompt the CLI really asks (`Install 1 external
  skill from the registry? [y/N] y`).
- **Maintainer docs** (`docs/meta/ARCHITECTURE.md`, `FEATURES.md` and
  `MAINTAINERS.md`) describe the `core/` / `pack/` / `docs/` layout, the
  docs and banner builders, the themes, and the current test suites.

### Removed

- **`newsletter-ai` is no longer bundled.** The repo's new
  `skills/newsletters/.skillsignore` (`newsletter-ai/`) leaves it out of the
  package, so `aiskills install` no longer installs it and the package has 12
  skills, all in groups. It stays in the repo: `npx skills add
  sugatoray/aiskills --skill newsletter-ai`, or
  `aix install -s sugatoray/aiskills@newsletter-ai`, still installs it.
  0.1.0–0.3.0 bundled it, but none was published.

- **The npm install step (`postinstall`).** `npm install` now only installs
  the `aiskills`, `ais` and `aix` commands: it makes no network requests,
  writes nothing to your home folder and changes no agent. Run
  `aiskills install` (or `npx @sugatoray-ai/aiskills install`) to save the
  skills and register them with your agents, as before. The install step's
  variables `AISKILLS_SKIP_POSTINSTALL` and `AISKILLS_SKIP_SKILLS_ADD` are
  gone, and `CI` and `INIT_CWD` are no longer read. The other `AISKILLS_*`
  variables still set defaults for the commands.

  **Breaking** compared with 0.1.0–0.3.0, which ran the step on
  `npm install`; none of those versions was published, so no installed copy
  is affected. Why: pnpm, bun and `--ignore-scripts` skip install scripts
  and npm 7+ hides their output, so the step failed silently for many
  users, and changing agents' instructions during `npm install` is what
  security scanners flag. The "Configure the npm install step" guide is
  replaced by [Set default choices](https://github.com/sugatoray/aiskills/blob/master/src/packages/aiskills/docs/docsite/guides/set-defaults.md).

### Fixed

- The root `README.md`, `CHANGELOG.md`, `SECURITY.md` and `LICENSE` are now
  listed as `/README.md` etc. in `package.json` `"files"`. A plain
  `README.md` also matches READMEs in subfolders, which would have
  published `src/scripts/README.md`.

## [0.3.0] - Never published

Superseded by 0.4.0 before it was published to npm, so it can't be installed
on its own.

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
  `docs/banner/config.yaml`. One list, `src/scripts/docs/themes.mjs`, feeds both.

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
[1.2.0]: https://github.com/sugatoray/aiskills/pull/223
[1.1.0]: https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-explainer
[1.0.0]: https://github.com/sugatoray/aiskills/pull/141
[0.9.0]: https://github.com/sugatoray/aiskills/pull/193
[0.8.0]: https://github.com/sugatoray/aiskills/pull/184
[0.7.0]: https://github.com/sugatoray/aiskills/pull/161
[0.6.0]: https://github.com/sugatoray/aiskills/pull/162
[0.5.0]: https://github.com/sugatoray/aiskills/pull/155
[0.4.0]: https://github.com/sugatoray/aiskills/pull/122
[0.3.0]: https://github.com/sugatoray/aiskills/pull/122
[0.2.0]: https://github.com/sugatoray/aiskills/pull/122
[0.1.0]: https://github.com/sugatoray/aiskills/pull/122
