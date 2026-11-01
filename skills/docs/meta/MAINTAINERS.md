# Maintaining the docs family

Family-wide maintainer notes for the skills under `skills/docs/`. Not read when answering any
request; each skill's own `SKILL.md` is what's read at invocation time. For a skill's own layout and
versioning, see its `meta/MAINTAINERS.md`:

- [`create-lib-docs/meta/MAINTAINERS.md`](../create-lib-docs/meta/MAINTAINERS.md)

This file covers one skill today. It exists because the plugin manifest below is a family-level
artifact, the same arrangement as `skills/stata/meta/MAINTAINERS.md`. Don't invent shared conventions
before a second skill exists.

## Claude Code plugin manifest (`.claude-plugin/plugin.json`)

The manifest lives in `skills/docs/`, not the repo root, like `skills/stata/` and `skills/scrolls/`.
The root `.claude-plugin/marketplace.json` lists it as `"source": "./docs"` (resolved against
`metadata.pluginRoot: "./skills"`).

**Keep it in sync, every time:**

- **Version:** `plugin.json`'s `"version"` must equal `create-lib-docs/SKILL.md`'s
  `metadata.version` and `create-lib-docs/.claude-plugin/plugin.json`'s `"version"`. Three files, one
  version, bumped in the same commit.
- **New skill:** add its `./<skill-name>` path to the `"skills"` array in the commit that adds it.
- **Skill retired:** remove its entry in the commit that renames its `SKILL.md` away (see
  `../../scrolls/meta/MAINTAINERS.md`, "Renaming convention that discards a skill from installing").

**Validate before pushing** (from the repo root): `claude plugin validate skills/docs --strict` and
`claude plugin validate .claude-plugin/marketplace.json --strict` must both report
`Validation passed`.

## Tests

```bash
python3 -m pytest skills/docs/create-lib-docs/tests
```
