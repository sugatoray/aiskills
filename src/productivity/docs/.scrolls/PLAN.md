# PLAN.md — Prioritized Backlog

The ordered, ticketed backlog. Highest priority first. Update ticket status (`[ ]` → `[x]`) as work completes, and re-prioritize when new requests change the calculus — this file reflects what's next, not a permanent record (that's what git history is for).

- [ ] PROD-1: Merge PR [sugatoray/aiskills#272](https://github.com/sugatoray/aiskills/pull/272), the new `productivity` group with `meeting-agenda` 1.0.0. If the user asks, first add the red/green summary and an issue list to its description (repo-root ROOT-10). When merged, date the skill's CHANGELOG `[1.0.0]` if needed.
- [ ] PROD-2: Stop the screenshot churn: have `tests/test_screenshots.py` write only when asked (for example `MEETING_AGENDA_SHOTS=1`), and still assert the visual states otherwise. Offered to the user; waiting for a yes.
- [ ] PROD-3: Optional, if asked: save timer state across reloads (see GAP_ANALYSIS).
- [x] PROD-0: Build `meeting-agenda`, from the first draft to the Settings redesign and the fixed agenda-item line. Done on `claude/sweet-hawking-7u1fpc`.
