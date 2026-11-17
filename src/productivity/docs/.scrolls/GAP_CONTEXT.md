# GAP_CONTEXT.md — Why Each Gap Exists

The *why* behind every entry in `GAP_ANALYSIS.md`: deliberate scope cut, genuine oversight, or technical blocker. Add or remove an entry here in lockstep with `GAP_ANALYSIS.md` — one gap, one reason.

- **Timer state not saved:** a deliberate scope cut. The spec asked for timers that pause and resume within a session. Saving them would mean deciding what a reload during a meeting should do, which nobody has asked for.
- **No per-item notes or speakers:** not requested. The data model (`{minutes, title, points}`) would need a new field, plus the checks in `normalize()` in both the page and `build_deck.py`.
- **No drag-and-drop:** a deliberate cut. The approved Detailed View mockup showed drag handles on sub-points, but buttons and keyboard editing cover the need, and drag-and-drop is hard to make accessible and to test reliably.
- **Minutes not validated to 0.5 steps:** deliberate. Rejecting values like 7.25 would annoy more than it helps, and the deck shows any value correctly.
- **Screenshot churn:** an oversight. `tests/test_screenshots.py` writes into `meta/screenshots/` on every run. A fix (only save when an env var is set) was offered to the user, who hasn't answered.
