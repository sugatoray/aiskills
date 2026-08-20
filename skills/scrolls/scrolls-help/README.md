# scrolls-help

Crisp, example-driven reference for the whole scrolls skill family —
what each command does, their shared flags, and common usage examples.
Supports `-e`/`--online` to serve it as a styled local page instead of
chat text.

Run it with `/scrolls-help`.

## Layout

```
scrolls-help/
├── agents/
│   └── openai.yaml
├── meta/
│   ├── MAINTAINERS.md
│   └── SECURITY.md
├── references/
│   └── HELP.md
├── scripts/
│   ├── open_help.ps1
│   ├── open_help.sh
│   └── serve_help.py
├── tests/
│   ├── test_open_help.ps1
│   └── test_open_help.sh
├── CHANGELOG.md
├── README.md
└── SKILL.md
```

- **Runtime instructions**: [`SKILL.md`](SKILL.md)
- **Reference content**: [`references/HELP.md`](references/HELP.md)
- **Development notes**: [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md)
- **Security posture**: [`meta/SECURITY.md`](meta/SECURITY.md)
- **Version history**: [`CHANGELOG.md`](CHANGELOG.md)
- **Skill family**: [`../README.md`](../README.md)

License: MIT
