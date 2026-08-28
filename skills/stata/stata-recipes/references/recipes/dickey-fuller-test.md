# Recipe: (Augmented) Dickey-Fuller test

## When to use this

The user wants to test whether a *single* time series has a unit root —
the specific mechanics of running and correctly specifying `dfuller` in
Stata. Typical asks: "test if this series is stationary", "run a
Dickey-Fuller test", "ADF test in Stata", "how many lags for my
unit root test".

**Not this when:**
- The question is really "which unit root test should I even use" —
  that's `unit-root-test.md`, the decision layer above this one (ADF vs.
  Phillips-Perron vs. DF-GLS vs. KPSS, and what to do about conflicting
  results). This recipe assumes ADF/`dfuller` has already been chosen and
  focuses on using it correctly.
- The variable is a panel variable (multiple units, not one series) —
  that's `im-pesaran-shin-test.md`. `dfuller` tests one series at a time;
  running it separately on every panel unit and eyeballing the results is
  a common but weaker substitute for a proper panel unit-root test.

## Data shape this assumes

One time series, `tsset`. `dfuller` needs a genuine time ordering to
compute the differenced/lagged terms its test regression is built from —
same requirement as any other `l.`/`d.` usage (see
`../good-bad-examples.md` #2).

## Worked script

```stata
* dickey_fuller_recipe.do
clear all
set more off

webuse investment2, clear
tsset time

* --- Step 1: look at the series before choosing a specification ---
* dfuller's null hypothesis (unit root) is tested against one of three
* alternative specifications, and picking the wrong one biases the test:
*   - `trend` : series has a deterministic trend under the alternative
*               (use when the series visibly trends over time)
*   - `drift` : series has a nonzero-mean random walk, no trend
*   - (neither): pure random walk with no drift, no trend — rarely the
*               right choice for real economic series; only use this
*               when the plotted series genuinely wanders with no trend
*               and no apparent drift
tsline invest
* invest visibly trends upward here, so `trend` is the right choice below.

* --- Step 2: choose the number of augmenting lags on purpose ---
* Too few lags leave autocorrelation in the test regression (invalidates
* the test's assumed distribution); too many cost power. A reasonable
* starting point (Schwert's rule of thumb) for length T:
*   maxlag = floor(12 * (T/100)^0.25)
* then trim down from there while the highest lag remains insignificant,
* or check residual autocorrelation directly with a quick regress +
* estat bgodfrey on the same specification before settling on a lag.
dfuller invest, trend lags(4) regress

* --- Step 3: read the actual output, not just "reject or not" ---
* dfuller prints the test statistic against Dickey-Fuller critical
* values (not standard normal/t critical values — this is why dfuller
* is a dedicated command rather than something read off a plain
* `regress` t-stat). More negative than the critical value at your
* chosen significance level rejects the unit-root null.

* --- Step 4: test the first difference if the level fails to reject ---
* Determines the order of integration — needed before deciding whether
* a regression involving this series risks spurious results, or whether
* an ARDL/error-correction approach (which tolerates a mix of I(0)/I(1)
* but not I(2)) is even valid.
gen d_invest = d.invest
dfuller d_invest, trend lags(4) regress
* If the level test fails to reject but the first-difference test does
* reject, the series is I(1). If even the first difference fails to
* reject, stop and reconsider — a series requiring a second difference
* to become stationary is I(2), which breaks the assumptions behind
* ardl.md's bounds test and most standard cointegration approaches.
```

**To point this at real data instead of the demo dataset:** replace
`webuse investment2, clear` with `use "yourfile.dta", clear` and `invest`
with the real variable name. Re-plot the series (step 1) before assuming
`trend` is still the right specification — that choice depends on what
the actual series looks like, not on this recipe's example.

## Common mistakes

- **Defaulting to no trend/drift option without looking at the series
  first.** The three specifications test different alternative
  hypotheses and use different critical values — picking the wrong one
  for a series that obviously trends biases the test toward failing to
  reject the unit-root null even when the series is trend-stationary.
- **Picking a lag length that leaves the test regression's residuals
  autocorrelated.** This invalidates the test's asymptotic distribution,
  not just its power — the reported p-value/critical-value comparison
  isn't trustworthy in that case. Check (step 2) rather than picking an
  arbitrary lag like 1 or 4 out of habit.
- **Testing only the level and stopping when the result is "fail to
  reject," without testing the first difference.** "Fail to reject unit
  root at the level" doesn't distinguish I(1) from I(2) — you don't know
  which until you also test the difference (step 4). Stopping early
  here is exactly the kind of assumption that quietly breaks an ARDL
  model downstream (see `ardl.md`'s "Not this when" note on I(2)).
- **Reading `dfuller`'s reported statistic against ordinary t-distribution
  critical values instead of the Dickey-Fuller critical values it
  prints.** The whole reason this is a dedicated test rather than "check
  if the AR(1) coefficient's t-stat is significant" is that the null
  hypothesis (a unit root) makes the ordinary t-distribution the wrong
  reference distribution — always read the critical values `dfuller`
  itself prints, not a mental default from `regress` output.
