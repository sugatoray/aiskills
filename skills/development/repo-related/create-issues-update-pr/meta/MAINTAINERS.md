# Maintaining create-issues-update-pr

For people developing this skill — not read as part of answering a
"file issues for this PR" request (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the only file read at invocation time: the workflow,
  the format reference, and what this skill doesn't do.
- `../README.md` — minimal, human-facing pointer to the files below;
  not read at invocation time.
- `../CHANGELOG.md` — this skill's version history; update it alongside
  `metadata.version` in `SKILL.md`.
- `../.claude-plugin/plugin.json` — the Claude Code plugin manifest
  (name, version, description, author, license, keywords). Not read
  during a normal skill invocation; only Claude Code's plugin loader
  reads it, when this directory is loaded as a plugin (see "Claude Code
  plugin packaging" below).
- `../agents/claude-code.yaml`, `../agents/openai.yaml` — per-agent-
  harness interface metadata (`display_name`, `short_description`,
  `allow_implicit_invocation`), same shape and purpose as the
  `scrolls-*` skills' `agents/openai.yaml` files, for the multi-agent
  `npx skills add --agent <name>` packaging. Claude Code's own plugin
  loader only reads `.md` files from `agents/` as custom-agent
  definitions, so these `.yaml` files are silently ignored by it — no
  conflict between the two uses of this directory name.

No `references/`, `scripts/`, or `tests/` here — the whole procedure
fits comfortably inside `SKILL.md` itself (no need for progressive
disclosure into separate reference files), and there's no bundled
executable script (every step is a GitHub MCP tool call made directly).

## Why this path

`skills/development/repo-related/create-issues-update-pr/` is one level
deeper than the flat `skills/<group>/<skill-name>/` layout
`skills/scrolls/` and `skills/stata/` use. `skills/development/` is
meant to hold developer-workflow skills broadly (not just GitHub ones),
with `repo-related/` as a subgroup for anything that acts on a
repository's own hosted state (issues, PRs, releases, and the like —
not just issues and PRs specifically, which is why the folder isn't
named `issues-pull-requests/`). It also isn't named `repo-actions/` (an
earlier choice) — "actions" already means something specific and
different in a GitHub context (GitHub Actions, the CI/CD product), and a
subgroup meant to be generic shouldn't borrow a name that reads as
"workflow automation" instead. A second skill in this subgroup (say, a
PR-review, release-notes, or issue-triage skill) slots in as a sibling
directory here without needing a new top-level group. Don't flatten this
back to `skills/development/create-issues-update-pr/` to match the other
groups' depth — the extra level is deliberate, not an accident to clean
up.

## Claude Code plugin packaging

`../SKILL.md` already sits directly at this skill's root with no
`skills/` subfolder — that's Claude Code's "single-skill plugin" layout
already, so adding `../.claude-plugin/plugin.json` was enough to make
this directory a self-contained, loadable Claude Code plugin with no
restructuring. Test it locally with:

```
claude --plugin-dir skills/development/repo-related/create-issues-update-pr
```

This individual manifest is separate from, and in addition to, the
family-level `skills/development/repo-related/.claude-plugin/plugin.json`
that groups every `repo-related` skill (currently just this one) into a
single `repo-related-skills` plugin listed in the repo-root
`.claude-plugin/marketplace.json` — see `../meta/MAINTAINERS.md` for
that manifest's design and its own keep-in-sync rules. Same
individual-plus-family arrangement as `stata-recipes` (see its own
`meta/MAINTAINERS.md` for the tradeoff worth revisiting once a family
gains a second skill), and unlike `scrolls-*`, which ships only the
group-level manifest.

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter (and add a
matching `../CHANGELOG.md` entry, same commit) whenever something a
live invocation would actually see change: a reworded workflow step, a
changed format-reference example, a new edge case documented in "What
this doesn't do". Pure typo fixes or formatting-only edits don't need a
bump.

Keep `../.claude-plugin/plugin.json`'s `version` field, **and**
`../../.claude-plugin/plugin.json`'s (the family-level manifest)
`version` field, equal to `SKILL.md`'s `metadata.version` — bump all
three in the same commit. Three manifests for the same release, and a
mismatch in any one of them is exactly the kind of inconsistency worth
catching before it ships.

This is currently the only skill under `skills/development/`, so its
version moves independently — no family-wide lockstep the way the five
`scrolls-*` skills share one (see `../../../scrolls/meta/MAINTAINERS.md`
for what that looks like) — even though the family-level plugin manifest
already exists and tracks this skill's version 1:1 by necessity (it's
the only member). If `repo-related/` or `skills/development/` grows a
second skill, revisit whether shared versioning makes sense here too,
rather than assuming it does or doesn't — it depends on how tightly the
new skill's release cadence actually tracks this one's.
