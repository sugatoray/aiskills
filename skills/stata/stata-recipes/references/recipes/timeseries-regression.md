# Recipe: single-equation time-series regression

## When to use this

The user wants to estimate a plain regression — one dependent variable on
one or more predictors — where the data happen to be a time series, and
they want the standard errors and diagnostics to actually account for
that instead of treating it like cross-sectional data. Typical asks:
"does X predict Y over time", "regress Y on X with lags", "my residuals
look autocorrelated, how do I fix the standard errors".

**Not this when:**
- The question is really about lag *structure* and a possible long-run
  equilibrium relationship between series that may differ in order of
  integration — that's `ardl.md`, not a plain regression.
- There are multiple panel units (firms, countries, individuals) observed
  over time, not one series — that's `panel-regression.md`.
- Any series involved might be non-stationary and you haven't checked —
  read `unit-root-test.md` / `dickey-fuller-test.md` *first*. Regressing
  one I(1) series on another unrelated I(1) series produces the classic
  "spurious regression" result: a high R² and significant coefficient
  with no real relationship behind it (Granger & Newbold, 1974). This is
  the single most common way a time-series regression misleads someone,
  and it happens with completely correct-looking `regress` syntax.

## Data shape this assumes

One time series, `tsset` on its time variable, with the stationarity of
every variable already checked (or a deliberate reason to proceed without
that, e.g. you've confirmed cointegration and are estimating an
error-correction form — at which point `ardl.md` is more likely what's
actually wanted).

## Worked script

Uses `webuse investment2` — the same dataset as `ardl.md`, so the two
recipes are directly comparable on the same data.

```stata
* timeseries_regression.do
clear all
set more off

webuse investment2, clear
tsset time

* --- Step 1: look at the series and confirm stationarity ---
* Don't skip this — see "Not this when" above. If invest or gnp turns
* out to be non-stationary, difference it (or move to ardl.md if you
* suspect a genuine long-run relationship) before trusting the
* regression below.
tsline invest gnp

* --- Step 2: specify the regression, including relevant lags ---
* Include lags of the regressor (and possibly the dependent variable)
* when the plain-language question is dynamic ("effect of gnp on
* investment, allowing for a delayed response") rather than purely
* contemporaneous.
regress invest gnp l.gnp l2.gnp

* --- Step 3: check for residual autocorrelation the right way ---
* estat dwatson (Durbin-Watson) is only valid when there is no lagged
* dependent variable among the regressors. This model has none, so it
* applies here — but if you'd added l.invest as a regressor, use
* estat bgodfrey instead (Durbin-Watson is invalid with a lagged DV).
estat dwatson
estat bgodfrey, lags(1/4)

* --- Step 4: if autocorrelation is present, re-estimate with ---
* --- Newey-West standard errors instead of patching the same model ---
* newey is a separate estimation command (not a regress option) that
* computes HAC (heteroskedasticity- and autocorrelation-consistent)
* standard errors. lag() should be at least as large as the
* autocorrelation you found in step 3.
newey invest gnp l.gnp l2.gnp, lag(4) t(time)

* --- Step 5: check for remaining heteroskedasticity ---
estat archlm, lags(1/4)
```

**To point this at real data instead of the demo dataset:** replace the
`webuse investment2, clear` line with `use "yourfile.dta", clear`, swap
`invest`/`gnp` for the real variable names, and re-run step 1's
stationarity check (via `dickey-fuller-test.md`/`unit-root-test.md`) on
the real series — this recipe assumes that check already happened, it
doesn't perform it.

## Common mistakes

- **Regressing two unrelated non-stationary series and trusting a
  significant coefficient.** The spurious-regression problem described
  above — a large R² and "significant" t-stat here are evidence of
  shared trends, not necessarily a real relationship. This is exactly
  why step 1 comes before step 2, not after.
- **Using `estat dwatson` when a lagged dependent variable is in the
  model.** The Durbin-Watson statistic is biased toward 2 (looking like
  "no autocorrelation") in that case regardless of the true residual
  structure — use `estat bgodfrey` instead, which remains valid.
- **Treating `newey`'s `lag()` as a tuning knob to try values of until
  the standard errors look the way you want.** Pick it based on the
  autocorrelation structure found in step 3 (e.g., largest lag with a
  significant Breusch-Godfrey result), not by searching for significance.
- **Omitting a time trend or seasonal dummies when the series obviously
  has one.** An omitted trend that both dependent and independent
  variables share produces the same spurious-relationship pattern as
  regressing two non-stationary series on each other, just via a
  different mechanism. For quarterly/monthly data with seasonal patterns,
  add `i.quarter`/`i.month` (built from the time variable) rather than
  leaving seasonality in the residuals.
- **Forgetting `tsset` before any `l.`/`f.`/`d.` operator** — see
  `../good-bad-examples.md` #2 for what silently goes wrong instead of
  erroring.
