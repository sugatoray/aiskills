# Maintaining subskill-dispatcher

For people developing this skill — not read as part of handling a live subskill request.

## Layout

- `../SKILL.md` — runtime instructions and the `::s` composition protocol.
- `../README.md` — human-facing usage, installation, guarantees, and package map.
- `../CHANGELOG.md` — version history; update it alongside `metadata.version` in `SKILL.md`.
- `../../.claude-plugin/plugin.json` — standalone Claude Code plugin manifest.
- `../agents/claude-code.yaml`, `../agents/openai.yaml` — per-agent-harness interface metadata.
- This skill has no scripts, tests, references, or assets; it is pure protocol guidance.

## Claude Code plugin packaging

The family-level manifest lives at `skills/development/building-blocks/.claude-plugin/plugin.json` and lists `./subskill-dispatcher`, matching the `skills/scrolls/.claude-plugin/plugin.json` layout.

Run it locally with:

```bash
claude --plugin-dir skills/development/building-blocks
```

Do not recreate a `.claude-plugin/` directory inside this skill. Add future skills to the family manifest's `skills` array.

## Scope

Keep this skill generic. Parent skills own their domain behavior and must declare the subskills they expose. Do not add domain-specific child registries here.

## Composition rules

The canonical syntax is:

```text
/{{parent-skill}} ::s {{subskill}} [arguments] [--options]
```

Options before `::s` belong to the parent; options after it belong to the child. Preserve the existing pipe syntax for independently composable modifiers.

A change to parsing, resolution order, context inheritance, option scoping, chaining, result handling, or failure behavior is a functional change and requires a version bump plus a `CHANGELOG.md` entry.

## Versioning

Use semantic versioning:

- Patch: clarifications or non-behavioral corrections.
- Minor: backward-compatible protocol additions.
- Major: incompatible syntax or contract changes.

Keep `SKILL.md`'s `metadata.version`, the family plugin's `version` aligned with the current changelog release in the same commit.

## Validation

From the repository root, run the repository's skill validator, if available. At minimum verify:

- valid YAML frontmatter;
- lowercase hyphenated skill name;
- no unfinished scaffold placeholders;
- all README links resolve;
- examples use the canonical `::s` grammar;
- the package remains independent of any single domain skill;
- `claude --plugin-dir skills/development/building-blocks/subskill-dispatcher` loads the standalone plugin successfully.
