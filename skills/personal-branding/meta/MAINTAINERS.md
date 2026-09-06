# Maintaining the personal-branding family

Family-wide maintainer notes for the skills under
`skills/personal-branding/` — not read as part of answering any live
request; each skill's own `SKILL.md` is what's actually read at
invocation time. For a specific skill's own layout and versioning rule,
see that skill's own `meta/MAINTAINERS.md`:

- [`landing-page-builder/meta/MAINTAINERS.md`](../landing-page-builder/meta/MAINTAINERS.md)

This file currently covers one skill. It exists anyway (rather than
folding this content into `landing-page-builder/meta/MAINTAINERS.md`)
because the Claude Code plugin manifest below is a family-level artifact
by construction — it lives at `skills/personal-branding/`, one level
above any single skill, mirroring exactly where
`skills/stata/.claude-plugin/plugin.json` lives for the `stata-*`
family. When a second `personal-branding` skill is added, this file is
already the right place for whatever becomes genuinely shared (license/
authorship, versioning approach) — see
`../../scrolls/meta/MAINTAINERS.md`'s "What's shared across all five"
for what that looks like once a family has more than one member. Don't
invent shared conventions ahead of a second skill actually existing.

## Claude Code plugin manifest (`.claude-plugin/plugin.json`)

**Design choice**: this manifest lives inside
`skills/personal-branding/`, not at the repo root — the same layout
`skills/stata/.claude-plugin/plugin.json` and
`skills/scrolls/.claude-plugin/plugin.json` use, and for the same
reason. The repo root only holds `.claude-plugin/marketplace.json` (the
catalog), with `metadata.pluginRoot: "./skills"` set so each plugin
entry's `source` can just be `"./<group>"`. This family's entry is
`"./personal-branding"`, resolving to
`skills/personal-branding/.claude-plugin/plugin.json`. This keeps every
skill-group folder responsible for its own manifest — a future
`personal-branding` skill gets its own `./<skill-name>` line added to
this manifest's `"skills"` array plus one new line in the root
`marketplace.json` (only if a wholly new family folder is created,
which this isn't).

**Keep it in sync — every time**:

- **Version**: `plugin.json`'s top-level `"version"` must match
  `landing-page-builder/SKILL.md`'s `metadata.version` exactly (the
  family's only member today, so its version *is* the family version).
  Bump both in the same commit. Also keep
  `landing-page-builder/.claude-plugin/plugin.json`'s own `"version"` —
  the individual single-skill plugin manifest, separate from this
  family-level one — equal to the same number. Three files, one
  version, every release.
- **New skill published**: add its `./<skill-name>` path to the
  `"skills"` array here in the same commit that adds the skill
  directory, and add a row to `../README.md`'s table.
- **Skill deprecated/deactivated**: remove its entry from the `"skills"`
  array in the same commit its `SKILL.md` is renamed away (e.g. to
  `SKILL.md.deprecated`). See `../../scrolls/meta/MAINTAINERS.md`'s
  "Renaming convention that discards a skill from installing" for why
  that exact rename mechanic is what actually drops a skill from
  installing.

**Validate before pushing**: `claude plugin validate
skills/personal-branding --strict` and `claude plugin validate
.claude-plugin/marketplace.json --strict` (from the repo root) both need
to report `Validation passed`. See `skills/stata/meta/MAINTAINERS.md`'s
note on `claude plugin install` failing locally against a
`Directory`-source marketplace — the same pre-existing CLI quirk applies
here too, and isn't a manifest defect.
