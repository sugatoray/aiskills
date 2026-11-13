# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state

- **Branch `devin/1794523707-code-review-skill`, [#215](https://github.com/sugatoray/aiskills/pull/215):** open into `master`, not merged. It adds the `skills/development/reviews/` subgroup and its one skill, `/code-review`, at **1.1.0** (the `reviews-skills` plugin manifest is at the same version). Nothing from this work is on `master`.
- **Size:** 87 tracked files under `skills/development/reviews/`, 84 of them in `code-review/`. Fourteen language folders, five files each.
- **Branch `claude/keen-babbage-2khhu9`:** the PR head (`f17f9bf`) plus one commit, `a59957b`, which fixes a test that failed on Python 3.13 (see "What just happened", item 6). Pushed to `origin`; **not yet on the PR branch**.
- **Checks, all local:** `python3 -m pytest skills/development/reviews/code-review/tests` passes 43 tests on Python 3.10, 3.11, 3.12 and 3.13 (Linux) with `a59957b`; without it, 42 pass on 3.13. The npm package's `npm test` passed 428. Both `claude plugin validate … --strict` runs passed, and `npx skills add` from the branch installed all 84 files. The repository runs no workflow on pull requests, so these are the only checks behind the PR.
- **npm package:** still 1.1.0, with the skill under `[Unreleased]` in its `CHANGELOG.md`; its docs, banner and counts say 17 skills in 9 groups. The version bump is the owner's decision.
- **This folder:** `src/development/reviews/` and `src/development/meta/reviews` were created on 2026-11-12 on the same branch. See "What just happened", item 5.

## What just happened

1. **1.0.0.** The user asked for `/code-review` under `skills/development/reviews/` for Python, JavaScript, TypeScript, Rust, shellscript, PowerShell-script and SQL, reviewing as a senior or staff engineer, with `references/review_<lang-name>/REVIEW.md` and other files per language. Built: the eight-step `SKILL.md`, three shared references, `REVIEW.md` / `PATTERNS.md` / `TOOLING.md` per language, and `scripts/detect_languages.py` with tests written first.
2. **1.1.0, options.** The user asked for `-l|--lang`, a security-only `-s|--security`, `SECURITY.md` and `WISDOM.md` in every language folder, and scope flags like `scrolls-setup`'s. Their `--lang` list named `html`, `xml`, `css` and `md`, which the skill did not cover, so four folders were added.
3. **1.1.0, tool-first.** The user asked whether existing tools could format and lint XML, JSON, YAML and TOML instead. Their decision: tool-first for all four, **and** keep the full XML review as drafted. `json`, `yaml` and `toml` were added as languages, and `scripts/check_formats.py` was added (the assistant's proposal, flagged to the user, no objection).
4. **`assets/EXAMPLE.md`.** The user asked for it in the form of `skills/image-styles/*/assets/EXAMPLE.md`. Its command output is pasted from real runs on a demo repository; its sample report was written by hand on seeded defects and says so. Replacing that report with a captured agent run was offered and the user answered "no need".
5. **This scroll set.** `/scrolls-setup --local` was run in `src/development/reviews/`, scoped to the work under `skills/development/reviews/`, then `/scrolls-update`. `src/development/meta/reviews` is a symlink to `skills/development/reviews/meta`, as `src/scrolls/meta` is to `skills/scrolls/meta`. `src/development/reviews/README.md` is a symlink to the subgroup's `README.md`, added for parity with `src/scrolls/README.md`; the user did not ask for that one.
6. **Python 3.13 test fix (2026-11-13, a Claude Code session, branch `claude/keen-babbage-2khhu9`).** Checking out #215, `test_valid_json_is_ok_and_a_syntax_error_names_the_line` failed on Python 3.13: it asserted `line 3` for a trailing-comma JSON file, and 3.13 reports `Illegal trailing comma … (line 2, …)`. `check_formats.py` was right; the test now uses a missing comma, which every version reports at line 3. Verified with `uv run --python 3.10…3.13 --with pytest --with pyyaml`.

## Known issues / open threads

- **`a59957b` is not on #215 yet.** The owner chooses: push it to `devin/1794523707-code-review-skill`, or ask Devin on the PR to apply it.
- **[#215](https://github.com/sugatoray/aiskills/pull/215) awaits the owner's review.** Do not merge it without being asked.
- **No independent run.** No agent has been invoked with `/code-review` on code it had not seen. What the skill finds on real code is unmeasured (`GAP_ANALYSIS.md`).
- **One behaviour change in 1.1.0 worth a second look in review:** with `--base`, files are now named from the folder the command runs in, and untracked files are listed from the whole repository. From a subfolder, 1.0.0 printed paths that could not be opened there.
- **Two package tests fail intermittently** and were left alone, because they belong to the npm package, not to this skill: the "Esc closes it" assertion in `docs-html.test.mjs` (3 of 6 runs on untouched `master`, once Playwright is installed) and "leaves no temporary folders behind" in `docs-skills.test.mjs` (1 of 5 runs). Re-run before concluding a change here broke them.
