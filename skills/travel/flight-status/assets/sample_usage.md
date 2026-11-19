# Sample usage

All examples below were run and verified. Times are US Eastern.

## Help

```sh
bin/flight-status -h
bin/flight-status --help
```

Prints the help document: what the skill does, the full flag reference,
and runnable usage examples.

## One-shot status check

```sh
bin/flight-status -f LX009
```

```
LX009 is now 40% of the way to Zurich — about 1,813 miles covered, 2,743 to go. Estimated to land around 5:04 AM EDT, roughly 25 minutes behind schedule — reported at 11:57 PM EDT.
```

Writes to the current directory:

- `lx009-card.html` — the composite report card (see
  [`sample_report.html`](sample_report.html) for the layout, rendered
  with representative values from the 12:14 AM EDT report below)
- `lx009-map.png` — the latest good route map render
- `report.json` — machine-readable summary

The card shows the percentage dashboard, miles covered/to-go, altitude,
speed, report time, **Expected arrival** with the previous estimate in
brackets when it changed, **Total journey time**, a tap-to-expand route
map, and a Source link to the FlightAware live-track page.

```json
{
  "flight": "LX009",
  "ident_icao": "SWR009",
  "status": "En Route / Delayed",
  "landed": false,
  "origin": {"iata": "ORD", "city": "Chicago"},
  "destination": {"iata": "ZRH", "city": "Zurich"},
  "journey": {"pct": 40, "covered_mi": 1813, "remaining_mi": 2743},
  "position": {"latitude": 47.1, "longitude": -49.8, "altitude_ft": 36000, "groundspeed_kt": 516},
  "estimated_landing_display": "5:04 AM EDT",
  "report_time_display": "11:57 PM EDT",
  "display_timezone": "America/Indiana/Indianapolis"
}
```

The `_display` times follow the display timezone (see below); the key
names no longer say `_eastern` because they aren't always Eastern.

## Display timezone

```sh
bin/flight-status -f LX009 -t Europe/Zurich   # explicit IANA zone
bin/flight-status -f LX009 -t start           # origin airport's zone (Chicago)
bin/flight-status -f LX009 -t end             # destination airport's zone (Zurich)
```

All clock times on the card and in the announcement render in the chosen
zone (report time, expected arrival, old estimate). Durations are
timezone-proof. Default: the user's locale, else the origin airport's
zone. `report.json` records the resolved zone in `display_timezone`.

## Sample mode

```sh
bin/flight-status -f LX009 -m
bin/flight-status --flight=LX009 --sample --out-dir=/tmp/fs-sample
```

Renders a sample report with built-in data (a real LX009 mid-flight
snapshot: 43%, 1,953/2,598 mi, ETA 5:05 AM EDT [old: 4:40 AM EDT], 8h 4m
total) — no FlightAware calls, no network. The card header reads
"LX009 · Sample report" and the announcement notes that no live data
was fetched. If a `<flight>-map.png` already exists in the output
directory it is reused for the map; otherwise the card shows the
route-map-unavailable fallback. Add `-k knob` or `-k paper-plane` to
preview the other progress-bar markers.

## Repeating checks

```sh
bin/flight-status -f LX009 -r 30mins
bin/flight-status --flight=LX009 --repeat=1h
```

The CLI still performs exactly one check per invocation; `-r` records
the cadence in `report.json` (`"repeat_secs": 1800`) so the caller —
usually an agent setting up a scheduled job — knows how often to re-run
it. See `SKILL.md` → Repeating.

## Pinned start datetime

```sh
bin/flight-status -f LX009 -s "2026-10-15 22:12:07"
bin/flight-status --flight=LX009 --start-datetime="2026-10-15 22:12:07"
```

The date portion selects the dated leg; omit `-s` to use now.

## Custom output directory

```sh
bin/flight-status -f LX009 --out-dir=/tmp/fs-sample
```

## Degraded modes

- **Map render fails**: the previous good `lx009-map.png` is kept and the
  card notes its age; a zero-byte map is never left in place.
- **Position feed empty**: the CLI exits 0 with a text-only report and
  no card — e.g. "LX009 is en route to Zurich. Estimated to land around
  4:40 AM EDT — reported at 12:04 AM EDT. (Live position unavailable
  for this check.)"
