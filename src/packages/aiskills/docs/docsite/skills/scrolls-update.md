# scrolls-update

Updates an existing docs/.scrolls/ project-memory system (STARTER.md, SPEC.md, HANDOFF.md, GAP_ANALYSIS.md, GAP_CONTEXT.md, PLAN.md, WISDOM.md, and any project-specific scrolls beyond that core set) to reflect what actually happened in the current session, following each file's own update rule instead of appending blindly. Also backfills SCROLLS.md/CLAUDE.md/AGENTS.md if the project predates them (idempotent — safe every run, never overwrites existing CLAUDE.md content). Use this whenever the user runs /scrolls-update, or asks to update the scrolls, refresh HANDOFF.md, write session handoff notes, record what was just done, close out or wrap up a session, log a new gap or trap, or update project memory / STARTER.md's docs. This is the counterpart to /scrolls-setup (which creates the system once) — use this one for every session afterward. Supports -p/--path for a custom docs location, -t/--reporoot to look under the git repository's top level regardless of which subdirectory you're in, -l/--local to look explicitly in the current directory, and -r/--recurse to search recursively for the scrolls folder if it isn't at the obvious exact location. Defaults to the current directory, but warns first if that differs from the repo root so a subdirectory invocation doesn't silently miss the real scrolls. Works on macOS, Linux, and Windows (bash or PowerShell). If no scrolls folder is found, say so and point at /scrolls-setup instead of inventing files here.

| Property | Value |
| --- | --- |
| Group | `scrolls-skills` (alias `scrolls`) |
| Version | 2.4.0 |
| Starts | When you ask for it: you type `/scrolls-update` (your agent doesn't start it on its own) |
| Needs | bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies) |
| License | MIT |
| Source | [skills/scrolls/scrolls-update](https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-update) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s scrolls-update -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: scrolls-update
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill scrolls-update --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `scrolls-skills` group:

```bash
aiskills install -G scrolls -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s scrolls-update
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/scrolls-update/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/EXAMPLES.md`
- `meta/MAINTAINERS.md`
- `scripts/session_diff.ps1`
- `scripts/session_diff.sh`
- `tests/test_session_diff.ps1`
- `tests/test_session_diff.sh`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-update/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-update/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
