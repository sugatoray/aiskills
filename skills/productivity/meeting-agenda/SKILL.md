---
name: meeting-agenda
description: "Turn a meeting agenda into a self-contained HTML slide deck with a countdown timer per item: one slide per item (large 01, 02… number, title, optional sub-points), a ring timer that turns amber in the last 20% and red with a +M:SS count-up past zero, a footer with clickable progress dots and a per-item meeting progress bar, and a built-in editor (gear button) that saves to localStorage or downloads an updated copy. Use when the user invokes /meeting-agenda, or asks for agenda slides, a timed agenda, a meeting timer deck, or to present an agenda with timeboxes. Accepts pasted agenda text, notes, a document, or agenda JSON. Delivers one offline HTML file that needs no dependencies."
license: MIT
compatibility: "Python 3.9+ (stdlib only) to build the deck; any modern browser to present it; optional pytest + Playwright to run the bundled test suite"
metadata:
  name: meeting-agenda
  type: skill
  author: sugatoray
  version: "1.0.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/productivity/meeting-agenda"
---

# Meeting agenda

Build a timed slide deck from an agenda by filling the bundled template, then hand
over one working HTML file. Never hand-edit the template for a single deck; the
build script writes the agenda into it safely.

Leave `README.md`, `CHANGELOG.md` and `meta/` for maintainers. Read
`meta/MAINTAINERS.md` only when changing the template itself.

## Invocation

`/meeting-agenda [[agenda text, notes, or a path to a file]]` with these options:

| Option | Default | Contract |
| --- | --- | --- |
| `--title` | Inferred from the request, else none | Meeting name shown top-left and as the page title. |
| `--total` | Sum of item minutes | Target length in minutes. Use it to allocate missing item times (below). If items already carry minutes that don't add up to it, say so; don't silently rescale. |
| `--output` | `meeting-agenda.html` in the working directory | Path of the HTML file to write. |

With no agenda at all, ask for one. Build the bundled 30-minute demo only if the user asks for a demo or example.

## 1. Turn the input into agenda JSON

```json
{ "title": "Team Planning Meeting",
  "items": [
    { "minutes": 10, "title": "Priorities for 2026 & 2027",
      "points": ["What are the priorities for 2026?", "What are the priorities for 2027?"] }
  ] }
```

- **One item per agenda topic, in the user's order.** Use the user's wording for titles. Keep each title short (about 8 words or fewer) and move the detail into `points`.
- **`points`** holds the sub-items, one string each. Omit it, or use `[]`, when an item has none. Don't invent points; if the user gave none, there are none.
- **`minutes`** must be > 0; 0.5 steps are typical (`7.5` shows as 7:30).
  - Times given for every item: use them as given.
  - Times given for some items plus a `--total`: spread the remaining minutes across the untimed items, rounded to 0.5. State the times you chose.
  - No times anywhere: ask. If the user wants you to decide, propose times and say so in the summary.
- Don't add items the user didn't list (no surprise "Intro" or "AOB"). You may suggest them in your reply.

## 2. Build the deck

Write the JSON to a temporary file, then run the script from this skill's directory:

```bash
python3 scripts/build_deck.py agenda.json -o meeting-agenda.html --title "Team Planning Meeting"
```

- `-` reads the JSON from stdin, and `--check` validates without writing.
- **Exit 2 means invalid input.** The error names the item and the problem (`item 3: title is required`). Fix the JSON and run it again.
- The script copies `assets/meeting-agenda.html` and replaces only its `<script type="application/json" id="agenda-data">` block, escaping every `<`. Titles that contain HTML or `</script>` are safe. It prints `wrote <path>: N items, M:SS planned`.

## 3. Verify

- Check that the printed item count and planned total match what you intended.
- If a browser tool or Playwright is available, open the file and check that the first slide shows `01` and your first title, and that the footer reads `Meeting: 0:00 used / <total> planned`.
- Run the bundled suite (`python3 -m pytest` in this directory) only if you changed the template or the script.

## 4. Deliver

Give the user:

1. The HTML file (send it or link it; don't paste its source).
2. A short table of the items (number, minutes, title) and the planned total. Point out any times you chose for them.
3. The controls in one line: `→`/`Space`/`PgDn` next, `←`/`Shift+Space`/`PgUp` back, `Home`/`End`, `P` pause, `R` reset, and the gear to edit (Apply remembers the agenda in that browser; Save HTML downloads an updated copy).

## What the deck does (for answering questions)

- **Slides:** one per item, with a large two-digit number, the title, and the sub-points. The background is a dark navy-to-plum gradient with a violet glow in the top-left corner. Adapts to any number of items and any lengths.
- **Timers:** each slide has a ring countdown that starts when the slide is shown and pauses when you leave it. It turns amber in the last 20% of the item's time, then red, pulsing and counting up (`+M:SS`) past zero. `P` and `R` (or the buttons) pause/resume and reset.
- **Footer:** keyboard hints, clickable progress dots, `Meeting: M:SS used / M:SS planned`, and a progress bar with one section per item, each filling with the time spent on that item. The bar turns amber at 80% of the planned total and red past it, and its tooltip shows the percentage used.
- **Editor (gear):** a row per item (minutes, title, sub-points), with ↑/↓ to reorder and ✕ to remove (the last row can't be removed). Buttons: Add item, Reset to file defaults (asks first), Cancel/Esc, Save HTML, Apply. Rows without a title or with minutes ≤ 0 are highlighted and block Apply and Save. While the editor is open the timer pauses and keys don't change slides.
- **Offline and private:** no network requests, and agenda text is never parsed as HTML. See `meta/SECURITY.md`.
