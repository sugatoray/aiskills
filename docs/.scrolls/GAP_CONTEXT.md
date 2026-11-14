# GAP_CONTEXT.md — Why Each Gap Exists

The *why* behind every entry in `GAP_ANALYSIS.md`: deliberate scope cut, genuine oversight, or technical blocker. Add or remove an entry here in lockstep with `GAP_ANALYSIS.md` — one gap, one reason.

- **link-skills untested on macOS/Windows**: a blocker. The cloud sessions run on Linux only. The script targets bash 3.2 and avoids GNU-only options. On Windows, git checks symlinks out as plain files unless Developer Mode and `core.symlinks` are on; `scripts/README.md` documents this.
- **Only 9 skills linked**: a deliberate scope cut. The user asked for just the scrolls family and `create-issues-update-pr` "for now". Link others when work here needs them.
