# Recipe: panel (fixed-effects / random-effects) regression

## When to use this

The user has repeated observations on the same units over time (firms,
countries, individuals, plants — anything with an ID that recurs across
periods) and wants to estimate the effect of one or more variables on an
outcome while accounting for that structure. Typical asks: "panel
regression", "fixed effects model", "does X affect Y controlling for
firm/country effects", "should I use fixed or random effects".

**Not this when:**
- There's only one unit observed over time (no panel dimension at all) —
  that's `timeseries-regression.md`.
- The question is specifically about whether a panel *variable* has a
  unit root — that's `im-pesaran-shin-test.md`, a diagnostic check that
  might precede a panel regression on non-stationary series, not a
  substitute for one.
- The panels are so short (T = 2 or 3) that within-unit dynamics aren't
  really estimable — a difference-in-differences or first-differences
  approach is often more natural for that case than `xtreg`.

## Data shape this assumes

Panel data: a panel identifier and a time identifier, `xtset` before
anything else runs. Fixed-effects (`fe`) and random-effects (`re`) are
the two workhorse estimators covered here; the choice between them is not
a style preference — it should be justified with the Hausman test in
step 3, not just picked by habit.

## Worked script

Uses `webuse nlswork` — the National Longitudinal Survey young-women's
panel that Stata's own `[XT]` manual entries use repeatedly for `xtreg`
and related commands, so its variable names (`idcode` panel ID, `year`
time variable, `ln_wage`, `age`, `tenure`, `union`) are exactly what
you'll see across the official documentation too.

```stata
* panel_regression.do
clear all
set more off

webuse nlswork, clear
xtset idcode year

* --- Step 1: look at the panel structure before modeling ---
* Balanced vs. unbalanced, typical T per panel — this affects which
* diagnostics are trustworthy and how much a Hausman test result should
* be trusted (very unbalanced panels can make it unreliable).
xtdescribe
xtsum ln_wage age tenure union

* --- Step 2: estimate both fixed effects and random effects ---
* fe sweeps out anything constant within a panel (observed or not) —
* robust to unobserved heterogeneity correlated with the regressors, but
* can't estimate the effect of any variable that doesn't vary within a
* panel (e.g. race here, which is fixed per person).
xtreg ln_wage age tenure union, fe
estimates store fe_model

* re treats the panel-level effect as a random draw uncorrelated with
* the regressors — more efficient and lets you estimate time-invariant
* variables' effects too, but only unbiased if that uncorrelated
* assumption actually holds.
xtreg ln_wage age tenure union, re
estimates store re_model

* --- Step 3: let the Hausman test decide, don't guess ---
* H0: the random-effects assumption holds (fe and re estimates should
* be similar under H0). A significant result rejects RE in favor of FE.
hausman fe_model re_model, sigmamore

* --- Step 4: use clustered standard errors regardless of fe/re choice ---
* Default xtreg standard errors assume no within-panel serial
* correlation, which is rarely true. Cluster by the panel variable so
* inference is valid even though the point estimates above didn't
* change.
xtreg ln_wage age tenure union, fe vce(cluster idcode)
```

**To point this at real data instead of the demo dataset:** replace
`webuse nlswork, clear` with `use "yourfile.dta", clear`, `xtset` on the
real panel/time identifiers, and swap in the real outcome/regressors.
Re-run step 1 on the real panel structure — the balance/typical-T picture
changes what's reasonable to trust from the Hausman test and from any
short-panel-specific diagnostic.

## Common mistakes

- **Running pooled OLS (`regress`) on panel data without `xtreg`.**
  Ignores the panel structure entirely — any unit-level unobserved factor
  correlated with the regressors biases the coefficients, and the
  default standard errors overstate precision by treating repeated
  observations on the same unit as independent.
- **Picking FE or RE by habit ("everyone in my field uses FE") instead of
  running the Hausman test.** RE is more efficient when its assumption
  holds — defaulting to FE always throws that efficiency away even when
  unjustified; defaulting to RE always risks the bias FE was built to
  avoid. Step 3 exists so this is a checked decision, not a convention.
- **Not clustering standard errors by panel.** `xtreg`'s default SEs
  assume the idiosyncratic error is uncorrelated across time within the
  same panel unit — usually false in real panels (this year's shock and
  next year's shock for the same firm are rarely independent). Cluster
  by the panel identifier (step 4) essentially by default, not only when
  a diagnostic flags a problem.
- **Trying to estimate the effect of a time-invariant variable with `fe`
  and finding it dropped.** That's not a bug — fixed effects sweep out
  anything constant within a panel by construction, including any
  variable (like `race` in this dataset) that never changes for a given
  unit. If that variable's effect is the actual question, `re` (or a
  Mundlak/correlated-random-effects approach) is the tool, not `fe`.
- **Forgetting `xtset` before `xtreg`.** This one errors immediately
  rather than silently misbehaving, but it's worth confirming the panel
  and time variables are the ones actually intended — `xtset` accepts
  the first two variables it's given without checking they make
  conceptual sense as panel/time identifiers.
