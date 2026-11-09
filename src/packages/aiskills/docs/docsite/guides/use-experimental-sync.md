# How to use the package with `npx skills experimental_sync`

Use this when you want a project's skills pinned by its lockfile, installed from `node_modules`, without the `aiskills` command or `~/.config/sugatoray/aiskills`.

The `skills` CLI has an `experimental_sync` command that installs skills found in a project's `node_modules`. It looks for `<package>/skills/<name>/SKILL.md`, one level deep. This package ships its skills exactly that way.

## Steps

1. Add the package as a dev dependency:

   ```bash
   npm install --save-dev @sugatoray-ai/aiskills
   ```

2. Install its skills into the project:

   ```bash
   npx skills experimental_sync --agent claude-code --yes
   ```

3. Commit the lockfile. Everyone who runs steps 1–2 gets the same skills.

## Variations

### Update

```bash
npm install --save-dev @sugatoray-ai/aiskills@latest
npx skills experimental_sync --agent claude-code --yes
```

## Troubleshooting

- **Nothing is installed**: check that `node_modules/@sugatoray-ai/aiskills/skills/` exists. It is created by `npm pack`, so it's there in the published package but not in a git checkout of the repo.
- **The command changed**: `experimental_sync` is marked experimental by the `skills` CLI and may change. `aiskills install -p` is the stable alternative.

See also: [Layouts: flat and nested](../concepts/layouts.md) · [3. Install into a project](../tutorial/03-install-into-a-project.md)
