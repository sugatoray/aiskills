# The skills.sh install count

After `aiskills install`, a background `npx skills add sugatoray/aiskills` adds the install to each skill's count on [skills.sh](https://skills.sh); it needs github.com, fails silently without it, and `--no-stats` turns it off.

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

## Without access to github.com

Behind a firewall or a proxy that blocks github.com, the clone (or the check with api.github.com) fails. Then nothing is counted and nothing is shown, and the install's exit status is unchanged: it had already finished. To see what the count does, run it in the foreground:

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

See also: [Security model](security.md) · [`--no-stats`](../reference/cli.md#--no-stats) · [Environment variables](../reference/environment.md)
