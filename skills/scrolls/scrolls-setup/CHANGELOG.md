# Changelog

All notable changes to the `scrolls-setup` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.1.0] - 2026-08-20

### Changed

- Tightened step 4's `CLAUDE.md` leave-alone condition: previously, a
  `CLAUDE.md` that already pointed straight at `SCROLLS_PATH/STARTER.md`
  (the pre-`1.2.0` direct-embed convention) was left alone entirely,
  even though it had no `SCROLLS.md` reference. Re-running
  `/scrolls-setup` against such a project therefore never added the
  `SCROLLS.md` pointer stub. Now the stub is inserted whenever
  `CLAUDE.md` doesn't already reference `SCROLLS.md` specifically,
  regardless of any older direct reference already there — additive
  only, old and new references can coexist.
- Made step 4's idempotency guarantee explicit: it always runs, even
  against a project whose `docs/.scrolls/` was already fully populated
  and left untouched in step 1 — re-running this skill purely to pick
  up the pointer chain is safe and never duplicates or overwrites
  anything.

## [2.0.0] - 2026-08-20

### Changed (breaking)

- Major version bump, family-wide (see `../CHANGELOG.md`): formalizes
  the `SCROLLS.md`/`CLAUDE.md`/`AGENTS.md` restructuring from `1.1.0`/
  `1.2.0` as a breaking change rather than a minor one. Projects
  already set up by a pre-`2.0.0` version of this skill keep working as
  before, but `scrolls-hide`/`scrolls-unhide` `2.0.0` no longer rewrite
  their `CLAUDE.md` on rename — only `SCROLLS.md` (see those skills'
  own `CHANGELOG.md`). Re-run `/scrolls-setup` against an old project
  (safe: it never overwrites existing content) to pick up `SCROLLS.md`
  and get that rewrite coverage back.

## [1.3.0] - 2026-08-20

### Changed

- Synced to `1.3.0` to keep this skill's version locked in step with
  the other four `scrolls-*` skills (see
  `../meta/MAINTAINERS.md`'s Versioning entry) — no functional change
  of its own in this release.

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
