# scrolls-remove

Removes a docs/.scrolls/ (or docs/scrolls/) project-memory system from a git repository — the exact opposite of /scrolls-setup. Deletes the scrolls folder, deletes SCROLLS.md, strips the scrolls pointer stub out of CLAUDE.md (and the dangling pointer out of AGENTS.md), deleting either file outright only when nothing else is left in it, and records the whole removal as ONE git commit whose message names the commit just before the removal, so it can always be undone. Use this whenever the user runs /scrolls-remove, or asks to remove, delete, uninstall, tear down, or get rid of the scrolls / project memory / docs/.scrolls. Supports -p/--path (repeatable), -t/--reporoot, -l/--local, -r/--recurse to find and remove every scrolls folder under a directory in one commit, -x/--purge [CLAUDE.md|AGENTS.md|SCROLLS.md|<other file>|all] to delete pointer files outright even when they hold other content, -n/--dry-run, -y/--yes to skip the confirmation, and --no-commit. Refuses to run when anything it would remove has uncommitted changes, since those could not be restored. Works on macOS, Linux, and Windows (bash or PowerShell).

| Property | Value |
| --- | --- |
| Group | `scrolls-skills` (alias `scrolls`) |
| Version | 2.5.0 |
| Starts | When you ask for it: you type `/scrolls-remove` (your agent doesn't start it on its own) |
| Needs | bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies); git |
| License | MIT |
| Source | [skills/scrolls/scrolls-remove](https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-remove) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s scrolls-remove -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: scrolls-remove
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill scrolls-remove --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `scrolls-skills` group:

```bash
aiskills install -G scrolls -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s scrolls-remove
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/scrolls-remove/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/EXAMPLES.md`
- `meta/MAINTAINERS.md`
- `scripts/remove.ps1`
- `scripts/remove.py`
- `scripts/remove.sh`
- `tests/test_remove.ps1`
- `tests/test_remove.sh`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-remove/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-remove/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
