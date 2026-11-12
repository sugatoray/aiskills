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
| `1.0.x` | Yes (current) |
| `0.9.x` | No: upgrade to `1.0.x` (`aiskills upgrade`) |
| `0.8.x`, `0.7.x`, `0.6.x`, `0.5.x`, `0.4.x` | No: upgrade to `1.0.x` (`npm install -g @sugatoray-ai/aiskills@latest`; `aiskills upgrade` arrived in 0.9.0) |
| `0.3.x`, `0.2.x`, `0.1.x` | Never published |

Only the latest release gets fixes. See [`CHANGELOG.md`](CHANGELOG.md).

## What the package does on your machine

### When it runs

- **`npm install` runs nothing.** The package has no `preinstall`, `install`
  or `postinstall` script, so installing it (with npm, pnpm or bun) only puts
  its files in the package manager's folder: no network requests, nothing
  written to your home folder, no agent changed. `src/test/packaging.test.mjs`
  fails if an install-time script is ever added.
- **The `aiskills`, `ais` and `aix` commands** run only when you call them.
- Nothing runs on a schedule. The one thing that runs in the background is
  the [skills.sh install count](#the-skillssh-install-count) after
  `aiskills install`; it ends on its own (at most 2 minutes) and
  `--no-stats` turns it off.

### Files it writes

| Path | Written by | Notes |
| --- | --- | --- |
| `~/.config/sugatoray/aiskills/` (or `AISKILLS_HOME`) | `install`, `sync`, `list`, `groups` | `skills/` is **replaced** on every sync; `--purge` deletes the **whole folder**. Both refuse a folder that isn't an aiskills folder (see [Protections](#protections-against-known-risks)). |
| `~/.agents/skills/`, `~/.claude/skills/` and other agents' skill folders | `npx skills add` / `remove`, run by `install` / `uninstall` | Global scope. The `skills` CLI decides the exact folders. |
| `./.claude/skills/`, `./skills-lock.json` etc. in the current folder | `npx skills`, with `-p`/`--project` | Project scope. |
| A temporary folder under the OS temp dir | the agent-list lookup for `-a` patterns | Empty; deleted straight after. |
| A temporary folder under the OS temp dir (`aiskills-stats-*`) | the [skills.sh install count](#the-skillssh-install-count) after `install` | A throwaway project install from GitHub; deleted when the count ends. |

It never reads or changes your code, git state, or anything else.

### Network access

`aiskills` itself makes **no** network requests. All of them come from the
`npx skills` commands it starts:

- **`npx -y skills@1.7.6 ...`** downloads the [`skills`](https://www.npmjs.com/package/skills)
  CLI from the npm registry if it isn't cached. The version is pinned (see
  [Protections](#protections-against-known-risks)).
- **The `skills` CLI** sends anonymous usage data and audit lookups to
  `skills.sh` unless `DISABLE_TELEMETRY` or `DO_NOT_TRACK` is set. `aiskills`
  passes both variables through, so setting either one turns this off.
- **`--route` / `aix`** run `npx skills find` (queries `skills.sh`) and
  `npx skills add <owner/repo@skill>` (downloads from GitHub or the given URL).
- **`aiskills install`** (bundled skills) then runs the skills.sh install
  count, below: github.com, api.github.com and skills.sh.

### The skills.sh install count

skills.sh counts installs that `npx skills add` makes from GitHub, not those
from a local folder like `aiskills install`'s. So after a successful install
of bundled skills, `aiskills` runs, in a new temp folder and in the
background:

```sh
npx -y skills@1.7.6 add sugatoray/aiskills --skill <each installed skill> --agent <your -a, or universal> --copy --yes
```

- **What it sends:** the `skills` CLI shallow-clones
  `https://github.com/sugatoray/aiskills`, asks `api.github.com` whether the
  repo is public, and sends `skills.sh` its usual install event: the repo, the
  skill names, the agents, the `skills` CLI version, and (if it detects one)
  the AI agent it runs under. `aiskills` adds nothing to it. No file from your
  projects or your install folder is read or sent.
- **What it changes:** nothing outside the temp folder, which is deleted when
  the count ends (a project install never touches your global skills or your
  projects' `skills-lock.json`). It's stopped after 2 minutes.
- **When it fails** (no access to github.com, a proxy, a timeout), nothing is
  counted and nothing is shown; the install's result is unchanged.
- **Off:** `--no-stats` (remembered until `--stats`), `AISKILLS_STATS=0`, and
  always with `DO_NOT_TRACK`, `DISABLE_TELEMETRY` or `CI`/`GITHUB_ACTIONS`.
  Not run for `-n/--dry-run`, failed installs, `sync`, or external skills
  (`--route`).

### Running other programs

- The only program it starts is `npx` (`npx.cmd` on Windows), always as
  `npx -y skills@<pinned version> <args>`, with an argument array (no shell on
  macOS and Linux; on Windows, see the shell-character check below).
- npm's own lifecycle variables (`npm_config_global`, `npm_config_prefix`,
  `npm_lifecycle_*`, …) are removed before `npx` runs; registry, proxy and
  certificate settings are kept, and so are npm's release-age settings
  (`npm_config_min_release_age`, `npm_config_min_release_age_exclude`,
  `npm_config_before`), which only make npm stricter or looser about how new
  a version may be.
- On Windows, the `skills@<range>` argument is passed to `cmd.exe` in double
  quotes (it may hold `<`, `>`, `|` or `^`, which `cmd.exe` reads as text
  there); it was already limited to version characters. Every other argument
  still may not contain shell characters.

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
  lookups run before anything is installed. A skill a lookup found is shown
  (source and install count) and installed only after you confirm it at a
  `[y/N]` prompt (default no) or pass `-y`; with no terminal and no `-y`,
  nothing is installed. Pinned `owner/repo@skill` specs aren't asked about.
  Prefer pinned `owner/repo@skill` specs from sources you trust.

### What the package build guarantees

- `"files"` in `package.json` ships only `bin/`, the two runtime scripts,
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
  maintainers bump it after testing and after `npm run audit:skills` (no high
  or critical advisory in its dependency tree, published at least 7 days
  earlier). `AISKILLS_SKILLS_LIB_VERSION` overrides it with an exact version,
  `latest`, `next`, an npm range or interval notation (`[1.7.4, 1.8.0)`);
  a range lets npm pick a version nobody tested with `aiskills`. Values are
  limited to version characters and plain spaces (no tabs, line breaks or
  Unicode spaces), so they can't name another package, a URL or a path, or
  carry shell syntax; anything else is refused. A typographic `…` in an
  interval is read as `...`, and the npm range passed on is rebuilt from the
  version numbers, so it never reaches `npx`. Whenever the variable
  overrides the pin, every command says so once
  (`using skills@<spec> from AISKILLS_SKILLS_LIB_VERSION, not the tested 1.7.6`),
  so a downgrade set by a profile, `.envrc` or CI variable isn't silent.
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

- Setting `AISKILLS_SKILLS_LIB_VERSION=latest` gives up the pinning above.
- An `owner/repo@skill` you type yourself is passed to `npx skills add` as you
  typed it (on Windows, still subject to the shell-character check).
- Anything already in an aiskills folder's `skills/` is replaced on every
  sync. Don't keep your own files there.
