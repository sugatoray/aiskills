# How to remove everything

Use this to take the skills, the install folder and the npm package off your machine.

npm runs nothing when a package is uninstalled, so remove the skills **before** the package.

## Steps

1. Preview:

   ```bash
   aiskills uninstall --purge -n
   ```

2. Remove every skill this package installed, then delete `~/.config/sugatoray/aiskills`:

   ```bash
   aiskills uninstall --purge
   ```

3. If you installed into projects, repeat in each project:

   ```bash
   aiskills uninstall -p
   ```

4. Remove the package:

   ```bash
   npm uninstall -g @sugatoray-ai/aiskills
   ```

## Variations

### The package is already gone

Run the CLI once through `npx`:

```bash
npx @sugatoray-ai/aiskills uninstall --purge
```

Or do it by hand with `npx skills`:

```bash
npx skills list -g
npx skills remove <skill...> --global --yes
rm -rf ~/.config/sugatoray/aiskills
```

### External skills too

A full uninstall never removes skills from other sources, even with `--route`. Name them:

```bash
aix uninstall -s pdf,docx
```

## Troubleshooting

- **`--purge only applies to a full uninstall`**: drop `-s`/`-G`.
- **`... is not an aiskills folder ...`**: `AISKILLS_HOME` points at a folder that `aiskills` didn't create, so it refuses to delete it. See [Errors](../reference/errors.md#not-an-aiskills-folder).

See also: [5. Uninstall](../tutorial/05-uninstall.md) · [`--purge`](../reference/cli.md#--purge)
