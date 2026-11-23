# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` (`0999e6f`, `1.6.0-dev`):** all **nine** `scrolls-*` skills at **`2.6.0`**; `/scrolls-compact` merged in [#265](https://github.com/sugatoray/aiskills/pull/265) (`57188d0`).
- **npm:** `@sugatoray-ai/aiskills` **1.5.0** (published, tagged `aiskills-v1.5.0`) bundles the family at 2.6.0. Package detail: `src/packages/aiskills/docs/.scrolls/`.
- **On [#320](https://github.com/sugatoray/aiskills/pull/320) (open), nothing in the scrolls skills changes.** Two things around them do:
  - This memory folder moved from `src/scrolls/` to `src/skills/scrolls/` (its `meta`, `README.md` and `CHANGELOG.md` links got one more `../`). `skills/scrolls/meta/MAINTAINERS.md` was updated for the new path; `skills/scrolls/CHANGELOG.md` keeps the old one as history.
  - `skills/scrolls/meta/` (the family-wide `MAINTAINERS.md`) no longer ships in the npm package from 1.6.0: `skills/.skillsignore` leaves out every group-level `meta/`. The skills' own `meta/` folders still ship.
- Branches holding only merged history: `claude/clever-mendel-k9n73h` (#265) and `claude/aiskills-1.4.0` (#302); deleting them is the user's call.

## What just happened
1. **On #320:** the folder move and the packaging change above; `SCROLLS.md` and `STARTER.md` now say `meta/MAINTAINERS.md` here opens `skills/scrolls/meta/MAINTAINERS.md`; `STARTER.md` no longer says `scrolls-compact` is unmerged.
2. `/scrolls-setup` was used to create three new scroll sets elsewhere in the repo (video-related, repo-related, image-styles); `/scrolls-update` ran several times, ending with the root scroll set becoming a router (see the root `STARTER.md`). Both commands behaved as documented; nothing in the skills needed changing.

## Known issues / open threads

- `tests/test_compact.ps1` has never run (no `pwsh` here), like every other `.ps1` suite.
- To revisit later (PLAN): split the example viewer's "Note" box in two, with Caveats in a warning-style amber. The user chose one box for now.
- After any change to a scrolls skill's `SKILL.md`, run `skills/scrolls/scrolls-explainer/scripts/explain.sh --build`, review the named tabs, then `--build --reviewed`. After a change to an example, rebuild the viewer (`python3 skills/scrolls/scrolls-compact/scripts/build_example_viewer.py`). Then run `npm run docs` in `src/packages/aiskills/`.
