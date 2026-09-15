# Changelog

All notable changes to the `subskill-dispatcher` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.1] - 2026-09-15

### Changed

- Moved the Claude Code plugin manifest to the family-level `skills/building-blocks/.claude-plugin/plugin.json`, matching the `scrolls-*` packaging model.

## [0.2.0] - 2026-09-15

### Added

- Claude Code plugin packaging through `.claude-plugin/plugin.json`.
- Claude Code agent metadata through `agents/claude-code.yaml`.
- Claude Code installation instructions in `README.md`.

### Changed

- Bumped the skill version to `0.2.0` for the packaging addition.

## [0.1.0] - 2026-09-15

### Added

- Initial release of the generic `::s` subskill-dispatch protocol.
- Defined parent/child context inheritance and option scoping.
- Added explicit skill resolution, alias handling, chaining, result, and failure contracts.
- Documented coexistence with pipe-based modifier composition.
