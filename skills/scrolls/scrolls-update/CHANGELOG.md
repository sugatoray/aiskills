# Changelog

All notable changes to the `scrolls-update` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.1.0] - 2026-08-20

### Added

- New step 2: idempotently backfills `SCROLLS.md`, `CLAUDE.md`, and
  `AGENTS.md` for a project set up by a pre-`2.0.0` `scrolls-setup`.
  Since `/scrolls-update` is the command people actually run every
  session — not the one-time `/scrolls-setup` — this is the point
  where such a project now catches up automatically. Reads its three
  pointer templates from `scrolls-setup`'s own `assets/templates/`
  rather than duplicating them. Safe on every run: create-if-missing /
  insert-if-not-already-referencing / leave-alone-if-already-correct,
  never overwrites or reorders existing content. Old steps 2-6
  renumbered to 3-7 accordingly.

### Changed

- `CLAUDE.md` insertion condition matches the same tightening applied
  in `scrolls-setup` `2.1.0`: the stub is inserted whenever `CLAUDE.md`
  doesn't already reference `SCROLLS.md` specifically, even if it
  already points straight at `SCROLLS_PATH/STARTER.md` directly (the
  pre-`1.2.0` convention) — additive only, old and new references can
  coexist.

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
