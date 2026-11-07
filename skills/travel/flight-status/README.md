# flight-status

One-shot or repeating flight status reports: journey percentage by
distance, miles covered/to-go, live route map, and an Eastern-timestamped
announcement — delivered as a single composite report card.

Run it with `/flight-status -f LX009`.

## Layout

```
flight-status/
├── agents/
│   └── openai.yaml
├── assets/
│   ├── sample_report.html
│   ├── sample_usage.md
│   ├── sample-map.png
│   └── screenshots/
│       ├── card.png
│       └── card-wide.png
├── bin/
│   ├── flight-status
│   └── render-screenshots
├── meta/
│   ├── MAINTAINERS.md
│   └── SECURITY.md
├── tests/
│   └── test_flight_status.py
├── CHANGELOG.md
├── README.md
└── SKILL.md
```

- **Runtime instructions**: [`SKILL.md`](SKILL.md)
- **Command**: [`bin/flight-status`](bin/flight-status)
- **Sample report card**: [`assets/sample_report.html`](assets/sample_report.html)
- **Sample usage**: [`assets/sample_usage.md`](assets/sample_usage.md)
- **Development notes**: [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md)
- **Security posture**: [`meta/SECURITY.md`](meta/SECURITY.md)
- **OpenAI-agent interface**: [`agents/openai.yaml`](agents/openai.yaml)
- **Version history**: [`CHANGELOG.md`](CHANGELOG.md)

## Installing

Install with the [`skills` CLI](https://skills.sh/) (`npx skills ...`, no
separate install step). Every form below is entirely command-line.

**Pick skills interactively, global or local** — omit `--skill`/`--yes`
and the CLI prompts you to choose the agent and which skills to install:

```
npx skills add sugatoray/aiskills              # project-level
npx skills add sugatoray/aiskills --global      # user-level
```

**Just this skill, global or local:**

```
npx skills add sugatoray/aiskills --skill flight-status --global   # global
npx skills add sugatoray/aiskills --skill flight-status            # local
```

## Quick start

```sh
bin/flight-status -f LX009
bin/flight-status -f LX009 -r 30mins
bin/flight-status -f LX009 -s "2026-10-15 22:12:07"
bin/flight-status -f LX009 -m   # sample report, no network
bin/flight-status -f LX009 -t end   # times in the destination's zone
```

See [`assets/sample_usage.md`](assets/sample_usage.md) for full examples
and [`assets/sample_report.html`](assets/sample_report.html) for what the
report card looks like.

<!-- screenshots:start -->
## Screenshots

![Sample report card (480px)](assets/screenshots/card.png)
![Sample report card (900px)](assets/screenshots/card-wide.png)

_Regenerated with `bin/render-screenshots` — deterministic from the pinned sample report (`bin/flight-status -m`) and `assets/sample-map.png`._
<!-- screenshots:end -->
