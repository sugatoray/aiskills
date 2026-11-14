# PLAN.md — Prioritized Backlog

The ordered, ticketed backlog. Highest priority first. Update ticket status (`[ ]` → `[x]`) as work completes, and re-prioritize when new requests change the calculus — this file reflects what's next, not a permanent record (that's what git history is for).

- [x] #223 merged into `master` (squash `089f938`), closing #226–#229.
- [x] Search and the docs site's light/dark switch in the HTML report.
- [x] The owner's mockup annotations: pinned header and collapsible verdict in `assets/report-template.html`, with `tests/test_report_page.py`.
- [x] #223 retargeted to #215's branch, retitled and described as the 1.2.0 PR; issues #226–#228 filed.
- [x] #215 merged into `master` (squash `7c0afec`), closing #216–#222, #224 and #225; #223 retargeted to `master` and rebased onto it.
- [x] After #215 merged: `HANDOFF.md` and `SPEC.md`'s opening note say 1.0.0–1.1.0 is on `master`.
- [x] `@sugatoray-ai/aiskills` 1.2.0 prepared in #223 (`eaeba06`), the owner's choice.
- [x] `@sugatoray-ai/aiskills` 1.2.0 published to npm (2026-11-13, `latest`); recorded in the package's SPEC release note.
- [x] Build `/run-code-review` 1.0.0 under `skills/development/review/`: workflow, shared references, seven languages, detector with tests, `review-skills` plugin, npm package docs.
- [x] 1.1.0: `-l`/`--lang`, `-s`/`--security`, scope flags, `SECURITY.md` and `WISDOM.md` in every language folder, HTML/CSS/Markdown/XML.
- [x] 1.1.0: tool-first XML, JSON, YAML and TOML with `scripts/check_formats.py`; XML keeps its full review.
- [x] `assets/EXAMPLE.md` with ten examples, linked from `SKILL.md`, `README.md` and `CHANGELOG.md`.
- [x] Set up `src/development/review/` (this scroll set) and the `src/development/meta/review` symlink.
- [x] Make the JSON line-number test pass on Python 3.13 (`a59957b`).
- [x] Rename the subgroup `reviews` → `review` and the plugin `reviews-skills` → `review-skills` (`ec71a5c`).
- [x] `/run-code-review` 1.2.0: `-o` (`.html`, `.md`, `.json`), `-f`, `--open`, `--host-type`, line links to GitHub or GitLab (`cd84a6c`).
- [x] Put the four follow-up commits on #215's branch; file #216–#222 and list them in #215's description.
- [x] Independent review of #215; fix its findings Red/Green (`8168cc1`, #224).
- [x] Rename `/code-review` → `/run-code-review` to avoid Claude Code's built-in (`7f2bff3`, #225).
- [x] #215 and the #216 parent retitled to `/run-code-review`.

Not planned: a captured agent run to replace the sample report in `assets/EXAMPLE.md`. The user declined it; see `GAP_CONTEXT.md`.
