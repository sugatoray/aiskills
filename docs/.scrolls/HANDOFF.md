# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` is at `8028d62`:** #230 was squash-merged. It brought `make link-skills` with 24 links, these root scrolls, `/run-code-review` 1.3.0 (starts only when typed), the npm package at `1.3.0-dev` and the release-tagging step. `@sugatoray-ai/aiskills` 1.2.0 is still the latest on npm.
- **Release tags `aiskills-v0.4.0`–`aiskills-v1.2.0` are on GitHub.** Each sits on its npm `gitHead` and has been verified.
- **[#234](https://github.com/sugatoray/aiskills/pull/234) (`claude/docs-stable-and-dev`, open, targets `master`):** the versioned docs site: the latest release at the root, older releases under `/v/<version>/` (default 5 in all), and `/dev/`. After #230's squash merge it was rebased with `--onto` (3 commits). Its files are identical to before, and 442 tests pass. Once it merges and deploys, the site shows 1.2.0 at the root, 1.1.0–0.8.0 under `/v/`, and 1.3.0-dev at `/dev/`. The deploy itself is untested.

## What just happened
- The user squash-merged #230 (`8028d62`). GitHub moved #234 to `master`, where it showed a conflict, because its branch still carried #230's 11 commits.
- Checked that `8028d62`'s tree equals #230's last head `72dd391`, then ran `git rebase --onto origin/master 72dd391`. It replayed only #234's 3 commits, with no conflicts. The result has the same files as before, and 442 tests and `make check-skill-links` pass.
- Recorded #230 as shipped: `make link-skills` and the release tags in `SPEC.md`, and `run-code-review` 1.3.0 in the review family's `SPEC.md`.

## Known issues / open threads
- **#234's deploy:** it runs only on `master` or a tag. A manual workflow run with "deploy" unticked builds the site as a downloadable artifact first.
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered.
- `claude/keen-babbage-2khhu9` (this session's designated branch) still holds merged #215-era history. Reusing it needs a reset from `master` and a force push, which the user must approve.
