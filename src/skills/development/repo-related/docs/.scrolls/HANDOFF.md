# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`create-issues-update-pr` 1.3.0** is the only skill in the subgroup. Its history is in its `CHANGELOG.md` and on `master` through #57 (1.0.0, 2026-08-27), #66 (1.2.0), #73 (the 1.2.1 frontmatter fix) and #74 (1.3.0, 2026-09-21).
- **Plugins:** the family plugin `repo-related-skills` (`skills/development/repo-related/.claude-plugin/plugin.json`) and the skill's own single-skill plugin are both at `1.3.0`, matching the skill. The family plugin is listed in the repo's `.claude-plugin/marketplace.json`; the single-skill one loads with `claude --plugin-dir`.
- **npm:** bundled in `@sugatoray-ai/aiskills` as group `repo-related` since the package's first published version.
- **Tests:** none; the skill is instructions only, and every step is a GitHub MCP tool call. It was used for real on 2026-11-22 to file #321 to #328 for PR #320, which is a fair smoke test of the epic, the `Closes` list and the read-back.

## What just happened
- These scrolls were set up on 2026-11-23, laid out like `src/skills/development/review/`, and `SPEC.md` and this file were filled in from the skill's CHANGELOG. No work on the skill itself happened in that session.

## Known issues / open threads
- `GAP_ANALYSIS.md`, `GAP_CONTEXT.md`, `PLAN.md` and `WISDOM.md` still hold the setup placeholders. The skill's `meta/MAINTAINERS.md` holds its layout and design notes (for example, why the subgroup is one level deeper than other groups, and how the single-skill and family plugin manifests relate).
