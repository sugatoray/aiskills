# GAP_ANALYSIS.md — Known Gaps

Concrete list of what is NOT implemented yet, or is a known partial/simplified implementation. One line per gap, terse. Remove a line the moment it's closed — don't mark it done, delete it; `GAP_CONTEXT.md` keeps the historical reasoning if that's ever needed.

- No `.ps1` path has ever been executed here: the hide/unhide/help scripts are hand-mirrored, and the `remove.ps1`/`restore.ps1` launchers and their `tests/*.ps1` harnesses are unrun. There's no `pwsh` in this environment.
- No CI is configured on the `sugatoray/aiskills` repo, so PR mergeability has only ever been checked by local test runs, not an automated gate.
- The per-skill `README.md` install examples were verified against `skills` CLI `v1.5.23` specifically (flag names, `--agent` auto-detection behavior); a future CLI release could rename or change the behavior of a flag without this repo noticing, since nothing here pins or tests against a specific CLI version.
- `/scrolls-restore` puts folders back only at their original paths; it can't relocate memory into a project whose layout has moved since the removal.

See `GAP_CONTEXT.md` for the reasoning behind each entry.
