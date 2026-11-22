# Maintaining the diagrams family

Family-wide maintainer notes for the skills under `skills/diagrams/`. Not read when answering any
request; each skill's own `SKILL.md` is what's read at invocation time. For a skill's own layout and
versioning, see its `meta/MAINTAINERS.md`:

- [`network-flow/meta/MAINTAINERS.md`](../network-flow/meta/MAINTAINERS.md)

This file covers one skill today. It exists because the plugin manifest below is a family-level
artifact, the same arrangement as `../../stata/meta/MAINTAINERS.md`. Don't invent shared conventions
before a second skill exists.

This `meta/` folder is for maintainers of this repo: `skills/.skillsignore` keeps every group- and
subgroup-level `meta/` out of the npm package. A `meta/` inside a skill folder still ships.

## Claude Code plugin manifest (`.claude-plugin/plugin.json`)

The manifest lives in `skills/diagrams/`, not the repo root, like `skills/stata/` and `skills/docs/`.
The root `.claude-plugin/marketplace.json` lists it as `"source": "./diagrams"` (resolved against
`metadata.pluginRoot: "./skills"`). The `aiskills` npm package derives the group alias from the
plugin name minus `-skills`: `diagrams`.

**Keep it in sync, every time:**

- **Version:** `plugin.json`'s `"version"` must equal `network-flow/SKILL.md`'s
  `metadata.version` (both `1.0.0` today). Two files, one version, bumped in the same commit.
- **New skill:** add its `./<skill-name>` path to the `"skills"` array in the commit that adds it,
  and a row to `../README.md`.
- **Skill retired:** remove its entry in the commit that renames its `SKILL.md` away (see
  `../../scrolls/meta/MAINTAINERS.md`, "Renaming convention that discards a skill from installing").

**Validate before pushing** (from the repo root): `claude plugin validate skills/diagrams --strict` and
`claude plugin validate .claude-plugin/marketplace.json --strict` must both report `Validation passed`.

## Tests

From the repo root:

```bash
python3 -m unittest discover -s skills/diagrams/network-flow/tests -p 'test_*.py'
node --check skills/diagrams/network-flow/assets/runtime/renderer.js
node skills/diagrams/network-flow/tests/check_browser.cjs
```

See `../network-flow/meta/MAINTAINERS.md` for what the browser check needs.
