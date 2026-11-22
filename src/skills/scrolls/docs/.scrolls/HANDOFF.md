# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state

- **`master` (`1780fd5`):** all **nine** `scrolls-*` skills at **`2.6.0`**. `/scrolls-compact` merged as [#265](https://github.com/sugatoray/aiskills/pull/265) (`57188d0`); its 13 issues (#266–#271, #295–#301) are closed. See `SPEC.md` for what it does.
- **npm:** `@sugatoray-ai/aiskills` **1.4.0** (published 2026-11-18T01:25Z, tagged `aiskills-v1.4.0`) bundles the family at 2.6.0, and its docs site has the "Browse the scrolls-compact examples" page. Package detail: `src/packages/aiskills/docs/.scrolls/`.
- **Branch `claude/aiskills-1.5.0-dev`** (pushed; no PR yet) starts the package's `1.5.0-dev` and carries the scrolls updates for the 1.4.0 release, this one included. Nothing in the scrolls skills changes on it.
- Branches holding only merged history: `claude/clever-mendel-k9n73h` (#265) and `claude/aiskills-1.4.0` (#302); deleting them is the user's call.

## What just happened

1. **#265 merged and shipped in 1.4.0.** It added `/scrolls-compact` (designed with the user, built Red/Green), its 23 replay-tested examples, `assets/example-viewer.html` (Lights Out theme, a "Note" box around Premise and Caveats) and its docs-site page, bumped the family to 2.6.0, and renamed `assets/EXAMPLE.md` → `assets/EXAMPLES.md` in three other skills. Before merging it was rebased onto `1.4.0-dev`.
2. **Scrolls:** `/scrolls-compact` is now in `SPEC.md`, and its PLAN ticket is ticked.

## Known issues / open threads

- `tests/test_compact.ps1` has never run (no `pwsh` here), like every other `.ps1` suite.
- To revisit later (PLAN): split the example viewer's "Note" box in two, with Caveats in a warning-style amber. The user chose one box for now.
- After any change to a scrolls skill's `SKILL.md`, run `skills/scrolls/scrolls-explainer/scripts/explain.sh --build`, review the named tabs, then `--build --reviewed`. After a change to an example, rebuild the viewer (`python3 skills/scrolls/scrolls-compact/scripts/build_example_viewer.py`). Then run `npm run docs` in `src/packages/aiskills/`.
