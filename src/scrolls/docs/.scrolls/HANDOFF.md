# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state

- **`master`:** six `scrolls-*` skills at `2.2.0`: setup, update, hide, unhide, help, and the new **remove**. PR #7 (2.1.0) and PR #110 (`/scrolls-remove`, 2.2.0) are both merged.
- **Branch `claude/scrolls-restore`:** one commit (`2a46fb5`) on top of `master` adds **`/scrolls-restore`** and bumps the whole family to `2.3.0`. It's pushed, but **no PR has been opened yet**.
- **Later on that branch:** every skill gained `assets/EXAMPLES.md` (ASD-STE100, linked from `SKILL.md` and `README.md`), and the family was bumped to **`2.4.0`**. PR #114 is open for the branch, with issues #115–#118.
- **Stale branch:** `claude/confident-maxwell-d6ws37` on the remote still points at the pre-squash `/scrolls-remove` commit (`d5f06d2`), whose content is already on `master` as `c692f5d`. Leave it or delete it; don't build on it.

## What just happened

1. **`/scrolls-remove` designed and built.**
   - The commit message contract is the user's own format: subject `maint(memory): scrolls-removed`, then `- previous commit: #<sha>`. The `Notes:` section and `Scrolls-*` trailers were added so a later restore can parse it.
   - `-x/--purge` takes a target list (`CLAUDE.md`, `AGENTS.md`, `SCROLLS.md`, any file name, or `all`).
   - Issues #111, #112 and #113 were filed for it, and PR #110 was retitled and its body given an Issues section.
2. **`/scrolls-restore` designed and built.** The user decided:
   - purged files come back as the stub only, with `--full` as the opt-in
   - with no checkpoint, it falls back to the commit before the last plain deletion
   - `--onto` works through a temporary worktree
   - `--all` applies to `--list` only
   - a checkpoint that was already restored is skipped
3. **Shared design for both new skills:** all logic is in one stdlib Python file (`remove.py`/`restore.py`), with thin `.sh`/`.ps1` launchers.
4. **Pushing the restore work.** After PR #110 merged, the branch was restarted from `master`. Pushing it there needed a force-push, which the permission classifier blocked, so with the user's OK the work went to the new branch `claude/scrolls-restore` instead.

## Known issues / open threads

- Open a PR for `claude/scrolls-restore`, then file its issues the same way as for #110.
- `remove.ps1`, `restore.ps1` and their `tests/*.ps1` harnesses have never been run, because there's no `pwsh` here and downloading it was blocked.
- Existing open threads that are still true: the `/scrolls-update` backfill has no automated test, and the README install examples are pinned to `skills` CLI `v1.5.23` behavior.
