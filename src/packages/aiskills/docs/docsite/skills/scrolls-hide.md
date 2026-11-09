# scrolls-hide

Converts an already-set-up docs/scrolls/ working-memory folder from visible (scrolls) to dotfile-hidden (.scrolls), renaming the folder and rewriting the path references inside it and in SCROLLS.md so nothing breaks. Use this whenever the user runs /scrolls-hide, or asks to hide, dot, or re-hide the scrolls folder, go back to hiding project memory / docs/.scrolls, or rename scrolls to .scrolls. This is the retrofit path for a project that was set up visible and now wants it hidden — for a brand-new project, /scrolls-setup's default (no -u/--unhide flag) already creates it hidden and this skill isn't needed. By default checks one exact location (docs/scrolls under the current directory); supports -r/--recurse to sweep an entire directory tree instead (e.g. every package in a monorepo in one run), repeatable -p/--path to target specific locations, -t/--reporoot to target the git repository's top level regardless of which subdirectory you're in, -l/--local to target the current directory explicitly, and the DEFAULT_SCROLLS_RELPATH environment variable to change the default location. Works on macOS, Linux, and Windows (bash or PowerShell). The opposite of /scrolls-unhide.

| Property | Value |
| --- | --- |
| Group | `scrolls-skills` (alias `scrolls`) |
| Version | 2.4.0 |
| Starts | When you ask for it: you type `/scrolls-hide` (your agent doesn't start it on its own) |
| Needs | bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies) |
| License | MIT |
| Source | [skills/scrolls/scrolls-hide](https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-hide) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s scrolls-hide -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: scrolls-hide
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill scrolls-hide --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `scrolls-skills` group:

```bash
aiskills install -G scrolls -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s scrolls-hide
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/scrolls-hide/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/EXAMPLES.md`
- `meta/MAINTAINERS.md`
- `scripts/hide.ps1`
- `scripts/hide.sh`
- `tests/test_hide.ps1`
- `tests/test_hide.sh`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-hide/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-hide/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
