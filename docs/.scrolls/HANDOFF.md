# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
This root scroll set holds **repo-wide** state and routes to the dedicated scroll sets (see `STARTER.md` → "Where memory lives"). Family, subgroup and package detail lives in those, not here.

- **`master` is at `0999e6f`:** [#314](https://github.com/sugatoray/aiskills/pull/314) (`1.6.0-dev`) squash-merged after [#310](https://github.com/sugatoray/aiskills/pull/310) (release 1.5.0).
- **npm:** `@sugatoray-ai/aiskills` **1.5.0** is published (`latest`, 2026-11-18T03:01Z, npm `gitHead` `b8ad785`) and tagged `aiskills-v1.5.0`. `master` is `1.6.0-dev`.
- **Open: [#320](https://github.com/sugatoray/aiskills/pull/320)** on `claude/wonderful-ptolemy-my8ha8` (ROOT-17), rebased onto `0999e6f`, with issues #321 (epic) and #322–#328 in its `Closes` list. It carries:

| Part | Detail lives in |
| --- | --- |
| The `agent-sessions-insight` skill (collector with Devin and Grok adapters, report template, build script, demo generator; 82 tests) | `src/skills/productivity/docs/.scrolls/` (PROD-6 to PROD-11) |
| Bundling it (20 skills in 10 groups), and keeping group/subgroup `meta/` out of the package (`skills/.skillsignore`); 522 tests | `src/packages/aiskills/docs/.scrolls/` (AIS-29) |
| The `video-related-skills` plugin version now following its skill (1.6.2) | `src/skills/video-related/docs/.scrolls/` |
| New scroll sets for image-styles and repo-related | `src/skills/image-styles/`, `src/skills/development/repo-related/` |
| Repo-wide: memory folders moved to `src/skills/`, `meta/MAINTAINERS.md` for every group, a `meta` link in every memory folder | this file and `WISDOM.md` |

## What just happened
- **Repo-wide changes on #320, at the user's request:**
  - Moved the per-family memory folders to `src/skills/{scrolls,development,productivity}`, fixing their relative symlinks.
  - Set up new scroll sets for video-related, repo-related and image-styles, and filled their `SPEC.md`/`HANDOFF.md` from the CHANGELOGs.
  - Added `meta/MAINTAINERS.md` to every skill group that lacked one (development, diagrams, image-styles, newsletters, personas, productivity, video-related).
  - Gave every memory folder under `src/skills/` a `meta` link to its group's `meta/`, with `SCROLLS.md`/`STARTER.md` naming the `MAINTAINERS.md` it opens; `src/skills/development/meta` links to `skills/development/meta`.
- **Sample data:** everything in #320 is fictional with neutral names, and the branch was squashed at the user's request (see `WISDOM.md`, Constraints).
- **This update** made the root scroll set a router: detail from this session went to the dedicated scroll sets listed above.

## Known issues / open threads
- **The 1.4.0 and 1.5.0 CHANGELOG dates** are 2026-11-18, npm's UTC date. In US Eastern time both were published on the evening of 2026-11-17 (01:25Z and 03:01Z; the 1.3.0 note judged by US Eastern). The user was asked about 1.4.0; no answer yet, so both stay.
- Nobody has looked at the rebuilt docs site since the tag push (this session can't reach `sugatoray.github.io`): `/` should be 1.5.0 and `/v/` the releases before it; `/dev/` shows the development version.
- **The scrolls `.ps1` suites** now run (PowerShell 7 from conda-forge) on `claude/scrolls-nested-routing` ([#329](https://github.com/sugatoray/aiskills/pull/329)); detail in `src/scrolls/docs/.scrolls/`. The same branch adds `make setup-conda` and `make setup-pwsh` (`scripts/setup-conda.sh`, `scripts/setup-pwsh.sh`, tested by `scripts/tests/test_setup_tools.sh` with fakes; also checked for real here) to install them.
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered (ROOT-3).
- Branches holding only merged history, deletable at the user's call: `claude/clever-mendel-k9n73h` (#265), `claude/aiskills-1.4.0` (#302), `claude/aiskills-1.5.0-dev` (#306), `claude/sweet-hawking-7u1fpc` (#272), `claude/aiskills-1.5.0` (#310), `claude/keen-babbage-2khhu9` (#215 era). The pre-rebase copy of #272 exists only as a local branch, `backup/pre-rebase-272`, in that session.
- **#320's history was rewritten twice** (squash, then a rebase onto `0999e6f`), both force-pushes approved by the user. The PR timeline records them. Its tickets were renumbered to ROOT-17 and AIS-29 because #314 had used ROOT-16 and AIS-28.
