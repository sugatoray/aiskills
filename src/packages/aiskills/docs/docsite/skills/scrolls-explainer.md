# scrolls-explainer

Writes scrolls-explainer.html: an interactive, offline page that explains how the scrolls skill family works (/scrolls-setup, /scrolls-update, /scrolls-hide, /scrolls-unhide, /scrolls-remove, /scrolls-restore, /scrolls-help) — one tab per command that animates, step by step, what the command does to docs/.scrolls/, SCROLLS.md, CLAUDE.md, AGENTS.md and git, with a callout explaining each step, a tab for how a new agent session reads the memory, and full keyboard navigation (arrows step, [ ] or 0-8 switch tabs, Space pauses, ? lists shortcuts). Use this whenever the user runs /scrolls-explainer, or asks for a visual, diagram, animation, walkthrough, explainer or interactive page of how the scrolls commands or the scrolls memory work, or wants something to show a team. Writes ./scrolls-explainer.html by default; supports -o/--output for another file or folder, -f/--force to overwrite, and --open to open it in a browser. Works on macOS, Linux, and Windows (bash or PowerShell).

| Property | Value |
| --- | --- |
| Group | `scrolls-skills` (alias `scrolls`) |
| Version | 2.5.0 |
| Starts | When you ask for it: you type `/scrolls-explainer` (your agent doesn't start it on its own) |
| Needs | bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies); any modern web browser to view the page |
| License | MIT |
| Source | [skills/scrolls/scrolls-explainer](https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-explainer) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s scrolls-explainer -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: scrolls-explainer
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill scrolls-explainer --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `scrolls-skills` group:

```bash
aiskills install -G scrolls -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s scrolls-explainer
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/scrolls-explainer/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/EXAMPLES.md`
- `assets/scrolls-explainer.html`
- `meta/MAINTAINERS.md`
- `meta/generator/build.py`
- `meta/generator/enhance.py`
- `meta/generator/graph.json`
- `scripts/explain.ps1`
- `scripts/explain.py`
- `scripts/explain.sh`
- `tests/browser/check_page.cjs`
- `tests/test_explain.ps1`
- `tests/test_explain.sh`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-explainer/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-explainer/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
