# scrolls-unhide

Converts an already-set-up `docs/.scrolls/` (dotfile-hidden) to visible
`docs/scrolls/`, renaming the folder and rewriting path references in its
own files and in `SCROLLS.md` so nothing breaks. The opposite of
`/scrolls-hide`.

Run it with `/scrolls-unhide`. For the full flag reference and usage
examples, run `/scrolls-help`.

## Layout

```
scrolls-unhide/
├── agents/
│   └── openai.yaml
├── meta/
│   └── MAINTAINERS.md
├── scripts/
│   ├── unhide.ps1
│   └── unhide.sh
├── tests/
│   ├── test_unhide.ps1
│   └── test_unhide.sh
├── CHANGELOG.md
├── README.md
└── SKILL.md
```

- **Runtime instructions**: [`SKILL.md`](SKILL.md)
- **Development notes**: [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md)
- **Version history**: [`CHANGELOG.md`](CHANGELOG.md)
- **Skill family**: [`../README.md`](../README.md)

License: MIT
