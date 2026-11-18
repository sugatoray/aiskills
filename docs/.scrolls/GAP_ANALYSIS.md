# GAP_ANALYSIS.md — Known Gaps

Concrete list of what is NOT implemented yet, or is a known partial/simplified implementation. One line per gap, terse. Remove a line the moment it's closed — don't mark it done, delete it; `GAP_CONTEXT.md` keeps the historical reasoning if that's ever needed.

- `scripts/link-skills.sh` is untested on macOS and Windows.
- Only 15 of the repo's 21 skills are linked into `.agents/skills/` and `.claude/skills/`.
- `flight-status` (#81) is missing `assets/sample-map.png` and `assets/screenshots/`, so 5 of its 104 tests fail.

See `GAP_CONTEXT.md` for the reasoning behind each entry.
