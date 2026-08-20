# scrolls-setup

Sets up `docs/.scrolls/` for a project that doesn't have it yet: `STARTER.md`,
`SPEC.md`, `HANDOFF.md`, `GAP_ANALYSIS.md`, `GAP_CONTEXT.md`, `PLAN.md`,
`WISDOM.md`, plus `SCROLLS.md`, a short `CLAUDE.md` pointer to it, and a
matching `AGENTS.md` pointer to `CLAUDE.md`.

Run it with `/scrolls-setup`. For the full flag reference and usage
examples, run `/scrolls-help`.

## Layout

```
scrolls-setup/
├── agents/
│   └── openai.yaml
├── assets/
│   └── templates/
│       ├── AGENTS_MD_BLOCK.md
│       ├── CLAUDE_MD_BLOCK.md
│       ├── GAP_ANALYSIS.md
│       ├── GAP_CONTEXT.md
│       ├── HANDOFF.md
│       ├── PLAN.md
│       ├── SCROLLS_MD_BLOCK.md
│       ├── SPEC.md
│       ├── STARTER.md
│       └── WISDOM.md
├── meta/
│   └── MAINTAINERS.md
├── CHANGELOG.md
├── README.md
└── SKILL.md
```

- **Runtime instructions**: [`SKILL.md`](SKILL.md)
- **Development notes**: [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md)
- **Version history**: [`CHANGELOG.md`](CHANGELOG.md)
- **Skill family**: [`../README.md`](../README.md)

License: MIT
