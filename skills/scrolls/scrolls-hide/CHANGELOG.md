# Changelog

All notable changes to the `scrolls-hide` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] - 2026-08-20

### Changed

- `hide.sh`/`hide.ps1` now rewrite the scrolls-path reference in
  `SCROLLS.md` instead of `CLAUDE.md`, matching `scrolls-setup` 1.2.0's
  split — `CLAUDE.md` no longer contains a scrolls-path reference to
  rewrite, since it's a fixed pointer to `SCROLLS.md`.

### Added

- `meta/MAINTAINERS.md`: development notes (layout, running `tests/`,
  versioning) for this skill.

## [1.0.0] - 2026-08-18

### Added

- Initial release: renames an already-set-up `docs/scrolls/` (visible)
  to dotfile-hidden `docs/.scrolls/`, rewriting path references inside
  the moved folder and in the sibling `CLAUDE.md` so nothing breaks.
  Supports `-p`/`-t`/`-l`/`-r`.
