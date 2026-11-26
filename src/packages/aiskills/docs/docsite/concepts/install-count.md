# The skills.sh install count

After `aiskills install`, a background `npx skills add sugatoray/aiskills` adds the install to each skill's count on [skills.sh](https://skills.sh); it needs github.com, fails silently without it, is off by default when npm uses a registry mirror or a proxy, and `--no-stats` turns it off.

## Why it exists

skills.sh shows how often each skill is installed. The `skills` CLI reports an install only when it installs from GitHub (`npx skills add owner/repo`). `aiskills install` registers the skills from a local folder, `~/.config/sugatoray/aiskills`, so without this step none of its installs would be counted.

## What happens

After a successful install of bundled skills, `aiskills` prints one line and returns:

```text
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

In the background, in a new temp folder, it runs:

```bash
npx -y skills@1.7.6 add sugatoray/aiskills --skill <each installed skill> --agent <your -a, or universal> --copy --yes
```

1. The `skills` CLI shallow-clones `https://github.com/sugatoray/aiskills` and installs the skills into the temp folder (a project install).
2. It asks `api.github.com` whether the repo is public; only then does it send `skills.sh` its usual install event: the repo, the skill names, the agents, its own version, and the AI agent it runs under, if it detects one.
3. `aiskills` deletes the temp folder. It stops the run after 2 minutes.

Your agents keep using the copy in `~/.config/sugatoray/aiskills`; nothing from the temp folder is kept, and your global skills and projects aren't touched.

| Install | Counted |
| --- | --- |
| `aiskills install`, with or without `-s`, `-G`, `-a`, `-p` | ✓ the skills installed, for the agents you named (`universal` if none) |
| A failed install | |
| `aiskills install -n` | shows the command as `[dry-run] skills.sh count: ...` |
| External skills (`--route`, `aix`) | by `npx skills add owner/repo@skill` itself |
| `aiskills sync` | |

## Behind a registry mirror or a proxy

When npm uses a registry mirror (Artifactory, Nexus, Verdaccio, …) or a proxy, `aiskills` doesn't run the count: there, github.com and git traffic are usually blocked, and a `git clone` started by an npm package is what firewall policies flag. It asks `npm config get registry https-proxy proxy` once, also checks `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY`, and says why:

```text
[aiskills] not adding this install to the skills.sh count: npm uses a registry mirror (<host>); turn on with --stats
```

Only the mirror's host is shown, never its path or credentials, and never a proxy's address. `--stats`, `AISKILLS_STATS=1`, `aiskills config stats true` or a remembered `--stats` still turn it on. `aiskills info` shows the reason as the setting's source. See [Use aiskills behind a firewall](../guides/use-behind-a-firewall.md).

## Without access to github.com

Where the count does run but github.com is blocked, the clone (or the check with api.github.com) fails. Then nothing is counted and nothing is shown, and the install's exit status is unchanged: it had already finished. To see what the count does, run it in the foreground:

```bash
AISKILLS_STATS_FOREGROUND=1 aiskills install
```

## Turning it off

| How | Lasts |
| --- | --- |
| `aiskills install --no-stats` | Remembered in `aiskills.json` until `--stats` |
| `aiskills sync --no-stats` | The same, without installing anything |
| [`AISKILLS_STATS=0`](../reference/environment.md#aiskills_stats) | While it's set; wins over the remembered choice, not over `--stats` |
| `DO_NOT_TRACK`, `DISABLE_TELEMETRY` (any value) | Always off, even with `--stats`; they also turn off the `skills` CLI's own telemetry |
| `CI`, `GITHUB_ACTIONS` set | Always off |
| npm uses a registry mirror or a proxy | Off by default; any choice above turns it on again |

See also: [Security model](security.md) · [`--no-stats`](../reference/cli.md#--no-stats) · [Environment variables](../reference/environment.md)
