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
  - **Theme:** twelve themes, previewed live: seven studio themes (Aurora, the default; Observatory; Abyss; Editorial; Signal; Clarity; Clarity Dark), then the five classics (Indigo, Midnight, Ocean, Daylight, High contrast).
  - **Buttons:** Apply (or Ctrl/⌘+Enter) remembers the agenda in the browser, Save HTML downloads a copy with the agenda and theme built in, and Reset restores the file's defaults.

## `/agent-sessions-insight`: how you use your coding agents (PR [#320](https://github.com/sugatoray/aiskills/pull/320), unmerged)
It reads the session logs coding agents already keep on the user's machine and gives back one offline, tabbed HTML report, `agent-sessions-insight.html`, plus the counted numbers in `agent-sessions-insight-data.json`. It runs only when invoked by name: `/agent-sessions-insight`, `$agent-sessions-insight` in Codex, `/skill:agent-sessions-insight` in Pi. Options: `--days N` (default 180), `--agents`, `--extra NAME=PATH` (another agent's folder, read with the generic parser) and `--output`.

- **Agents read:** Claude Code, Codex CLI, Pi, OpenCode (JSON storage and SQLite), GitHub Copilot CLI, Devin CLI (per-session `log.jsonl` or the older `sessions.db`) and Grok CLI, plus any JSONL-logging agent through `--extra`.
- **Report:** sessions, active days, prompts, session length, busiest months, weekdays and hours, projects, tools, slash commands, test runs, doc-file edits and a per-agent split. Counted figures are exact; "kinds of work" and "friction" are the agent's reading and are labelled as such.
- **Built from a template:** the agent doesn't write HTML. It writes its reading as a small insights JSON (overview, kinds, habits, friction, agents), and `scripts/build_report.py` fills the bundled template with that and the counted numbers. Every run looks the same. The page works offline, in light and dark, and at phone width, with a tooltip and a table behind every chart. `--demo` gives the template as is, with made-up data, so a user can see the report before running it.
- **Every judgement is checkable:** habits are numbered cards with a "Seen in" line, friction points carry evidence, the Friction tab lists open threads with a next step, and a "What this is based on" banner says which logs were read and what was missing. Months are stacked by agent with totals; a button overrides the system's light or dark theme.
- **Privacy:** read-only (SQLite opened `mode=ro`), no network, prompts kept as snippets of at most 160 characters, and the report isn't published unless the user asks.

<!--
## <Feature name>
What it does, from a user's perspective. A pointer to where it lives in the code
(`path/to/file.ext:line`) if that saves the next reader time.
-->
