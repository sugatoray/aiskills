# PLAN.md — Prioritized Backlog

The ordered, ticketed backlog. Highest priority first. Update ticket status (`[ ]` → `[x]`) as work completes, and re-prioritize when new requests change the calculus — this file reflects what's next, not a permanent record (that's what git history is for).

- [x] Implement the `scrolls-update` idempotent backfill: add `SCROLLS.md`/`CLAUDE.md`-stub/`AGENTS.md`-stub creation for existing projects that predate `2.0.0`, sourcing the shared pointer content from `scrolls-setup`'s `assets/templates/` (single source of truth, not duplicated).
- [x] Make the equivalent guarantee explicit in `scrolls-setup`'s own `SKILL.md` (the mechanism already backfills correctly via step 4's unconditional walk, but say so plainly rather than leaving it implicit).
- [x] Update `meta/MAINTAINERS.md` (both `scrolls-setup`'s and `scrolls-update`'s) to document the shared-template cross-reference.
- [x] Bump all five `scrolls-*` skills together per the lockstep policy (minor bump: additive, not breaking) and update every `CHANGELOG.md`.
- [x] Dry-run the new backfill logic against a simulated pre-`2.0.0` project fixture before calling it done.
- [ ] Commit, push, and note the change in PR #7 if it's still open.

Longer-horizon, not yet ticketed in detail (tracked instead as GitHub issues #8–#18 until/unless they need local scroll entries too):
- [ ] Merge PR #7 once ready, and close out issues #8–#18 accordingly.
- [ ] Consider CI for the repo (explicitly out of scope unless the repo owner asks).
