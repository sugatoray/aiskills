# scrolls-setup

Sets up a minimal docs/.scrolls/ working-memory system for a project — a small set of cross-session memory files (STARTER.md, SPEC.md, HANDOFF.md, GAP_ANALYSIS.md, GAP_CONTEXT.md, PLAN.md, WISDOM.md) plus a SCROLLS.md file that points future sessions at STARTER.md, a short CLAUDE.md pointer to SCROLLS.md, and a matching AGENTS.md pointer to CLAUDE.md for other agent harnesses. Use this whenever the user runs /scrolls-setup, or asks to set up 'scrolls', a project-memory system, session handoff notes, a docs/.scrolls folder, or a CLAUDE.md/AGENTS.md/SCROLLS.md that points new sessions at persistent project docs. Trigger even if the project has no docs/ folder, no CLAUDE.md, no AGENTS.md, or no SCROLLS.md yet — creating them is part of the job. Supports -p/--path for a custom docs location, -t/--reporoot to pin everything to the git repository's top level regardless of which subdirectory you're in, -l/--local to pin it explicitly to the current directory, -r/--recurse to scan recursively for an existing scrolls folder before creating a new one (avoiding accidental duplicates), and -u/--unhide to name the folder scrolls instead of .scrolls. Defaults to the current directory, but warns first if that differs from the repo root so a subdirectory invocation doesn't silently create a second, disconnected scrolls system. Works on macOS, Linux, and Windows (bash or PowerShell).

| Property | Value |
| --- | --- |
| Group | `scrolls-skills` (alias `scrolls`) |
| Version | 2.4.0 |
| Starts | When you ask for it: you type `/scrolls-setup` (your agent doesn't start it on its own) |
| Needs | bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies) |
| License | MIT |
| Source | [skills/scrolls/scrolls-setup](https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-setup) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s scrolls-setup -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: scrolls-setup
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill scrolls-setup --agent claude-code --yes
```

Or the whole `scrolls-skills` group:

```bash
aiskills install -G scrolls -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s scrolls-setup
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/scrolls-setup/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/EXAMPLES.md`
- `assets/templates/AGENTS_MD_BLOCK.md`
- `assets/templates/CLAUDE_MD_BLOCK.md`
- `assets/templates/GAP_ANALYSIS.md`
- `assets/templates/GAP_CONTEXT.md`
- `assets/templates/HANDOFF.md`
- `assets/templates/PLAN.md`
- `assets/templates/SCROLLS_MD_BLOCK.md`
- `assets/templates/SPEC.md`
- `assets/templates/STARTER.md`
- `assets/templates/WISDOM.md`
- `meta/MAINTAINERS.md`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-setup/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-setup/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
