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

Leave out `-a` and `npx skills` installs for every agent it detects on your machine: each agent whose folder exists (such as `~/.claude` or `~/.codex`), plus the agents that share `~/.config/agents/skills`. If it detects none, it installs for every agent it supports.

## Pick from a list (`-i`)

`-i` (`--interactive`) lets `npx skills add` ask you, the way it does when you run it yourself:

```bash
aiskills install -i
```

It shows three pickers: the skills (all checked; uncheck what you don't want), the agents (the ones you picked last time are already checked) and how to install (symlink or copy). `-s`, `-G` and `-a` still work and skip the matching picker, so `aiskills install -i -G scrolls` only asks about agents. `-i` needs a terminal.

## Reuse your last pick (`-l`)

`npx skills` remembers the agents you picked in its agent picker. `-l` (`--last-agents`) installs for exactly those, without asking:

<!-- verify: last=claude-code,codex -->
```bash
aiskills install -l -G stata
```

```text
[aiskills] last-picked agents: claude-code, codex
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: stata-recipes
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill stata-recipes --agent claude-code --agent codex --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

If you have never picked agents in `npx skills add`, `-l` stops before installing anything:

<!-- verify -->
```bash
aiskills install -l
```

```text
[aiskills] --last-agents: no agents recorded in ~/.agents/.skill-lock.json
  pick them once with 'aiskills install -i' (or 'npx skills add'), or use -a <agents>
```

A good habit: run `aiskills install -i` once to choose your agents, then `aiskills install -l` for later updates.

## Recap

- `-s` picks skills, `-G` picks groups, and they combine.
- Patterns work in `-s`, `-G` and `-a`; quote them.
- The `bundled:` line shows exactly what will be installed.
- `-i` lets you pick from a list; `-l` reuses the agents you picked last time.

Reference: [`-s`, `--skill`](../reference/cli.md#-s---skill) · [`-a`, `--agent`](../reference/cli.md#-a---agent) · [`-i`, `--interactive`](../reference/cli.md#-i---interactive) · [`-l`, `--last-agents`](../reference/cli.md#-l---last-agents) · [Patterns](../reference/patterns.md)

Next: [3. Install into a project](03-install-into-a-project.md) · Previous: [1. Install a group](01-install-a-group.md)
