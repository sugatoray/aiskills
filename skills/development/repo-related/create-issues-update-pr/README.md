# create-issues-update-pr

Files GitHub issue(s) for work already done (or about to be done) on a
branch/PR — grouping related issues under a parent epic via GitHub's
native parent/child relationship when the work genuinely splits into
distinct pieces, one flat issue otherwise — then updates that pull
request's title (kept short) and description so the description lists
every issue in the exact format `- #{{issue-number}} -- {{issue-title}}`,
indented to match parent-child nesting.

See [`SKILL.md`](SKILL.md) for the skill's runtime instructions. This
file is a human-facing pointer, not read at invocation time.

## What's here

- [`SKILL.md`](SKILL.md) — the workflow: establish scope from real
  commits/diffs, decide flat-vs-hierarchical, check issue-type support,
  search for duplicates, create the issues, then rewrite the PR's title
  and body, then verify with a fresh read.
- [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md) — development notes:
  layout and versioning. Not read at invocation time.
- [`CHANGELOG.md`](CHANGELOG.md) — this skill's version history.

## Example

Given a PR with six commits building one feature, this skill produced:

```
## Issues

- #50 -- Add Stata skill (stata-recipes)
  - #51 -- Create the initial stata-recipes skill
  - #52 -- Expand stata-recipes: time-series/panel regression, unit-root tests
  - #53 -- Restructure stata-recipes recipes into models/ and tests/ subfolders
  - #54 -- Add meta/MAINTAINERS.md to stata-recipes
  - #55 -- Package stata-recipes as a standalone Claude Code plugin
  - #56 -- Add stata-skills to the Claude Code plugin marketplace
```

with the PR's own title trimmed to match the parent epic's: "Add Stata
skill (stata-recipes)".
