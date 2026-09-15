# Building-block skills

Reusable protocol and composition primitives for constructing larger skills and slash-command experiences.

## Included skills

| Skill | Purpose |
| --- | --- |
| [`subskill-dispatcher`](subskill-dispatcher/) | Dispatch a named child skill from a parent skill using `::s`, with inherited context, scoped options, explicit resolution, chaining, and failure handling. |

## Claude Code plugin

This group is packaged as a family-level Claude Code plugin at `skills/development/building-blocks/.claude-plugin/plugin.json`.

```bash
claude --plugin-dir skills/development/building-blocks
```

The manifest's `skills` array should include every installable skill in this group.

## Composition syntax

Use the dispatcher from a parent skill with:

```text
/{{parent-skill}} ::s {{subskill}} [arguments] [--options]
```

Example:

```text
/visualize [[coffee production]] ::s infographic --orientation landscape
```

Use `::s` for a named capability owned by a parent. Continue using pipe composition for independently composable modifiers:

```text
/visualize [[a mechanical watch]] | /scroll-sequence
```

## Installing

Install the building-block skill from the repository:

```bash
npx skills add sugatoray/aiskills --skill subskill-dispatcher --yes
```

More building blocks will be added here as reusable skill infrastructure is developed.

License: MIT
