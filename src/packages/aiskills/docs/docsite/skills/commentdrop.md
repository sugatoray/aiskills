# commentdrop

Add simulated social-media comment overlays to a still image in the floating comment-drop style used in video editing. Use when the user invokes /commentdrop or asks for a comment-drop effect on an image.

| Property | Value |
| --- | --- |
| Group | `image-styles-skills` (alias `image-styles`) |
| Version | 1.0.0 |
| Starts | When you ask for it: you type `/commentdrop` (your agent doesn't start it on its own) |
| Needs | An image-generation or image-editing tool capable of returning rendered images |
| License | MIT |
| Source | [skills/image-styles/commentdrop](https://github.com/sugatoray/aiskills/tree/master/skills/image-styles/commentdrop) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s commentdrop -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: commentdrop
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill commentdrop --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `image-styles-skills` group:

```bash
aiskills install -G image-styles -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s commentdrop
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/commentdrop/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/EXAMPLE.md`
- `meta/MAINTAINERS.md`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/image-styles/commentdrop/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/image-styles/commentdrop/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
