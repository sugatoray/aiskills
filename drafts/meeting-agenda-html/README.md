# Meeting Agenda Deck

One self-contained HTML file (`meeting-agenda.html`) that turns a meeting agenda into a full-screen slide deck, with a countdown timer for every item. It has no dependencies and makes no network calls. Open it in any modern browser, including offline.

## Use it

1. Open `meeting-agenda.html` in a browser (double-click it; no server needed).
2. Present with the keyboard. Each slide's timer starts when the slide is shown.
3. Click the gear in the top right to change the agenda.

### Keyboard

| Action | Keys |
|---|---|
| Next slide | `→`, `Space`, `Page Down` |
| Previous slide | `←`, `Shift+Space`, `Page Up` |
| First / last slide | `Home` / `End` |
| Pause / resume timer | `P` |
| Reset timer | `R` |
| Close editor without saving | `Esc` |

The Pause/Resume and Reset buttons under the ring, and the progress dots in the footer, do the same with the mouse.

### Timers

- The ring counts down from the item's minutes. It pauses when you leave the slide and continues from the same point when you come back.
- The ring turns **amber** in the last 20% of the item's time. Past zero it turns **red**, pulses, and counts up (`+1:05`).
- The footer shows `Meeting: M:SS used / M:SS planned` and a progress bar with a tick mark at each item boundary. The bar turns amber at 80% of the planned total and red once past it. Hover over it to see the percentage used.

### Editing the agenda

The gear opens the editor, with one row per item: minutes (0.5 steps), title, and sub-points (one per line). Use ↑/↓ to reorder and ✕ to remove a row. The last row can't be removed.

| Button | What it does |
|---|---|
| **+ Add item** | Adds a blank row |
| **Reset to file defaults** | Asks first, then restores the agenda built into the file and forgets the browser copy |
| **Cancel** / `Esc` | Closes the editor and discards changes |
| **Save HTML** | Downloads a copy of `meeting-agenda.html` with this agenda built in. Share it, and it opens with your agenda. |
| **Apply** | Rebuilds the deck and remembers the agenda in this browser (`localStorage`) |

Every item needs a title and minutes greater than 0. Invalid rows are highlighted, and Apply/Save are blocked until they're fixed. While the editor is open the timer is paused and the keys don't change slides.

You can also edit the agenda directly in the file's `<script type="application/json" id="agenda-data">` block:

```json
{ "title": "Team Planning Meeting",
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

If you already have Chromium installed, point `CHROMIUM_PATH` at it and skip the `playwright install` step. The suite has 49 tests and runs in about 25 seconds, because the timers use Playwright's fake clock. It also regenerates `screenshots/`.

## Contents

| Path | What |
|---|---|
| `meeting-agenda.html` | The deck |
| `tests/` | pytest + Playwright suite |
| `logs/red.log`, `logs/green.log` | Test runs before (stub) and after the implementation |
| `screenshots/` | Normal, amber, overtime, editor, validation, meeting-over |
| `maintainers.md` | How it's built and how to change it |
| `security.md` | Security model |
