# GAP_ANALYSIS.md — Known Gaps

Concrete list of what is NOT implemented yet, or is a known partial/simplified implementation. One line per gap, terse. Remove a line the moment it's closed — don't mark it done, delete it; `GAP_CONTEXT.md` keeps the historical reasoning if that's ever needed.

- `/code-review` has never been run by an independent agent on code it had not seen; its detection rate is unmeasured, and the sample report in `assets/EXAMPLE.md` (Example-01) was written by hand on seeded defects.
- Reference statements about Windows PowerShell 5.1, MySQL, SQL Server, older PostgreSQL, GitHub Actions' runtime, Kubernetes, Docker Compose, Ansible, Ruby, SnakeYAML and package-index resolution come from documentation; none was run.
- `scripts/check_formats.py` runs no linter or schema validator; it only lists the ones on `PATH`. It reports YAML as `unchecked` without PyYAML, TOML as `unchecked` on Python older than 3.11, and XML that declares DTD entities and `.jsonc`/`.json5` files with comments as `unchecked`.
- The two scripts and their tests have only been run on Linux (Python 3.10 and 3.12); never on Windows or macOS.
- Only the fourteen listed languages are reviewed with a checklist; files in any other language (Go, Java, C#, …) are listed as `unsupported`.
- No workflow runs the skill's tests: the repository's only workflow runs on pushes to `master` that touch the npm package's docs.
- The subgroup has no `CHANGELOG.md`, so `src/development/reviews/` has no `CHANGELOG.md` symlink where `src/scrolls/` has one.

See `GAP_CONTEXT.md` for the reasoning behind each entry.
