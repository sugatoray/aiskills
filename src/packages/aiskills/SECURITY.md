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
| `0.1.x` | Yes (current) |

Only the latest release gets fixes. See [`CHANGELOG.md`](CHANGELOG.md).

## What the package does on your machine

### When it runs

- **`npm install`** runs the `postinstall` step (`src/scripts/postinstall.mjs`),
  unless install scripts are disabled (`--ignore-scripts`, pnpm and bun by
  default) or `AISKILLS_SKIP_POSTINSTALL=1` is set.
- **The `aiskills`, `ais` and `aix` commands** run only when you call them.
- Nothing runs in the background or on a schedule.

### Files it writes

| Path | Written by | Notes |
| --- | --- | --- |
| `~/.config/sugatoray/aiskills/` (or `AISKILLS_HOME`) | `postinstall`, `install`, `sync`, `list`, `groups` | `skills/` is **replaced** on every sync; `--purge` deletes the **whole folder** (see [Known limitations](#known-limitations)). |
| `~/.agents/skills/`, `~/.claude/skills/` and other agents' skill folders | `npx skills add` / `remove`, run by `install` / `uninstall` | Global scope. The `skills` CLI decides the exact folders. |
| `./.claude/skills/`, `./skills-lock.json` etc. in the current folder | `npx skills`, with `-p`/`--project` | Project scope. |
| A temporary folder under the OS temp dir | the agent-list lookup for `-a` patterns | Empty; deleted straight after. |

It never reads or changes your code, git state, or anything else.

### Network access

`aiskills` itself makes **no** network requests. All of them come from the
programs it starts:

- **`npx -y skills ...`** downloads the [`skills`](https://www.npmjs.com/package/skills)
  CLI from the npm registry if it isn't cached. The version isn't pinned, so it's
  the latest one (see [Known limitations](#known-limitations)).
- **The `skills` CLI** sends anonymous usage data and audit lookups to
  `skills.sh` unless `DISABLE_TELEMETRY` or `DO_NOT_TRACK` is set. `aiskills`
  passes both variables through, so setting either one turns this off.
- **`--route` / `aix`** run `npx skills find` (queries `skills.sh`) and
  `npx skills add <owner/repo@skill>` (downloads from GitHub or the given URL).

### Running other programs

- The only program it starts is `npx` (`npx.cmd` on Windows), always as
  `npx -y skills <args>`, with an argument array (no shell on macOS and Linux).
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
  It never picks for you. All lookups run before anything is installed.
  Prefer pinned `owner/repo@skill` specs from sources you trust.

### What the package build guarantees

- `"files"` in `package.json` ships only `bin/`, the three runtime scripts,
  the vendored skills, metadata, README, CHANGELOG and LICENSE. Tests, the
  vendor script and the project-memory files never ship (also guarded by
  `.npmignore`).
- The vendor step refuses skill names that aren't safe folder names (e.g.
  `../evil`), two skills with the same name, and skills nested inside skills.
- The package has **no runtime dependencies**.

## Known limitations

These are known and tracked; reports with better fixes are welcome.

- **`npx -y skills` isn't pinned to a version.** A compromised or broken new
  release of the `skills` CLI would be used automatically. The fix is to pin a
  tested version in `runSkills()` (`src/scripts/installer.mjs`).
- **Windows: `--route` passes registry data through `cmd.exe`.** On Windows,
  `npx.cmd` is started with `shell: true`, and the `owner/repo@skill` string
  that `npx skills find` returns is passed on unchecked. A crafted registry
  entry containing shell characters (`&`, `|`, `^`, …) could run a command.
  Until this is fixed, don't use `--route`/`aix` with bare names on Windows;
  pinned `owner/repo@skill` specs you typed yourself are fine.
- **`--purge` deletes `AISKILLS_HOME` recursively** without checking that it
  is an aiskills folder. Never point `AISKILLS_HOME` at a folder that holds
  anything else (and never at your home folder).
