# subskill-dispatcher

A reusable protocol for invoking a named skill from within a parent skill with CLI-style syntax:

```text
/{{parent-skill}} ::s {{subskill}} [arguments] [--options]
```

For example:

```text
/visualize [[coffee production]] ::s infographic --orientation landscape
```

See [`SKILL.md`](SKILL.md) for runtime instructions. This README is human-facing documentation and is not read during invocation.

## Guarantees

- Explicit child-skill resolution and alias handling.
- Parent context flows into the child.
- Options before `::s` belong to the parent; options after it belong to the child.
- Child results, artifacts, warnings, and verification status return to the parent.
- Unknown or unavailable children fail explicitly instead of being guessed.
- Existing pipe-based modifier composition remains supported.

## Installation

Install only this skill from the repository:

```bash
npx skills add sugatoray/aiskills --skill subskill-dispatcher --yes
```

Install the building-blocks Claude Code plugin:

```bash
claude --plugin-dir skills/development/building-blocks
```

The family-level plugin currently includes `subskill-dispatcher`.

From a local clone:

```bash
npx skills add . --skill subskill-dispatcher --yes
```

## Package layout

```text
subskill-dispatcher/
├── agents/
│   ├── claude-code.yaml
│   └── openai.yaml
├── meta/
│   └── MAINTAINERS.md
├── CHANGELOG.md
├── README.md
└── SKILL.md
```

License: MIT
