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
  - `assets/EXAMPLES.md` (a small index, with each example's file and what it starts from) and `assets/examples/example_001.md`–`example_023.md`: 23 examples, each with a premise, caveats, the prompt and its real output, covering every flag, refusal and exit code 0–4 on one demo repository. An agent reads the index, then only the example it needs. `tests/test_examples.sh` replays them all, fails on any difference, and fails if the index and the files drift apart.
  - `assets/example-viewer.html`: the index and every example on one page, one tab each, rendered or as Markdown, with Previous/Next and Jump to; links between the files open the matching tab. Each example's Premise and Caveats sit together in one tinted box labelled "Note". It works on its own and embedded in an `<iframe srcdoc>`, as the docsite's "Browse the scrolls-compact examples" page shows it. Styled with Lights Out, the banner's and the docsite's theme, light and dark. Built by `scripts/build_example_viewer.py` and checked by `tests/test_example_viewer.sh`.
  - Unit labels longer than 72 characters end at a whole word with `…`; a rule of one reads `1 day` / `1 commit`; a bad `--before`/`--base` fails before any plan output.
  - `scripts/compact.py` holds all logic; `compact.sh`/`compact.ps1` are thin launchers. `tests/test_compact.sh` (Red/Green) and `tests/test_compact.ps1` (launcher parity).
