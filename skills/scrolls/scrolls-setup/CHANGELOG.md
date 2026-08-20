# Changelog

All notable changes to the `scrolls-setup` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.2.0] - 2026-08-20

### Changed

- Split `CLAUDE.md`'s content in two: the "read `STARTER.md` first"
  block now lives in a new `SCROLLS.md` (from a new
  `assets/templates/SCROLLS_MD_BLOCK.md` template), and `CLAUDE.md`
  itself becomes a fixed two-line pointer to it (`## Access Scrolls
  Agentic Memory` / `See @SCROLLS.md.`), no longer containing the
  scrolls path directly. `AGENTS.md` is unaffected — it still points at
  `CLAUDE.md`, which continues to resolve correctly regardless of what
  `CLAUDE.md` itself contains.
- `assets/templates/CLAUDE_MD_BLOCK.md` redefined to the new short
  pointer content (previously the full memory-pointer block, now in
  `SCROLLS_MD_BLOCK.md` instead).

## [1.1.0] - 2026-08-20

### Added

- A matching `AGENTS.md` pointer (`See @CLAUDE.md`) alongside the
  existing `CLAUDE.md` pointer, for other agent harnesses that read the
  [agents.md](https://agents.md) convention instead (e.g. Codex CLI).
  New `assets/templates/AGENTS_MD_BLOCK.md` template.
- `meta/MAINTAINERS.md`: development notes (layout, versioning) for
  this skill, including the `assets/templates/` inventory.

## [1.0.0] - 2026-08-18

### Added

- Initial release: scaffolds `docs/.scrolls/` (`STARTER.md`, `SPEC.md`,
  `HANDOFF.md`, `GAP_ANALYSIS.md`, `GAP_CONTEXT.md`, `PLAN.md`,
  `WISDOM.md`) for a project that doesn't have it yet, plus a
  `CLAUDE.md` pointer to it. Supports `-p`/`-t`/`-l`/`-r`/`-u`.
