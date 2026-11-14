# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` is at `089f938`:** `/run-code-review` 1.2.0 (#215, #223) is merged, and `@sugatoray-ai/aiskills` 1.2.0 is published to npm as `latest`.
- **Release tags `aiskills-v0.4.0`–`aiskills-v1.2.0` are on GitHub.** The user pushed them. Each is annotated and sits on the commit npm records as that version's `gitHead`, which was the `master` head when it was published. Their messages carry the npm publish time.
- **[#230](https://github.com/sugatoray/aiskills/pull/230) (`claude/skill-symlinks`, open)** holds, as 11 commits directly on `master`:
  - `make link-skills` with 24 links (12 skills);
  - the scrolls commit (1.2.0 release record, these root scrolls, package scrolls);
  - `/run-code-review` 1.3.0: starts only when typed (`disable-model-invocation: true`);
  - the npm package at `1.3.0-dev`, with changes collecting under `## [1.3.0] - Unreleased`;
  - MAINTAINERS step 6, which tags each release on its `gitHead`;
  - scrolls notes.

  Issues #231 (parent), #232 and #233 cover the links.
- **[#234](https://github.com/sugatoray/aiskills/pull/234) (`claude/docs-stable-and-dev`, open; based on `master`):** the docs website shows two versions while `package.json` is `x.y.z-dev`.
  - The root shows the newest release tag's docs, read with `git archive`.
  - `/dev/` shows `master`'s docs. Each page has a version menu, and `/dev/` has a notice that it isn't released yet.
  - Pieces: `build-site.mjs` (`npm run docs:site`), `--version`/`--channel` on `build-docs-html.mjs`, and `fetch-depth: 0` plus a tag trigger in `aiskills-docs.yml`.
  - 442 package tests pass, including browser tests. The deploy itself is untested.
  - Its scrolls notes are here on purpose: editing the package scrolls on #234 would conflict with #230.
- **The root `docs/.scrolls/`** live only on #230's branch until it merges.

## What just happened
- Added `run-code-review` to the links, and shortened #233's title to "Link the first skills into .agents and .claude".
- `/run-code-review` 1.3.0 and the package at `1.3.0-dev`: the user's calls. npm rejects `1.3.0.dev`.
- Listed the npm releases against `master` commits. Every release was published 3–16 minutes after its PR merged (0.6.0: 2 h 18 min), from the `master` head.
- Created the nine tags here. This session can't push tags (HTTP 403), so the user pushed them, and they were then verified against npm.
- Built #234. A browser check found two bugs, both fixed and now covered by a test: the notice link dropped the page anchor, and the phone header was 36px too wide.

## Known issues / open threads
- **Merge order:** #230 and #234 both regenerate `src/packages/aiskills/docs/docsite/index.html` and `llms-full.txt`. Whichever merges second needs a rebase and `npm run docs`. Once both are in, the site shows 1.2.0 at the root and 1.3.0-dev at `/dev/`.
- **#234's deploy:** it runs only on `master` or a tag. A manual workflow run with "deploy" unticked builds the site as a downloadable artifact first.
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered.
- `claude/keen-babbage-2khhu9` (this session's designated branch) still holds merged #215-era history. Reusing it needs a reset from `master` and a force push, which the user must approve.
