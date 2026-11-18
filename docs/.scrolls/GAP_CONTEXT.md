# GAP_CONTEXT.md — Why Each Gap Exists

The *why* behind every entry in `GAP_ANALYSIS.md`: deliberate scope cut, genuine oversight, or technical blocker. Add or remove an entry here in lockstep with `GAP_ANALYSIS.md` — one gap, one reason.

- **link-skills untested on macOS/Windows**: a blocker. The cloud sessions run on Linux only. The script targets bash 3.2 and avoids GNU-only options. On Windows, git checks symlinks out as plain files unless Developer Mode and `core.symlinks` are on; `scripts/README.md` documents this.
- **Only 15 of 21 skills linked**: a deliberate scope cut. The user asked for just the scrolls family and `create-issues-update-pr` "for now", then added `create-lib-docs`, `network-flow` and `run-code-review`; `meeting-agenda` and `flight-status` were linked with their PRs. Link others when work here needs them.
- **`flight-status` assets missing**: a genuine oversight on #81. Its README and `bin/render-screenshots` expect a pinned `assets/sample-map.png` and the generated `assets/screenshots/card*.png`, but they were never committed, so the screenshot tests fail (`render-screenshots` exits with `FileNotFoundError`). Only the author's original map can restore them; the rest of the suite (110 tests) passes.
- **No FlightAware CLI outside Muse**: a technical blocker. The skill was built against Muse's FlightAware connector command. Its contract (the subcommands and JSON shapes) is in `skills/travel/flight-status/meta/MAINTAINERS.md`; writing an AeroAPI wrapper needs an AeroAPI key and is out of scope for #81.
