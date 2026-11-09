# create-lib-docs

Writes top-grade, verified user documentation for a library, CLI or framework as a folder of Markdown pages plus SVG diagrams, structured the way FastAPI, Pydantic, DuckDB and Effect structure theirs: a landing page with a 30-second example, Getting Started, a progressive Tutorial with runnable steps, task-oriented How-to Guides, Concepts (explanations with diagrams), an exhaustive Reference (CLI flags, API, config, output schemas, one anchor per error with cause and fix), FAQ/troubleshooting, and llms.txt / llms-full.txt so AI agents can load the docs. Every fact is taken from the code, --help output and tests (never from memory), and every snippet is run before it is published. Use this whenever the user asks to write, create, restructure or overhaul documentation / docs / a user guide / a manual / API reference for a library, package, CLI or framework, wants docs 'like FastAPI's / Pydantic's / DuckDB's / Effect's', wants docs that help both humans and AI agents, or invokes /create-lib-docs.

| Property | Value |
| --- | --- |
| Group | `docs-skills` (alias `docs`) |
| Version | 1.2.0 |
| Starts | When you ask for it: you type `/create-lib-docs` (your agent doesn't start it on its own) |
| License | MIT |
| Source | [skills/docs/create-lib-docs](https://github.com/sugatoray/aiskills/tree/master/skills/docs/create-lib-docs) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s create-lib-docs -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: create-lib-docs
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill create-lib-docs --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `docs-skills` group:

```bash
aiskills install -G docs -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s create-lib-docs
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/create-lib-docs/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `meta/MAINTAINERS.md`
- `references/patterns.md`
- `references/templates.md`
- `scripts/build_llms_txt.py`
- `scripts/check_docs.py`
- `tests/test_scripts.py`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/docs/create-lib-docs/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/docs/create-lib-docs/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
