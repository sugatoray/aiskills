# Maintaining subskill-dispatcher

For people developing this skill — not read as part of handling a live subskill request.

## Layout

- `../SKILL.md` — runtime instructions and the `::s` composition protocol.
- `../README.md` — human-facing usage, installation, guarantees, and package map.
- `../CHANGELOG.md` — version history; update it with `metadata.version` in `SKILL.md`.
- `../agents/openai.yaml` — OpenAI agent interface metadata.
- This skill has no scripts, tests, references, or assets; it is pure protocol guidance.

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

Keep `SKILL.md`'s `metadata.version` and the current changelog release aligned in the same commit.

## Validation

From the repository root, run the repository's skill validator, if available. At minimum verify:

- valid YAML frontmatter;
- lowercase hyphenated skill name;
- no unfinished scaffold placeholders;
- all README links resolve;
- examples use the canonical `::s` grammar;
- the package remains independent of any single domain skill.
