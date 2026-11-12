# scrolls-restore

Restores a docs/.scrolls/ (or docs/scrolls/) project-memory system from git history — the counterpart to /scrolls-remove. By default finds the newest /scrolls-remove checkpoint in HEAD's history and brings back exactly what it removed; or takes any COMMIT (a removal commit, or an ordinary commit containing a scrolls folder). Restores ONLY the agentic memory — the scrolls folders plus the SCROLLS.md/CLAUDE.md/AGENTS.md pointer stubs, re-inserted into those files as they are today — never rolling back anything else in the repository, and records it as one git commit. --onto REF mounts the memory onto another branch (or, with -b, a new branch at any commit) through a temporary worktree, without touching the current checkout. Use this whenever the user runs /scrolls-restore, or asks to restore, bring back, recover, undo the removal of, or re-mount the scrolls / project memory / docs/.scrolls. Supports -p/--path (repeatable), -t/--reporoot, -l/--local, -r/--recurse, --onto, -b/--branch, --full, -f/--force, --list [--all], -n/--dry-run, -y/--yes, and --no-commit. Works on macOS, Linux, and Windows (bash or PowerShell).

| Property | Value |
| --- | --- |
| Group | `scrolls-skills` (alias `scrolls`) |
| Version | 2.5.0 |
| Starts | When you ask for it: you type `/scrolls-restore` (your agent doesn't start it on its own) |
| Needs | bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies); git |
| License | MIT |
| Source | [skills/scrolls/scrolls-restore](https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-restore) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s scrolls-restore -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: scrolls-restore
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill scrolls-restore --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `scrolls-skills` group:

```bash
aiskills install -G scrolls -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s scrolls-restore
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/scrolls-restore/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/EXAMPLES.md`
- `meta/MAINTAINERS.md`
- `scripts/restore.ps1`
- `scripts/restore.py`
- `scripts/restore.sh`
- `tests/test_restore.ps1`
- `tests/test_restore.sh`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-restore/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-restore/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
