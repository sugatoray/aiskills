# newsletter-ai

Generates the weekly executive AI intelligence newsletter: researches the last 7 days of AI developments (with 30-90 day context where needed) and writes them up as a 15-part executive brief — the Top 20 developments, model intelligence, open-vs-closed, talent, funding/M&A, production deployment, agents, chips/compute, data centers/energy, the global AI race, a company watchlist, key numbers, under-the-radar signals, what changed this week, and a closing synthesis. Defaults to markdown chat output; pass -o/--output yaml (or --yaml) to instead produce a sourced YAML document, and add -r/--report path/to/folder-or-report.html to render it straight into an interactive, light/dark, multi-tab HTML report (with per-tab References accordions, its source YAML fused in for single-file distribution, and a Download-data button) written next to a copy of the YAML. Use when the user runs /newsletter-ai (aliased as the shorthand /nltr-ai — treat both identically), or asks to draft, write, or update this week's AI newsletter/intelligence brief.

| Property | Value |
| --- | --- |
| Group | None: install it with `-s` or `-G all` |
| Version | 1.5.3 |
| Starts | When you type `/newsletter-ai`, or your agent uses it when a task fits its description |
| Also answers to | `/nltr-ai` (described in the skill; not a separate skill) |
| License | MIT |
| Source | [skills/newsletters/newsletter-ai](https://github.com/sugatoray/aiskills/tree/master/skills/newsletters/newsletter-ai) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s newsletter-ai -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: newsletter-ai
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill newsletter-ai --agent claude-code --yes
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s newsletter-ai
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/newsletter-ai/`:

- `.gitignore`
- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `assets/PROMPT.md`
- `assets/images/report-citations-dark.png`
- `assets/images/report-overview-light.png`
- `assets/templates/icons.svg`
- `assets/templates/report.html`
- `assets/templates/sample-report.yaml`
- `builder/build_report.py`
- `builder/capture_screenshots.py`
- `builder/fuse.py`
- `builder/paths.py`
- `builder/report_data.py`
- `builder/requirements.txt`
- `builder/screenshots.cjs`
- `meta/FEATURES.md`
- `meta/MAINTAINERS.md`
- `meta/MARKDOWN_FORMATTING.md`
- `pyproject.toml`
- `tests/browser/check_download.cjs`
- `tests/conftest.py`
- `tests/fixtures/sample.yaml`
- `tests/test_browser_download.py`
- `tests/test_build_report.py`
- `tests/test_capture_screenshots.py`
- `tests/test_cli.py`
- `tests/test_example_data.py`
- `tests/test_fuse.py`
- `tests/test_packaging.py`
- `tests/test_paths.py`
- `tests/test_report_data.py`
- `uv.lock`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/newsletters/newsletter-ai/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/newsletters/newsletter-ai/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
