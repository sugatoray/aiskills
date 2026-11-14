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

### `AISKILLS_STATS`

`0` or `1` (also `false`/`true`, `no`/`yes`, `off`/`on`): the same as `--no-stats` / `--stats` while it's set, but not remembered. `--stats`/`--no-stats` win over it; it wins over the choice remembered in `aiskills.json`. Empty means unset; any other value fails with `AISKILLS_STATS must be 1 or 0`. See [The skills.sh install count](../concepts/install-count.md).

### `AISKILLS_STATS_FOREGROUND`

`1` (or `true`, `yes`, `on`): run the [skills.sh install count](../concepts/install-count.md) in the foreground after `aiskills install`, and show its output, to see why a count doesn't happen. Its exit status still doesn't change the install's.

## Where things go

### `AISKILLS_HOME`

The install folder. Default: `~/.config/sugatoray/aiskills`. A relative path is resolved from the current folder. If the folder exists, it must be empty or an aiskills folder (it has `aiskills.json`); otherwise `aiskills` refuses to replace or delete it.

### `AISKILLS_SKILLS_LIB_VERSION`

The version of the `skills` CLI library that every `npx` call runs (not the version of the bundled skills). Default: `1.7.6` (pinned and tested). Accepts an exact version (`1.7.6`, `1.8.0-beta.1`), `latest`, `next`, an npm range (`~1.7.4`, `1.7.x`, `>=1.7.4 <1.8.0`) or interval notation, where exactly one of `...`, `?` or `*` is an open end (no combinations): `[x, ...)` (or `[x, ?)`, `[x, *)`) is `>=x`, `(x, ...)` is `>x`, `[x, y)` is `>=x <y`, `(..., x]` is `<=x`, and the other mixes of `[ ( ) ]`. With a range, npm picks the newest version its own rules (such as `min-release-age`) allow. A typographic `…` (as autocorrect makes it) is read as `...`. Only plain spaces may separate a range's parts; tabs, line breaks and Unicode spaces are refused. Anything else, or an interval no version fits, is refused. When it overrides the pinned version, every command says so once: `using skills@<spec> from AISKILLS_SKILLS_LIB_VERSION, not the tested 1.7.6`. See [Choose the `skills` CLI version](../guides/choose-the-skills-cli-version.md).

Its old name, `AISKILLS_SKILLS_VERSION` (0.4.0 to 0.5.0; deprecated with a warning from 0.6.0 to 0.9.0), was removed in 1.0.0 and is no longer read: if it's still set, the pinned version runs, without a warning. Rename it in your profile, `.envrc` or CI.

## `info` and `releases`

### `AISKILLS_TODAY`

A date (`YYYY-MM-DD`) that [`aiskills releases`](cli.md#releases) treats as today when it shows a release's age (`3 days ago`). Unset, today is the current UTC date. For reproducible output, as in tests and these docs; it doesn't change the download periods, which end on npm's latest day of data. Anything but a real date stops with `AISKILLS_TODAY must be a date (YYYY-MM-DD)`.

### `AISKILLS_NPM_API_URL`

The base URL of the npm download counts API that [`aiskills releases --downloads`](cli.md#--downloads) asks. Default: `https://api.npmjs.org`. For tests, or a mirror that serves the same paths (`/downloads/point/...`, `/downloads/range/...`, `/versions/...`). The release list itself comes from `npm view`, which uses your npm registry setting instead.

### `TERM`

Set by your terminal. When it is `dumb`, [`aiskills releases`](cli.md#releases) draws the downloads chart with `#`, as with [`--ascii`](cli.md#--ascii), and the output isn't colored.

## Colored output

On a terminal, `aiskills` colors its output; piped output is plain. See [Colored output](cli.md#colored-output). Both variables are also passed on to `npx skills`.

### `NO_COLOR`

Any non-empty value turns color off, as [`--no-color`](cli.md#--no-color) does. Wins over `FORCE_COLOR`; `--color` wins over it. The [NO_COLOR](https://no-color.org) convention.

### `FORCE_COLOR`

Any non-empty value except `0` or `false` turns color on even when the output isn't a terminal, as [`--color`](cli.md#--color) does. `NO_COLOR` and `--no-color` win over it.

## Read by `npx skills`, passed through

`aiskills` passes every variable to `npx` except npm's own `npm_*` variables (registry, proxy and certificate settings among them are kept). These are worth knowing:

| Variable | Effect in `npx skills` |
| --- | --- |
| `DISABLE_TELEMETRY`, `DO_NOT_TRACK` | Turn off its anonymous usage data to `skills.sh`, and the [skills.sh install count](../concepts/install-count.md) (any value) |
| `CI`, `GITHUB_ACTIONS` | Read by `aiskills`: when set, the skills.sh install count is off |
| `npm_config_min_release_age`, `npm_config_min_release_age_exclude`, `npm_config_before` | npm's release-age rule, passed on to `npx` (other `npm_config_*` variables except registry, proxy and certificate settings are not). `npm_config_min_release_age=0 aiskills <command>` relaxes it for one run. See [When npm's release-age rule blocks the pinned version](../guides/choose-the-skills-cli-version.md#when-npms-release-age-rule-blocks-the-pinned-version) |

See also: [Set default choices](../guides/set-defaults.md) · [CLI reference](cli.md)
