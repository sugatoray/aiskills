# scrolls-help

Shows a crisp, example-driven reference for the whole scrolls skill family (/scrolls-setup, /scrolls-update, /scrolls-hide, /scrolls-unhide, /scrolls-remove, /scrolls-restore) — what each command does, their shared -p/-t/-l/-r/-u/-x/--onto flags, and common usage examples (new project, monorepo, running from a subdirectory, toggling hidden/visible, removing and restoring scrolls). Use this whenever the user runs /scrolls-help, or asks what the scrolls commands do, how to use them, what flags they take, which one they need, or seems unsure about docs/.scrolls setup — even if they only name one of the six commands rather than 'scrolls' generally. Supports -e/--online to render it as a styled page served on an OS-assigned localhost port instead of chat text, with light/dark and colorize/plain toggles. Works on macOS, Linux, and Windows (bash or PowerShell).

| Property | Value |
| --- | --- |
| Group | `scrolls-skills` (alias `scrolls`) |
| Version | 2.4.0 |
| Starts | When you ask for it: you type `/scrolls-help` (your agent doesn't start it on its own) |
| Needs | bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies) |
| License | MIT |
| Source | [skills/scrolls/scrolls-help](https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-help) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s scrolls-help -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: scrolls-help
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill scrolls-help --agent claude-code --yes
```

Or the whole `scrolls-skills` group:

```bash
aiskills install -G scrolls -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s scrolls-help
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/scrolls-help/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/EXAMPLES.md`
- `meta/MAINTAINERS.md`
- `meta/SECURITY.md`
- `references/HELP.md`
- `scripts/open_help.ps1`
- `scripts/open_help.sh`
- `scripts/serve_help.py`
- `tests/test_open_help.ps1`
- `tests/test_open_help.sh`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-help/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-help/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
