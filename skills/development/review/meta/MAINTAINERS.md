# Maintaining the review subgroup

Subgroup-wide maintainer notes for the skills under `skills/development/review/`. Not read when
answering any request; each skill's own `SKILL.md` is what's read at invocation time. For a
skill's own layout and versioning, see its `meta/MAINTAINERS.md`:

- [`run-code-review/meta/MAINTAINERS.md`](../run-code-review/meta/MAINTAINERS.md)

This file covers one skill today. It exists because the plugin manifest below is a subgroup-level
artifact, the same arrangement as `../../repo-related/meta/MAINTAINERS.md`. Don't invent shared
conventions before a second skill exists.

## Claude Code plugin manifest (`.claude-plugin/plugin.json`)

The manifest lives in `skills/development/review/`, not the repo root and not
`skills/development/`: `skills/development/` holds subgroups, and each subgroup is its own
installable plugin, as `../../repo-related/` is. The root `.claude-plugin/marketplace.json` lists
it as `"source": "./development/review"` (resolved against `metadata.pluginRoot: "./skills"`).
The `aiskills` npm package derives the group alias from the plugin name minus `-skills`:
`review`.

**Keep it in sync, every time:**

- **Version:** `plugin.json`'s `"version"` must equal `run-code-review/SKILL.md`'s
  `metadata.version`. Two files, one version, bumped in the same commit.
- **New skill:** add its `./<skill-name>` path to the `"skills"` array in the commit that adds it,
  and a row to `../README.md`.
- **Skill retired:** remove its entry in the commit that renames its `SKILL.md` away (see
  `../../../scrolls/meta/MAINTAINERS.md`, "Renaming convention that discards a skill from
  installing").
- **Descriptions:** the plugin's `description` appears in `plugin.json` and in the root
  `marketplace.json`; keep the two identical.

**Validate before pushing** (from the repo root):
`claude plugin validate skills/development/review --strict` and
`claude plugin validate .claude-plugin/marketplace.json --strict` must both report
`Validation passed`.

**After adding or changing a skill here**, regenerate the npm package's docs and run its tests
(from `src/packages/aiskills`): `npm run docs`, `npm run banner:png`, `npm test`. See
`src/packages/aiskills/docs/meta/MAINTAINERS.md`.

## Tests

```bash
python3 -m pytest skills/development/review/run-code-review/tests
```

## Why `skills/development/review/`

Reviewing is a developer workflow, so it sits under `skills/development/` beside `repo-related/`
instead of in a new top-level group. It is its own subgroup because its skills read and judge
work, where `repo-related/` skills act on a repository's hosted state (issues, pull requests,
releases). A skill that posts review comments to a pull request still belongs here: reviewing is
what it does, and the PR is only where the result goes.
