# PLAN.md — Prioritized Backlog

The ordered, ticketed backlog. Highest priority first. Update ticket status (`[ ]` → `[x]`) as work completes, and re-prioritize when new requests change the calculus — this file reflects what's next, not a permanent record (that's what git history is for).

- [x] ROOT-1: Set up the repo-root scrolls (`/scrolls-setup -t`). On #230.
- [x] ROOT-5: Merge #234 (versioned docs site: latest, older releases, dev). Merged as `58c1e52`; the deploy built `/`, `/v/1.1.0/`–`/v/0.8.0/` and `/dev/` (verified from the job log; the user checks the live pages).
- [ ] ROOT-8: Move the docs workflow off Node 20: `actions/checkout` and `actions/setup-node` to v5, and `node-version` to 22. Keep `docs-workflow.test.mjs` matching (it checks `@v\d+`).
- [ ] ROOT-6: Release 1.3.0 when the user says so: set `package.json` to `1.3.0`, date the CHANGELOG section, publish, then tag `aiskills-v1.3.0` on its `gitHead` (MAINTAINERS step 6). The tag push rebuilds the site with one version.
- [x] ROOT-7: Tag the published releases `aiskills-v0.4.0`–`aiskills-v1.2.0` on their npm `gitHead`. The user pushed them; verified.
- [x] ROOT-2: Merge #230 (`make link-skills`, the skill links, the release record, the root scrolls). Merged as `8028d62`; `make link-skills` is in `SPEC.md`.
- [ ] ROOT-3: Optional. File an issue under #231 for #230's scrolls commit, if the user wants it tracked.
- [ ] ROOT-4: Link more skills with `make link-skills` as they're worked on here. So far only the scrolls family, `create-issues-update-pr`, `create-lib-docs`, `network-flow` and `run-code-review` are linked.
