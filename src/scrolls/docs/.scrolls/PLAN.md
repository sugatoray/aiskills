# PLAN.md — Prioritized Backlog

The ordered, ticketed backlog. Highest priority first. Update ticket status (`[ ]` → `[x]`) as work completes, and re-prioritize when new requests change the calculus — this file reflects what's next, not a permanent record (that's what git history is for).

- [x] Design and build `/scrolls-remove` (2.2.0), with tests, docs, and the family lockstep bump; merged as PR #110.
- [x] File issues for PR #110: #111, with sub-issues #112 and #113. Retitle the PR and add an Issues section.
- [x] Design `/scrolls-restore`'s interface with the user, then build it (2.3.0) with tests driven end to end through `remove.sh`.
- [x] Push the restore work: `claude/scrolls-restore`, commit `2a46fb5`.
- [ ] Open a PR from `claude/scrolls-restore` to `master`, then file its issues and update the PR with an Issues section, the same way as for #110.
- [ ] Run `tests/test_remove.ps1` and `tests/test_restore.ps1` (and the older `.ps1` suites) somewhere `pwsh` is available.
- [ ] Optionally delete the stale remote branch `claude/confident-maxwell-d6ws37`. Its content is already on `master`; this is the user's call.

Longer-horizon:
- [ ] Consider CI for the repo (explicitly out of scope unless the repo owner asks).
- [ ] Consider moving folders to a new path in `/scrolls-restore`, only if a real need shows up (see `GAP_CONTEXT.md`).
