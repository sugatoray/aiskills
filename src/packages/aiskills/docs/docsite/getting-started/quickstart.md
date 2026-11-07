# Quickstart

In five commands: see what's in the package, install a group for one agent, check it, and remove it.

**You'll need:** the package installed ([Installation](installation.md)).

## 1. See the groups

```bash
aiskills groups
```

Each group lists its alias and its skills. The full output is in [Tutorial step 1](../tutorial/01-install-a-group.md).

## 2. Install a group for one agent

<!-- verify -->
```bash
aiskills install -G personas -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: prodigy
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill prodigy --agent claude-code --yes
```

`npx skills` then prints its own progress. In Claude Code, the skill is now available as `/prodigy`.

## 3. Check what's installed

<!-- verify: list=prodigy -->
```bash
aiskills installed
```

```text
prodigy                    personas-skills        Claude Code
```

The columns are the skill, its group, and the agents it is installed for.

## 4. Preview the removal

<!-- verify: list=prodigy -->
```bash
aiskills uninstall -n
```

```text
[aiskills] [dry-run] would remove (global): prodigy
[aiskills] [dry-run] npx -y skills@1.7.6 remove prodigy --global --yes
[aiskills] skill files kept in ~/.config/sugatoray/aiskills/skills (re-add with 'aiskills install'; delete with --purge).
```

## 5. Remove it

```bash
aiskills uninstall
```

As the preview said, the skill files stay in `~/.config/sugatoray/aiskills/skills/`, so `aiskills install` can add them back offline.

## Recap

- `aiskills groups` shows what you can install.
- `aiskills install -G <group> -a <agent>` installs a group for an agent.
- `aiskills installed` and `aiskills uninstall -n` show what is there and what would go.

Next: the [Tutorial](../tutorial/01-install-a-group.md) covers patterns, projects, external skills and uninstalling in more depth.

See also: [CLI reference](../reference/cli.md)
