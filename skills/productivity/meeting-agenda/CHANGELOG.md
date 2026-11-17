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
- Runs only when invoked explicitly (`/meeting-agenda`, or `$meeting-agenda`
  in Codex): `disable-model-invocation: true` in `SKILL.md`, and
  `allow_implicit_invocation: false` in `agents/openai.yaml`.
- `scripts/build_deck.py`: validates agenda JSON and writes it into the
  template's `agenda-data` block, escaping `<`.
- Indigo/violet theme with cyan accents: an "Agenda item N of M · X min"
  label, a violet-to-cyan ring captioned "of M:SS allotted", pill
  Pause/Reset buttons, progress dashes that fill per item, and the
  meeting bar ahead of the meeting text.
- The "Agenda item N of M" line stays at the same height on every slide:
  slides are laid out in one shared box, sized to the tallest slide and centred
  once, and the entrance animation is a fade only.
- Redesigned Settings: an underlined Contents/Theme tab bar, a × to close, the deck
  title as an editable heading, a running total, inline per-item errors with a
  footer count, Ctrl/⌘+Enter to apply, a quieter footer, and a bottom sheet on
  phones. Contents has two views of one draft: **Quick View** (an inline list)
  and **Detailed View** (list plus detail, with a −/+ minutes control, quick
  picks and one line per sub-point).
- Deck title field in Settings → Contents (default "Team Planning Meeting"),
  kept in the agenda's `"title"`.
- `/meeting-agenda --demo` (`build_deck.py --demo`) returns the bundled
  demo deck byte for byte.
- Settings (gear) with two tabs: **Contents** (the agenda editor) and
  **Theme**. There are five themes: Indigo (default), Midnight, Ocean,
  Daylight (light) and High contrast. Clicking a theme previews it live;
  Apply keeps it, and Save HTML carries it. `build_deck.py --theme` and
  the agenda's `"theme"` field set it.
- `Space` pauses and resumes the timer (like `P`, and like a video
  player); it no longer changes slides, and `Shift+Space` does nothing.
- Touch support: swipe, tap zones (right 70% forward, left 30% back),
  long-press to pause/resume, `‹ ›` buttons and touch hints on touch
  screens, and a layout that fits a phone.
- pytest + Playwright suite (168 tests), built red/green.
