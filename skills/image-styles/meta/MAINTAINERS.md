# Maintaining the image-styles family

Family-wide maintainer notes for the skills under `skills/image-styles/`. Not read when answering any
request; each skill's own `SKILL.md` is what's read at invocation time. For a skill's own layout and
versioning, see its `meta/MAINTAINERS.md`:

- [`artwallbg/meta/MAINTAINERS.md`](../artwallbg/meta/MAINTAINERS.md)
- [`commentdrop/meta/MAINTAINERS.md`](../commentdrop/meta/MAINTAINERS.md)

Working memory for this family (narrative, plans, traps) is in `src/skills/image-styles/docs/.scrolls/`;
start from its `STARTER.md`. `src/skills/image-styles/meta` links back to this folder.

This `meta/` folder is for maintainers of this repo: `skills/.skillsignore` keeps every group- and
subgroup-level `meta/` out of the npm package. A `meta/` inside a skill folder still ships.

## What's shared

- **License and authorship:** MIT, `metadata.author: sugatoray`, in both `SKILL.md` files.
- **Checks:** both skills are instructions for an image tool, with no scripts or tests. Each
  skill's own notes say to validate its frontmatter and agent YAML, keep the manifest and the
  marketplace entry in step with the skill names and paths, and forward-test typical and default
  invocations with an image tool when one is available. Never claim generated images were checked
  without running the tool.

## Claude Code plugin manifest (`.claude-plugin/plugin.json`)

The manifest lives in `skills/image-styles/`, not the repo root, like `skills/stata/` and `skills/docs/`.
The root `.claude-plugin/marketplace.json` lists it as `"source": "./image-styles"` (resolved against
`metadata.pluginRoot: "./skills"`). The `aiskills` npm package derives the group alias from the
plugin name minus `-skills`: `image-styles`.

**Keep it in sync, every time:**

- **Version:** `plugin.json`'s `"version"` equals the skills' `metadata.version`, which both skills
  share today (`1.0.1`). If they diverge, bump the plugin with the change that ships, and say so in
  the skill's `CHANGELOG.md`.
- **New skill:** add its `./<skill-name>` path to the `"skills"` array in the commit that adds it,
  and a row to `../README.md`.
- **Skill retired:** remove its entry in the commit that renames its `SKILL.md` away (see
  `../../scrolls/meta/MAINTAINERS.md`, "Renaming convention that discards a skill from installing").

**Validate before pushing** (from the repo root): `claude plugin validate skills/image-styles --strict` and
`claude plugin validate .claude-plugin/marketplace.json --strict` must both report `Validation passed`.
