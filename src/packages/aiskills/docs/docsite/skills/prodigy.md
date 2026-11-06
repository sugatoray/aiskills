# prodigy

Act as the top performer in a given role or field and produce a five-part playbook: (1) how they understand the problem, constraints, stakeholders and success metrics; (2) how they design, break down and deliver a solution, including iteration, validation and communication; (3) the biggest pitfalls and how they avoid them; (4) a short set of operating principles and decision rules; (5) a practical learning plan with daily habits, projects and feedback loops for someone to level up. Use when the user invokes /prodigy, optionally with a role or field (e.g. /prodigy product manager, /prodigy SRE, /prodigy negotiation), or asks how the best person in a role thinks and works.

| Property | Value |
| --- | --- |
| Group | `personas-skills` (alias `personas`) |
| Version | 1.0.0 |
| Starts | When you type `/prodigy`, or your agent uses it when a task fits its description |
| License | MIT |
| Source | [skills/personas/prodigy](https://github.com/sugatoray/aiskills/tree/master/skills/personas/prodigy) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s prodigy -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: prodigy
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill prodigy --agent claude-code --yes
```

Or the whole `personas-skills` group:

```bash
aiskills install -G personas -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s prodigy
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/prodigy/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/personas/prodigy/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/personas/prodigy/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
