# Recipe: ARDL (Autoregressive Distributed Lag) modeling

## When to use this

The user wants to estimate a relationship between a time series and one
or more predictors where the *dynamics* matter — how many lags of each
variable belong in the model — and possibly whether there's a **long-run
equilibrium relationship** between variables that aren't all stationary
at the same order of integration. Typical asks this maps to: "is there a
long-run relationship between X and Y", "how many lags should I include",
"bounds test for cointegration", "short-run vs long-run effect of X on
Y".

**Not this when:**
- The series are a *system* with no natural single dependent variable and
  you want to study dynamic interactions among several jointly-endogenous
  variables — that's a **VAR**, not ARDL.
- You already know (or have tested) that all variables are I(1) and
  cointegrated, and just want the cointegrating vector — a plain
  **Engle-Granger** or **Johansen (`vecrank`/`vec`)** approach may be more
  standard in the user's field, though ARDL with `ec` covers similar
  ground and has the advantage of not requiring every variable to be the
  same order of integration.
- Any variable is **I(2)** (stationary only after differencing twice).
  ARDL's bounds-testing approach (Pesaran, Shin & Smith 2001) is derived
  under the assumption that regressors are I(0) or I(1) — it is not valid
  with I(2) variables, and the bounds test will not tell you this on its
  own. Test for this in step 1 below, don't skip it.

## Data shape this assumes

A single time series (or one panel unit) with a `tsset` time variable
already in place — ARDL as covered here is not the panel-ARDL variant.
Before touching `ardl` itself:

1. The data must be `tsset` on a proper time variable (see
   `../good-bad-examples.md` #2 for why this matters generally — for ARDL
   specifically, `ardl` will refuse to run at all without it).
2. Check the order of integration of every variable going in
   (`dfuller`, ideally with a trend/lag specification matched to the
   series' actual behavior) — confirm none of them are I(2).

## Worked script

Uses `webuse investment2`, the dataset Stata's own `[TS] ardl`
documentation demonstrates with (aggregate investment `invest` and `gnp`,
annual time series). Variable names in webuse-shipped datasets can shift
slightly between Stata releases — run `describe` right after `webuse` and
adjust the variable names below if yours differ before relying on the
rest of the script.

```stata
* ardl_recipe.do
clear all
set more off

webuse investment2, clear
describe
tsset time

* --- Step 1: stationarity check before anything else ---
* Confirm neither series is I(2). dfuller's null is "has a unit root";
* a series needs differencing until you fail to reject before you know
* its order of integration.
tsline invest gnp
dfuller invest, trend lags(4)
dfuller gnp, trend lags(4)
* If either rejects only after a *second* difference, stop here — ARDL's
* bounds test is not valid with an I(2) regressor. Proceeding below
* assumes both are I(0) or I(1), which is what this dataset's series are.

* --- Step 2: let AIC pick the lag order instead of guessing ---
* maxlags(4 4) caps the search at 4 lags each for invest and gnp;
* `aic` (as opposed to `bic`/`hqic`) picks the specification that
* minimizes the Akaike Information Criterion over that search space.
* See "Common mistakes" below for why an arbitrary fixed lag choice
* (e.g. "just use lag 1 for everything") is the wrong default here.
ardl invest gnp, maxlags(4 4) aic ec regstore(ardl_base)

* --- Step 3: bounds test for a long-run relationship ---
* Pesaran/Shin/Smith (2001) bounds test. Compare the reported F-statistic
* (and t-statistic on the error-correction term) against the I(0)/I(1)
* critical value bounds Stata prints: above the upper bound rejects "no
* long-run relationship" regardless of whether the regressors are I(0)
* or I(1); below the lower bound fails to reject; in between is
* inconclusive without further information about each series' actual
* order of integration.
estat ectest

* --- Step 4: read the long-run and short-run coefficients ---
* `ec` in step 2 reports the model in error-correction form directly:
* the ADJ (adjustment) block is the speed of adjustment back to
* equilibrium; the LR (long-run) block is the long-run coefficients;
* the SR (short-run) block is the short-run dynamics. No extra command
* needed — this is why `ec` was requested at estimation time rather
* than derived by hand afterward.

* --- Step 5: diagnostics ---
* ardl's own e() results don't carry the full `regress` postestimation
* menu directly (see "Common mistakes" below) — restore the regstore'd
* underlying regression first.
estimates restore ardl_base
estat bgodfrey, lags(1/4)   // serial correlation in the residuals
estat archlm, lags(1/4)     // ARCH effects (residual heteroskedasticity over time)
predict resid_ardl, residuals
tsline resid_ardl           // eyeball for obvious structural breaks/outliers

* --- Step 6: export the results table ---
estimates restore ardl_base
esttab ardl_base using "ardl_results.rtf", replace label ///
    b(%9.3f) se(%9.3f) star(* 0.10 ** 0.05 *** 0.01) ///
    title("ARDL: investment on GNP")
```

**To point this at real data instead of the demo dataset:** replace the
`webuse investment2, clear` line with `use "yourfile.dta", clear`,
replace `invest`/`gnp` throughout with the actual dependent/independent
variable names, and re-run step 1's stationarity check on the real
series before trusting the rest — the lag-selection and bounds-test steps
downstream depend on that check having actually been done on the data in
front of you, not assumed from the demo.

## Common mistakes

- **Picking a lag order by habit ("just use lag 1") instead of a
  criterion.** The whole value of `ardl`'s `maxlags()`/`aic`/`bic` option
  is that it searches the specification space instead of you guessing —
  an under-specified lag order leaves residual autocorrelation (which
  step 5's `estat bgodfrey` would have caught) and biases the estimated
  dynamics.
- **Running `estat hettest`/`estat bgodfrey`/other `regress`
  postestimation directly after `ardl` without `regstore()` +
  `estimates restore` first.** `ardl`'s own stored results don't expose
  the full `regress`-style postestimation menu; the `regstore(name)`
  option at estimation time is what makes `estimates restore name`
  possible afterward. Forgetting `regstore()` at estimation time means
  re-running the whole model just to get diagnostics — cheap to include
  up front, annoying to have skipped.
- **Interpreting a bounds test result that falls in the inconclusive
  region as either a clear "yes" or "no."** Between the lower and upper
  bound, the test genuinely doesn't resolve the question — say so plainly
  to the user rather than picking whichever answer the surrounding
  discussion seems to want.
- **Skipping the I(2) check because the bounds test "ran fine."** The
  test executes and prints numbers regardless of whether its I(0)/I(1)
  assumption actually holds — a clean-looking `estat ectest` output is
  not evidence that the assumption was satisfied. That's why step 1 has
  to happen first, not as an afterthought if results look odd.
- **Using `ec`'s reported long-run coefficients without checking the
  bounds test supports a long-run relationship in the first place.** The
  `LR` block in `ec` output is always printed once the model is
  estimated with the `ec` option, whether or not the bounds test actually
  supports interpreting it as a genuine equilibrium relationship — read
  step 3's result before leaning on step 4's numbers.
