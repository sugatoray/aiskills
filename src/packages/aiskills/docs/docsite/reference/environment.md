# Environment variables reference

Every environment variable `aiskills` and its npm install step read; this page is exhaustive.

Variables give defaults. An option on the command line replaces the matching variable. The npm install step (`postinstall`) takes no options, so it reads only these. Values that are lists are comma-separated, and accept [patterns](patterns.md). "Truthy" means `1`, `true` or `yes`, in any case.

<!-- verify -->
```bash
AISKILLS_LAYOUT=nested aiskills sync
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (nested layout)
```

## Choosing skills and agents

### `AISKILLS_SKILLS`

Default for `-s`: skill names or patterns. Unset: every skill. In the install step, a name that isn't bundled is an error unless [`AISKILLS_ROUTE`](#aiskills_route) is truthy.

### `AISKILLS_GROUPS`

Default for `-G`: group names, aliases or patterns. Combined with `AISKILLS_SKILLS` (union).

### `AISKILLS_AGENTS`

Default for `-a`: agent names or patterns. Unset: the agents `npx skills` detects.

### `AISKILLS_SCOPE`

`project` = `-p`; anything else, or unset, = `-g` (global).

### `AISKILLS_COPY`

Truthy = `--copy`.

### `AISKILLS_ROUTE`

Truthy = `--route`. The `aix` command sets it. In the install step, lets names in `AISKILLS_SKILLS` that aren't bundled be looked up.

### `AISKILLS_LAYOUT`

`flat` or `nested`, the same as `--flat` / `--nested`. A command-line flag wins over it; it wins over the remembered layout. Any other value fails with `unknown layout`.

## Where things go

### `AISKILLS_HOME`

The install folder. Default: `~/.config/sugatoray/aiskills`. A relative path is resolved from the current folder. If the folder exists, it must be empty or an aiskills folder (it has `aiskills.json`); otherwise `aiskills` refuses to replace or delete it.

### `AISKILLS_SKILLS_VERSION`

The `skills` CLI version every `npx` call runs. Default: `1.7.6` (pinned and tested). Accepts an exact version (`1.7.6`, `1.8.0-beta.1`), `latest` or `next`; anything else is refused. See [Choose the `skills` CLI version](../guides/choose-the-skills-cli-version.md).

## The npm install step

### `AISKILLS_SKIP_POSTINSTALL`

Truthy: the install step does nothing. Same effect as `npm install --ignore-scripts` for this package.

### `AISKILLS_SKIP_SKILLS_ADD`

Truthy: the install step saves the skills to the install folder but doesn't run `npx skills add`.

### `CI`

Truthy (most CI systems set `CI=true`): same as `AISKILLS_SKIP_SKILLS_ADD`. Only the install step reads it; `aiskills install` in CI still installs.

### `INIT_CWD`

Set by npm to the folder `npm install` was run from. With `AISKILLS_SCOPE=project`, the install step installs into that folder.

## Read by `npx skills`, passed through

`aiskills` passes every variable to `npx` except npm's own `npm_*` variables (registry, proxy and certificate settings among them are kept). These are worth knowing:

| Variable | Effect in `npx skills` |
| --- | --- |
| `DISABLE_TELEMETRY`, `DO_NOT_TRACK` | Turn off its anonymous usage data to `skills.sh` |

See also: [Configure the npm install step](../guides/configure-npm-install.md) · [CLI reference](cli.md)
