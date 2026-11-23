# GAP_CONTEXT.md — Why Each Gap Exists

The *why* behind every entry in `GAP_ANALYSIS.md`: deliberate scope cut, genuine oversight, or technical blocker. Add or remove an entry here in lockstep with `GAP_ANALYSIS.md` — one gap, one reason.

- **`.ps1` paths never executed**: technical blocker. This sandboxed environment has no `pwsh`, and downloading it was refused by the session's permission classifier. The `.sh` suites are the real regression signal. For remove, restore, explainer and compact, the gap is deliberately narrow: all logic is in Python, and the `.ps1` files only find Python and forward `@args`.
- **No CI on the repo**: deliberate as far as this work is concerned. Adding CI is a repo-infrastructure decision for the repo owner, not something to bolt on unasked.
- **Install examples pinned to `skills` CLI `v1.5.23` behavior, unpinned in the docs**: accepted tradeoff, not an oversight. The CLI is a third-party tool whose release cadence this repo doesn't control. The mitigation is process: every command form is re-run whenever it's touched, per `WISDOM.md`'s "test before documenting" rule.
- **`/scrolls-restore` can't relocate folders**: deliberate scope cut. Remapping paths would mean rewriting the references inside `STARTER.md` and `SCROLLS.md` for a layout the tool can't verify. `-p` scoping covers the common case, and relocation can come later if someone actually needs it.
- **`/scrolls-compact` units come from markdown structure**: deliberate. `git blame` dates lines, not ideas; grouping lines into sections and list items is the smallest reliable unit, and a unit is old only if every line is. Errs toward keeping text. Smarter grouping would need a parser per file convention, with no real case yet.
