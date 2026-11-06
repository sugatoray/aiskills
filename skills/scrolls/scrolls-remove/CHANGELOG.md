# Changelog

All notable changes to the `scrolls-remove` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- `SKILL.md`: say again exactly how `/scrolls-restore` reads the trailers (`git log --format='%(trailers:unfold,only)'`, with `--grep='^Scrolls-Action:'`). The 2.3.0 wording dropped that detail.

### Added

- `assets/EXAMPLES.md`: worked examples, one `## Example: NN — Title` block each, with Premise / Usage / Caveats / Expected Output sections, written in ASD-STE100 Simplified Technical English. Linked from `SKILL.md` (as an on-demand read) and `README.md`. Documentation only; no version bump.

## [2.3.0] - 2026-11-05

### Changed

- Synced to `2.3.0` for the new `/scrolls-restore` skill. The removal's
  behavior and commit message format are unchanged. `SKILL.md` and
  `meta/MAINTAINERS.md` now refer to `/scrolls-restore` as the way to
  undo a removal, instead of calling it a future skill.

## [2.2.0] - 2026-11-05

### Added

- Initial release. It undoes `/scrolls-setup`:
  - deletes the scrolls folder (`.scrolls` or `scrolls`) and a `docs/`
    folder left empty
  - deletes `SCROLLS.md`, or cuts the setup block out of it
  - cuts the scrolls stub out of `CLAUDE.md`, and the dangling pointer
    out of `AGENTS.md`, deleting either file when nothing else is left
  - commits the removal as one `maint(memory): scrolls-removed` commit
    that records the previous commit's SHA, plus human-readable notes and
    machine-readable `Scrolls-*` trailers
- Supports `-p`/`-t`/`-l`/`-r`, `-x`/`--purge` (`SCROLLS.md`,
  `CLAUDE.md`, `AGENTS.md`, any other file name, or `all`), `-n`, `-y`,
  and `--no-commit`.
- Refuses when it couldn't be undone: uncommitted, untracked, or ignored
  content under the targets, or no commits in the repository. Also
  refuses when unrelated changes are staged.
