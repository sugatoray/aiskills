# GAP_ANALYSIS.md — Known Gaps

Concrete list of what is NOT implemented yet, or is a known partial/simplified implementation. One line per gap, terse. Remove a line the moment it's closed — don't mark it done, delete it; `GAP_CONTEXT.md` keeps the historical reasoning if that's ever needed.

- `scripts/link-skills.sh` is untested on macOS and Windows.
- Only 15 of the repo's 21 skills are linked into `.agents/skills/` and `.claude/skills/`.
- `flight-status` (#81) is missing `assets/sample-map.png` and `assets/screenshots/`, so 3 of its 113 tests fail.
- `flight-status` has no FlightAware CLI outside Meta's Muse: live runs need a wrapper behind `FLIGHTAWARE_CLI` (only `-m` works without one).

See `GAP_CONTEXT.md` for the reasoning behind each entry.
