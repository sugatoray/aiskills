# Changelog

All notable changes to the `create-issues-update-pr` skill are
documented here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
