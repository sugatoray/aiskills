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

No `references/`, `scripts/`, `tests/`, or `.claude-plugin/` here — the
whole procedure fits comfortably inside `SKILL.md` itself (no need for
progressive disclosure into separate reference files), there's no
bundled executable script (every step is a GitHub MCP tool call made
directly), and nothing here has been packaged as a standalone Claude
Code plugin yet — see `skills/stata/stata-recipes/meta/MAINTAINERS.md`
for what that packaging looks like if this skill grows to need it.

## Why this path

`skills/development/repo-actions/create-issues-update-pr/` is one level
deeper than the flat `skills/<group>/<skill-name>/` layout
`skills/scrolls/` and `skills/stata/` use. `skills/development/` is
meant to hold developer-workflow skills broadly (not just GitHub ones),
with `repo-actions/` as a subgroup for anything that acts on a
repository's own hosted state (issues, PRs, releases, and the like —
not just issues and PRs specifically, which is why the folder isn't
named `issues-pull-requests/`) — a second skill in that subgroup (say, a
PR-review, release-notes, or issue-triage skill) slots in as a sibling
directory here without needing a new top-level group. Don't flatten this
back to `skills/development/create-issues-update-pr/` to match the other
groups' depth — the extra level is deliberate, not an accident to clean
up.

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter (and add a
matching `../CHANGELOG.md` entry, same commit) whenever something a
live invocation would actually see change: a reworded workflow step, a
changed format-reference example, a new edge case documented in "What
this doesn't do". Pure typo fixes or formatting-only edits don't need a
bump.

This is currently the only skill under `skills/development/`, so its
version moves independently — no family-wide lockstep. If
`repo-actions/` or `skills/development/` grows a second skill,
decide then whether shared versioning or a family-level
`meta/MAINTAINERS.md` (see `skills/stata/meta/MAINTAINERS.md` for what
that looks like at the group level) makes sense — don't assume it does
or doesn't ahead of that actually happening.
