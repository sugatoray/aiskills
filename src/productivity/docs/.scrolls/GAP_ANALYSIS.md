# GAP_ANALYSIS.md — Known Gaps

Concrete list of what is NOT implemented yet, or is a known partial/simplified implementation. One line per gap, terse. Remove a line the moment it's closed — don't mark it done, delete it; `GAP_CONTEXT.md` keeps the historical reasoning if that's ever needed.

- Timer state isn't saved: reloading the page resets every item's timer.
- The meeting title can be set in Settings → Contents, but there's no way to set per-item notes or speaker names.
- Detailed View has no drag-and-drop for items or sub-points (↑ ↓ buttons and Enter/Backspace only).
- Minutes accept any value above 0. The 0.5 step is a UI hint, not a validation rule.
- The tests regenerate tracked screenshots on every run (see HANDOFF).
- The studio themes' art direction needs a 2023+ browser (CSS nesting); older browsers get their colours only.

See `GAP_CONTEXT.md` for the reasoning behind each entry.
