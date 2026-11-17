# SPEC.md — Feature Spec

What productivity skills does, feature by feature. Add a section per feature when it ships — describe *what* it does and *why* it matters to a user, not the implementation detail (that belongs in code comments or `WISDOM.md`).

## `/meeting-agenda`: a timed slide deck from an agenda (PR [sugatoray/aiskills#272](https://github.com/sugatoray/aiskills/pull/272), unmerged)
You give it an agenda (pasted text, notes, a document, or JSON) and get back one offline HTML file, `meeting-agenda.html`. It runs only when invoked by name: `/meeting-agenda`, or `$meeting-agenda` in Codex. `--demo` returns the bundled 30-minute demo deck byte for byte. Other options: `--title`, `--total` (fills in missing item times), `--theme` and `--output`. The skill's own `README.md` and `CHANGELOG.md` have the full details.

- **Slides:** one per item, each with an "Agenda item N of M · X min" label that stays at the same height on every slide, a large number, the title and its sub-points.
- **Timers:** a ring countdown per item that pauses when you leave the slide. It turns amber in the last 20% and red with a `+M:SS` count-up past zero.
- **Footer:** progress dashes that fill per item, and a meeting bar with one section per item. "Meeting: M:SS used / M:SS planned" sits beside it, and the bar turns amber at 80% of the plan and red past 100%.
- **Controls:** `←`/`→` and `PgUp`/`PgDn` change slides, `Home`/`End` go to the first/last, `Space` or `P` pauses (like a video player), and `R` resets. On phones: swipe, tap the right or left side, hold to pause, and `‹ ›` buttons.
- **Settings (gear):**
  - **Contents:** the deck title, a running total, and two views of one draft: **Quick View** (an inline list) and **Detailed View** (a list plus a detail pane with a −/+ minutes control and quick picks).
  - **Theme:** five themes (Indigo, Midnight, Ocean, Daylight, High contrast), previewed live.
  - **Buttons:** Apply (or Ctrl/⌘+Enter) remembers the agenda in the browser, Save HTML downloads a copy with the agenda and theme built in, and Reset restores the file's defaults.

<!--
## <Feature name>
What it does, from a user's perspective. A pointer to where it lives in the code
(`path/to/file.ext:line`) if that saves the next reader time.
-->
