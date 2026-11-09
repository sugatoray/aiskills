# Environment variables reference

Every environment variable `aiskills` reads; this page is exhaustive. `npm install` reads none of them: the package has no install step.

Variables give defaults. An option on the command line replaces the matching variable. Values that are lists are comma-separated, and accept [patterns](patterns.md). "Truthy" means `1`, `true` or `yes`, in any case.

<!-- verify -->
```bash
AISKILLS_LAYOUT=nested aiskills sync
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (nested layout)
```

## Choosing skills and agents

### `AISKILLS_SKILLS`

Default for `-s`: skill names or patterns. Unset: every skill. A name that isn't bundled is an error unless [`AISKILLS_ROUTE`](#aiskills_route) is truthy.

### `AISKILLS_GROUPS`

Default for `-G`: group names, aliases or patterns. Combined with `AISKILLS_SKILLS` (union).

### `AISKILLS_AGENTS`

Default for `-a`: agent names or patterns. Unset: the agents `npx skills` detects.

### `AISKILLS_SCOPE`

`project` = `-p`; anything else, or unset, = `-g` (global).

### `AISKILLS_COPY`

Truthy = `--copy`.

### `AISKILLS_ROUTE`

Truthy = `--route`. The `aix` command sets it. Lets names in `AISKILLS_SKILLS` that aren't bundled be looked up.

### `AISKILLS_LAYOUT`

`flat` or `nested`, the same as `--flat` / `--nested`. A command-line flag wins over it; it wins over the remembered layout. Any other value fails with `unknown layout`.

## Where things go

### `AISKILLS_HOME`

The install folder. Default: `~/.config/sugatoray/aiskills`. A relative path is resolved from the current folder. If the folder exists, it must be empty or an aiskills folder (it has `aiskills.json`); otherwise `aiskills` refuses to replace or delete it.

### `AISKILLS_SKILLS_VERSION`

The `skills` CLI version every `npx` call runs. Default: `1.7.6` (pinned and tested). Accepts an exact version (`1.7.6`, `1.8.0-beta.1`), `latest` or `next`; anything else is refused. See [Choose the `skills` CLI version](../guides/choose-the-skills-cli-version.md).

## Read by `npx skills`, passed through

`aiskills` passes every variable to `npx` except npm's own `npm_*` variables (registry, proxy and certificate settings among them are kept). These are worth knowing:

| Variable | Effect in `npx skills` |
| --- | --- |
| `DISABLE_TELEMETRY`, `DO_NOT_TRACK` | Turn off its anonymous usage data to `skills.sh` |

See also: [Set default choices](../guides/set-defaults.md) · [CLI reference](cli.md)
