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
- Indigo/violet theme with cyan accents: an "Agenda item N of M · X min"
  label, a violet-to-cyan ring captioned "of M:SS allotted", pill
  Pause/Reset buttons, progress dashes that fill per item, and the
  meeting bar ahead of the meeting text.
- `Space` pauses and resumes the timer (like `P`, and like a video
  player); it no longer changes slides, and `Shift+Space` does nothing.
- Touch support: swipe, tap zones (right 70% forward, left 30% back),
  long-press to pause/resume, `‹ ›` buttons and touch hints on touch
  screens, and a layout that fits a phone.
- pytest + Playwright suite (94 tests), built red/green.
