# STARTER.md — Read Me First

You're picking up work on **productivity skills**, the `productivity` skill family (plugin `productivity-skills`). Its skills are `meeting-agenda` and `agent-sessions-insight`. Before making changes, read the following files **in this exact order**:

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
This directory (`src/productivity/`) is **not** where the productivity skills live. They are at `skills/productivity/`, with the family's `README.md` and `.claude-plugin/plugin.json` (plugin `productivity-skills`, registered in the repo's `.claude-plugin/marketplace.json`). There are two skills. `meeting-agenda/`:
- `SKILL.md`: the agent workflow, with options `--title`, `--total`, `--theme`, `--output` and `--demo`.
- `assets/meeting-agenda.html`: the template, which is also a working 30-minute demo deck. One self-contained HTML file with no dependencies.
- `scripts/build_deck.py`: standard-library Python. Validates agenda JSON and writes it into the template with `<` escaped. `--demo` copies the template byte for byte.
- `tests/`: pytest + Playwright. Run `python3 -m pytest` from `skills/productivity/meeting-agenda/`. In cloud sessions, first run `pip install pytest playwright`; the tests use `/opt/pw-browsers/chromium`.
- `meta/MAINTAINERS.md` (layout, themes, Settings, touch, alignment) and `meta/SECURITY.md`.
- `meta/screenshots/`, left out of the npm package by its `.skillsignore`.
- `CHANGELOG.md`, `README.md` and `agents/openai.yaml`.

`agent-sessions-insight/`:
- `SKILL.md`: the agent workflow (check → collect → read → build report → verify → deliver), with options `--days`, `--agents`, `--extra NAME=PATH` and `--output`.
- `scripts/collect.py`: standard-library Python, read-only, offline. One `parse_<agent>()` per agent (Claude Code, Codex CLI, Pi, OpenCode, Copilot CLI, Devin CLI), a generic JSONL parser, `discover()`, `summarize()` and the CLI.
- `scripts/build_report.py` and `assets/agent-sessions-insight.html`: the builder validates the collector's JSON and the agent's insights JSON and writes them into the template's data block (`<` escaped). The template is one offline page with eight tabs and ships with demo data; `--demo` copies it as is. `scripts/make_demo.py` regenerates that demo (`--check` to test it is current).
- `tests/`: `test_collect.py` and `test_build_report.py` (stdlib), `test_report_page.py` (Playwright; skipped without it). Run `python3 -m unittest discover -s tests -v` (or `python3 -m pytest`) from `skills/productivity/agent-sessions-insight/`; `pip install playwright` first in cloud sessions.
- `meta/MAINTAINERS.md` (how to add an agent, red/green) and `meta/SECURITY.md`; `CHANGELOG.md`, `README.md` and `agents/openai.yaml`.

This `docs/.scrolls/` folder holds the narrative and process memory of the work on `skills/productivity/` only. The skill's `CHANGELOG.md` is the authoritative record of what shipped, and its `meta/MAINTAINERS.md` holds the design notes; these scrolls point to them rather than repeating them. The `aiskills` npm package that bundles the skill has its own scrolls at `src/packages/aiskills/docs/.scrolls/`. Repo-wide scrolls are at the root's `docs/.scrolls/`.

As the project grows, this file may end up pointing to additional `docs/.scrolls/*.md` files for specialized topics (architecture decisions, security reviews, subsystem deep-dives). If you add one, list it here in the numbered order above with the same "read this when / update this when" treatment as the core six, so future sessions don't have to guess whether it's load-bearing.
