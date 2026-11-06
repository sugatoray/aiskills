# GAP_CONTEXT.md — Why Each Gap Exists

The *why* behind every entry in `GAP_ANALYSIS.md`: deliberate scope cut, genuine oversight, or technical blocker. Add or remove an entry here in lockstep with `GAP_ANALYSIS.md` — one gap, one reason.

- **No automated tests** — oversight. Features were added quickly in one session and verified with throwaway installs. The pure helpers (`globToRegExp`, `expandPatterns`, `selectedSkills`, `loadGroups`, `skillsForGroups`, `specSkillName`) are easy to unit test with `node:test`; the npx-dependent parts can use the `SKILLS_API_URL` fake and a throwaway `HOME`.
- **`--route` not tested against live skills.sh** — blocker. The development sandbox's network policy blocks skills.sh, so lookups were tested against a local server returning the same JSON. GitHub installs (`anthropics/skills@pdf`, `@docx`) did run for real.
- **Parsing `npx skills` text output** — deliberate trade-off. `npx skills` has no machine-readable agent list or `find --json`. The agent list comes from the "Valid agents:" line printed for an invalid `--agent`, and lookups from the `owner/repo@skill` lines of `skills find`. A change to that output in a new `skills` version would break these two features (they fail loudly, not silently). `skills list --json` is structured and is used wherever possible.
- **No `-d/--dir`** — deliberate cut. It was offered to the user, who didn't ask for it; `cd` into the project and use `-p` instead.
- **No publish CI** — not requested; publishing is a manual `npm publish` from the package folder (the `prepack` hook copies the skills in).
- **Not published** — waiting on review and merge of PR #122.
