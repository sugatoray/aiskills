# stata-recipes

Turns a plain-language description of a data/statistics task into
correct, runnable Stata code — a `.do` file or command sequence, not
pseudocode — and flags the common Stata footguns that run cleanly but
give a wrong answer along the way.

See [`SKILL.md`](SKILL.md) for the skill's runtime instructions. This
file is a human-facing pointer, not read at invocation time.

## What's here

- [`SKILL.md`](SKILL.md) — the workflow: understand the data shape, check
  for a matching recipe, write the code, sanity-check it, handle Python
  interop if relevant, explain the choices.
- [`references/good-bad-examples.md`](references/good-bad-examples.md) —
  bad/good pairs for the mistakes that run without error but produce
  wrong results (merge checks, `tsset`/`xtset` before time-series ops,
  `gen` vs `egen`, deprecated syntax, unsafe overwrites, hardcoded
  variable lists, manually-transcribed results, silent type mismatches).
- [`references/python-interop.md`](references/python-interop.md) — the
  three directions of Stata↔Python interop: calling Python from inside a
  `.do` file (`python:`/`sfi`), reading/writing Stata's active dataset
  from Python, and driving Stata from a Python script (`pystata`/
  `stata_setup` for in-process work, batch mode for pipelines/CI).
- [`references/recipes/`](references/recipes/) — named, reusable
  workflows, split into `models/` (a model class to estimate) and
  `tests/` (a diagnostic/statistical test):
  [`models/ardl.md`](references/recipes/models/ardl.md) (lag selection,
  bounds test, long-run/short-run form, diagnostics),
  [`models/regression-timeseries.md`](references/recipes/models/regression-timeseries.md)
  (single-series regression, Newey-West SEs, spurious-regression
  avoidance),
  [`models/regression-panel.md`](references/recipes/models/regression-panel.md)
  (fixed vs. random effects, Hausman test, clustered SEs),
  [`tests/test-dickey-fuller.md`](references/recipes/tests/test-dickey-fuller.md)
  (`dfuller` mechanics: specification and lag choice),
  [`tests/test-unit-root.md`](references/recipes/tests/test-unit-root.md)
  (choosing among ADF/PP/DF-GLS/KPSS and reading them together), and
  [`tests/test-im-pesaran-shin.md`](references/recipes/tests/test-im-pesaran-shin.md)
  (panel unit-root testing via `xtunitroot ips`).
  [`recipes/README.md`](references/recipes/README.md) is the template
  for adding more, including the `models/`/`tests/` naming pattern.
- [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md) — development notes:
  layout and versioning. Not read at invocation time.
- [`CHANGELOG.md`](CHANGELOG.md) — this skill's version history.

## Adding a recipe

New recipes are meant to be dropped in over time without editing
`SKILL.md`'s workflow section — just a new file in
`references/recipes/models/` or `references/recipes/tests/` (see
`references/recipes/README.md` for which one and the naming pattern),
plus one row added to the recipe table in `SKILL.md`.
