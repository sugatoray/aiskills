# PLAN.md — Prioritized Backlog

The ordered, ticketed backlog. Highest priority first. Update ticket status (`[ ]` → `[x]`) as work completes, and re-prioritize when new requests change the calculus — this file reflects what's next, not a permanent record (that's what git history is for).

- [ ] Owner reviews [#215](https://github.com/sugatoray/aiskills/pull/215) and decides on the merge; merging closes #216–#222. Not to be merged without being asked.
- [ ] After #215 merges: rewrite `HANDOFF.md` and the opening note of `SPEC.md` to say the work is on `master`.
- [ ] Owner decides the `@sugatoray-ai/aiskills` version bump that releases the skill (it sits under `[Unreleased]` at 1.1.0).
- [x] Build `/run-code-review` 1.0.0 under `skills/development/review/`: workflow, shared references, seven languages, detector with tests, `review-skills` plugin, npm package docs.
- [x] 1.1.0: `-l`/`--lang`, `-s`/`--security`, scope flags, `SECURITY.md` and `WISDOM.md` in every language folder, HTML/CSS/Markdown/XML.
- [x] 1.1.0: tool-first XML, JSON, YAML and TOML with `scripts/check_formats.py`; XML keeps its full review.
- [x] `assets/EXAMPLE.md` with ten examples, linked from `SKILL.md`, `README.md` and `CHANGELOG.md`.
- [x] Set up `src/development/review/` (this scroll set) and the `src/development/meta/review` symlink.
- [x] Make the JSON line-number test pass on Python 3.13 (`a59957b`).
- [x] Rename the subgroup `reviews` → `review` and the plugin `reviews-skills` → `review-skills` (`ec71a5c`).
- [x] Put the four follow-up commits on #215's branch; file #216–#222 and list them in #215's description.

Not planned: a captured agent run to replace the sample report in `assets/EXAMPLE.md`. The user declined it; see `GAP_CONTEXT.md`.
