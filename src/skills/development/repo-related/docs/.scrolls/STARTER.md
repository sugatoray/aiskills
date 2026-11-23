# STARTER.md — Read Me First

You're picking up work on **repo-related (aiskills)**, the repo-related skills subgroup (`/create-issues-update-pr` today) shipped in the `sugatoray/aiskills` repo. Before making changes, read the following files **in this exact order**:

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
This directory (`src/skills/development/repo-related/`) is **not** where the repo-related skills live. They are at `skills/development/repo-related/`: one skill today, `create-issues-update-pr/` (`SKILL.md` holding the whole procedure, `README.md`, `CHANGELOG.md`, `agents/claude-code.yaml` and `agents/openai.yaml`, its own single-skill `.claude-plugin/plugin.json`, and `meta/MAINTAINERS.md`; no `references/`, `scripts/` or `tests/`, since every step is a GitHub MCP tool call; try it locally with `claude --plugin-dir skills/development/repo-related/create-issues-update-pr`), plus the subgroup's `README.md`, `meta/MAINTAINERS.md` and `.claude-plugin/plugin.json` (plugin `repo-related-skills`, whose version follows the skill's). Two symlinks reach those sources from `src/`: `README.md` here → `../../../../skills/development/repo-related/README.md`, and the `meta` folder here → `../../../../skills/development/repo-related/meta`, so `meta/MAINTAINERS.md` here opens `skills/development/repo-related/meta/MAINTAINERS.md` (the subgroup's maintainer notes). This `docs/.scrolls/` folder holds the narrative and process memory of the work on `skills/development/repo-related/` only. `create-issues-update-pr/CHANGELOG.md` is the authoritative, version-by-version record of what shipped, and the two `meta/MAINTAINERS.md` files hold the layout, versioning and design notes; this scroll set points to them and does not repeat them. The `aiskills` npm package that bundles the skill has its own scrolls at `src/packages/aiskills/docs/.scrolls/`, and the sibling `review` subgroup has its own at `src/skills/development/review/docs/.scrolls/`.

As the project grows, this file may end up pointing to additional `docs/.scrolls/*.md` files for specialized topics (architecture decisions, security reviews, subsystem deep-dives). If you add one, list it here in the numbered order above with the same "read this when / update this when" treatment as the core six, so future sessions don't have to guess whether it's load-bearing.
