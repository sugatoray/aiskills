# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state

All five `scrolls-*` skills (`scrolls-setup`, `scrolls-update`, `scrolls-hide`, `scrolls-unhide`, `scrolls-help`) are at version `2.1.0`, on branch `claude/snyk-scrolls-help-safety-ue9pkk`, tracked by open PR #7 (not yet merged) and GitHub issues #8–#18. `src/scrolls/docs/.scrolls/` (this scroll set) was scaffolded via `/scrolls-setup`, dogfooding the family's own convention — including `docs/.scrolls/` itself, `SCROLLS.md`, and the `CLAUDE.md`/`AGENTS.md` pointer chain.

## What just happened

Closed the gap flagged in the previous snapshot: `scrolls-update` gained a new step 2 that idempotently backfills `SCROLLS.md`, `CLAUDE.md`, and `AGENTS.md` for any project set up by a pre-`2.0.0` `scrolls-setup` — reading its three pointer templates from `scrolls-setup`'s own `assets/templates/` rather than duplicating them, and never overwriting or reordering anything already in those files.

While designing that step, a dry-run against a simulated pre-`1.2.0` fixture (a `CLAUDE.md` with the old direct `SCROLLS_PATH/STARTER.md` embed, no `SCROLLS.md`) surfaced a real bug in the *existing* `scrolls-setup` logic too: its leave-alone condition treated "already points straight at `SCROLLS_PATH/STARTER.md`" as equivalent to "already references `SCROLLS.md`" and skipped insertion either way — meaning a legacy project would never actually gain the `SCROLLS.md` stub, even on a fresh re-run. Fixed in both skills: the stub is now inserted whenever `CLAUDE.md` doesn't already reference `SCROLLS.md` specifically, additive-only, so an old direct reference and the new stub can coexist. Verified with an actual dry-run fixture (create → apply once → confirm all three files correct → apply again → confirm no-op).

Bumped all five skills `2.0.0` → `2.1.0` (minor: additive, backward-compatible, no breaking behavior) and updated every `CHANGELOG.md` (five per-skill plus the family-wide one).

See `SPEC.md` for the full feature list and `WISDOM.md` for the lessons (including the dry-run-before-documenting one this gap produced).

## Known issues / open threads

- PR #7 hasn't merged yet; issues #8–#18 stay open until it does. PR description likely needs another refresh to mention the `2.1.0` bump.
- `.ps1` script changes throughout this branch were hand-mirrored from verified `.sh` behavior — `pwsh` isn't available in this sandboxed environment, so none of the PowerShell paths have actually been executed here.
- The backfill logic itself has no automated test (steps 2/4 in both skills are followed via Read/Write/Edit at invocation time, not a script) — correctness rests on the SKILL.md prose plus the manual dry-run above, not a regression suite.
