# Security posture: flight-status

What this skill can touch, what it exposes, and why, for anyone auditing
it (human or automated). See `../SKILL.md` for behavior and
`MAINTAINERS.md` for upkeep — this file is neither; it documents design
decisions.

## Threat model

`flight-status` is a reporting tool: it reads flight data from the
FlightAware connector CLI, computes a distance-based journey split, and
writes a composite report card (`<flight>-card.html`), a route map PNG,
and `report.json` to a caller-chosen output directory. It never takes
arbitrary input and turns it into a shell command — the only shell it
runs is the fixed FlightAware connector CLI with a flight identifier and
date derived from the validated `--flight`/`--start-datetime` flags. It
never handles credentials, tokens, or secrets: FlightAware
authentication lives in the connector, not in this skill's code. It runs
no server and opens no listening port. Anything below this line is either
"what stops it from touching things it shouldn't" or "where its network
egress goes."

## File-system scope

- **Reads:** its own directory (the CLI script); everything else it
  consumes arrives via the FlightAware connector CLI's stdout.
- **Writes:** `<flight>-card.html`, `<flight>-map.png` (and its temp
  sibling `<flight>-map-new.png`), and `report.json` — only inside
  `--out-dir` (default: the caller's working directory). The map render
  is written to a temp file first and moved over the kept map only when
  non-empty, so a failed render can never leave a zero-byte file behind.
- **Never touches:** user code, user files outside `--out-dir`, git
  state, or anything outside the caller's chosen output directory. The
  recurring-watch workflow in `../SKILL.md` (goal workspace writes,
  scheduled jobs) is performed by the invoking agent, not by the CLI —
  the CLI itself is one-shot and stateless.

## Network exposure

The skill's only network egress is through the FlightAware connector
CLI (`/opt/hatch/bin/flightaware`):

- `flightaware canonical-flight` / `flight` / `position` — JSON flight
  facts and live position, read-only queries.
- `flightaware map` — the route map render, saved to disk.

All authentication and rate-limit handling belong to the connector; the
skill passes no secrets and stores none. No other network calls are made
— there is no tile fetching, no telemetry, no update check.

## Input handling

- `--flight` is validated as a flight identifier and passed as a single
  argv element to the connector CLI — never interpolated into a shell
  string.
- `--start-datetime` must match `"yyyy-mm-dd HH:MM:SS"` exactly; anything
  else raises `ValueError` before any subprocess runs.
- `--repeat` is parsed as a duration (`30mins`, `1h`, …) and recorded in
  `report.json`; it causes no scheduling by itself.
- Flight data reflected into the HTML card (city names, times, status
  text) comes from FlightAware's API, a third-party source. It is
  inserted as text into the card template; the template performs no
  script execution beyond the card's own inline layout CSS. Treat the
  data as informational, not authoritative for safety-of-flight
  decisions.

## Dependencies

Everything here is Python 3.9+ standard library — `argparse`, `json`,
`math`, `subprocess`, `datetime`, `base64`, `os`, `sys`. No third-party
packages, no install step, and nothing is fetched over the network except
through the FlightAware connector CLI.

## Design notes: instruction hygiene

`../SKILL.md` is read by the agent as live instructions on every
invocation. Maintainer-only procedural text (test commands, release
steps, sample regeneration) lives entirely in `MAINTAINERS.md`, which
`SKILL.md` only names, never quotes — so the runtime document the agent
acts on never mixes "do this for the user" with "do this to maintain the
skill."

## Known, accepted limitations

- FlightAware coverage gaps are real (an empty `last_position` has been
  observed in production): the CLI degrades to a text-only report rather
  than failing, which means a scheduled watch can deliver a run with no
  percentage — the card is skipped that run, not fabricated.
- The map is a cached render: on render failure the previous good map is
  kept and its age is noted on the card, so the map shown can lag the
  numbers by one or more runs.
- Position and estimates are third-party data; never use them for
  operational decisions.

## Reporting a concern

Open an issue against the repository this skill ships in
(`sugatoray/aiskills`), describing the concern and, if possible, which
file/line it applies to.
