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
- [x] File #265's issues: epic #266 with sub-issues #267–#270, and #271 for the `EXAMPLES.md` rename (2026-11-16); then, under #266, the viewer epic #295 (#296–#300) and #301 for the rebase (2026-11-18). The PR body lists them all with `Closes`.
- [x] Add `/scrolls-compact` to `SPEC.md` once #265 merges: merged as `57188d0` (2026-11-18) and shipped in npm 1.4.0.
- [ ] Later, to revisit (the user's choice, 2026-11-16: one box for now): in `assets/example-viewer.html`, split the "Note" box into two, Premise in the accent tint and Caveats in a warning-style amber.
- [x] Show `/scrolls-compact`'s examples in the docsite's Skills tab: the page "Browse the scrolls-compact examples" (`explainers/scrolls-compact-examples.md`, under Explainers) embeds `assets/example-viewer.html` (2026-11-16).
- [x] The stale remote branch `claude/confident-maxwell-d6ws37` is gone (checked with `git ls-remote`).
- [x] Build nested scroll sets and routing Red/Green (2.7.0, the family bumped in lockstep), on `claude/scrolls-nested-routing` (from `0999e6f`): `/scrolls-update` gets `scripts/route.py` (+ `route.sh`/`route.ps1`) and a "Route the work" step; `/scrolls-setup` registers a new set with its parent; the `STARTER.md` template gets a `## Where memory lives` table; the explainer, `/scrolls-help` and READMEs describe it. `test_route.sh`: 33 checks.
- [ ] Open a PR for `claude/scrolls-nested-routing` when the user asks, file its issues, and get it merged. It touches the same root `STARTER.md` section idea as #320 (which adds this repo's own router table): merge #320 first, or expect a small conflict in `docs/.scrolls/`.
- [x] Run the `.ps1` suites: all nine pass under PowerShell 7.6 (installed from conda-forge via Miniforge, 2026-11-23), after fixing `open_help.ps1 --stop` (it splatted the port character by character; `test_open_help.ps1` scenario 3 had always failed).
- [ ] Bring the older `.ps1` files up to the PowerShell 5.1 rule in `skills/scrolls/meta/MAINTAINERS.md`: 12 files still have non-ASCII comments or strings, and the test harnesses call `pwsh` by name. No 5.1 is available here to run them on; check on Windows if possible.

Longer-horizon:
- [ ] Consider CI for the repo (explicitly out of scope unless the repo owner asks).
- [ ] Consider moving folders to a new path in `/scrolls-restore`, only if a real need shows up (see `GAP_CONTEXT.md`).
