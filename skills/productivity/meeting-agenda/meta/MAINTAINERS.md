# Maintainers' notes

## Ground rules

- **One file, no dependencies.** CSS and JS are inline. No CDNs, fonts, images, `fetch` or XHR. `test_file_has_no_external_dependencies` and `test_no_network_requests_on_load` enforce this.
- **Red/green TDD.** Add or change a test first, watch it fail, then change the HTML.
- **Never write a literal closing script tag inside the main `<script>`.** That includes comments: the HTML parser ends the block there. This happened once during development and broke the whole page. Write "closing script tag" in prose instead.

## Skill layout

- `SKILL.md`: the agent workflow (input → agenda JSON → `build_deck.py` → verify → deliver).
- `assets/meeting-agenda.html`: the template, which is also a working deck with the demo agenda.
- `scripts/build_deck.py`: stdlib-only. `normalize()` mirrors the in-page `normalize()` rules, and `embed()` replaces only the `agenda-data` block, with `<` escaped. Exit 2 on invalid input. Keep its validation in step with the page's.
- `tests/`: run `python3 -m pytest` from the skill directory.

## Layout of `assets/meeting-agenda.html`

1. `<style>`: colour tokens on `:root`, then the header, stage, timer, footer and editor sections.
2. Static markup: header (`#meeting-title`, `#btn-edit`), `main` (`#deck`, `#timer`, controls), footer (`#hints`, `#dots`, `#meeting-text`, `#meeting-bar`), and the hidden `#editor` dialog. **Static markup must stay free of rendered slides.** "Save HTML" serializes a copy of the page as it was before rendering.
3. `<script type="application/json" id="agenda-data">`: the agenda that ships with the file.
4. The app script, an IIFE in strict mode.

## Data model

```js
{ title: string, items: [ { minutes: number > 0, title: non-empty string, points: string[] } ] }
```

`normalize()` is the one gate for every source (file block, `localStorage`, editor). It trims strings, drops empty points, and returns `null` for anything invalid. Callers then fall back to the file defaults. A bare array of items is also accepted.

## State

| Variable | Meaning |
|---|---|
| `agenda` | Active agenda |
| `current` | Index of the visible slide |
| `elapsed[i]` | ms used on slide *i*, not counting the running segment |
| `runningSince` | `Date.now()` when the current slide's timer last started, or `null` if paused |
| `editorOpen`, `resumeAfterEditor` | Editor gating |

Used time is `elapsed[i] + (now - runningSince)` for the current slide. Time is never accumulated by counting ticks, so a throttled background tab doesn't lose time. `setInterval(render, 250)` only repaints.

- `go(i)`: stop the current segment, switch slides, start the new one.
- Timer thresholds: `warn` when not over and remaining ≤ 20% of planned; `over` when used > planned. The text shows `ceil(remaining)` normally and `+floor(overage)` when over.
- Meeting bar: one `.seg` per item (`left`/`width` = the item's planned share of the total), each holding a `.seg-fill` whose width is that item's `used*100/planned`, capped at 100%. `.seg.current` marks the visible item, and `.seg.over` marks an item past its own time. On the whole bar, `pct = totalUsed*100/totalPlanned` gives `warn` (≥ 80% and ≤ 100%), `over` (above 100%), and the uncapped rounded tooltip. *History:* the first version had one fill growing from the left by the total, so time on a later item appeared inside item 1's section. Fixed red/green (`logs/red-section-progress.log`).

## Editor flow

`openEditor` stops the timer and copies `agenda` into rows. Rows are re-rendered from `readRows()` on add, move and remove, so typed values survive. Validation runs on Apply and Save. After the first failed attempt it re-runs live on every input. `applyAgenda(data, persist)` either writes to `localStorage` (Apply) or clears it (Reset), rebuilds the deck, and resets all timers.

**Save HTML** clones the `PRISTINE` copy of the document (taken at script start, before anything is rendered) and writes `JSON.stringify(...).replace(/</g, "\\u003c")` into `#agenda-data`. It then downloads `"<!doctype html>\n" + outerHTML` as a Blob.

## Tests

`tests/conftest.py` launches Chromium once per session, using `CHROMIUM_PATH` or `/opt/pw-browsers/chromium` if present, and otherwise Playwright's own download. Each test gets a fresh context (empty `localStorage`) and `page.clock.install()`, and `tick(page, seconds)` advances time. `store_agenda(page, items)` seeds `localStorage` and reloads.

| File | Covers |
|---|---|
| `test_slides.py` | Self-containment, embedded demo, slide structure, XSS-as-text, corrupt storage |
| `test_navigation.py` | All keys, clamping, dots, Space after a button click |
| `test_timers.py` | Countdown, per-slide pause, P/R and buttons, amber, red/pulse/count-up |
| `test_footer.py` | Meeting text, ticks, per-section segments (sizing, fill per item, revisits, overtime cap, current marker), tooltip, amber/red |
| `test_editor.py` | Rows, gating, add/apply/storage, reorder/remove, last row, validation, cancel/Esc, reset confirm, Save HTML escaping and round-trip |
| `test_layout.py` | 24 long items, 90-minute item, phone width |
| `test_screenshots.py` | Asserts each visual state, and saves the four images in `KEEP` to `meta/screenshots/` (the skill is copied on install, so keep it small). Finishes finite animations before capturing, so images aren't caught mid-fade. |
| `test_build_deck.py` | `build_deck.py`: file and stdin input, `--title`, only the data block changes, `<` escaping, each validation error, `--check`, and a built deck rendering in the browser |

Selectors the tests rely on (keep them stable): `.slide`, `.slide.active`, `.num`, `.title`, `.points li`, `#timer(.warn|.over|.paused)`, `#timer-text`, `#ring-progress`, `#btn-pause`, `#btn-reset`, `#btn-edit`, `#dots .dot`, `#meeting-text`, `#meeting-bar(.warn|.over) .seg(.current|.over) .seg-fill .tick`, `#editor .row(.invalid)`, `.f-min`, `.f-title`, `.f-points`, `.btn-up`, `.btn-down`, `.btn-remove`, `#ed-add`, `#ed-reset`, `#ed-cancel`, `#ed-save`, `#ed-apply`, `#ed-error`.

## Common changes

- **Background:** a top-left radial glow (`#3a2a6b`) over a 135° navy-to-plum linear gradient (`#0f1530` to `#2e1a47`), set on `body`. `test_gradient_theme` only checks that a gradient is present.
- **Colours:** edit the `:root` tokens. The amber test checks the ring stroke is `#f59e0b`, so update it if you change that token.
- **Warn threshold:** `WARN_FRACTION` (item ring) and the `80` in `render()` (meeting bar). Update the matching tests.
- **New per-item field:** add it to `normalize()`, `rowFromItem`, `renderRows`, `readRows`, `collect`, and to the slide build in `build()`. Set it with `textContent`.
- **Storage key:** `STORAGE_KEY = "meetingAgenda"`. Changing it orphans agendas users already saved.

## Known limits

- Timer state isn't persisted. Reloading the page resets all timers.
- The meeting title is only editable in the JSON block, not in the editor.
- Minutes accept any value > 0. The 0.5 step is a UI hint, not a validation rule.
