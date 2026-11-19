# Maintaining flight-status

For people developing this skill — not read as part of answering a
`/flight-status` request (that's `../SKILL.md`). For the security rationale
behind how this skill is built, see `SECURITY.md`.

## Layout

- `../SKILL.md` — the only file read at invocation time.
- `../README.md` — minimal, human-facing pointer to the files below;
  not read at invocation time.
- `../CHANGELOG.md` — this skill's version history; update it alongside
  `metadata.version` in `SKILL.md`.
- `../bin/flight-status` — the CLI (stdlib-only Python). Keep it
  dependency-free so it runs anywhere with Python 3.9+.
- `../tests/test_flight_status.py` — Red/Green regression suite
  (stdlib `unittest`, FlightAware mocked, no network).
- `../agents/openai.yaml` — OpenAI-agent interface metadata.
- `../skill.yaml` — Meta's Muse skill-catalog entry (the skill was first
  built in Muse). Nothing else reads it.
- `../meta/SECURITY.md` — the security posture (file-system scope,
  network egress, input handling); reference material, not something to
  act on while answering a request.
- `../assets/sample_report.html` — a real generated report card;
  regenerate it from a live run when the card layout changes.
- `../assets/sample_usage.md` — sample invocations and outputs; keep
  the flags in sync with `bin/flight-status --help`.

## Portability

The skill was first built in Meta's Muse. It keeps working there, but must
not depend on it:

- **No sandbox paths.** Commands run from the skill's folder; the
  FlightAware CLI is `$FLIGHTAWARE_CLI`, else `flightaware` on `PATH`.
- **Card colors.** Styles use the card's own `--fs-*` tokens, defined in
  one `<style>` block (`CARD_PALETTE_LIGHT` / `CARD_PALETTE_DARK`). Each
  token takes Muse's `--hatch-widget-*` variable when the host sets it,
  else the built-in color. Never write a bare `var(--hatch-widget-*)`; a
  test fails on one.
- **Host tools.** `SKILL.md` describes delivery and repeating in general
  terms, then gives the Muse tool names as one example.

### The FlightAware CLI contract

`bin/flight-status` needs a `flightaware` command (Muse's FlightAware
connector provides one) that prints JSON for:

| Call | Used for |
|---|---|
| `flightaware canonical-flight <flight>` | the ident to query |
| `flightaware flight <ident> --date <yyyy-mm-dd>` | the dated legs |
| `flightaware position <fa_flight_id>` | the live position |
| `flightaware track <fa_flight_id> --compact` | the flown-track fixes |
| `flightaware airport <iata>` | coordinates of airports not built in |

and `flightaware map <fa_flight_id> --save <file>`, which saves the route
map PNG. The `canonical-flight`, `flight` and `position` JSON shapes are the
fixtures at the top of `tests/test_flight_status.py`; `fetch_track` and
`airport_coords` show what they read from `track` and `airport`.
Outside Muse, a wrapper over FlightAware's AeroAPI that answers the same
calls works; point `FLIGHTAWARE_CLI` at it. Only `-m` runs without one.

## Running tests

After touching `bin/flight-status`:

```sh
python3 -m unittest discover -s tests   # from the skill's folder
```

Covers: arg parsing and defaults, short flags, repeat parsing,
haversine math, the distance split, Eastern EST/EDT labeling,
FlightAware JSON parsing, card HTML content, announcement wording,
map-render fallback, missing-position fallback, and an end-to-end
mocked run.

## Frontmatter validation

Run `yamllint --strict` against `../SKILL.md`'s frontmatter every time
this skill is updated — it catches unquoted URLs, trailing whitespace,
and other formatting slips before they land. Extract the block between
the two `---` markers and lint it (`line-length`/`document-start`
disabled since prose descriptions and bare `SKILL.md` frontmatter both
fail those on purpose):

```bash
awk '/^---$/{c++; if(c==2){exit}} c==1' ../SKILL.md | \
  yamllint --strict -d "{extends: default, rules: {line-length: disable, document-start: disable}}" -
```

## Regenerating the sample report

`assets/sample_report.html` is produced by a real run:

```sh
bin/flight-status -f LX009 --out-dir /tmp/fs-sample
cp /tmp/fs-sample/lx009-card.html assets/sample_report.html
```

Regenerate it whenever the card layout in `build_card_html` changes, so
the asset never drifts from what the CLI actually emits.

## Versioning

This skill follows [Semantic Versioning](https://semver.org/). Bump
`metadata.version` in `../SKILL.md`'s frontmatter and add a
`CHANGELOG.md` entry (Keep a Changelog format) in the same commit:

- **Patch** (`0.1.x`): bug fixes, doc/test-only changes.
- **Minor** (`0.x.0`): new flags, new behavior, new output fields —
  anything visible to a `/flight-status` invocation.
- **Major** (`x.0.0`): breaking changes to flags, output files, or the
  report format.
