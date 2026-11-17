# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`meeting-agenda` 1.0.0** (unreleased) is on branch `claude/sweet-hawking-7u1fpc`, in PR [sugatoray/aiskills#272](https://github.com/sugatoray/aiskills/pull/272). The PR is open and not merged. Pushing to the branch updates it.
- **Tests:** 168 skill tests pass (150 for the deck, 18 for `build_deck.py`). So do the npm package's 516 tests (the skill is bundled; the package docs and banner were regenerated for the new `productivity` group).
- **Registered:** in `.claude-plugin/marketplace.json` (`productivity-skills`), the root `README.md`, and as links in `.claude/skills/` and `.agents/skills/`.
- **These scrolls** (`src/productivity/docs/.scrolls/`) were set up at the end of the session that built the skill. Until then, the work was recorded in the repo-root scrolls (`docs/.scrolls/`), which still hold a short summary.

## What just happened
- Built the skill red/green, step by step, from the user's requests:
  1. A one-page deck, approved as a draft under `drafts/` and then folded into the skill.
  2. A per-item meeting bar.
  3. A navy/plum background, later replaced by an indigo theme matched to a screenshot from the user.
  4. Touch controls.
  5. Space as pause.
  6. Settings with Contents and Theme tabs and five themes.
  7. A deck-title field.
  8. `--demo`.
  9. Explicit-only invocation.
  10. A Settings redesign (Quick View and Detailed View, from mockups the user approved).
  11. The "Agenda item" line held at one height across slides.
- The red/green summary for the PR description is in the repo-root `docs/.scrolls/PLAN.md` (ROOT-10). It isn't in the PR description yet; add it only if the user asks.

## Known issues / open threads
- **Screenshots churn:** running the tests rewrites the four to six tracked screenshots in `meta/screenshots/` with tiny pixel differences. Restore them (`git checkout -- skills/productivity/meeting-agenda/meta/screenshots`) unless the UI really changed. The user was offered a fix (save screenshots only when asked) and hasn't answered.
- **PR description:** the red/green summary and the usual `- Closes #N -- title` issue list are not in the PR yet. Do it only if asked.
