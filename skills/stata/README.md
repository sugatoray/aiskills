# Stata skills

Skills for writing, reviewing, and reasoning about Stata code — turning a
plain-language description of what someone's trying to do into correct,
runnable Stata commands, with attention to the mistakes that run cleanly
but silently produce a wrong answer.

## Skills

| Skill | Purpose |
| --- | --- |
| [`stata-recipes`](stata-recipes/) | Turns a plain-language requirement into a runnable `.do` file or command sequence. Covers good-vs-bad Stata patterns, all three directions of Stata↔Python interop, and a growing library of named recipes for specific model classes (ships with ARDL). |

More skills will be added under this folder over time (e.g. panel-data
workflows, data cleaning/wrangling patterns, output/reporting) following
the same layout as `stata-recipes/`.

## Layout

Each skill's directory has:

- `SKILL.md` — the skill's runtime instructions.
- `README.md` — a minimal, human-facing pointer to the files below; not
  read at invocation time.
- `references/` — detailed content loaded on demand rather than held in
  context on every invocation (good/bad examples, interop guide, recipe
  library).
- `CHANGELOG.md` — that skill's own version history.
