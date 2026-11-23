# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`dynamic-promo-video` 1.6.2** is the only skill in the family. It landed on `master` in #161 (`f8c4165`, 2026-11-11), with the whole 1.0.0 to 1.6.2 history in its `CHANGELOG.md`, and has been bundled in the `@sugatoray-ai/aiskills` npm package since 0.7.0 (group `video-related-skills`, alias `video-related`).
- **Open PR:** this family's changes (the plugin version rule, the new group notes, these scrolls) are in [#320](https://github.com/sugatoray/aiskills/pull/320), not yet merged.
- **Tests:** 32 pass with none skipped: `python3 -m unittest discover -s skills/video-related/dynamic-promo-video/tests -p 'test_*.py'` from the repo root, about 45s, in a session that has ffmpeg, numpy, Node and Playwright. `node --check …/scripts/render.js` passes. The tests replace the ElevenLabs network call and never spend credits.
- **Registered** in `skills/video-related/.claude-plugin/plugin.json` (`video-related-skills`, version 1.6.2: it follows the skill's version since 2026-11-23), the repo's `.claude-plugin/marketplace.json` and the READMEs.

## What just happened
- These scrolls were set up on 2026-11-22, laid out like `src/skills/productivity/`, and `SPEC.md` and this file were filled in from the skill's CHANGELOG. No work on the skill itself happened in that session.
- Everything before that is in the CHANGELOG, not in these scrolls: all of 1.0.0 to 1.6.2 was built on 2026-11-10/11.
- 2026-11-23: the plugin version now follows the skill (it had stayed at 1.0.0 through the skill's releases), guarded by `PluginVersionTest`, written red first.
- 2026-11-22/23: the family got `skills/video-related/meta/MAINTAINERS.md` (plugin manifest, version rule, tests), reached from here through the `meta` link (`meta/MAINTAINERS.md` here opens it). Like every group-level `meta/`, it stays out of the npm package.

## Known issues / open threads
- `GAP_ANALYSIS.md`, `GAP_CONTEXT.md`, `PLAN.md` and `WISDOM.md` still hold the setup placeholders. The CHANGELOG and `meta/MAINTAINERS.md` hold the design notes and constraints (for example: never put a real project's name, branding or screenshots in `assets/template/index.html`; keep `DEFAULT_VOICE`, `SKILL.md` and `references/voiceover.md` in step; keep the demo's install commands in step with the repo README).
