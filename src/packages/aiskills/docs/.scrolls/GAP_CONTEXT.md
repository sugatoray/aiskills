# GAP_CONTEXT.md — Why Each Gap Exists

The *why* behind every entry in `GAP_ANALYSIS.md`: deliberate scope cut, genuine oversight, or technical blocker. Add or remove an entry here in lockstep with `GAP_ANALYSIS.md` — one gap, one reason.

- **`--route` not tested against live skills.sh** — blocker. The development sandbox's network policy blocks skills.sh, so lookups were tested against a local server returning the same JSON. GitHub installs (`anthropics/skills@pdf`, `@docx`) did run for real.
- **Parsing `npx skills` text output** — deliberate trade-off. `npx skills` has no machine-readable agent list or `find --json`. The agent list comes from the "Valid agents:" line printed for an invalid `--agent`, and lookups from the `owner/repo@skill` lines of `skills find`. A change to that output in a new `skills` version would break these two features (they fail loudly, not silently). `skills list --json` is structured and is used wherever possible.
- **No `-d/--dir`** — deliberate cut. It was offered to the user, who didn't ask for it; `cd` into the project and use `-p` instead.
- **No CI** — not requested. Publishing is a manual `npm publish` from the package folder (the `prepack` hook copies the skills in), and the tests are run by hand.
- **Windows test coverage** — deliberate cut. The stand-in `npx` used by `src/test/cli.test.mjs` is a POSIX script, and the `test:e2e` script sets `AISKILLS_E2E=1` with POSIX syntax. The package code itself handles Windows (`npx.cmd` through `cmd.exe`, the shell-character check and quoting of arguments with spaces), but those are only unit-tested (`unsafeForWindowsShell`, `quoteForCmd`), never run on a real Windows machine.
- **Not published** — waiting on review and merge of PR #122.
- **Docs not on the web** — waiting on the user. Publishing would add the repo's first workflow and claim `sugatoray.github.io/aiskills` (root or a subpath), which is the user's call. Loading the renderer from cdnjs is deliberate: it matches sugatoray/callai's page, and the browser test is skipped when cdnjs is unreachable.
