# GAP_ANALYSIS.md — Known Gaps

Concrete list of what is NOT implemented yet, or is a known partial/simplified implementation. One line per gap, terse. Remove a line the moment it's closed — don't mark it done, delete it; `GAP_CONTEXT.md` keeps the historical reasoning if that's ever needed.

- `.ps1` variants of every script changed this session (`scrolls-hide`, `scrolls-unhide`, `scrolls-help`) are hand-mirrored from verified `.sh` behavior, never actually executed — no `pwsh` in this environment.
- No CI is configured on the `sugatoray/aiskills` repo, so PR #7's mergeability has only ever been verified by local test runs, not an automated gate.

See `GAP_CONTEXT.md` for the reasoning behind each entry.
