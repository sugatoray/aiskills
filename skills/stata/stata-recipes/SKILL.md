---
name: stata-recipes
description: "Turns a plain-language description of a data/statistics task into correct, runnable Stata code — a .do file or command sequence, not pseudocode. Use this whenever the user asks how to do something in Stata, wants a Stata command or .do file written or fixed, mentions Stata alongside a modeling task (regression, panel data, time series, ARDL, fixed effects, diff-in-diff, matching, etc.), or wants Stata and Python working together (running Python from inside a .do file, pulling Stata's dataset into pandas, or driving Stata from a Python script via pystata/stata_setup or batch mode). Also trigger when the user pastes Stata code that errors or gives wrong-looking results and wants it debugged, or asks 'is this good Stata style' / 'what's wrong with this command'. Covers a growing library of named recipes for common econometric workflows (ARDL modeling shipped now; more added over time) that produce a ready-to-run script, not just an explanation."
license: MIT
compatibility: "Stata 16+ (Stata 17+ recommended — modern `ardl` command and built-in Python integration); optionally Python 3.9+ with the `pystata`/`stata_setup` package (bundled with Stata 17+) for Stata<->Python interop"
metadata:
  - name: stata-recipes
    type: skill
    author: sugatoray
    version: "1.0.0"
    source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/stata/stata-recipes"
---

# Stata command & recipe writer

This skill turns "here's what I'm trying to do" into working Stata code —
a full `.do` file when the task has multiple steps, or a short command
sequence when it doesn't. The output is always something the user can
paste into Stata and run, not a description of what they'd need to write.

Stata rewards precision more than most languages: a command that runs
without error can still silently produce the wrong answer (unset panel
structure, a `merge` nobody checked, `gen` where `egen` was needed for
missing values). So this skill's job isn't just "make it run" — it's
"make it run *and* be right," and to say why when a plausible-looking
alternative would have been wrong.

## Workflow

1. **Understand the data shape before writing anything.** Ask (or infer
   from what the user already said) whether the data is cross-sectional,
   panel, or time series; roughly how many observations/variables; and
   whether it's already loaded, a file path, or hypothetical. A regression
   recipe for panel data and one for a single time series look nothing
   alike even when the plain-language ask ("does X affect Y") is the same.
   Don't stall on this if the user already gave enough to proceed — infer
   sensible defaults and say what you assumed, rather than interrogating
   them over something you can reasonably guess.

2. **Check whether a matching recipe already exists** in
   `references/recipes/` (see the table below) before improvising from
   scratch. A recipe encodes decisions — lag selection method, which
   diagnostics matter, which postestimation commands actually work after
   that estimator — that are easy to get subtly wrong by generalizing from
   a different command's usual pattern.

3. **Write the code**, structured as a proper `.do` file even for a short
   answer: `clear all` / `set more off` at the top when starting fresh,
   `tsset`/`xtset` before any time-series or panel operation that needs
   it, comments only where the *why* isn't obvious from the command itself
   (see `references/good-bad-examples.md` for the difference between a
   useful comment and noise). Prefer the modern, currently-documented form
   of a command over an older syntax that still happens to run — flag it
   explicitly if you're aware the user's snippet uses a deprecated form.

4. **Sanity-check the code against `references/good-bad-examples.md`**
   before handing it back: does it check `_merge` after a `merge`, `tsset`
   before lags/regressions on time series, use `egen` (not `gen`) for
   row-wise stats that might hit missing values, and avoid overwriting
   data without the user clearly wanting that? These are the mistakes
   that produce code which runs cleanly and gives a wrong answer — the
   most expensive kind of Stata bug because nothing flags it.

5. **If Python is in the picture**, read
   `references/python-interop.md` and pick the right direction of travel
   — calling Python *from* a `.do` file, pulling Stata's active dataset
   *into* a Python session via `sfi`, or driving Stata *from* a Python
   script — rather than defaulting to the roundabout "write a CSV, read
   the CSV" pattern, which loses value labels/formats and adds a disk
   round-trip that direct interop skips.

6. **Explain the choices, briefly**, next to the code — why this lag
   selection method, why `ec` form, why this diagnostic — not as a
   separate essay. A short comment or one sentence per non-obvious choice
   beats a wall of prose the user has to cross-reference against the code.

## Reference files

Load these on demand rather than holding all of it in context at once:

| File | Read it when |
| --- | --- |
| [`references/good-bad-examples.md`](references/good-bad-examples.md) | Writing or reviewing any Stata code — the common footguns (merge checks, panel/time-series setup, `gen` vs `egen`, deprecated syntax, unsafe overwrites, output tables) with a bad/good pair and *why* for each. |
| [`references/python-interop.md`](references/python-interop.md) | The task involves Python and Stata together, in either direction. |
| [`references/recipes/README.md`](references/recipes/README.md) | Writing a *new* recipe, or checking what a recipe file is expected to contain. |
| [`references/recipes/ardl.md`](references/recipes/ardl.md) | The task is ARDL / bounds-testing / long-run-short-run time-series modeling, or is close enough to it to use as a structural template. |

## Recipe library

Each recipe is a self-contained file in `references/recipes/` following the
template in `references/recipes/README.md`: when to reach for this
approach, the data shape it assumes, a full worked script against a real
(not invented) dataset, the diagnostics that matter for that estimator
specifically, and common mistakes particular to it. New recipes get added
there over time without touching this file.

| Recipe | Covers |
| --- | --- |
| [`ardl`](references/recipes/ardl.md) | Autoregressive Distributed Lag modeling: lag-order selection, the `ec` error-correction form, the Pesaran/Shin/Smith bounds test for a long-run relationship, and the postestimation gotcha where `ardl`'s own results don't carry the full `regress` postestimation menu. |

If the user's task doesn't match an existing recipe, write the code
directly from Stata/econometric first principles and the guidance above —
don't force-fit a recipe that doesn't actually apply. If it's a workflow
likely to recur (the kind of thing worth a named recipe), mention that to
the user as a possible addition rather than silently improvising every
time.

## What this skill doesn't do

It doesn't run Stata itself — there's no Stata installation in this
environment to execute code against, so treat every script as reviewed-
for-correctness-by-reading, not executed-and-verified. Say so if the user
seems to assume the code was actually run. It also doesn't fetch or
fabricate the user's real data; recipes are demonstrated against Stata's
own bundled example datasets (via `webuse`/`sysuse`) so the script is
genuinely runnable as shown, with a clear note on which lines to swap for
the user's actual `use "yourfile.dta", clear`.
