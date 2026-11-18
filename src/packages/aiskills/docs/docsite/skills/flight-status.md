# flight-status

One-shot or repeating flight status reports: journey percentage by distance, miles covered/to-go, live route map, and a timestamped announcement, delivered as a composite report card. Use whenever the user runs /flight-status, asks for a flight's status, or wants recurring flight tracking with visual progress.

| Property | Value |
| --- | --- |
| Group | `travel-skills` (alias `travel`) |
| Version | 0.9.9 |
| Starts | When you ask for it: you type `/flight-status` (your agent doesn't start it on its own) |
| Needs | Python 3.9+ (stdlib only, no dependencies); FlightAware connector CLI (`flightaware` on PATH, or set FLIGHTAWARE_CLI) |
| License | MIT |
| Source | [skills/travel/flight-status](https://github.com/sugatoray/aiskills/tree/master/skills/travel/flight-status) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s flight-status -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: flight-status
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill flight-status --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `travel-skills` group:

```bash
aiskills install -G travel -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s flight-status
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/flight-status/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/sample_report.html`
- `assets/sample_usage.md`
- `bin/flight-status`
- `bin/render-screenshots`
- `meta/MAINTAINERS.md`
- `meta/SECURITY.md`
- `skill.yaml`
- `tests/test_flight_status.py`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/travel/flight-status/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/travel/flight-status/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
