# Changelog

All notable changes to this skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-11-16

### Added

- `/meeting-agenda` skill: turns an agenda into a self-contained HTML slide
  deck with a ring countdown per item (amber in the last 20%, red with a
  `+M:SS` count-up past zero), keyboard and dot navigation, a footer with a
  per-item meeting progress bar, and an in-page editor that applies to
  `localStorage` or downloads an updated copy.
- `scripts/build_deck.py`: validates agenda JSON and writes it into the
  template's `agenda-data` block, escaping `<`.
- pytest + Playwright suite (67 tests), built red/green; logs in
  `meta/tdd-logs/`.
