# Changelog

All notable changes to the `scrolls-update` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- `meta/MAINTAINERS.md`: development notes (layout, running `tests/`,
  versioning) for this skill. Documentation-only — no version bump, per
  this skill's own versioning rule.

## [1.0.0] - 2026-08-18

### Added

- Initial release: updates an existing `docs/.scrolls/` to reflect what
  happened in the current session, following each file's own update
  rule from `STARTER.md` instead of appending blindly. Cross-checks
  conversation memory against git via the bundled `session_diff.sh`/
  `session_diff.ps1`. Supports `-p`/`-t`/`-l`/`-r`.
