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
| `--theme` | `indigo` | One of `indigo`, `midnight`, `ocean`, `daylight` (light; for bright rooms and projectors) or `contrast` (high contrast). If the user mentions a bright room, a projector or accessibility, suggest `daylight` or `contrast`. |
| `--output` | `meeting-agenda.html` in the working directory | Path of the HTML file to write. |
| `--demo` | Off | Return the bundled 30-minute demo deck exactly as it ships. See **Demo** below. |

With no agenda at all, ask for one. If the user asks for a demo or an example, treat it as `--demo`.

## Demo (`--demo`)

Copy the bundled deck byte for byte. Don't build, edit or re-theme it:

```bash
python3 scripts/build_deck.py --demo -o meeting-agenda.html
```

The script refuses an agenda, `--title` or `--theme` alongside `--demo` (exit 2). If the user passed any, say they were ignored, and offer a custom build instead. Then skip to **4. Deliver**: send the file, show the demo's five items (10 + 8 + 5 + 3 + 4 = 30 minutes), and give the controls line.

## 1. Turn the input into agenda JSON

```json
{ "title": "Team Planning Meeting", "theme": "indigo",
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
python3 scripts/build_deck.py agenda.json -o meeting-agenda.html --title "Team Planning Meeting" --theme indigo
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
3. The controls in one or two lines. Keyboard: `→`/`PgDn` next, `←`/`PgUp` back, `Home`/`End`, `Space` or `P` pause/resume, `R` reset. Phone: swipe or tap (right side forward, left side back), hold to pause, `‹ ›` buttons. The gear edits the agenda: Apply remembers it in that browser, and Save HTML downloads an updated copy.

## What the deck does (for answering questions)

- **Slides:** one per item, with a large two-digit number, the title, and the sub-points. Above the number, a cyan label reads "Agenda item 3 of 5 · 5 min". The theme is indigo/violet with a lighter violet glow at the top-left, a violet number, and cyan accents. Adapts to any number of items and any lengths.
- **Timers:** each slide has a violet-to-cyan ring countdown, captioned "of M:SS allotted",, that starts when the slide is shown and pauses when you leave it. It turns amber in the last 20% of the item's time, then red, pulsing and counting up (`+M:SS`) past zero. `Space` or `P` pauses/resumes (like a video player), and `R` resets; the buttons do the same.
- **Footer:** keyboard hints, clickable progress dashes (one per item, each filling with that item's time), a progress bar, then `Meeting: M:SS used / M:SS planned`. The bar has one section per item, each filling with the time spent on that item. The bar turns amber at 80% of the planned total and red past it, and its tooltip shows the percentage used.
- **Phones and tablets:** swipe left/right for next/previous, tap the right 70% / left 30% of the slide, long-press (½ s) to pause or resume, and `‹ ›` buttons beside the progress dashes. Touch targets are at least 44 px, and the layout scales down to fit a phone. Mouse clicks on the slide don't navigate.
- **Settings (gear):** two tabs.
  - **Contents:** the deck title (shown top-left and as the page title; may be blank), then a row per item (minutes, title, sub-points), with ↑/↓ to reorder, ✕ to remove (the last row can't be removed), and Add item.
  - **Theme:** five themes (Indigo, Midnight, Ocean, Daylight, High contrast) as preview cards. Clicking one previews it live.
  - **Shared buttons:** Reset to file defaults (asks first), Cancel/Esc (discards changes, including a previewed theme), Save HTML (the agenda and theme go into the copy), and Apply (saved in the browser).
  - Rows without a title or with minutes ≤ 0 are highlighted and block Apply and Save. While Settings is open the timer pauses and keys don't change slides.
- **Offline and private:** no network requests, and agenda text is never parsed as HTML. See `meta/SECURITY.md`.
