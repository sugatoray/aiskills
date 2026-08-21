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
  workflows for specific model classes. Ships with
  [`ardl.md`](references/recipes/ardl.md) (Autoregressive Distributed Lag
  modeling: lag selection, bounds test, long-run/short-run form,
  diagnostics). [`recipes/README.md`](references/recipes/README.md) is
  the template for adding more.

## Adding a recipe

New recipes are meant to be dropped in over time without editing
`SKILL.md`'s workflow section — just a new file in `references/recipes/`
following the template in `references/recipes/README.md`, plus one row
added to the recipe table in `SKILL.md`.
