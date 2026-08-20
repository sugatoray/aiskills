# scrolls-hide

Converts an already-set-up `docs/scrolls/` (visible) to dotfile-hidden
`docs/.scrolls/`, renaming the folder and rewriting path references in
its own files and in `SCROLLS.md` so nothing breaks. The opposite of
`/scrolls-unhide`.

Run it with `/scrolls-hide`. For the full flag reference and usage
examples, run `/scrolls-help`.

## Layout

```
scrolls-hide/
├── agents/
│   └── openai.yaml
├── meta/
│   └── MAINTAINERS.md
├── scripts/
│   ├── hide.ps1
│   └── hide.sh
├── tests/
│   ├── test_hide.ps1
│   └── test_hide.sh
├── CHANGELOG.md
├── README.md
└── SKILL.md
```

- **Runtime instructions**: [`SKILL.md`](SKILL.md)
- **Development notes**: [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md)
- **Version history**: [`CHANGELOG.md`](CHANGELOG.md)
- **Skill family**: [`../README.md`](../README.md)

License: MIT
