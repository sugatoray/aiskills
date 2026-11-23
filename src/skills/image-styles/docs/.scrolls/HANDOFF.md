# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`artwallbg` 1.0.1 and `commentdrop` 1.0.1** are the family's two skills. Both arrived in #141 (`28aee02`, 2026-11-11), which was also the `@sugatoray-ai/aiskills` npm package's 1.0.0 release, the first to bundle the `image-styles-skills` group (alias `image-styles`). The 1.0.1 rename of `assets/EXAMPLE.md` to `EXAMPLES.md` landed in #265 (`57188d0`).
- **Plugin:** `image-styles-skills` (`skills/image-styles/.claude-plugin/plugin.json`) is at `1.0.1`, the version both skills share, and is listed in the repo's `.claude-plugin/marketplace.json`.
- **Tests:** none. Both skills are instructions for an image tool. The skills' own notes say how to check them: validate the frontmatter and agent YAML, keep the plugin and marketplace entries in step, and forward-test with an image tool when one is available.

## What just happened
- These scrolls were set up on 2026-11-23, laid out like `src/skills/video-related/` (with a `meta` link to `skills/image-styles/meta/`), and `SPEC.md` and this file were filled in from the two skills' CHANGELOGs and `SKILL.md` files. No work on the skills themselves happened in that session.

## Known issues / open threads
- `GAP_ANALYSIS.md`, `GAP_CONTEXT.md`, `PLAN.md` and `WISDOM.md` still hold the setup placeholders.
- The two skills are versioned separately but have always moved together. If one changes alone, decide how the plugin's version follows (see `skills/image-styles/meta/MAINTAINERS.md`).
