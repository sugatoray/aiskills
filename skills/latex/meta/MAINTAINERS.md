# Maintaining the latex family

Family-wide maintainer notes for the `latex-*`/`arxiv-*` skills under
`skills/latex/` — not read as part of answering any paper-assembly
request; each skill's own `SKILL.md` is what's actually read at
invocation time. For a specific skill's own layout and versioning rule,
see that skill's own `meta/MAINTAINERS.md`:

- [`arxiv-paper-builder/meta/MAINTAINERS.md`](../arxiv-paper-builder/meta/MAINTAINERS.md)

This file currently covers one skill. It exists anyway (rather than
folding this content into `arxiv-paper-builder/meta/MAINTAINERS.md`)
because the Claude Code plugin manifest below is a family-level artifact
by construction — it lives at `skills/latex/`, one level above any
single skill, mirroring exactly where
`skills/stata/.claude-plugin/plugin.json` lives for the `stata-*`
family. When a second `latex-*` skill is added, this file is already the
right place for whatever becomes genuinely shared (license/authorship,
versioning approach) — see `../../scrolls/meta/MAINTAINERS.md`'s "What's
shared across all five" for what that looks like once a family has more
than one member. Don't invent shared conventions ahead of a second
skill actually existing.

## Claude Code plugin manifest (`.claude-plugin/plugin.json`)

**Design choice**: this manifest lives inside `skills/latex/`, not at
the repo root — the same layout `skills/stata/.claude-plugin/plugin.json`
and `skills/scrolls/.claude-plugin/plugin.json` use, and for the same
reason. The repo root only holds `.claude-plugin/marketplace.json` (the
catalog), with `metadata.pluginRoot: "./skills"` set so each plugin
entry's `source` can just be `"./<group>"`. LaTeX's entry is
`"./latex"`, resolving to `skills/latex/.claude-plugin/plugin.json`.

**Keep it in sync — every time**:

- **Version**: `plugin.json`'s top-level `"version"` must match
  `arxiv-paper-builder/SKILL.md`'s `metadata.version` exactly (the
  family's only member today, so its version *is* the family version).
  Bump both in the same commit. Also keep
  `arxiv-paper-builder/.claude-plugin/plugin.json`'s own `"version"` —
  the individual single-skill plugin manifest, separate from this
  family-level one — equal to the same number. Three files, one
  version, every release.
- **New skill published**: add its `./arxiv-<name>` (or `./latex-<name>`)
  path to the `"skills"` array here in the same commit that adds the
  skill directory.
- **Skill deprecated/deactivated**: remove its entry from the
  `"skills"` array in the same commit its `SKILL.md` is renamed away
  (e.g. to `SKILL.md.deprecated`). See
  `../../scrolls/meta/MAINTAINERS.md`'s "Renaming convention that
  discards a skill from installing" for the exact rename mechanic that
  actually drops a skill from installing.

**Validate before pushing**: `claude plugin validate skills/latex
--strict` and `claude plugin validate .claude-plugin/marketplace.json
--strict` (from the repo root) both need to report `Validation passed`.
