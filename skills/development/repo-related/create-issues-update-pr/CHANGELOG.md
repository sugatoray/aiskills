# Changelog

All notable changes to the `create-issues-update-pr` skill are
documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.2.0] - 2026-09-02

### Changed

- The `## Issues` list format changed from `- #{{issue-number}} --
  {{issue-title}}` to `- Closes #{{issue-number}} -- {{issue-title}}`,
  on every line including a parent epic's — GitHub auto-closes any
  issue referenced this way when the PR merges into the default branch,
  so the list now also does the closing rather than just describing it.
  Updated the workflow step, both format-reference examples, and the
  frontmatter `description`.

## [1.1.0] - 2026-08-28

### Added

- `.claude-plugin/plugin.json`: a Claude Code plugin manifest, making
  this directory a self-contained, loadable plugin (`claude
  --plugin-dir skills/development/repo-related/create-issues-update-pr`)
  with no restructuring — `SKILL.md` already sat at the plugin root
  with no `skills/` subfolder.
- `agents/claude-code.yaml`, `agents/openai.yaml`: per-agent-harness
  interface metadata for the `npx skills add --agent <name>` install
  path, matching the `scrolls-*` skills' own `agents/openai.yaml`
  pattern.
- This skill is now also part of the `repo-related-skills` family
  plugin (`skills/development/repo-related/.claude-plugin/plugin.json`,
  new), installable via `/plugin install repo-related-skills@sugatoray`
  after `/plugin marketplace add sugatoray/aiskills`, in addition to
  this skill's own standalone plugin manifest. See
  `skills/development/repo-related/meta/MAINTAINERS.md` (new) for the
  family-level manifest and this skill's own `meta/MAINTAINERS.md` for
  how the two relate.
- `skills/development/repo-related/README.md` rewritten to follow
  `skills/scrolls/README.md`'s structure (a `## Skills` table and a
  detailed `## Layout` section covering every file, including the new
  plugin/agent files).

## [1.0.0] - 2026-08-28

### Added

- Initial release: files GitHub issue(s) for a PR's work (one flat
  issue, or a parent epic plus children via GitHub's native parent/child
  relationship when the work genuinely splits into distinct pieces),
  checks the repository's issue-type support first, searches for
  duplicates before creating, then rewrites the PR's title (kept short)
  and description with an `## Issues` section listing every issue as
  `- #{{issue-number}} -- {{issue-title}}`, indented to match
  parent-child nesting. Verifies with a fresh read after writing.
