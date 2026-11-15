# Changelog

All notable changes to the `scrolls-compact` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.6.0] - 2026-11-15

### Added

- New skill. `/scrolls-compact` condenses the history in `SPEC.md`, `PLAN.md`, `HANDOFF.md`, `GAP_ANALYSIS.md` and `GAP_CONTEXT.md` that `git blame` shows is older than a compaction base, and keeps the full text in git at a checkpoint (the commit just before).
  - Base: `--before=YYYYMMDD` or `--base=COMMIT`. By default it is the newer of `--keep-days` (7) and `--keep-commits` (20, counted on the trunk's first-parent line).
  - Open tickets, every `GAP_ANALYSIS.md` line and HANDOFF's open threads are never condensed. `WISDOM.md` and `STARTER.md` are never in scope. `--include`/`--exclude` adjust the files.
  - A read-only plan, then the agent's edits, then `--finalize`, which validates the edits against the plan and makes one `maint(memory): scrolls-compacted` commit with `Scrolls-*` trailers, including `Scrolls-Previous-Compaction` to chain checkpoints.
  - Writes `compacted/scrolls_compact_<yyyymmdd>_<githash>.md` (one marker section per file, with its blob id at the checkpoint), adds a row to `COMPACT.md`'s Compaction History table, lists `COMPACT.md` in `STARTER.md` once, and tags the checkpoint `scrolls-compact/<yyyymmdd>-<githash>` (`--no-tag` to skip).
  - `--list`, `--show` and `--extract` read old history back from git, also after a squash merge or `/scrolls-unhide`.
  - `scripts/compact.py` holds all logic; `compact.sh`/`compact.ps1` are thin launchers. `tests/test_compact.sh` (Red/Green) and `tests/test_compact.ps1` (launcher parity).
