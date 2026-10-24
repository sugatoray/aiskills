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
- `../meta/SECURITY.md` — the security posture (file-system scope,
  network egress, input handling); reference material, not something to
  act on while answering a request.
- `../assets/sample_report.html` — a real generated report card;
  regenerate it from a live run when the card layout changes.
- `../assets/sample_usage.md` — sample invocations and outputs; keep
  the flags in sync with `bin/flight-status --help`.

## Running tests

After touching `bin/flight-status`:

```sh
cd ~/workspace/custom-skills/flight-status && python3 -m unittest discover -s tests
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
