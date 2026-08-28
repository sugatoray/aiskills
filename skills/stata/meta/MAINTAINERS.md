# Maintaining the stata family

Family-wide maintainer notes for the `stata-*` skills under
`skills/stata/` — not read as part of answering any Stata-code-writing
request; each skill's own `SKILL.md` is what's actually read at
invocation time. For a specific skill's own layout and versioning rule,
see that skill's own `meta/MAINTAINERS.md`:

- [`stata-recipes/meta/MAINTAINERS.md`](../stata-recipes/meta/MAINTAINERS.md)

This file currently covers one skill. It exists anyway (rather than
folding this content into `stata-recipes/meta/MAINTAINERS.md`) because
the Claude Code plugin manifest below is a family-level artifact by
construction — it lives at `skills/stata/`, one level above any single
skill, mirroring exactly where `skills/scrolls/.claude-plugin/plugin.json`
lives for the `scrolls-*` family. When a second `stata-*` skill is added,
this file is already the right place for whatever becomes genuinely
shared (license/authorship, versioning approach) — see
`../../scrolls/meta/MAINTAINERS.md`'s "What's shared across all five" for
what that looks like once a family has more than one member. Don't
invent shared conventions ahead of a second skill actually existing.

## Claude Code plugin manifest (`.claude-plugin/plugin.json`)

**Design choice**: this manifest lives inside `skills/stata/`, not at
the repo root — the same layout `skills/scrolls/.claude-plugin/plugin.json`
uses, and for the same reason. The repo root only holds
`.claude-plugin/marketplace.json` (the catalog), with
`metadata.pluginRoot: "./skills"` set so each plugin entry's `source` can
just be `"./<group>"`. Stata's entry is `"./stata"`, resolving to
`skills/stata/.claude-plugin/plugin.json`. This keeps every skill-group
folder responsible for its own manifest — a future `skills/<newgroup>/`
gets its own `.claude-plugin/plugin.json` plus one new line in the root
`marketplace.json`, never a second manifest competing for the repo root.

**Keep it in sync — every time**:

- **Version**: `plugin.json`'s top-level `"version"` must match
  `stata-recipes/SKILL.md`'s `metadata.version` exactly (the family's
  only member today, so its version *is* the family version). Bump both
  in the same commit. Also keep
  `stata-recipes/.claude-plugin/plugin.json`'s own `"version"` — the
  individual single-skill plugin manifest, separate from this
  family-level one, see `stata-recipes/meta/MAINTAINERS.md` — equal to
  the same number. Three files, one version, every release.
- **New skill published**: add its `./stata-<name>` path to the
  `"skills"` array here in the same commit that adds the skill
  directory, and add its own row if/when this file grows a shared
  versioning table (see `../../scrolls/meta/MAINTAINERS.md` for what
  that looks like at five skills).
- **Skill deprecated/deactivated**: remove its entry from the `"skills"`
  array in the same commit its `SKILL.md` is renamed away (e.g. to
  `SKILL.md.deprecated`). See `../../scrolls/meta/MAINTAINERS.md`'s
  "Renaming convention that discards a skill from installing" for why
  that exact rename mechanic is what actually drops a skill from
  installing, verified there against `claude plugin details`.

**Validate before pushing**: `claude plugin validate skills/stata
--strict` and `claude plugin validate .claude-plugin/marketplace.json
--strict` (from the repo root) both need to report `Validation passed`.
Note that `claude plugin install <name>@sugatoray` fails locally against
a `Directory`-source marketplace added via `claude plugin marketplace add
<local-path>` — `Source path does not exist: .../stata` instead of
`.../skills/stata` — for `scrolls-skills` too, not just this one, so it's
a pre-existing quirk in how this CLI resolves `metadata.pluginRoot`
against a local-directory marketplace source, not a manifest defect;
`claude plugin validate` is the check that actually reflects manifest
correctness. Whether the real `owner/repo`-sourced install path
(`/plugin marketplace add sugatoray/aiskills`) is affected the same way
hasn't been verified here and is worth confirming before relying on it.
