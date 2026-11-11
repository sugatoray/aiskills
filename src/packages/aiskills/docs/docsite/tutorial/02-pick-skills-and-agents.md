# 2. Pick skills and agents

After this step you can choose skills by name or pattern and install them for several agents at once.

**You'll need:** the previous step.

## Name the skills

`-s` (`--skill`) takes skill names, separated by commas:

<!-- verify -->
```bash
aiskills install -s scrolls-setup,scrolls-update -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: scrolls-setup, scrolls-update
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill scrolls-setup --skill scrolls-update --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

## Use a pattern

`-s`, `-G` and `-a` accept glob patterns: `*` for any text, `?` for one character, `[abc]` for one of a set. Quote them so your shell leaves them alone:

<!-- verify -->
```bash
aiskills install -s 'scrolls-[hu]*' -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: scrolls-help, scrolls-hide, scrolls-unhide, scrolls-update
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill scrolls-help --skill scrolls-hide --skill scrolls-unhide --skill scrolls-update --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

The `bundled:` line shows what the pattern matched, before anything is installed. A pattern that matches nothing stops the command:

<!-- verify -->
```bash
aiskills install -s 'scroll-*'
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] no skill matches: scroll-*
  available: create-issues-update-pr, create-lib-docs, dynamic-promo-video, network-flow, prodigy, scrolls-help, scrolls-hide, scrolls-remove, scrolls-restore, scrolls-setup, scrolls-unhide, scrolls-update, stata-recipes
```

## Mix skills and groups

`-s` and `-G` add up. This installs the personas group plus one skill:

<!-- verify -->
```bash
aiskills install -G personas -s create-lib-docs -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: create-lib-docs, prodigy
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill create-lib-docs --skill prodigy --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

## Several agents

`-a` takes several agents, and patterns too. Plain agent names are passed to `npx skills`, which checks them. A pattern is expanded against the agent list that `npx skills` itself reports, and the result is printed:

```bash
aiskills install -G stata -a claude-code,codex
aiskills install -G stata -a 'claude*,codex'
```

Leave out `-a` and `npx skills` installs for every agent it detects on your machine.

## Recap

- `-s` picks skills, `-G` picks groups, and they combine.
- Patterns work in `-s`, `-G` and `-a`; quote them.
- The `bundled:` line shows exactly what will be installed.

Reference: [`-s`, `--skill`](../reference/cli.md#-s---skill) · [`-a`, `--agent`](../reference/cli.md#-a---agent) · [Patterns](../reference/patterns.md)

Next: [3. Install into a project](03-install-into-a-project.md) · Previous: [1. Install a group](01-install-a-group.md)
