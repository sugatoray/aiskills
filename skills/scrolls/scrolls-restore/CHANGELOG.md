# Changelog

All notable changes to the `scrolls-restore` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.4.0] - 2026-11-06

### Fixed

- The message for an already-restored checkpoint no longer says "Nothing to restore" twice.

### Added

- `assets/EXAMPLES.md`: worked examples, one `## Example: NN — Title` block each, with Premise / Usage / Caveats / Expected Output sections, written in ASD-STE100 Simplified Technical English. Linked from `SKILL.md` (as an on-demand read) and `README.md`.

## [2.3.0] - 2026-11-05

### Added

- Initial release, the counterpart to `/scrolls-remove`:
  - Restores only the agentic memory: the scrolls folders, plus the
    `SCROLLS.md`/`CLAUDE.md`/`AGENTS.md` stubs re-inserted into those files
    as they are now. Nothing else in the repository is rolled back.
  - Default source: the newest `/scrolls-remove` checkpoint in HEAD's
    history, which it skips if that checkpoint was already restored. If
    there is none, it falls back to the commit before the last deletion
    of a scrolls folder.
  - Accepts any `<COMMIT>`: a removal commit, or an ordinary commit
    containing a scrolls folder.
  - `--onto REF` (plus `-b NEW_BRANCH` for non-branch refs) commits onto
    another branch through a temporary worktree.
  - Flags: `-p`/`-t`/`-l`/`-r`, `--full`, `-f`, `--list [--all]`, `-n`,
    `-y`, `--no-commit`.
  - Records the restore as one `maint(memory): scrolls-restored` commit
    with notes and `Scrolls-*` trailers.
