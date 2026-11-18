# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`meeting-agenda` 1.0.0** (unreleased; ships with the package's 1.5.0) is on branch `claude/sweet-hawking-7u1fpc`, rebased onto `master` at `90a835c` (`1.5.0-dev`) on 2026-11-18. The pre-rebase head is kept locally as `backup/pre-rebase-272`. PR [sugatoray/aiskills#272](https://github.com/sugatoray/aiskills/pull/272) was squash-merged into `master` as `f27b875` on 2026-11-18, closing #273–#286. It ships in the package's 1.5.0 release, prepared on `claude/aiskills-1.5.0`.
- **Tests:** 226 skill tests pass (`build_deck.py` included). So do the npm package's 520 tests (the skill is bundled; the package docs and banner were regenerated for the new `productivity` group).
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
  12. Five studio themes (Aurora, Observatory, Abyss, Editorial, Signal) added in front of the five classics, with Aurora as the new default. The user rejected a first, colour-only mockup ("impress me"), then approved an art-directed one (own type, texture, numeral and dial per theme) as a working HTML mockup. Cards are now drawn from theme tokens (no `sw` swatch colours). Filed as #285 under #273.
  13. Clarity and Clarity Dark, after Apple's design principles, from an approved mockup. Named "Clarity" so the deck doesn't use Apple's name or brand. Filed as #286 under #273, and the PR description now covers twelve themes and 226 tests.
- Filed issues for the PR with `/create-issues-update-pr`: parent #273 (Feature) with sub-issues #274–#284, one per step of the work (Feature/Task/Bug). The PR description was corrected (it said the ring turns amber at 80% remaining; it's the last 20%) and now lists them with `Closes`, plus the red/green summary. A later run added #285 (studio themes) and refreshed the PR's theme, test-count and red/green lines.

## Known issues / open threads
- **Screenshots churn:** running the tests rewrites the four to six tracked screenshots in `meta/screenshots/` with tiny pixel differences. Restore them (`git checkout -- skills/productivity/meeting-agenda/meta/screenshots`) unless the UI really changed. The user was offered a fix (save screenshots only when asked) and hasn't answered.
