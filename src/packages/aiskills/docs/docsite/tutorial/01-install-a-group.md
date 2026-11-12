# 1. Install a group

After this step you can find a group of skills and install it for one agent.

**You'll need:** the package installed ([Installation](../getting-started/installation.md)), and at least one agent that `npx skills` supports, such as Claude Code.

## See the groups

<!-- verify -->
```bash
aiskills groups
```

```text
scrolls-skills  (alias: scrolls)
  Scrolls: a git-native markdown system for agentic memory that persists project state across sessions and ag...
  skills: scrolls-explainer, scrolls-help, scrolls-hide, scrolls-remove, scrolls-restore, scrolls-setup, scrolls-unhide, scrolls-update

stata-skills  (alias: stata)
  Stata skills: turns a plain-language data/statistics task into correct, runnable Stata code, with good-vs-b...
  skills: stata-recipes

repo-related-skills  (alias: repo-related)
  Repo-related skills: acting on a repository's own hosted state (issues, pull requests, releases, and simila...
  skills: create-issues-update-pr

docs-skills  (alias: docs)
  Docs skills: writes verified user documentation for a library, CLI or framework, structured like FastAPI, P...
  skills: create-lib-docs

diagrams-skills  (alias: diagrams)
  Animated architecture and network diagrams with flowing packets, orthogonal routing, selectable nodes, and ...
  skills: network-flow

personas-skills  (alias: personas)
  Persona skills: /prodigy acts as the top performer in any role or field and shares how they frame problems,...
  skills: prodigy

video-related-skills  (alias: video-related)
  Video skills: /dynamic-promo-video builds a short narrated promo or intro video (HTML scenes with zoom/tilt...
  skills: dynamic-promo-video

image-styles-skills  (alias: image-styles)
  Skills for generating images in a variety of styles and applying visual styles or effects to existing image...
  skills: artwallbg, commentdrop

Install a group:  aiskills install --group <name|alias> --global --agent <agent>
```

Each group has a name (`scrolls-skills`) and a shorter alias (`scrolls`, the name without `-skills`). Either works. Every bundled skill is in a group; a skill that wasn't would be listed under `(ungrouped; use -s or -G all)`, to install by name or with the built-in group `all`.

## Install one group for one agent

<!-- verify -->
```bash
aiskills install --group scrolls --agent claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: scrolls-explainer, scrolls-help, scrolls-hide, scrolls-remove, scrolls-restore, scrolls-setup, scrolls-unhide, scrolls-update
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill scrolls-explainer --skill scrolls-help --skill scrolls-hide --skill scrolls-remove --skill scrolls-restore --skill scrolls-setup --skill scrolls-unhide --skill scrolls-update --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

What happened, in order:

1. `aiskills` refreshed the skill files in `~/.config/sugatoray/aiskills/skills/` from the package.
2. It turned the group into its seven skills (`bundled: ...`).
3. It ran `npx skills add` on that folder with one `--skill` per skill and your agent. `--global` is the default scope, and `--yes` skips `npx skills`' prompts.

`npx skills` prints its own progress after that line, and the skills appear in Claude Code as `/scrolls-setup`, `/scrolls-update` and so on.

> [!TIP]
> The same command, shorter: `ais i -G scrolls -a claude-code`. `ais` is `aiskills`, `i` is `install`, and `-G`/`-a` are the short forms of `--group`/`--agent`.

## Install several groups

Separate groups with commas, or repeat `-G`:

```bash
aiskills install -G scrolls,personas -a claude-code
aiskills install -G scrolls -G personas -a claude-code
```

## Recap

- `aiskills groups` lists groups, their aliases and their skills.
- `aiskills install -G <group> -a <agent>` installs a group for one agent; `-G` takes the name or the alias.
- `aiskills` always refreshes the saved skills, then hands the install to `npx skills add`.

Reference: [`install`](../reference/cli.md#install) · [`-G`, `--group`](../reference/cli.md#-g---group---groups) · [Skill groups](../concepts/skill-groups.md)

Next: [2. Pick skills and agents](02-pick-skills-and-agents.md)
