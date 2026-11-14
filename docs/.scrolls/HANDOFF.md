# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` is at `58c1e52`:** #234 (the versioned docs site) was squash-merged after #230 (`8028d62`). `@sugatoray-ai/aiskills` 1.2.0 is still the latest on npm; `package.json` on `master` is `1.3.0-dev`.
- **The docs site is deployed** ([run 16](https://github.com/sugatoray/aiskills/actions/runs/43614530086), success). The build fetched all nine `aiskills-v*` tags and built six pages:
  - `/` shows 1.2.0;
  - `/v/1.1.0/`, `/v/1.0.0/`, `/v/0.9.0/` and `/v/0.8.0/` show the older releases;
  - `/dev/` shows 1.3.0-dev.

  Issues #235–#240 closed with the merge.
- **Working branch:** `claude/next-updates`, created from `58c1e52` for the next round of work. It has no commits of its own yet; the first is this scrolls update.

## What just happened
- #234 grew from two versions to many: older releases under `/v/x.y.z/` (default 5 releases in all, `--releases`), then a **Find a version** box in the version menu (partial and fuzzy match). Filed and tracked as #235–#240.
- After the merge, I verified the deploy from the workflow's job log: the tags were fetched, six pages were built, and they were published.

## Known issues / open threads
- **The live site hasn't been looked at in a browser.** This session's network blocks `sugatoray.github.io` (403 at the proxy), so only the build log confirms it. The user should check the menu, the find box, switching to `/v/0.8.0/` on a `#page`, and the notices.
- **The docs workflow warns that its actions target Node.js 20** (`actions/checkout@v4`, `actions/setup-node@v4`, and `node-version: "20"`). GitHub already forces them onto Node 24, so the build works. Moving to the v5 actions and Node 22 would clear the warning (ROOT-8).
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered.
- `claude/keen-babbage-2khhu9` (this session's designated branch) still holds merged #215-era history. Reusing it needs a reset from `master` and a force push, which the user must approve.
