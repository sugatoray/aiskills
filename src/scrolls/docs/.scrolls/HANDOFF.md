# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state

- **`master`:** seven `scrolls-*` skills at `2.4.0` (setup, update, hide, unhide, remove, restore, help). `/scrolls-restore` and `assets/EXAMPLES.md` merged as #114 (`718388a`).
- **Branch `claude/brave-mccarthy-m6aut0`:** adds **`/scrolls-explainer`** (an animated, offline `scrolls-explainer.html`, one tab per command) and bumps the whole family to **`2.5.0`** in lockstep, with `plugin.json` listing the new skill. The same branch bumps the `@sugatoray-ai/aiskills` npm package to `1.1.0` to bundle it (16 skills in 8 groups). Open as [#206](https://github.com/sugatoray/aiskills/pull/206) (opened 2026-11-12, into `master`); not merged.
- **Stale branch:** `claude/confident-maxwell-d6ws37` still points at the pre-squash `/scrolls-remove` commit. Leave it or delete it; don't build on it.

## What just happened

1. **The page came first, then the skill.** The user asked for a network-flow diagram of the scrolls family, then one tab per command with an animated callout per step, then full keyboard navigation. Each version was checked with Playwright at 1280/820/390/320 px.
2. **`/scrolls-explainer` built Red/Green** (the user's request, modelled on the other scrolls skills):
   - `tests/test_explain.sh` was written first: 54 assertions, 49 failing for the right reason (no script, page or build).
   - Then `scripts/explain.py` (+ thin `.sh`/`.ps1` launchers): `-o` file or folder, `-f`, `--open`, `--version`. A different file at the target is refused (exit 3); an identical one is "already up to date".
   - The page ships prebuilt in `assets/`. Its words are in `assets/explainer-graph.json`, rendered by `skills/diagrams/network-flow`'s renderer, plus `scripts/page_enhance.py` (callouts, keys, version stamp); test scenario 11 catches a stale page.
   - `tests/browser/check_page.cjs` (Playwright) runs from the suite when available.
3. **The user's choices:** a bare `/scrolls-explainer` is `--show` (open the bundled page in place, copy nothing; this replaced an earlier copy-to-`./scrolls-explainer.html` default); copying needs `-o` (`-o .` for the current folder, or the host's outputs folder); bundle the skill in the npm package and bump it to `1.1.0`.
4. **Caught on the way:** the generator first lived in `meta/build/`, which the repo `.gitignore` ignores (`build/`), so it would never have been committed. Scenario 13 now fails if git ignores any file in the skill.
5. **`--show` and `--build`** (the user's follow-up): `--show` opens the bundled page in place. `--build` regenerates it from the `scrolls-*` skills as they are then: tabs per skill (deactivated via `SKILL.md.deprecated` → tab dropped; folder missing → stop), the lockstep version (mismatch → stop), and a fingerprint of each `SKILL.md` minus its version line (changed → stop until the tab is reviewed and `--build --reviewed`). The generator moved from `meta/` to `scripts/` (`build_page.py`, `page_enhance.py`) and the graph to `assets/explainer-graph.json`, since `--build` is now user-facing. Red/Green: 48 new assertions (scenarios 14–25) failed first, then passed; four deliberate code mutations were each caught. Folded into the unreleased 2.5.0 rather than a new 2.6.0, as nothing had merged.
6. **Issues filed for #206** (create-issues-update-pr, by hand): epic #207 (Feature) with #208–#213 as real sub-issues (one per piece of work: 1.0.0 record, the skill, the 2.5.0 bump, the 1.1.0 bundle, show/`--build`, scrolls). PR retitled `aiskills v1.1.0: add /scrolls-explainer`; its body keeps its own sections plus `## Issues` with `Closes` lines.
7. **The explainer on the npm package's docs site** (the user's request): `src/packages/aiskills/docs/docsite/explainers/scrolls.md` ("See how the scrolls skills work", Skills tab) embeds a copy of `assets/scrolls-explainer.html` that `npm run docs` makes. It took two fixes after the user looked on a phone: the frame was empty, then a 404, because a viewer that only has `index.html` can't load a file next to it. Now the page is embedded in `index.html` (base64) and shown with `srcdoc`; "full-size" opens an in-page overlay; nothing requests the file. The user checked it in a private artifact preview and said it looks good. Details are in the package's own scrolls.

## Known issues / open threads

- [#206](https://github.com/sugatoray/aiskills/pull/206) is open and not merged; its issues #207–#213 close on merge. The user hasn't asked for it to be watched for review comments or CI. The docs-site work (#206's last three commits) has no issue of its own yet (offered).
- `test_explain.ps1` (and every other `.ps1` suite) has never run: no `pwsh` here, and downloading it was blocked again.
- After any change to a scrolls skill's `SKILL.md`, run `skills/scrolls/scrolls-explainer/scripts/explain.sh --build`: it names the tabs to review in `assets/explainer-graph.json`, then `--build --reviewed`. Its test suite fails until that's done. Then run `npm run docs` in `src/packages/aiskills/`: the package docs carry a copy of the page, and the package tests fail until it's refreshed.
