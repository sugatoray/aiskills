# Security model

`aiskills` writes only to its install folder, starts only a pinned `npx skills`, and checks anything from the registry before using it; the skills themselves are code your agent may run.

The full policy, including how to report a vulnerability, is in the package's [SECURITY.md](../../../SECURITY.md). This page explains the model.

## What it touches

| What | When |
| --- | --- |
| `~/.config/sugatoray/aiskills/` (or `AISKILLS_HOME`) | Written by `install`, `sync`, `list` and `groups`. `skills/` is replaced each time. `--purge` deletes the folder. |
| Agents' skill folders | Only through `npx skills add` / `remove`. |
| An empty temporary folder | While reading the agent list for `-a` patterns; deleted straight after. |
| The network | Never directly. `npx` downloads the `skills` CLI; `npx skills` talks to `skills.sh` and GitHub. |

## Protections

Each one is covered by the test suite.

- **No install step.** The package has no `preinstall`, `install` or `postinstall` script, so `npm install` (or pnpm, or bun) only puts files in npm's own folder: no network calls, nothing written to your home folder, no agent changed. Your agents change only when you run `aiskills install`.
- **Pinned `skills` CLI.** Every call is `npx -y skills@1.7.6 ...`, so a new or compromised release isn't used until it has been tested. [`AISKILLS_SKILLS_VERSION`](../reference/environment.md#aiskills_skills_version) overrides it, and only accepts an exact version, `latest` or `next`.
- **Registry results are checked.** With `--route`, a `find` result is used only if its `owner/repo@skill` is made of letters, digits, `.`, `_` and `-`, and a bare name needs exactly one exact match.
- **Found skills are confirmed.** A skill the registry lookup chose is shown (source, install count) and installed only after you answer `y`, or pass `-y`. Without a terminal and without `-y`, nothing is installed. Pinned `owner/repo@skill` specs aren't asked about. See [`-y`](../reference/cli.md#-y---yes).
- **No shell syntax on Windows.** `npx.cmd` runs through `cmd.exe`, so `aiskills` refuses arguments containing `& | < > ^ % ! " ( )`.
- **Only its own folders are replaced or deleted.** `sync`, `install` and `uninstall --purge` refuse a folder that has other files but no `aiskills.json`. This guards against an `AISKILLS_HOME` pointed at the wrong place.
- **npm's own variables are removed** before `npx` runs (registry, proxy and certificate settings are kept).
- **No runtime dependencies.**

## Skills are code

Agent skills contain instructions, and sometimes scripts, that your agent may run with your permissions. Bundled skills come from the [sugatoray/aiskills](https://github.com/sugatoray/aiskills) repo at the version you installed; you can read them in `~/.config/sugatoray/aiskills/skills/`. External skills are third-party code: prefer `owner/repo@skill` from sources you trust.

## Telemetry

`aiskills` sends nothing. The `skills` CLI sends anonymous usage data to `skills.sh` unless `DISABLE_TELEMETRY` or `DO_NOT_TRACK` is set; `aiskills` passes both through.

See also: [Errors and exit codes](../reference/errors.md) · [Choose the `skills` CLI version](../guides/choose-the-skills-cli-version.md)
