# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` is at `715aca5`:** #287 released 1.3.0 (`a92ab00`), and #291 started `1.4.0-dev` with an empty `## [1.4.0] - Unreleased` section.
- **npm:** `@sugatoray-ai/aiskills` **1.3.0** is the latest (published 2026-11-17, tagged `aiskills-v1.3.0`). `/scrolls-compact` is **not** in it: it ships in 1.4.0.
- **`claude/clever-mendel-k9n73h`**, open as **[#265](https://github.com/sugatoray/aiskills/pull/265)**, is **rebased onto `715aca5`** (2026-11-17, at the user's request) and force-pushed. It is part of **1.4.0-dev**:
  - The new **`/scrolls-compact`** skill and the scrolls family at **2.6.0**. Design: `skills/scrolls/scrolls-compact/meta/DESIGN.md`. Family detail: `src/scrolls/docs/.scrolls/`.
  - Its 23 replay-tested examples (`assets/EXAMPLES.md` plus `assets/examples/`), and `assets/example-viewer.html`, which shows them one tab each. The docsite shows the viewer in its Skills tab under Explainers, and embedded pages now follow the docs' light/dark button.
  - `assets/EXAMPLE.md` renamed `assets/EXAMPLES.md` in `run-code-review` (1.3.1), `artwallbg` and `commentdrop` (1.0.1).
  - The package CHANGELOG lists all of it under `[1.4.0] - Unreleased`. The rebase moved these entries there from `[1.3.0]`, which is released and now matches `master`.
  - Tests on the rebased branch: package `npm test` 519; `test_compact.sh` 126; `test_examples.sh` 420; `test_example_viewer.sh`; `test_explain.sh` 110; the other scrolls suites; `make test-scripts` 59. All pass.

## What just happened
- Rebased the branch's 14 commits onto `master` (`715aca5`, 1.4.0-dev). Conflicts:
  - generated docs and the banner: took `master`'s side, then regenerated with `npm run docs` and `npm run banner:png` at each commit;
  - the package CHANGELOG: moved this branch's entries into `[1.4.0]`;
  - the root scrolls: `PLAN.md` keeps `master`'s ROOT-6 and ROOT-9, and this snapshot was rewritten.
- Earlier on the branch: the example viewer (theme, Note box, docsite page, light/dark sync). Issues for [#265](https://github.com/sugatoray/aiskills/pull/265): epic #266 (#267–#270, plus the viewer epic #295 with #296–#300, and #301 for the rebase) and #271.

## Known issues / open threads
- **[#265](https://github.com/sugatoray/aiskills/pull/265) is open, not merged** (ROOT-10). Add `/scrolls-compact` to `SPEC.md` once it merges. Its description lists every issue with `Closes`: epic #266 (#267–#270, plus the viewer epic #295 with #296–#300, and #301 for the rebase) and #271. Package detail is in `src/packages/aiskills/docs/.scrolls/` (AIS-23).
- **`tests/test_compact.ps1` has never run.** This session had no `pwsh`; the same scenario passed through the bash launcher.
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered (ROOT-3).
- `claude/keen-babbage-2khhu9` still holds merged #215-era history. Reusing it needs a reset from `master` and a force push, which the user must approve.
