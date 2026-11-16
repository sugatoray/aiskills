# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` is at `904e593`:** #245 (colored CLI output and the CLI outputs page, `73af49b`) and #250 (`aiskills config` and a grouped Skills tab in the docs, `904e593`) are merged.
- **npm:** `@sugatoray-ai/aiskills` 1.2.0 is still the latest; `package.json` on `master` is `1.3.0-dev`.
- **`claude/clever-mendel-k9n73h`** (from `904e593`; pushed; open as **[#265](https://github.com/sugatoray/aiskills/pull/265)**, created from the Claude Code UI): the new **`/scrolls-compact`** skill and the scrolls family at **2.6.0**.
  - `/scrolls-compact` condenses old scroll history and keeps the full text in git at a tagged checkpoint, with `COMPACT.md` and `compacted/scrolls_compact_<yyyymmdd>_<githash>.md` as the index. Design: `skills/scrolls/scrolls-compact/meta/DESIGN.md`.
  - The skill's examples are an index, `assets/EXAMPLES.md`, plus one file per example, `assets/examples/example_001.md`–`example_023.md`. A replay test checks every documented output against the real script.
  - Repo-wide effects on the branch: all nine scrolls skills are bumped to 2.6.0; the package docs and banner are regenerated (18 bundled skills, 9 in `scrolls-skills`); and the package tests' hardcoded skill and tab counts are updated to match. The package CHANGELOG `[1.3.0]` lists the new skill.
  - All tests pass: the scrolls suites, `test_compact.sh` 126, `test_examples.sh` 420, and the package `npm test` 516.

## What just happened
- Designed `/scrolls-compact` with the user (four decisions, recorded in `DESIGN.md` §11), then built it Red/Green.
- Added the replay-tested examples. Reading their real outputs found three bugs, each fixed test-first.
- At the user's request, merged the two example files into one `EXAMPLES.md`, then split it into the index plus per-example files, so an agent reads about 2k tokens instead of 25k.
- Linked `scrolls-compact` (`make link-skills`) and recorded the work in the family scrolls (`src/scrolls/docs/.scrolls`). Found three places the first pass missed and fixed them: the root marketplace description, the root `README.md` skills table, and the install commands in `src/scrolls/CLAUDE.md`. The family `WISDOM.md` now lists every place a new scrolls skill must be added.
- Published a private review page comparing the merge with both source files ([scrolls-compact Examples Merge](https://claude.ai/artifact/5kSccRSDNDVG9t1vGxZEcp)). The merge is adopted, so the page is now only a record.

- At the user's request, renamed `assets/EXAMPLE.md` to `assets/EXAMPLES.md` in `run-code-review` (1.3.1), `artwallbg` and `commentdrop` (1.0.1), so every skill uses one name. A new package test fails if a bundled skill ships `assets/EXAMPLE.md` again; `npm test` passes 517.

## Known issues / open threads
- **[#265](https://github.com/sugatoray/aiskills/pull/265) is open, not merged** (ROOT-10: issues filed, epic #266 with #267–#270, plus #271; `SPEC.md` waits for the merge). Pushing to `claude/clever-mendel-k9n73h` updates it. It regenerates the package docs, so rebase onto `master` and re-run `npm run docs` if another docs PR lands first.
- **`tests/test_compact.ps1` has never run.** This session had no `pwsh`; the same scenario passed through the bash launcher.
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered (ROOT-3).
