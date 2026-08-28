# Repo-related skills

Skills that act on a repository's own hosted state — issues, pull
requests, releases, and similar — rather than on its code. Currently:
filing issues for work that's happened on a branch, and keeping a PR's
title and description in sync with what it actually tracks.

## Skills

| Skill | Purpose |
| --- | --- |
| [`create-issues-update-pr`](create-issues-update-pr/) | Files GitHub issue(s) for a PR's work — one flat issue, or a parent epic plus children via GitHub's native parent/child relationship when the work genuinely splits into distinct pieces — then rewrites the PR's title (kept short) and description with an itemized, correctly nested `## Issues` list. |

More skills will be added under this folder over time (e.g. PR review
triage, stale-issue cleanup) following the same layout as
`create-issues-update-pr/`.

## Layout

Each skill's directory has:

- `SKILL.md` — the skill's runtime instructions.
- `README.md` — a minimal, human-facing pointer to the files below; not
  read at invocation time.
- `meta/MAINTAINERS.md` — development notes: layout and versioning. Not
  read at invocation time.
- `CHANGELOG.md` — that skill's own version history.
