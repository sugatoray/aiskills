# Changelog

All notable changes to this skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-11-22

### Added

- `/agent-sessions-insight` skill: turns local coding-agent session logs into a tabbed, offline HTML report (overview, frequency, kinds of work, habits, friction, per-agent split, exact numbers, data).
- `scripts/collect.py`: stdlib-only, read-only collector with adapters for Claude Code, Codex CLI, Pi, OpenCode (JSON and SQLite), GitHub Copilot CLI, Devin CLI (per-session `log.jsonl` and legacy `sessions.db`) and Grok CLI (`updates.jsonl`, or `chat_history.jsonl`; subagent sessions skipped), plus a generic JSONL parser (`--extra NAME=PATH`) for other agents such as Hermes. Corrupt lines are skipped, missing folders yield no sessions, and an unknown SQLite schema is skipped.
- `assets/agent-sessions-insight.html`: the report template, a self-contained offline page with eight tabs (overview, frequency, kinds of work, habits, friction, agents, exact numbers, data), light and dark, phone-width friendly, with tooltips and a table behind every chart. It ships with made-up demo data, so it opens as a working example. Habits are numbered cards with a "Seen in" line, friction points carry evidence, the Friction tab has an open-threads table, a "What this is based on" banner states the source data, months are stacked by agent with totals, each tab opens with a lead sentence, and a theme button overrides the system's light or dark setting (motion only when the system allows it).
- `scripts/build_report.py`: stdlib-only builder that validates the collector's JSON and the agent's insights JSON (`overview`, `kinds`, `habits`, `friction`, `agents`, `threads`, `caveat`) and writes them into the template's data block with every `<` escaped. `--demo` copies the template byte for byte.
- `scripts/make_demo.py`: a maintainer script that regenerates the template's demo data deterministically; `--check` reports a stale demo.
- Runs only when invoked explicitly: `disable-model-invocation: true` in `SKILL.md`, and `allow_implicit_invocation: false` in `agents/openai.yaml`.
- 82 `unittest` tests (also run by pytest), written test-first: 33 for the collector, 24 for the build script and template, 7 for the demo generator, and 18 browser tests (Playwright; skipped when it isn't installed).
