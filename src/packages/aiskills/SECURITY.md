# Security

This file covers the `@sugatoray-ai/aiskills` npm package: how to report a
problem, and what the package can touch, for anyone auditing it.

## Reporting a vulnerability

Please report security problems privately, not in a public issue:

1. In [sugatoray/aiskills](https://github.com/sugatoray/aiskills), open the
   **Security** tab and choose **Report a vulnerability** (GitHub private
   vulnerability reporting).
2. If that option isn't available, open an issue titled "Security contact
   request" **without any details**, and the maintainer will reply with a
   private channel.

Include the package version (`aiskills --version`), your OS and Node.js
version, and the steps to reproduce.

## Supported versions

| Version | Supported |
| --- | --- |
| `0.4.x` | Yes (current) |
| `0.3.x`, `0.2.x`, `0.1.x` | Never published |

Only the latest release gets fixes. See [`CHANGELOG.md`](CHANGELOG.md).

## What the package does on your machine

### When it runs

- **`npm install`** runs the `postinstall` step (`src/scripts/core/postinstall.mjs`),
  unless install scripts are disabled (`--ignore-scripts`, pnpm and bun by
  default) or `AISKILLS_SKIP_POSTINSTALL=1` is set.
- **The `aiskills`, `ais` and `aix` commands** run only when you call them.
- Nothing runs in the background or on a schedule.

### Files it writes

| Path | Written by | Notes |
| --- | --- | --- |
| `~/.config/sugatoray/aiskills/` (or `AISKILLS_HOME`) | `postinstall`, `install`, `sync`, `list`, `groups` | `skills/` is **replaced** on every sync; `--purge` deletes the **whole folder**. Both refuse a folder that isn't an aiskills folder (see [Protections](#protections-against-known-risks)). |
| `~/.agents/skills/`, `~/.claude/skills/` and other agents' skill folders | `npx skills add` / `remove`, run by `install` / `uninstall` | Global scope. The `skills` CLI decides the exact folders. |
| `./.claude/skills/`, `./skills-lock.json` etc. in the current folder | `npx skills`, with `-p`/`--project` | Project scope. |
| A temporary folder under the OS temp dir | the agent-list lookup for `-a` patterns | Empty; deleted straight after. |

It never reads or changes your code, git state, or anything else.

### Network access

`aiskills` itself makes **no** network requests. All of them come from the
programs it starts:

- **`npx -y skills@1.7.6 ...`** downloads the [`skills`](https://www.npmjs.com/package/skills)
  CLI from the npm registry if it isn't cached. The version is pinned (see
  [Protections](#protections-against-known-risks)).
- **The `skills` CLI** sends anonymous usage data and audit lookups to
  `skills.sh` unless `DISABLE_TELEMETRY` or `DO_NOT_TRACK` is set. `aiskills`
  passes both variables through, so setting either one turns this off.
- **`--route` / `aix`** run `npx skills find` (queries `skills.sh`) and
  `npx skills add <owner/repo@skill>` (downloads from GitHub or the given URL).

### Running other programs

- The only program it starts is `npx` (`npx.cmd` on Windows), always as
  `npx -y skills@<pinned version> <args>`, with an argument array (no shell on
  macOS and Linux; on Windows, see the shell-character check below).
- npm's own lifecycle variables (`npm_config_global`, `npm_config_prefix`,
  `npm_lifecycle_*`, …) are removed before `npx` runs; registry, proxy and
  certificate settings are kept.
- The `postinstall` step never fails `npm install`: errors are caught and
  printed as warnings.

### Skills are code

Agent skills can contain instructions and scripts (`.sh`, `.ps1`, `.py`) that
your agent may run **with your permissions**.

- **Bundled skills** come from the [sugatoray/aiskills](https://github.com/sugatoray/aiskills)
  repo at the version you installed. Review them in
  `~/.config/sugatoray/aiskills/skills/` (`aiskills sync --nested` shows the
  repo's layout).
- **External skills** (`--route`, `aix`) are third-party code. `aiskills`
  installs a bare name only when **exactly one** registry result has that
  exact name; with several, it stops and asks you to pin `owner/repo@skill`.
  It never picks for you, and ignores results with unsafe characters. All
  lookups run before anything is installed.
  Prefer pinned `owner/repo@skill` specs from sources you trust.

### What the package build guarantees

- `"files"` in `package.json` ships only `bin/`, the three runtime scripts,
  the vendored skills, metadata, README, CHANGELOG and LICENSE. Tests, the
  vendor script and the project-memory files never ship (also guarded by
  `.npmignore`).
- The vendor step refuses skill names that aren't safe folder names (e.g.
  `../evil`), two skills with the same name, and skills nested inside skills.
- The package has **no runtime dependencies**.

## Protections against known risks

Each of these has tests in `src/test/` (`npm test`).

- **The `skills` CLI version is pinned.** Every call runs
  `npx -y skills@1.7.6` (`SKILLS_CLI_VERSION` in `src/scripts/core/installer.mjs`),
  so a new or compromised `skills` release is never used silently. The
  maintainers bump it after testing. `AISKILLS_SKILLS_VERSION` overrides it
  (an exact version, `latest` or `next`; anything else is refused).
- **Registry text is checked before use.** Under `--route` / `aix`, an
  `owner/repo@skill` result from `npx skills find` is used only if every part
  is made of letters, digits, `.`, `_` and `-`. Other results are ignored with
  a warning, and are never passed to `npx`.
- **No shell syntax reaches `cmd.exe`.** On Windows, where `npx.cmd` must run
  through `cmd.exe`, `aiskills` refuses to start `npx` if any argument contains
  `& | < > ^ % ! " ( )`, and quotes arguments that contain spaces.
- **Only aiskills folders are replaced or deleted.** `sync`/`install` (which
  replace `skills/`) and `uninstall --purge` (which deletes the folder) refuse
  to touch an existing folder that has other files but no `aiskills.json`.
  A missing or empty folder is fine. This protects against an `AISKILLS_HOME`
  pointed at the wrong place. `--purge` checks this before removing any
  skill, so a refusal changes nothing.

## Remaining caveats

- Setting `AISKILLS_SKILLS_VERSION=latest` gives up the pinning above.
- An `owner/repo@skill` you type yourself is passed to `npx skills add` as you
  typed it (on Windows, still subject to the shell-character check).
- Anything already in an aiskills folder's `skills/` is replaced on every
  sync. Don't keep your own files there.
