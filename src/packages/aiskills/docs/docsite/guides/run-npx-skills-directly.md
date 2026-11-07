# How to run any `npx skills` command

Use `aiskills skills <args>` when you need a `skills` command or flag that `aiskills` doesn't wrap, such as `update`, `use` or `init`.

It passes the arguments to `npx skills` unchanged, with two extras: the pinned `skills` version, and `:root` replaced by the install folder.

## Steps

1. Write the `npx skills` command you want, and put `aiskills skills` in front instead of `npx skills`:

   <!-- verify -->
   ```bash
   aiskills skills list -g
   ```

   ```text
   [aiskills] running: npx -y skills@1.7.6 list -g
   ```

   The `npx skills` output follows that line.

2. Use `:root` where you need the install folder:

   <!-- verify -->
   ```bash
   aiskills skills add :root -s prodigy -g -y
   ```

   ```text
   [aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills -s prodigy -g -y
   ```

## Variations

### Extra flags on `install` and `uninstall`

Anything after `--` is added to the end of the `npx skills` command. For example, `--json` makes `npx skills add` print its result as JSON:

<!-- verify -->
```bash
aiskills install -G stata -a claude-code -- --json
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: stata-recipes
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill stata-recipes --agent claude-code --yes --json
```

### Search the registry

`aiskills find <query>` is `npx skills find <query>`:

<!-- verify -->
```bash
aiskills find pdf
```

```text
[aiskills] running: npx -y skills@1.7.6 find pdf
…
```

See also: [`skills`](../reference/cli.md#skills) · [Choose the `skills` CLI version](choose-the-skills-cli-version.md)
