# How to set default choices with environment variables

Use `AISKILLS_*` environment variables when you run `aiskills` with the same choices every time, or when a script or CI job should not have to repeat them.

`aiskills install`, `uninstall`, `installed` and `sync` read these variables as defaults. An option on the command line replaces the matching variable.

## Steps

1. Pick the variables for what you want:

   | You want | Set | Same as |
   | --- | --- | --- |
   | Some groups | `AISKILLS_GROUPS=scrolls,personas` | `-G` |
   | Some skills | `AISKILLS_SKILLS='scrolls-*,prodigy'` | `-s` |
   | Some agents | `AISKILLS_AGENTS=claude-code,codex` | `-a` |
   | The current project, not your user | `AISKILLS_SCOPE=project` | `-p` |
   | Copies instead of symlinks | `AISKILLS_COPY=1` | `--copy` |
   | The repo's folder layout | `AISKILLS_LAYOUT=nested` | `--nested` |
   | Also external skills in `-s` | `AISKILLS_ROUTE=1` | `--route` |

2. Set them for one command:

   ```bash
   AISKILLS_GROUPS=scrolls AISKILLS_AGENTS='claude*' aiskills install
   ```

3. Check the result:

   ```bash
   aiskills installed
   ```

## Variations

### Make them your defaults everywhere

Put them in your shell profile (`~/.bashrc`, `~/.zshrc`, ...):

```bash
export AISKILLS_AGENTS=claude-code,codex
```

### Override a default for one command

Options win over variables. With `AISKILLS_AGENTS=claude-code` set, this installs for Codex only:

```bash
aiskills install -a codex
```

## Troubleshooting

- **A command installs for fewer agents or skills than expected**: a variable is set in your shell. `env | grep AISKILLS_` shows them.
- **A name in `AISKILLS_SKILLS` isn't bundled**: `aiskills install` stops with `not provided by this package`. Fix the name, or set `AISKILLS_ROUTE=1` to look it up in the skills registry.

See also: [Environment variables](../reference/environment.md) · [Installation](../getting-started/installation.md)
