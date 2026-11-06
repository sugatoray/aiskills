# PLAN.md — Prioritized Backlog

The ordered, ticketed backlog. Highest priority first. Update ticket status (`[ ]` → `[x]`) as work completes, and re-prioritize when new requests change the calculus — this file reflects what's next, not a permanent record (that's what git history is for).

- [ ] **AIS-1** Merge [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122), then publish `0.1.0` (`cd src/packages/aiskills && npm publish`, logged in as a `sugatoray-ai` org member). Afterwards, update the release note in `SPEC.md`.
- [ ] **AIS-2** Try `aiskills --route install -s <real skill>` and `aiskills find <query>` against the live skills.sh service; fix the parser if the output differs.
- [ ] **AIS-3** Add a `node:test` suite: unit tests for the glob, group and selection helpers, plus an end-to-end test (pack, install into a throwaway `HOME`/prefix, uninstall) using the `SKILLS_API_URL` fake for `--route`.
- [ ] **AIS-4** (optional) Add a GitHub Actions workflow that publishes on a tag.
- [ ] **AIS-5** (optional, only if asked) `-d/--dir <path>` for project-scope commands.
