# PLAN.md — Prioritized Backlog

The ordered, ticketed backlog. Highest priority first. Update ticket status (`[ ]` → `[x]`) as work completes, and re-prioritize when new requests change the calculus — this file reflects what's next, not a permanent record (that's what git history is for).

- [x] PROD-1: Merge PR [sugatoray/aiskills#272](https://github.com/sugatoray/aiskills/pull/272), the new `productivity` group with `meeting-agenda` 1.0.0, for the package's 1.5.0 (rebased onto `1.5.0-dev`). Its description has the red/green summary and the issue list: parent #273 with sub-issues #274–#286. Squash-merged as `f27b875` (2026-11-18); all 14 issues closed. Ships in the package's 1.5.0 (root ROOT-15, package AIS-27).
- [ ] PROD-6: Merge PR [#320](https://github.com/sugatoray/aiskills/pull/320): `agent-sessions-insight` 1.0.0 (applied from the user's patch, renamed from `agent-session-insight`) with the Devin CLI adapter (red/green: 5 new tests failed, then passed; 28 in all). The PR description has the red/green summary. Root ROOT-17.
- [x] PROD-8: Replace the hand-written report with a template and build script, red/green: `assets/agent-sessions-insight.html` (eight tabs, demo data built in), `scripts/build_report.py` (validation, `<` escaping, `--demo`), 19 stdlib and 11 Playwright tests (58 in all). On [#320](https://github.com/sugatoray/aiskills/pull/320).
- [x] PROD-9: Add five report features, red/green: evidence on habits and friction, habits as numbered cards, an open-threads table, a "What this is based on" caveat banner, and months stacked by agent with totals, lead sentences, a theme button and a reduced-motion guard. 12 new tests (70 in all). On [#320](https://github.com/sugatoray/aiskills/pull/320).
- [x] PROD-10: Add the demo generator to the skill as `scripts/make_demo.py` (deterministic; `--check`), with 6 tests (76 in all).
- [ ] PROD-7: Check the Copilot CLI, Devin CLI and OpenCode SQLite adapters against redacted real logs when the user can share some (see GAP_ANALYSIS).
- [ ] PROD-2: Stop the screenshot churn: have `tests/test_screenshots.py` write only when asked (for example `MEETING_AGENDA_SHOTS=1`), and still assert the visual states otherwise. Offered to the user; waiting for a yes.
- [ ] PROD-3: Optional, if asked: save timer state across reloads (see GAP_ANALYSIS).
- [x] PROD-5: Add Clarity and Clarity Dark (Apple's design principles) after Signal; twelve themes in all. Mockup approved first. Commit `2d17234`, issue #286.
- [x] PROD-4: Add five studio themes (Aurora, Observatory, Abyss, Editorial, Signal) in front of the five classics; Aurora is the default. Commit `0357d62`, issue #285.
- [x] PROD-0: Build `meeting-agenda`, from the first draft to the Settings redesign and the fixed agenda-item line. Done on `claude/sweet-hawking-7u1fpc`.
