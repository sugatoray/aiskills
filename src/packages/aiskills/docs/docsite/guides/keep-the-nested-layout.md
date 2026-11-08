# How to keep the repo's nested layout

Use `--nested` when you want `~/.config/sugatoray/aiskills/skills/` to look exactly like the repo's `skills/` folder, for browsing or editing.

## Steps

1. Rewrite the folder in the nested layout:

   <!-- verify -->
   ```bash
   aiskills sync --nested
   ```

   ```text
   [aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (nested layout)
   ```

2. Browse it: skills are now under their group folders, e.g. `skills/scrolls/scrolls-setup/`, with the groups' `README.md` and `.claude-plugin/plugin.json` files next to them.

The choice is saved in `~/.config/sugatoray/aiskills/aiskills.json`, so later `install`, `sync`, `list` and `groups` keep using it.

## Variations

### Install and nest in one go

```bash
aiskills --nested
aiskills install --nested -G scrolls
```

`aiskills --nested` on its own means `aiskills install --nested`.

### Go back to flat

<!-- verify -->
```bash
aiskills sync --flat
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
```

### Nested by default

Set `AISKILLS_LAYOUT=nested` in your shell profile, and every sync uses the nested layout without `--nested`:

```bash
export AISKILLS_LAYOUT=nested
```

## Troubleshooting

- **My edits disappeared**: every sync replaces `skills/`. Edit a copy elsewhere, or contribute the change to the repo.
- **Skills behave differently**: they don't; `npx skills add` finds the same skills in either layout.

See also: [Layouts: flat and nested](../concepts/layouts.md) · [`--nested`](../reference/cli.md#--nested)
