---
name: flight-status
description: "One-shot or repeating flight status reports: journey percentage by distance, miles covered/to-go, live route map, and a timestamped announcement, delivered as a composite report card. Use whenever the user runs /flight-status, asks for a flight's status, or wants recurring flight tracking with visual progress."
license: MIT
compatibility: "Python 3.9+ (stdlib only, no dependencies); FlightAware connector CLI (/opt/hatch/bin/flightaware)"
disable-model-invocation: true
metadata:
  name: flight-status
  type: skill
  author: sugatoray
  version: "0.9.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/travel/flight-status"
---

# flight-status

Check a flight's live status and produce the standard status report: a
spoken-style announcement plus one composite card (percentage-by-distance
dashboard fused with the full-width route map).

## Signature

Run the bundled CLI:

```sh
~/workspace/custom-skills/flight-status/bin/flight-status \
  -f LX009 \
  [-r 30mins] \
  [-s "2026-10-15 22:12:07"] \
  [-m] \
  [-k airliner|knob|paper-plane] \
  [-t <iana|start|end>] \
  [--out-dir=<dir>] [--map-keep-name=<file>]
```

| Flag | Required | Meaning |
|---|---|---|
| `-f`, `--flight` | yes | Flight number, e.g. `LX009` (IATA or ICAO form both work) |
| `-r`, `--repeat` | no | Cadence like `30mins`, `30m`, `1h`. Default: none (one-shot). The CLI performs exactly one check; repeating on a schedule is the agent's job (see Repeating). |
| `-s`, `--start-datetime` | no | `"yyyy-mm-dd HH:MM:SS"`. Default: now. Its date selects the dated leg; its time is the reporting anchor. |
| `-m`, `--sample` | no | Render a sample report with built-in data (a real LX009 mid-flight snapshot). No FlightAware calls, no network. Useful for previewing the card layout. |
| `-k`, `--flight-marker` | no | Marker riding the progress bar: `airliner` (default), `knob`, or `paper-plane`. |
| `-t`, `--tz`, `--timezone` | no | Display timezone: an IANA name (e.g. `Europe/Zurich`), `start` for the origin airport's zone, or `end` for the destination airport's zone. Default: the user's locale, else the origin airport's zone. |
| `-h`, `--help` | no | Show the help document with flag reference and usage examples. |
| `--out-dir` | no | Where the card, map and `report.json` go. Default: current directory. |
| `--map-keep-name` | no | Kept map filename. Default: `<flight-lower>-map.png`. |

## What the CLI does

1. Resolves the flight via `flightaware canonical-flight`, then reads the
   dated leg (`flightaware flight IDENT --date <date>`) and the live
   position (`flightaware position <fa_flight_id>`).
2. Computes the journey split by **distance** (haversine, statute miles):
   `pct = round(100 * covered / (covered + remaining))` between origin and
   destination coordinates. Never use FlightAware's `progress_percent`.
3. Renders a fresh route map (`flightaware map --save`); if the render
   fails or is empty, the previous good map is kept and the card notes its
   age. A zero-byte map is never left in place.
4. Builds the composite card HTML (`<flight>-card.html`): big percentage,
   progress bar, "X mi covered / Y mi to go", altitude, groundspeed, current
   position coordinates, report timestamp, and the route map fused
   full-width into the same card. The top-right corner shows a color-coded
   status pill (e.g. "En Route · Delayed") over the estimated time
   remaining (e.g. "≈5h to go").
5. Writes `report.json` (status, journey split, position, display times and
   timezone, repeat cadence, file paths) and prints the announcement to
   stdout.

## Timezones (`-t`)

All displayed clock times (report time, expected arrival, the old estimate,
the announcement) render in one display timezone:

- `-t Europe/Zurich` (also `--tz`, `--timezone`): any IANA name.
- `-t start` / `-t end`: shorthand for the origin / destination airport's
  zone.
- Default: the user's locale (from the environment); if that cannot be
  determined, the origin airport's zone.

Durations (e.g. "8h 4m") are timezone-proof and unchanged. `report.json`
records the resolved zone in `display_timezone`, with the times in
`report_time_display` / `estimated_landing_display`.

## Output format (the status report)

Every report has two parts, in this order:

1. **Announcement (words):** states the distance percentage, e.g.
   "LX009 is now 35% of the way to Zurich — about 1,599 miles covered,
   2,940 to go. Estimated to land around 5:04 AM EDT, roughly 25 minutes
   behind schedule — reported at 11:35 PM EDT." Times render in the display
   timezone (default: the user's locale), labeled to match the actual zone
   (EST/EDT, CEST, CDT, …).
2. **Composite card:** a single HTML widget (via
   `widget.create_html_file_widget` on `<flight>-card.html`,
   `fallback_text` "LX009 journey progress") — percentage dashboard fused
   with the full-width route map, theme-aware, scaling with the screen.
   The card also shows:
   - **Expected arrival** with the previous estimate in brackets when it
     changed, e.g. "Expected arrival **5:05 AM EDT** [old: 4:40 AM EDT]".
   - **Total journey time** (takeoff → arrival), e.g. "Total journey
     time 8h 4m".
   - A **tap-to-expand** route map (tapping opens the map fullscreen;
     the fullscreen view supports **pinch-to-zoom** up to 4x with
     drag-to-pan; tap closes and resets).
   - A **Source** link to the FlightAware live-track page the data came
     from.
   - A **solid flown-track overlay**: after a fresh map render, the
     flight's actual position fixes are drawn over the map as a solid
     line, because FlightAware's renderer sometimes styles the oceanic
     part of the flown track as dashed.

On landing the card is built at 100% and the announcement becomes the
landing notice ("<flight> has landed in <city> at <time>. Journey
complete: 100% of the distance covered — reported at <time>.").

## Delivering a one-shot report

1. Run the CLI (no `--repeat`).
2. Send the announcement text as your message.
3. Attach the card: `widget.create_html_file_widget` on the produced
   `<flight>-card.html`, embed token on its own line after the text.
4. Keep commands, `fa_flight_id` values and raw status codes out of the
   reply.

## Repeating (`--repeat`)

When `--repeat` is given (e.g. `--repeat=30mins`):

1. Create a tracked item for the watch first (`tracking.create`), unless
   the work belongs to an existing user goal.
2. Create one interval cron job (e.g. id `flight-status-<slug>`) owned by
   that item (`owner: goal:<slug>`). Its body must stand alone: run this
   CLI into the item's `hidden_files/`, then deliver per "Delivering a
   one-shot report", then `tracking.create_entry`.
3. The job ends the watch when the flight lands: deliver the landing
   notice + 100% card, then `tracking.set_status` completed (which retires
   the job). Also stop on confirmed cancellation/diversion.
4. Never change, cancel, or rebook anything. Never claim landing from
   percentages or estimates alone — only from an actual landing time or a
   Landed/Arrived status.

## Tests

Red/Green TDD with stdlib unittest, no network (FlightAware is mocked):

```sh
cd ~/workspace/custom-skills/flight-status && python3 -m unittest discover -s tests
```

Covers arg parsing and defaults, repeat parsing, haversine math, the
distance split, timezone resolution and formatting (`-t`, `start`/`end`
shorthands), status-pill tones, time-remaining and position labels, card
HTML content, the announcement wording, map-render fallback, and an
end-to-end mocked run.
