# stata-recipes

Turns a plain-language description of a data/statistics task into correct, runnable Stata code — a .do file or command sequence, not pseudocode. Use this whenever the user asks how to do something in Stata, wants a Stata command or .do file written or fixed, mentions Stata alongside a modeling task (regression, panel data, time series, ARDL, fixed effects, diff-in-diff, matching, etc.), or wants Stata and Python working together (running Python from inside a .do file, pulling Stata's dataset into pandas, or driving Stata from a Python script via pystata/stata_setup or batch mode). Also trigger when the user pastes Stata code that errors or gives wrong-looking results and wants it debugged, or asks 'is this good Stata style' / 'what's wrong with this command'. Covers a growing library of named recipes for common econometric workflows (ARDL modeling shipped now; more added over time) that produce a ready-to-run script, not just an explanation.

| Property | Value |
| --- | --- |
| Group | `stata-skills` (alias `stata`) |
| Version | 1.3.2 |
| Starts | When you type `/stata-recipes`, or your agent uses it when a task fits its description |
| Needs | Stata 16+ (Stata 17+ recommended — modern `ardl` command and built-in Python integration); optionally Python 3.9+ with the `pystata`/`stata_setup` package (bundled with Stata 17+) for Stata<->Python interop |
| License | MIT |
| Source | [skills/stata/stata-recipes](https://github.com/sugatoray/aiskills/tree/master/skills/stata/stata-recipes) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s stata-recipes -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: stata-recipes
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill stata-recipes --agent claude-code --yes
```

Or the whole `stata-skills` group:

```bash
aiskills install -G stata -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s stata-recipes
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/stata-recipes/`:

- `.claude-plugin/plugin.json`
- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/claude-code.yaml`
- `agents/openai.yaml`
- `meta/MAINTAINERS.md`
- `references/good-bad-examples.md`
- `references/python-interop.md`
- `references/recipes/README.md`
- `references/recipes/models/ardl.md`
- `references/recipes/models/regression-panel.md`
- `references/recipes/models/regression-timeseries.md`
- `references/recipes/tests/test-dickey-fuller.md`
- `references/recipes/tests/test-im-pesaran-shin.md`
- `references/recipes/tests/test-unit-root.md`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/stata/stata-recipes/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/stata/stata-recipes/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
