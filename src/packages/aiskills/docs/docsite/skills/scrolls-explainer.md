# scrolls-explainer

Shows, copies or rebuilds scrolls-explainer.html: an interactive, offline page that explains how the scrolls skill family works (/scrolls-setup, /scrolls-update, /scrolls-hide, /scrolls-unhide, /scrolls-remove, /scrolls-restore, /scrolls-help) — one tab per command that animates, step by step, what the command does to docs/.scrolls/, SCROLLS.md, CLAUDE.md, AGENTS.md and git, with a callout explaining each step, a tab for how a new agent session reads the memory, and full keyboard navigation (arrows step, [ ] or digits switch tabs, Space pauses, ? lists shortcuts). Use this whenever the user runs /scrolls-explainer, or asks for a visual, diagram, animation, walkthrough, explainer or interactive page of how the scrolls commands or the scrolls memory work, or wants something to show a team. By default (same as --show) it opens the bundled page in place and copies nothing; -o/--output copies it to a file or folder (-o . for ./scrolls-explainer.html), -f/--force overwrites with -o, --open opens the copy, and --build to regenerate the bundled page from the scrolls-* skills as they are now (their tabs, lockstep version, and a review check when a SKILL.md changed). Works on macOS, Linux, and Windows (bash or PowerShell).

| Property | Value |
| --- | --- |
| Group | `scrolls-skills` (alias `scrolls`) |
| Version | 2.5.0 |
| Starts | When you ask for it: you type `/scrolls-explainer` (your agent doesn't start it on its own) |
| Needs | bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies); any modern web browser to view the page; --build also needs the network-flow skill |
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
- `assets/explainer-graph.json`
- `assets/scrolls-explainer.html`
- `meta/MAINTAINERS.md`
- `scripts/build_page.py`
- `scripts/explain.ps1`
- `scripts/explain.py`
- `scripts/explain.sh`
- `scripts/page_enhance.py`
- `tests/browser/check_page.cjs`
- `tests/test_explain.ps1`
- `tests/test_explain.sh`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-explainer/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-explainer/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
