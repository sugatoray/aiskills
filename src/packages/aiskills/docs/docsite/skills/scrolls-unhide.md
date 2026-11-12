# scrolls-unhide

Converts an already-set-up docs/.scrolls/ working-memory folder from dotfile-hidden (.scrolls) to visible (scrolls), renaming the folder and rewriting the path references inside it and in SCROLLS.md so nothing breaks. Use this whenever the user runs /scrolls-unhide, or asks to unhide, un-dot, or show the scrolls folder, stop hiding project memory / docs/.scrolls, or rename .scrolls to scrolls. This is the retrofit path for a project that was set up hidden and now wants it visible — for a brand-new project, /scrolls-setup's own -u/--unhide flag does this in one step and this skill isn't needed. By default checks one exact location (docs/.scrolls under the current directory); supports -r/--recurse to sweep an entire directory tree instead (e.g. every package in a monorepo in one run), repeatable -p/--path to target specific locations, -t/--reporoot to target the git repository's top level regardless of which subdirectory you're in, -l/--local to target the current directory explicitly, and the DEFAULT_SCROLLS_RELPATH environment variable to change the default location. Works on macOS, Linux, and Windows (bash or PowerShell). The opposite of /scrolls-hide.

| Property | Value |
| --- | --- |
| Group | `scrolls-skills` (alias `scrolls`) |
| Version | 2.5.0 |
| Starts | When you ask for it: you type `/scrolls-unhide` (your agent doesn't start it on its own) |
| Needs | bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies) |
| License | MIT |
| Source | [skills/scrolls/scrolls-unhide](https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-unhide) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s scrolls-unhide -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: scrolls-unhide
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill scrolls-unhide --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `scrolls-skills` group:

```bash
aiskills install -G scrolls -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s scrolls-unhide
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/scrolls-unhide/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/EXAMPLES.md`
- `meta/MAINTAINERS.md`
- `scripts/unhide.ps1`
- `scripts/unhide.sh`
- `tests/test_unhide.ps1`
- `tests/test_unhide.sh`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-unhide/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-unhide/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
