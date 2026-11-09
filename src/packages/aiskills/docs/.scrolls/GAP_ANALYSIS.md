# GAP_ANALYSIS.md — Known Gaps

Concrete list of what is NOT implemented yet, or is a known partial/simplified implementation. One line per gap, terse. Remove a line the moment it's closed — don't mark it done, delete it; `GAP_CONTEXT.md` keeps the historical reasoning if that's ever needed.

- `--route` registry lookup never run against the live skills.sh service.
- Agent patterns (`-a 'claude*'`) and `--route` lookups depend on parsing `npx skills` text output, not a stable API.
- No `-d/--dir <path>` option; project-scope commands only act on the current folder.
- No CI workflow: nothing runs `npm test` on pull requests, and publishing to npm is manual.
- Nothing has run on real Windows: the CLI tests are skipped there, `npm run test:e2e` only works in a POSIX shell, and the Windows `cmd.exe` safety checks are only unit-tested.
- The skills.sh count relies on undocumented `skills` CLI behaviour (it sends an install event only for GitHub sources, after a public-repo check); a newer pinned `skills` may change it. Not verified that skills.sh's number goes up (checked only that the command installs into the temp folder, with `DISABLE_TELEMETRY`).
- The docs page needs network to render (marked and highlight.js come from cdnjs).

See `GAP_CONTEXT.md` for the reasoning behind each entry.
