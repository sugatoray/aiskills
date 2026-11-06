# PLAN.md — Prioritized Backlog

The ordered, ticketed backlog. Highest priority first. Update ticket status (`[ ]` → `[x]`) as work completes, and re-prioritize when new requests change the calculus — this file reflects what's next, not a permanent record (that's what git history is for).

- [ ] **AIS-1** Merge [sugatoray/aiskills#122](https://github.com/sugatoray/aiskills/pull/122), then publish `0.1.0` (`cd src/packages/aiskills && npm publish`, logged in as a `sugatoray-ai` org member). Afterwards, update the release note in `SPEC.md`.
- [ ] **AIS-2** Try `aiskills --route install -s <real skill>` and `aiskills find <query>` against the live skills.sh service; fix the parser if the output differs.
- [x] **AIS-3** Add a `node:test` suite: unit tests for the glob, group and selection helpers, plus an end-to-end test (pack, install into a throwaway `HOME`/prefix, uninstall) using the `SKILLS_API_URL` fake for `--route`.
- [x] **AIS-6** Flatten `skills/` at pack time to `skills/<skill-name>/...` so `npx skills experimental_sync` can find the skills, and write a skill-to-group map at the same time so `-G` keeps working (`marketplace.json` points at the nested folders). Done with `.aiskills/layout.json` + `.aiskills/nested/`, plus `--nested` / `--flat` (the user asked for a way to restore the nested layout).
- [ ] **AIS-7** (proposed, awaiting the user's decision) Make the automatic install at npm-install time opt-in (`AISKILLS_AUTO_INSTALL=1`); by default, only save the skills and print "run `aiskills install`". This reverses part of the original request, so don't do it without a yes.
- [ ] **AIS-4** (optional) GitHub Actions: run `npm test` on pull requests and publish on a tag.
- [ ] **AIS-5** (optional, only if asked) `-d/--dir <path>` for project-scope commands.
