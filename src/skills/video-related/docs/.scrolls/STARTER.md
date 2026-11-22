# STARTER.md — Read Me First

You're picking up work on **video-related skills**, the `video-related` skill family (plugin `video-related-skills`). Its one skill today is `dynamic-promo-video`. Before making changes, read the following files **in this exact order**:

1. **`docs/.scrolls/SPEC.md`** — What the project does, feature by feature. Read this first so you understand the full surface area before you read anything else. Update this when you SHIP a feature (not when you start one).
2. **`docs/.scrolls/HANDOFF.md`** — The "change of guard" note: current state, what just happened, recent bugs and their root causes. This is short-lived/tactical — read it to know what the *previous* session left you with. Update this at the **end of every session** (overwrite stale entries, don't let it grow forever — it's a snapshot, not a changelog).
3. **`docs/.scrolls/GAP_ANALYSIS.md`** — Concrete list of what is NOT implemented yet or is a known partial/simplified implementation. Read this to avoid re-discovering already-known gaps, and to recognize when a request is actually asking you to close one of these.
4. **`docs/.scrolls/GAP_CONTEXT.md`** — The *why* behind every entry in GAP_ANALYSIS.md (deliberate scope cut vs. genuine oversight vs. technical blocker). Read this before deciding to "just fix" a gap — some are intentional, and the reasoning tells you whether a new request changes the calculus.
5. **`docs/.scrolls/PLAN.md`** — The prioritized backlog / issue board (ordered, ticketed, with status). Read this to see what's already planned as "next" before inventing your own priority order. Update ticket status as you complete work, and re-prioritize if a new request changes priorities.
6. **`docs/.scrolls/WISDOM.md`** — Constraints, traps, bad patterns, and best practices learned the hard way on this project. Read this LAST, right before you start editing, so it's freshest in mind. It has four sections: **Constraints** (things you must respect/conform to), **Traps** (specific bugs that have bitten this project before — avoid repeating them), **Ditches** (bad patterns/decisions to never take), and **Wisdom** (best practices worth reusing). Update this whenever you discover a new trap, ditch, or piece of wisdom worth preserving — especially right after fixing a nasty bug.

## When to update each file
- **SPEC.md**: after shipping a feature (describe what it does, not how you built it).
- **HANDOFF.md**: at the end of every session, always — overwrite/prune, keep it current and short.
- **GAP_ANALYSIS.md**: whenever you ship something that closes a gap (remove the line) or discover a new gap (add a line).
- **GAP_CONTEXT.md**: whenever you add/remove a GAP_ANALYSIS.md line — explain the why.
- **PLAN.md**: whenever ticket status changes, or priorities shift based on new requests.
- **WISDOM.md**: whenever you hit a new trap/bug, make a mistake worth not repeating, or land on a pattern worth reusing.

## Development strategy

- Always use Red/Green TDD while developing or fixing code. _This is also mentioned inside **WISDOM.md**_.

## Quick orientation
This directory (`src/skills/video-related/`) is **not** where the video-related skills live. They are at `skills/video-related/`, with the family's `README.md` and `.claude-plugin/plugin.json` (plugin `video-related-skills`, registered in the repo's `.claude-plugin/marketplace.json`). There is one skill today, `dynamic-promo-video/`:
- `SKILL.md`: the agent workflow for a short (~25-45s, 1280x720) narrated promo or intro video: animated HTML scenes with zoom/tilt over real screenshots, a TTS voiceover and ducked background music. `--demo` and `--demo=self` build ready-made demo videos; `--voice` narrates them.
- `assets/template/index.html`: the generic starter scene page. Never put a real project's name, branding or screenshots in it.
- `assets/demo/<default|self>/` (`index.html`, `narration.txt`, `clips.json`) and `assets/demo/clips/` (the shared narration recordings): the `--demo` variants, which rebuild identically every run.
- `scripts/`: `render.js` (Playwright, frame by frame), `demo.py`, `timing.py`, `tts_elevenlabs.py` (urllib only), `music.py` (numpy), `mix.py` (ffmpeg) and `verify.py`. Python is standard library except `music.py`.
- `references/`: `scene-engine.md`, `screenshots.md`, `voiceover.md`, `music-and-mix.md`, loaded only when a step needs them.
- `tests/test_scripts.py`: unit tests plus an end-to-end run of the template. Tests skip when ffmpeg, numpy, Node or Playwright is missing, and never call the TTS service. Run `python3 -m unittest discover -s skills/video-related/dynamic-promo-video/tests -p 'test_*.py'` and `node --check skills/video-related/dynamic-promo-video/scripts/render.js` from the repo root.
- `meta/MAINTAINERS.md` (layout, the demo clips, checks), `CHANGELOG.md` (keep it in step with `metadata.version` in `SKILL.md`), `README.md`, and `agents/claude-code.yaml` and `agents/openai.yaml`.

This `docs/.scrolls/` folder holds the narrative and process memory of the work on `skills/video-related/` only. The skill's `CHANGELOG.md` is the authoritative record of what shipped, and its `meta/MAINTAINERS.md` holds the design notes; these scrolls point to them rather than repeating them. The `aiskills` npm package that bundles the skill has its own scrolls at `src/packages/aiskills/docs/.scrolls/`. Repo-wide scrolls are at the root's `docs/.scrolls/`.

As the project grows, this file may end up pointing to additional `docs/.scrolls/*.md` files for specialized topics (architecture decisions, security reviews, subsystem deep-dives). If you add one, list it here in the numbered order above with the same "read this when / update this when" treatment as the core six, so future sessions don't have to guess whether it's load-bearing.
