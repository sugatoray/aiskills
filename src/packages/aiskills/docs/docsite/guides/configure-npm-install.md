# How to configure the npm install step

Use `AISKILLS_*` environment variables when you want `npm install` itself to install a particular set of skills, or nothing at all.

The package's `postinstall` step reads the same choices as `aiskills install`, but from the environment, because npm passes no arguments to it.

## Steps

1. Pick the variables for what you want:

   | You want | Set |
   | --- | --- |
   | Some groups | `AISKILLS_GROUPS=scrolls,personas` |
   | Some skills | `AISKILLS_SKILLS='scrolls-*,prodigy'` |
   | Some agents | `AISKILLS_AGENTS=claude-code,codex` |
   | The current project, not your user | `AISKILLS_SCOPE=project` |
   | Copies instead of symlinks | `AISKILLS_COPY=1` |
   | The repo's folder layout | `AISKILLS_LAYOUT=nested` |
   | Also external skills in `AISKILLS_SKILLS` | `AISKILLS_ROUTE=1` |

2. Set them on the npm command:

   ```bash
   AISKILLS_GROUPS=scrolls AISKILLS_AGENTS='claude*' npm install -g @sugatoray-ai/aiskills
   ```

3. Check the result, since npm hides the step's output:

   ```bash
   aiskills installed
   ```

## Variations

### Save the files but don't register them

```bash
AISKILLS_SKIP_SKILLS_ADD=1 npm install -g @sugatoray-ai/aiskills
```

The skills are saved to `~/.config/sugatoray/aiskills/skills/`; run `aiskills install ...` later. The step also skips registering when `CI` is set.

### Skip the step entirely

```bash
AISKILLS_SKIP_POSTINSTALL=1 npm install -g @sugatoray-ai/aiskills
```

Or `npm install --ignore-scripts`. Nothing is written until you run `aiskills install` or `aiskills sync`.

### Make the choices the defaults for the CLI too

`aiskills install`, `uninstall` and `installed` read the same variables as defaults; options on the command line replace them. Put them in your shell profile to use them everywhere:

```bash
export AISKILLS_AGENTS=claude-code,codex
```

## Troubleshooting

- **No skills appeared after `npm install`**: the step never fails the npm install, so look for a reason by running the same choice with the CLI, e.g. `aiskills install -G scrolls`. It prints the error.
- **pnpm or bun**: they skip install steps by default; run `aiskills install` once.
- **An unknown name in `AISKILLS_SKILLS`** stops the step with `unknown skill(s) in AISKILLS_SKILLS`. Fix the name, or set `AISKILLS_ROUTE=1` to look it up.

See also: [Environment variables](../reference/environment.md) · [Installation](../getting-started/installation.md)
