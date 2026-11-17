# meeting-agenda

Turns a meeting agenda into one self-contained HTML slide deck with a countdown timer for every item. The deck has no dependencies and makes no network calls; open it in any modern browser, including offline.

![A slide with its ring timer and the per-item meeting progress bar](meta/screenshots/07-progress-by-section.png)

## Install

```bash
npx skills add sugatoray/aiskills --skill meeting-agenda
```

Or, in Claude Code, run `/plugin marketplace add sugatoray/aiskills`, then `/plugin install productivity-skills@sugatoray`.

## Ask for a deck

```text
/meeting-agenda --title "Team Planning Meeting" --total 30
10 min  Priorities for 2026 & 2027 (what are the priorities for 2026? for 2027?)
8 min   Identify trainings for 2027
5 min   Resourcing & budget
3 min   Risks & blockers
4 min   Decisions, owners & next steps
```

The agent turns this into agenda JSON, builds the deck with `scripts/build_deck.py`, and hands you `meeting-agenda.html`, along with a table of items and the planned total. Options: `--title`, `--total` (the target length, used to fill in missing item times), `--theme` (`aurora`, `observatory`, `abyss`, `editorial`, `signal`, `clarity`, `clarity-dark`, or the classics `indigo`, `midnight`, `ocean`, `daylight`, `contrast`), and `--output` (path).

`/meeting-agenda --demo` returns the bundled 30-minute demo deck exactly as it ships.

To build a deck yourself without an agent:

```bash
python3 scripts/build_deck.py agenda.json -o meeting-agenda.html --title "Weekly sync" --theme editorial
```

Or copy the demo deck unchanged:

```bash
python3 scripts/build_deck.py --demo -o meeting-agenda.html
```

## Present it

1. Open the HTML file in a browser (double-click it; no server needed).
2. Present with the keyboard. Each slide's timer starts when the slide is shown.
3. Click the gear in the top right to change the agenda.

### Controls

| Action | Keyboard | Phone or tablet |
|---|---|---|
| Next slide | `→`, `Page Down` | Swipe left, tap the right 70% of the slide, or tap `›` |
| Previous slide | `←`, `Page Up` | Swipe right, tap the left 30% of the slide, or tap `‹` |
| First / last slide | `Home` / `End` | Tap the first / last progress dash |
| Pause / resume timer | `Space` or `P` (like a video player) | Long-press the slide (½ s), or tap Pause |
| Reset timer | `R` | Tap Reset |
| Close editor without saving | `Esc` | Tap Cancel |

The Pause/Resume and Reset buttons under the ring, and the progress dashes in the footer, also work with a mouse. A mouse click on the slide itself never changes slides; only touch and pen do.

The touch defaults follow common presentation apps (Keynote, Google Slides, reveal.js) and story viewers:
- A swipe must travel at least 50 px and be mostly sideways, so scrolling a long slide never changes it.
- Forward gets the larger tap area because it's the common action.
- Long-press uses the standard ½-second hold, with a short vibration where the phone supports it and a "Paused"/"Resumed" message.
- Reset has no gesture, so it can't happen by accident.
- Touch targets are at least 44 px, Apple's minimum.

On a touch screen, the footer hints change to "Swipe or tap to navigate · Hold to pause".

### Timers

- The ring counts down from the item's minutes. It pauses when you leave the slide and continues from the same point when you come back.
- The ring turns **amber** in the last 20% of the item's time. Past zero it turns **red**, pulses, and counts up (`+1:05`).
- The footer shows `Meeting: M:SS used / M:SS planned` and a progress bar split into one section per item, sized by that item's planned minutes and separated by tick marks. Each section fills with the time spent on its own item, so moving between items (or skipping one) shows exactly where the time went. The current item's section is highlighted, and a section that runs over its item's time turns red without spilling into the next section. The whole bar turns amber at 80% of the planned total and red once past it. Hover over it to see the percentage used.

### Settings (the gear)

The gear opens **Settings**, which has two tabs. Switch between them by clicking, or with `←`/`→` when a tab has focus.

**Contents** starts with the **deck title**: large text you click into to edit, shown top-left and as the browser tab's title. Leave it blank to hide it. Next to the view switch, a running total ("5 items · 30 min planned") updates as you type. The agenda itself has two views of the same unsaved edits, so you can switch between them mid-edit; the view you used last opens next time.

| View | Layout | Best for |
|---|---|---|
| **Quick View** (default) | One list. Each row has the title, its sub-points (one per line, growing as you type) and a compact "10 min" field. ↑ ↓ ✕ appear when you hover over or focus a row. **+ Add item** is at the end. | Scanning and tweaking the whole meeting at once |
| **Detailed View** | The item list on the left (number, title, minutes) and the selected item on the right: title, a −/+ minutes control with 5 / 10 / 15 / 30 quick picks, and sub-points as separate lines. Enter adds a sub-point, Backspace on an empty one removes it, and ✕ deletes one. ↑ ↓ ✕ at the top move or delete the item. | Long or detailed agendas |

In both views the last item can't be removed. A problem item gets a red edge and a short message ("Add a title", "Minutes must be more than 0"), and the footer shows how many items need attention.

**Theme** shows the twelve themes as cards, each a small preview of that theme. Clicking a card previews the theme on the deck behind the dialog. The chosen card has a ✓.

| Theme | Look | Best for |
|---|---|---|
| **Aurora** (default) | A slowly drifting violet aurora, a glass dial, a "live" label, display-weight numerals | General use |
| **Observatory** | Pure black, a fading grid, outlined numerals, a mono timer with a 60-tick watch dial | Dark rooms, technical teams |
| **Abyss** | Deep teal with slow light shafts, a glowing ring, ultralight numerals | A calm, cinematic look |
| **Editorial** | Ivory paper, serif italics, terracotta ink, ruled header and footer, a print-style dial | Bright rooms and projectors |
| **Signal** | Black, white and signal yellow, heavy type, a thick ring; no texture, glow or blur | Accessibility, very poor projectors |
| **Clarity** | Apple's design principles: a quiet light background, sentence-case labels, the timer on a raised white card, a filled blue Pause button | Bright rooms, a calm and familiar look |
| **Clarity Dark** | The same in true black, with charcoal cards | Dark rooms, OLED screens |
| **Indigo** (classic) | Violet and cyan on indigo | General use |
| **Midnight** | Teal on navy and plum | Dark rooms, a calmer look |
| **Ocean** | Aqua and coral on deep teal-blue | A cooler alternative |
| **Daylight** | Light background, dark text | Bright rooms and washed-out projectors |
| **High contrast** | Black and white, cyan accents, no gradients | Accessibility and very poor projectors |

The classic five look exactly as before. Fonts come from the viewer's own computer (nothing is downloaded): Inter or the system UI font, Iowan Old Style or Charter for Editorial, San Francisco and SF Pro Rounded for Clarity, SF Mono or another monospace for Observatory. The motion in Aurora and Abyss is very slow, and stops for anyone who has asked their system to reduce motion.

Every theme keeps the main text at WCAG AAA contrast (7:1) and the small text at AA (4.5:1). The amber and red time warnings look the same in every theme.

The buttons at the bottom apply to both tabs. The × at the top right closes like Cancel, and **Ctrl+Enter** (**⌘+Enter** on a Mac) applies:

| Button | What it does |
|---|---|
| **Reset to defaults** | Asks first, then restores the title, agenda and theme built into the file and forgets the browser copy |
| **Cancel** / `Esc` | Closes Settings and discards changes, including a previewed theme |
| **↓ Save HTML** | Downloads a copy of `meeting-agenda.html` with this agenda and theme built in. Share it, and it opens that way. |
| **Apply** | Rebuilds the deck and remembers the agenda and theme in this browser (`localStorage`) |

Every item needs a title and minutes greater than 0. Invalid rows are highlighted, and Apply/Save are blocked until they're fixed. If you press Apply from the Theme tab, Settings switches to Contents to show the problem. While Settings is open the timer is paused and the keys don't change slides.

You can also edit the agenda directly in the file's `<script type="application/json" id="agenda-data">` block:

```json
{ "title": "Team Planning Meeting", "theme": "daylight",
  "items": [ { "minutes": 10, "title": "Priorities", "points": ["2026", "2027"] } ] }
```

### Which agenda loads?

The agenda saved in this browser (from Apply) loads first. If there isn't one, the agenda built into the file loads.

## Run the tests

Requires Python 3.10+, `pytest` and `playwright`.

```bash
pip install pytest playwright
```

```bash
python -m playwright install chromium
```

```bash
python -m pytest
```

If you already have Chromium installed, point `CHROMIUM_PATH` at it and skip the `playwright install` step. The suite has 168 tests (150 for the deck, 18 for `build_deck.py`) and runs in about 25 seconds, because the timers use Playwright's fake clock. It also regenerates `meta/screenshots/`.

## Contents

| Path | What |
|---|---|
| `SKILL.md` | Instructions the agent follows |
| `assets/meeting-agenda.html` | The deck template (it's also a working deck: the 30-minute demo agenda) |
| `scripts/build_deck.py` | Validates agenda JSON and writes it into a copy of the template |
| `tests/` | pytest + Playwright suite |
| `meta/MAINTAINERS.md` | How the deck is built and how to change it |
| `meta/SECURITY.md` | Security model |
| `meta/screenshots/` | Normal slide, overtime, Settings (Quick View, Detailed View, Theme), progress by section, phone |
