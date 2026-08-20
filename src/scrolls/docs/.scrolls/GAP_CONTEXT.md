# GAP_CONTEXT.md — Why Each Gap Exists

The *why* behind every entry in `GAP_ANALYSIS.md`: deliberate scope cut, genuine oversight, or technical blocker. Add or remove an entry here in lockstep with `GAP_ANALYSIS.md` — one gap, one reason.

- **`.ps1` scripts hand-mirrored, not run**: technical blocker — this sandboxed environment has no `pwsh` installed, and installing one is out of scope for a docs/skills repo. The `.sh` suites are the real regression signal; `.ps1` changes are kept structurally identical to the verified `.sh` diff on a best-effort basis.
- **No CI on the repo**: deliberate, as far as this branch's work is concerned — adding CI is a repo-infrastructure decision for the repo owner, not something to bolt on unasked while fixing a security-audit finding.
