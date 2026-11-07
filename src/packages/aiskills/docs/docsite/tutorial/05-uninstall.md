# 5. Uninstall

After this step you can remove some or all of the skills, and preview a removal first.

**You'll need:** the previous steps.

## Preview with `-n`

`-n` (`--dry-run`) prints what would be removed and the exact command, and changes nothing. Suppose `npx skills` has `scrolls-setup` and `prodigy` installed from this package, and `docx` from elsewhere:

<!-- verify: list=scrolls-setup,prodigy,anthropics/skills@docx -->
```bash
aiskills uninstall -n
```

```text
[aiskills] [dry-run] would remove (global): prodigy, scrolls-setup
[aiskills] [dry-run] npx -y skills@1.7.6 remove prodigy scrolls-setup --global --yes
[aiskills] skill files kept in ~/.config/sugatoray/aiskills/skills (re-add with 'aiskills install'; delete with --purge).
```

A full uninstall removes only what `npx skills` recorded as installed from `~/.config/sugatoray/aiskills`. `docx` isn't touched.

## Remove some skills

`-s` and `-G` work as they do for install, patterns included. With a pattern or a group, only skills that are actually installed are removed:

<!-- verify: list=scrolls-help,scrolls-hide,scrolls-setup -->
```bash
aiskills uninstall -s 'scrolls-[hu]*' -n
```

```text
[aiskills] [dry-run] would remove (global): scrolls-help, scrolls-hide
[aiskills] [dry-run] npx -y skills@1.7.6 remove scrolls-help scrolls-hide --global --yes
```

Drop `-n` to remove them:

```bash
aiskills uninstall -s 'scrolls-[hu]*'
```

## Remove from one agent

`-a` unlinks the skills from those agents only:

```bash
aiskills uninstall -a codex
```

## Remove an external skill

Without `--route`, `uninstall` refuses names this package doesn't provide. With it, names also match skills from other sources:

```bash
aix uninstall -s docx
```

## Remove everything, files included

`--purge` runs a full uninstall and then deletes `~/.config/sugatoray/aiskills`:

<!-- verify: list=scrolls-setup -->
```bash
aiskills uninstall --purge -n
```

```text
[aiskills] [dry-run] would remove (global): scrolls-setup
[aiskills] [dry-run] npx -y skills@1.7.6 remove scrolls-setup --global --yes
[aiskills] [dry-run] would delete ~/.config/sugatoray/aiskills
```

## Recap

- `-n` previews any uninstall.
- No `-s`/`-G` removes exactly what this package installed; `-s`/`-G`/`-a` narrow it.
- `--route` (or `aix`) lets names match skills from other sources.
- `--purge` also deletes the install folder.

Reference: [`uninstall`](../reference/cli.md#uninstall) · [Remove everything](../guides/remove-everything.md)

Previous: [4. Add external skills](04-add-external-skills.md) · Back to the [docs home](../README.md)
