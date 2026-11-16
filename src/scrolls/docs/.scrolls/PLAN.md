# PLAN.md — Prioritized Backlog

The ordered, ticketed backlog. Highest priority first. Update ticket status (`[ ]` → `[x]`) as work completes, and re-prioritize when new requests change the calculus — this file reflects what's next, not a permanent record (that's what git history is for).

- [x] Design and build `/scrolls-remove` (2.2.0), with tests, docs, and the family lockstep bump; merged as PR #110.
- [x] File issues for PR #110: #111, with sub-issues #112 and #113. Retitle the PR and add an Issues section.
- [x] Design `/scrolls-restore`'s interface with the user, then build it (2.3.0) with tests driven end to end through `remove.sh`.
- [x] Push the restore work: `claude/scrolls-restore`, commit `2a46fb5`.
- [x] Open a PR for the restore work and file its issues: PR #114 (issues #115–#118), merged as `718388a` (2.4.0).
- [x] Build `/scrolls-explainer` Red/Green (2.5.0, the family bumped in lockstep), bundled in the npm package `1.1.0`. On `claude/brave-mccarthy-m6aut0`.
- [x] Open a PR for `claude/brave-mccarthy-m6aut0`: [#206](https://github.com/sugatoray/aiskills/pull/206) (2026-11-12).
- [x] File #206's issues: epic #207 with sub-issues #208–#213 (2026-11-12); PR body lists them with `Closes`.
- [x] Show the explainer on the npm package's docs site (embedded, works from `index.html` alone and on phones); checked by the user in an artifact preview.
- [x] Get #206 merged: merged as `67b771c` (2.5.0, npm 1.1.0).
- [x] Design `/scrolls-compact` with the user (`skills/scrolls/scrolls-compact/meta/DESIGN.md`), then build it Red/Green (2.6.0, the family bumped in lockstep), with replay-tested examples split into an index + one file each. On `claude/clever-mendel-k9n73h`.
- [x] Open a PR for `claude/clever-mendel-k9n73h`: [#265](https://github.com/sugatoray/aiskills/pull/265), created from the Claude Code UI (2026-11-16).
- [x] File #265's issues: epic #266 with sub-issues #267–#270, and #271 for the `EXAMPLES.md` rename (2026-11-16); the PR body lists them with `Closes`.
- [ ] Add `/scrolls-compact` to `SPEC.md` once #265 merges.
- [ ] Later, to revisit (the user's choice, 2026-11-16: one box for now): in `assets/example-viewer.html`, split the "Note" box into two, Premise in the accent tint and Caveats in a warning-style amber.
- [ ] Show `/scrolls-compact`'s examples in the docsite's Skills tab, using `assets/example-viewer.html` (the user's next step; the page uses the same `marked` 12.0.2 from cdnjs as `docs/docsite/index.html`).
- [ ] Run `tests/test_remove.ps1`, `tests/test_restore.ps1`, `tests/test_explain.ps1`, `tests/test_compact.ps1` (and the older `.ps1` suites) somewhere `pwsh` is available.
- [x] The stale remote branch `claude/confident-maxwell-d6ws37` is gone (checked with `git ls-remote`).

Longer-horizon:
- [ ] Consider CI for the repo (explicitly out of scope unless the repo owner asks).
- [ ] Consider moving folders to a new path in `/scrolls-restore`, only if a real need shows up (see `GAP_CONTEXT.md`).
