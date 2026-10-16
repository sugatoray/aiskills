# Changelog

All notable changes to the `flight-status` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This skill follows [Semantic Versioning](https://semver.org/).

## [0.9.5] - 2026-10-16

### Fixed

- `format_time_remaining` returned nonsense like "≈408h" when groundspeed
  was taxi speed (815 mi ÷ 2 kt). Groundspeeds under 100 kt now yield a
  blank instead of a misleading estimate.

  Red/Green TDD: 3 new tests (92 total, all green).

## [0.9.4] - 2026-10-16

### Fixed

- Flight-leg selection preferred a landed leg over a taxiing one:
  `_select_flight` now ranks a leg that has pushed back (`actual_out`
  set) but not yet taken off above landed legs. Previously a taxiing
  AI2702 fell through to yesterday's landed leg.
- Added DEL, CCU, HYD to `AIRPORT_TZ` (Asia/Kolkata); `-t start`/`-t end`
  for Indian airports no longer falls back to UTC.
- A (0,0) "no fix" position now maps to the origin airport instead of
  producing nonsense distances (taxiing showed 47% / 5,438 mi covered).

  Red/Green TDD: 2 new tests (89 total, all green).

## [0.9.3] - 2026-10-16

### Fixed

- "FlightAware — live track" link pointed to the hardcoded LX009 page
  (`SWR9`) for every flight: the live-flight path now passes a URL built
  from the actual flight ident via `flightaware_url(ident)`
  (e.g. `https://www.flightaware.com/live/flight/SWR146`).
  `assets/sample_report.html` regenerated from the current template.

  Red/Green TDD: 2 new tests (87 total, all green).

## [0.9.2] - 2026-10-16

### Fixed

- Card header showed hardcoded "LX009 · Chicago → Zurich" for every
  flight: the live-flight path now passes
  `"{flight} · {origin_city} → {destination_city}"`, and the
  `build_card_html` default is a generic "Flight status".

  Red/Green TDD: 2 new tests plus 1 updated (85 total, all green).

## [0.9.1] - 2026-10-16

### Fixed

- Flight selection when FlightAware returns multiple legs for one flight
  number on a date: `parse_flight_facts` now prefers the airborne leg
  (taken off, not landed), then the most recently landed, instead of
  blindly taking the first entry. Previously LX146 reported "Scheduled"
  while the real flight was en route.

  Red/Green TDD: 2 new tests (83 total, all green).

## [0.9.0] - 2026-10-16

### Added

- `bin/render-screenshots`: regenerates the README screenshots deterministically
  from the pinned sample report (`bin/flight-status -m`) and the pinned
  `assets/sample-map.png` — no network, no browser. Renders
  `assets/screenshots/card.png` (480px) and `card-wide.png` (900px) with PIL
  and updates README.md's screenshot section. Re-running produces
  byte-identical output, so the step stays feasible for auto-generation.
- README now embeds the example card screenshots.

  Red/Green TDD: 6 new tests (81 total, all green).

## [0.8.0] - 2026-10-16

### Added

- Solid-track overlay: after a fresh route-map render, the flight's actual
  position fixes are drawn over the map as a solid line (pure-stdlib PNG
  codec, no Pillow). FlightAware's static renderer sometimes styles the
  oceanic part of the flown track as dashed — the overlay guarantees the
  elapsed path is solid. Fixes are truncated at the current position so the
  line never extends past the plane marker; track gaps are bridged with a
  straight segment. Best-effort: any failure keeps the original map.
- Pinch-to-zoom on the expanded route map: the fullscreen map view now
  supports two-finger pinch zoom (up to 4x) and drag-to-pan via touch
  handlers; tap still closes and resets the zoom.

  Red/Green TDD: 12 new tests (75 total, all green).

## [0.7.0] - 2026-10-16

### Added

- `-t`/`--tz`/`--timezone`: renders all displayed clock times in the
  chosen zone — an IANA name (e.g. `-t Europe/Zurich`), or the `start` /
  `end` shorthands for the origin / destination airport's zone (backed by
  an airport→IANA table). Default: the user's locale (`TZ` env, else the
  machine zone), falling back to the origin airport's zone. `report.json`
  records the resolved zone as `display_timezone`; the time fields are now
  `report_time_display` / `estimated_landing_display` (renamed from
  `*_eastern`, since they follow the display zone).
- Corner status block: the card's top-right corner now shows a color-coded
  status pill ("En Route · Delayed" amber, "Landed" green, "Cancelled" red)
  over the estimated time remaining ("≈5h to go", from remaining miles ÷
  groundspeed; hidden when unknown or zero).
- Position in the details line: "47.5°N, 48.4°W" joins altitude and
  groundspeed before the report timestamp.

  Red/Green TDD: 19 new tests (63 total, all green).

### Packaging

- Added `skill.yaml` (name, title, description, category, prompt inclusion)
  so the skill is registered in Muse's skill catalog under "Travel and
  local plans".

## [0.6.0] - 2026-10-16

### Added

- `-h`/`--help` now shows a full help document: skill description, the
  complete flag reference, and runnable usage examples. 1 new test
  (44 total, all green).

## [0.5.0] - 2026-10-16

### Added

- `-k`/`--flight-marker` flag: chooses the marker riding the progress
  bar — `airliner` (default, classic silhouette pointing east), `knob`
  (the original circle), or `paper-plane`. Invalid values are rejected
  by the argument parser. Implemented as `_marker_html` + a `marker`
  parameter through `_progress_bar_html` and `build_card_html`; 4 new
  tests (43 total, all green).

## [0.4.0] - 2026-10-16

### Changed

- The card's progress bar is now the striped-remainder + milestone
  design: the covered portion stays solid, the not-yet-covered portion
  shows a diagonal stripe pattern, quarter ticks (25/50/75%) sit on the
  bar, and a knob marks the current position. Extracted as the
  `_progress_bar_html` helper; 1 new test (39 total, all green).

## [0.3.0] - 2026-10-16

### Added

- `-m`/`--sample` flag: renders a sample report with built-in data (a
  real LX009 mid-flight snapshot) — no FlightAware calls, no network.
  Writes `<flight>-card.html` and `report.json` (`"sample": true`) to
  `--out-dir`, reusing the kept route map when one is already there.
  The card header is labeled `<flight> · Sample report` and the
  announcement notes that no live data was fetched.
- `build_card_html` now takes a `header` parameter (default
  `LX009 · Chicago → Zurich`), so the card title is no longer hardcoded
  for every flight.

## [0.2.0] - 2026-10-16

### Added

- Card now shows **Expected arrival** with the previous estimate in
  brackets when it changed (`<Latest> [old: <Old>]`), the **total
  journey time** (takeoff → arrival, e.g. `8h 4m`), a **tap-to-expand**
  route map (fullscreen lightbox on tap), and a **Source** link to the
  FlightAware live-track page. `main()` computes the arrival/journey
  fields from FlightAware facts (`actual_takeoff_at`,
  `actual_landing_at`/`estimated_landing_at`).
- `format_duration_hm` helper and 5 new tests (33 total, all green).

## [0.1.0] - 2026-10-16

Initial release.

### Added

- `bin/flight-status` CLI (stdlib-only Python, no dependencies) with the
  `/flight-status` signature: `-f`/`--flight` (required),
  `-r`/`--repeat` (e.g. `30mins`, `1h`; default none),
  `-s`/`--start-datetime` (`"yyyy-mm-dd HH:MM:SS"`; default now).
- Journey progress computed **by distance** (haversine, statute miles)
  between origin, live position, and destination — never FlightAware's
  `progress_percent`.
- Composite report card (`<flight>-card.html`): big percentage, progress
  bar, miles covered/to-go, altitude, groundspeed, and the route map
  fused full-width into one theme-aware card.
- Announcement text stating the percentage in words, stamped with the
  report time in US Eastern (EST/EDT label matched to the actual offset).
- `report.json` machine-readable summary per run.
- Landing detection (actual landing time or Landed/Arrived status) with a
  100% completion card and landing notice.
- Graceful degradation: failed map renders keep the previous good map
  (never a zero-byte file); an empty position feed yields a text-only
  report instead of a crash.
- `SKILL.md` with the agent workflow for one-shot delivery and
  `--repeat`-driven scheduled watches (tracking item + interval cron,
  watch closes on landing).
- Red/Green TDD suite: 28 stdlib-`unittest` tests, FlightAware mocked,
  no network.
- `README.md`, `meta/MAINTAINERS.md`, `meta/SECURITY.md`,
  `agents/openai.yaml`, `assets/sample_report.html`,
  `assets/sample_usage.md`, front matter aligned with the `scrolls-*`
  skills (`license`, `compatibility`, `disable-model-invocation`,
  `metadata` with semver `version` and `source_url`).
