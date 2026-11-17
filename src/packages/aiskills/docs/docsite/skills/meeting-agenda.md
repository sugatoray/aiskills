# meeting-agenda

Turn a meeting agenda into a self-contained HTML slide deck with a countdown timer per item: one slide per item (large 01, 02… number, title, optional sub-points), a ring timer that turns amber in the last 20% and red with a +M:SS count-up past zero, a footer with clickable progress dots and a per-item meeting progress bar, and a built-in editor (gear button) that saves to localStorage or downloads an updated copy. Use when the user invokes /meeting-agenda, or asks for agenda slides, a timed agenda, a meeting timer deck, or to present an agenda with timeboxes. Accepts pasted agenda text, notes, a document, or agenda JSON. Delivers one offline HTML file that needs no dependencies.

| Property | Value |
| --- | --- |
| Group | `productivity-skills` (alias `productivity`) |
| Version | 1.0.0 |
| Starts | When you ask for it: you type `/meeting-agenda` (your agent doesn't start it on its own) |
| Needs | Python 3.9+ (stdlib only) to build the deck; any modern browser to present it; optional pytest + Playwright to run the bundled test suite |
| License | MIT |
| Source | [skills/productivity/meeting-agenda](https://github.com/sugatoray/aiskills/tree/master/skills/productivity/meeting-agenda) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s meeting-agenda -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: meeting-agenda
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill meeting-agenda --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `productivity-skills` group:

```bash
aiskills install -G productivity -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s meeting-agenda
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/meeting-agenda/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/meeting-agenda.html`
- `meta/MAINTAINERS.md`
- `meta/SECURITY.md`
- `pytest.ini`
- `scripts/build_deck.py`
- `tests/conftest.py`
- `tests/test_alignment.py`
- `tests/test_build_deck.py`
- `tests/test_deck_title.py`
- `tests/test_editor.py`
- `tests/test_footer.py`
- `tests/test_layout.py`
- `tests/test_navigation.py`
- `tests/test_screenshots.py`
- `tests/test_settings.py`
- `tests/test_settings_views.py`
- `tests/test_slides.py`
- `tests/test_studio_themes.py`
- `tests/test_theme.py`
- `tests/test_timers.py`
- `tests/test_touch.py`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/productivity/meeting-agenda/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/productivity/meeting-agenda/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
