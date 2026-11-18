# GAP_CONTEXT.md — Why Each Gap Exists

The *why* behind every entry in `GAP_ANALYSIS.md`: deliberate scope cut, genuine oversight, or technical blocker. Add or remove an entry here in lockstep with `GAP_ANALYSIS.md` — one gap, one reason.

- **Timer state not saved:** a deliberate scope cut. The spec asked for timers that pause and resume within a session. Saving them would mean deciding what a reload during a meeting should do, which nobody has asked for.
- **No per-item notes or speakers:** not requested. The data model (`{minutes, title, points}`) would need a new field, plus the checks in `normalize()` in both the page and `build_deck.py`.
- **No drag-and-drop:** a deliberate cut. The approved Detailed View mockup showed drag handles on sub-points, but buttons and keyboard editing cover the need, and drag-and-drop is hard to make accessible and to test reliably.
- **Minutes not validated to 0.5 steps:** deliberate. Rejecting values like 7.25 would annoy more than it helps, and the deck shows any value correctly.
- **Studio themes need CSS nesting:** deliberate. The art direction for the five studio themes sits in one nested block under `:root:is([data-theme=…])`, which needs Chrome 112, Safari 16.5 or Firefox 117. Expanding the selector on every rule would keep older browsers fully styled, at the cost of a much longer stylesheet. Revisit only if a user reports an old browser.
- **Screenshot churn:** an oversight. `tests/test_screenshots.py` writes into `meta/screenshots/` on every run. A fix (only save when an env var is set) was offered to the user, who hasn't answered.
