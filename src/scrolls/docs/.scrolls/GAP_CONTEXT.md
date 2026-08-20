# GAP_CONTEXT.md — Why Each Gap Exists

The *why* behind every entry in `GAP_ANALYSIS.md`: deliberate scope cut, genuine oversight, or technical blocker. Add or remove an entry here in lockstep with `GAP_ANALYSIS.md` — one gap, one reason.

- **`.ps1` scripts hand-mirrored, not run**: technical blocker — this sandboxed environment has no `pwsh` installed, and installing one is out of scope for a docs/skills repo. The `.sh` suites are the real regression signal; `.ps1` changes are kept structurally identical to the verified `.sh` diff on a best-effort basis.
- **No CI on the repo**: deliberate, as far as this branch's work is concerned — adding CI is a repo-infrastructure decision for the repo owner, not something to bolt on unasked while fixing a security-audit finding.
- **Install examples pinned to `skills` CLI `v1.5.23` behavior, unpinned in the docs**: accepted tradeoff, not an oversight — the CLI is a third-party tool this repo doesn't control the release cadence of, and re-verifying every documented flag on every CLI release is out of scope for a docs/skills repo. The mitigation already in place is process, not tooling: every command form is re-run and re-verified (not just copy-pasted) whenever it's touched, per `WISDOM.md`'s "test before documenting" rule.
