# Changelog

All notable changes to the `scrolls-hide` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.1.0] - 2026-08-20

### Changed

- Synced to `2.1.0` to keep this skill's version locked in step with
  the other four `scrolls-*` skills (see `../meta/MAINTAINERS.md`'s
  Versioning entry). No functional change of its own in this release —
  the minor bump reflects `scrolls-setup`/`scrolls-update`'s new
  idempotent `CLAUDE.md`/`SCROLLS.md`/`AGENTS.md` backfill, not
  anything in `scrolls-hide` itself. See `../CHANGELOG.md`.

## [2.0.0] - 2026-08-20

### Changed (breaking)

- Major version bump, family-wide (see `../CHANGELOG.md`): formalizes
  the `1.1.0` rewrite-target change (`SCROLLS.md` instead of
  `CLAUDE.md`) as breaking rather than minor. A project set up by a
  pre-`2.0.0` `scrolls-setup` — `CLAUDE.md` embeds the scrolls path
  directly, no `SCROLLS.md` exists — will no longer get that reference
  rewritten by this skill; only `SCROLLS.md` is checked now. Re-run
  `/scrolls-setup` first (safe, never overwrites existing content) to
  add `SCROLLS.md` and regain rewrite coverage.

## [1.3.0] - 2026-08-20

### Changed

- Synced to `1.3.0` to keep this skill's version locked in step with
  the other four `scrolls-*` skills (see
  `../meta/MAINTAINERS.md`'s Versioning entry) — no functional change
  of its own in this release.

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
