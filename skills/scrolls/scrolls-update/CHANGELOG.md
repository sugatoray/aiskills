# Changelog

All notable changes to the `scrolls-update` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.0.0] - 2026-08-20

### Changed

- Synced to `2.0.0` to keep this skill's version locked in step with
  the other four `scrolls-*` skills (see `../meta/MAINTAINERS.md`'s
  Versioning entry). No functional change of its own in this release —
  the major bump reflects a breaking change elsewhere in the family
  (`scrolls-hide`/`scrolls-unhide`'s rewrite-target change), not
  anything in `scrolls-update` itself. See `../CHANGELOG.md`.

## [1.3.0] - 2026-08-20

Jumps straight from `1.0.0` to `1.3.0`, skipping `1.1.0`/`1.2.0` — this
skill's version is now locked in step with the other four `scrolls-*`
skills (see `../meta/MAINTAINERS.md`'s Versioning entry), and `1.3.0` is
where that family-wide version currently stands. No functional change
of this skill's own in this release.

### Added

- `meta/MAINTAINERS.md`: development notes (layout, running `tests/`,
  versioning) for this skill. Was documentation-only at the time it
  landed (no version bump then, per this skill's own versioning rule);
  folded into this release now that a family-wide bump is happening
  anyway.

## [1.0.0] - 2026-08-18

### Added

- Initial release: updates an existing `docs/.scrolls/` to reflect what
  happened in the current session, following each file's own update
  rule from `STARTER.md` instead of appending blindly. Cross-checks
  conversation memory against git via the bundled `session_diff.sh`/
  `session_diff.ps1`. Supports `-p`/`-t`/`-l`/`-r`.
