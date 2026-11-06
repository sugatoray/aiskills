# GAP_ANALYSIS.md — Known Gaps

Concrete list of what is NOT implemented yet, or is a known partial/simplified implementation. One line per gap, terse. Remove a line the moment it's closed — don't mark it done, delete it; `GAP_CONTEXT.md` keeps the historical reasoning if that's ever needed.

- `--route` registry lookup never run against the live skills.sh service.
- Agent patterns (`-a 'claude*'`) and `--route` lookups depend on parsing `npx skills` text output, not a stable API.
- No `-d/--dir <path>` option; project-scope commands only act on the current folder.
- No CI workflow: nothing runs `npm test` on pull requests, and publishing to npm is manual.
- The CLI tests are skipped on Windows, and `npm run test:e2e` only works in a POSIX shell.
- Not yet published to npm (`0.1.0`).

See `GAP_CONTEXT.md` for the reasoning behind each entry.
