# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state

- **`master`:** seven `scrolls-*` skills at `2.4.0` (setup, update, hide, unhide, remove, restore, help). `/scrolls-restore` and `assets/EXAMPLES.md` merged as #114 (`718388a`).
- **Branch `claude/brave-mccarthy-m6aut0`:** adds **`/scrolls-explainer`** (an animated, offline `scrolls-explainer.html`, one tab per command) and bumps the whole family to **`2.5.0`** in lockstep, with `plugin.json` listing the new skill. The same branch bumps the `@sugatoray-ai/aiskills` npm package to `1.1.0` to bundle it (16 skills in 8 groups). Pushed; no PR yet.
- **Stale branch:** `claude/confident-maxwell-d6ws37` still points at the pre-squash `/scrolls-remove` commit. Leave it or delete it; don't build on it.

## What just happened

1. **The page came first, then the skill.** The user asked for a network-flow diagram of the scrolls family, then one tab per command with an animated callout per step, then full keyboard navigation. Each version was checked with Playwright at 1280/820/390/320 px.
2. **`/scrolls-explainer` built Red/Green** (the user's request, modelled on the other scrolls skills):
   - `tests/test_explain.sh` was written first: 54 assertions, 49 failing for the right reason (no script, page or build).
   - Then `scripts/explain.py` (+ thin `.sh`/`.ps1` launchers): `-o` file or folder, `-f`, `--open`, `--version`. A different file at the target is refused (exit 3); an identical one is "already up to date".
   - The page ships prebuilt in `assets/`. Its source is `meta/generator/graph.json`, rendered by `skills/diagrams/network-flow`'s renderer, plus `enhance.py` (callouts, keys, version stamp); `build.py --check` and test scenario 11 catch a stale page.
   - `tests/browser/check_page.cjs` (Playwright) runs from the suite when available.
3. **The user's choices:** default output is `./scrolls-explainer.html` (the agent passes `-o` to a host outputs folder when it has one); bundle the skill in the npm package and bump it to `1.1.0`.
4. **Caught on the way:** the generator first lived in `meta/build/`, which the repo `.gitignore` ignores (`build/`), so it would never have been committed. Renamed to `meta/generator/`; scenario 13 now fails if git ignores any file in the skill.

## Known issues / open threads

- Open a PR for `claude/brave-mccarthy-m6aut0` when the user asks.
- `test_explain.ps1` (and every other `.ps1` suite) has never run: no `pwsh` here, and downloading it was blocked again.
- If any other scrolls command's behavior changes, `/scrolls-explainer`'s `meta/generator/graph.json` must be edited and the page rebuilt (see its `meta/MAINTAINERS.md`).
