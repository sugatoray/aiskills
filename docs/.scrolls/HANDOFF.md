# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` is at `0999e6f`:** [#314](https://github.com/sugatoray/aiskills/pull/314) (`1.6.0-dev`, ROOT-16) squash-merged. Before it, [#310](https://github.com/sugatoray/aiskills/pull/310) (release 1.5.0) squash-merged; it closed #311–#313. Before it, #272 (`meeting-agenda`, `f27b875`).
- **npm:** `@sugatoray-ai/aiskills` **1.5.0 is published** (`latest`, 2026-11-18T03:01Z; npm `gitHead` `b8ad785`). The user pushed the annotated tag `aiskills-v1.5.0` on it, which rebuilds the docs site with 1.5.0 at the root.
- **`claude/wonderful-ptolemy-my8ha8`** → PR [#320](https://github.com/sugatoray/aiskills/pull/320) (ROOT-17), one squashed commit: the new `agent-sessions-insight` productivity skill (applied from the user's patch, renamed from `agent-session-insight`). It reads local session logs (Claude Code, Codex CLI, Pi, OpenCode, Copilot CLI, Devin CLI, generic JSONL) and fills a bundled offline HTML template via `scripts/build_report.py`; `scripts/make_demo.py` rebuilds the template's fictional demo. Skill tests: 77 pass (Playwright tests need `pip install playwright`). The bundle is 20 skills in 10 groups; package docs and banner regenerated, `## [1.6.0] - Unreleased` CHANGELOG entry, `npm test` 521 pass. Family detail: `src/productivity/docs/.scrolls/`.

## What just happened
- The user merged #310, published 1.5.0 and pushed `aiskills-v1.5.0`; checked against the npm registry (`gitHead`) and the remote tag. ROOT-15 ticked; the tag range in `SPEC.md` runs to `aiskills-v1.5.0`. (The first check, right after the user said it was published, still showed 1.4.0; the release appeared a few minutes later, so check npm before tagging.)
- At the user's request, started `1.6.0-dev` on `claude/aiskills-1.6.0-dev` and ran the step-7 scrolls updates, like #291.
- Built #320 red/green in steps the user asked for: the patch (renamed), a Devin CLI adapter, the package docs and scrolls, a report template plus build script, five report features (evidence, open threads, caveat banner, stacked months, theme button), and the demo generator, moved to `scripts/`.
- At the user's request, made the demo and test data neutral and fictional, and squashed and force-pushed the branch.

## Known issues / open threads
- **The 1.4.0 and 1.5.0 CHANGELOG dates** are 2026-11-18, npm's UTC date. In US Eastern time both were published on the evening of 2026-11-17 (01:25Z and 03:01Z; the 1.3.0 note judged by US Eastern). The user was asked about 1.4.0; no answer yet, so both stay.
- Nobody has looked at the rebuilt docs site since the tag push (this session can't reach `sugatoray.github.io`): `/` should be 1.5.0 and `/v/` the releases before it; `/dev/` shows the development version.
- **`tests/test_compact.ps1` has never run** (no `pwsh` in these sessions).
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered (ROOT-3).
- Branches holding only merged history, deletable at the user's call: `claude/clever-mendel-k9n73h` (#265), `claude/aiskills-1.4.0` (#302), `claude/aiskills-1.5.0-dev` (#306), `claude/sweet-hawking-7u1fpc` (#272), `claude/aiskills-1.5.0` (#310), `claude/keen-babbage-2khhu9` (#215 era). The pre-rebase copy of #272 exists only as a local branch, `backup/pre-rebase-272`, in that session.
- **#320 was squashed and force-pushed** at the user's request, then rebased onto `0999e6f` (`1.6.0-dev`): its package CHANGELOG entry now sits under `## [1.6.0] - Unreleased`, and its tickets were renumbered to ROOT-17 and AIS-29 because #314 used ROOT-16 and AIS-28.
