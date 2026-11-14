# PLAN.md — Prioritized Backlog

The ordered, ticketed backlog. Highest priority first. Update ticket status (`[ ]` → `[x]`) as work completes, and re-prioritize when new requests change the calculus — this file reflects what's next, not a permanent record (that's what git history is for).

- [x] ROOT-1: Set up the repo-root scrolls (`/scrolls-setup -t`). On #230.
- [ ] ROOT-5: Merge #234 (two-version docs site). Rebase whichever of #230/#234 merges second and run `npm run docs`. After the first deploy with both, check `/` shows 1.2.0 and `/dev/` shows 1.3.0-dev.
- [ ] ROOT-6: Release 1.3.0 when the user says so: set `package.json` to `1.3.0`, date the CHANGELOG section, publish, then tag `aiskills-v1.3.0` on its `gitHead` (MAINTAINERS step 6). The tag push rebuilds the site with one version.
- [x] ROOT-7: Tag the published releases `aiskills-v0.4.0`–`aiskills-v1.2.0` on their npm `gitHead`. The user pushed them; verified.
- [ ] ROOT-2: Merge #230 (`make link-skills`, the skill links, the release record, the root scrolls). Afterwards, add `make link-skills` to `SPEC.md`.
- [ ] ROOT-3: Optional. File an issue under #231 for #230's scrolls commit, if the user wants it tracked.
- [ ] ROOT-4: Link more skills with `make link-skills` as they're worked on here. So far only the scrolls family, `create-issues-update-pr`, `create-lib-docs`, `network-flow` and `run-code-review` are linked.
