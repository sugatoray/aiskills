# PLAN.md — Prioritized Backlog

The ordered, ticketed backlog. Highest priority first. Update ticket status (`[ ]` → `[x]`) as work completes, and re-prioritize when new requests change the calculus — this file reflects what's next, not a permanent record (that's what git history is for).

- [x] ROOT-1: Set up the repo-root scrolls (`/scrolls-setup -t`). On #230.
- [x] ROOT-5: Merge #234 (versioned docs site: latest, older releases, dev). Merged as `58c1e52`; the deploy built `/`, `/v/1.1.0/`–`/v/0.8.0/` and `/dev/` (verified from the job log; the user checks the live pages).
- [x] ROOT-8: Move the docs workflow off Node 20: `actions/checkout` and `actions/setup-node` to v5, and `node-version` to 22. Merged in #241 (`75700d3`); run 17 has no Node 20 warning.
- [x] ROOT-9: Open a PR for `claude/cli-colors` (colored CLI output, `--color`/`--no-color`; the reproducible CLI outputs page under Reference), file its issues, and record it in the package scrolls. Done: #245, squash-merged as `73af49b`.
- [ ] ROOT-10: PR for `claude/clever-mendel-k9n73h` (the `/scrolls-compact` skill, scrolls family 2.6.0, and the `EXAMPLES.md` rename): opened as [#265](https://github.com/sugatoray/aiskills/pull/265) from the Claude Code UI. Left: file its issues when the user asks, and add it to `SPEC.md` once merged.
- [x] ROOT-11: Record `/scrolls-compact` in the scrolls family's own memory (`src/scrolls/docs/.scrolls`).
- [x] ROOT-6: Release 1.3.0 when the user says so: set `package.json` to `1.3.0`, date the CHANGELOG section, publish, then tag `aiskills-v1.3.0` on its `gitHead` (MAINTAINERS step 6). The tag push rebuilds the site with one version. Done: #287 merged as `a92ab00`, published 2026-11-17 and tagged `aiskills-v1.3.0`; `master` is now `1.4.0-dev`.
- [ ] ROOT-11: Record `/scrolls-compact` in the scrolls family's own memory: `/scrolls-update -p src/scrolls/docs`.
- [x] ROOT-7: Tag the published releases `aiskills-v0.4.0`–`aiskills-v1.2.0` on their npm `gitHead`. The user pushed them; verified.
- [x] ROOT-2: Merge #230 (`make link-skills`, the skill links, the release record, the root scrolls). Merged as `8028d62`; `make link-skills` is in `SPEC.md`.
- [ ] ROOT-3: Optional. File an issue under #231 for #230's scrolls commit, if the user wants it tracked.
- [ ] ROOT-4: Link more skills with `make link-skills` as they're worked on here. So far only the scrolls family (all nine), `create-issues-update-pr`, `create-lib-docs`, `network-flow` and `run-code-review` are linked.
