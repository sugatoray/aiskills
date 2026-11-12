# artwallbg

Create a vivid illustrated image of a subject in front of a huge spray-painted wall. Use when the user invokes /artwallbg or requests this art-wall background visual.

| Property | Value |
| --- | --- |
| Group | `image-styles-skills` (alias `image-styles`) |
| Version | 1.0.0 |
| Starts | When you ask for it: you type `/artwallbg` (your agent doesn't start it on its own) |
| Needs | An image-generation or image-editing tool capable of returning rendered images |
| License | MIT |
| Source | [skills/image-styles/artwallbg](https://github.com/sugatoray/aiskills/tree/master/skills/image-styles/artwallbg) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s artwallbg -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: artwallbg
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill artwallbg --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `image-styles-skills` group:

```bash
aiskills install -G image-styles -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s artwallbg
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/artwallbg/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/EXAMPLE.md`
- `meta/MAINTAINERS.md`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/image-styles/artwallbg/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/image-styles/artwallbg/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
