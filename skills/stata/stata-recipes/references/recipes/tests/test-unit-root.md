# Recipe: choosing and running a unit-root test

## When to use this

The user needs to establish whether a series is stationary before
trusting a downstream regression, and hasn't already committed to a
specific test — "is this series stationary", "do I need to difference
this before regressing", "my results might be spurious, how do I check".
This recipe is the decision layer: which test(s) to run and how to read
them together, not the detailed mechanics of any single one.

**Not this when:**
- The test to run has already been decided as the (Augmented) Dickey-
  Fuller test specifically — go straight to `test-dickey-fuller.md` for
  the lag-selection and specification details.
- The variable is a panel variable (multiple units) rather than one
  series — go to `test-im-pesaran-shin.md` instead; the tests below are
  all single-series tests.

## The core idea: tests disagree about which hypothesis is the null

This is the single most important thing to get right about combining
unit-root tests, and it's easy to miss because the tests otherwise look
similar:

| Test | Stata command | Null hypothesis (H0) |
| --- | --- | --- |
| (Augmented) Dickey-Fuller | `dfuller` | Series **has** a unit root (non-stationary) |
| Phillips-Perron | `pperron` | Series **has** a unit root (non-stationary) |
| DF-GLS (Elliott-Rothenberg-Stock) | `dfgls` | Series **has** a unit root (non-stationary) |
| KPSS | community-contributed (`ssc install kpss`) | Series **is** stationary |

ADF/PP/DF-GLS all share the same null (unit root) — they differ in how
they handle serial correlation and deterministic terms in the test
regression (PP corrects the test statistic non-parametrically instead of
adding augmenting lags; DF-GLS GLS-detrends the series first, which gives
it more power than plain ADF against the same alternative). KPSS flips
the null and alternative entirely. That reversal is *useful*, not just a
quirk — it's what makes combining ADF (or PP/DF-GLS) with KPSS more
informative than running either alone:

| ADF/PP/DF-GLS result | KPSS result | Read as |
| --- | --- | --- |
| Reject unit root | Fail to reject stationarity | Good agreement: stationary |
| Fail to reject unit root | Reject stationarity | Good agreement: non-stationary |
| Reject unit root | Reject stationarity | Conflicting — often a sign of a structural break the tests aren't modeling, not a genuine contradiction |
| Fail to reject unit root | Fail to reject stationarity | Conflicting — usually a low-power case (short series, near-boundary root); don't force a conclusion either test alone didn't support |

## Worked script

```stata
* unit_root_recipe.do
clear all
set more off

webuse investment2, clear
tsset time
tsline invest
* invest visibly trends, so every test below is specified with a trend.

* --- ADF: see test-dickey-fuller.md for full detail on this step ---
dfuller invest, trend lags(4) regress

* --- Phillips-Perron: same null as ADF, non-parametric correction for ---
* --- serial correlation instead of augmenting lags ---
pperron invest, trend lags(4)

* --- DF-GLS: GLS-detrends first, generally more powerful than plain ---
* --- ADF against the same alternative — Stata reports results across ---
* --- a range of lags plus suggested optimal lags by a couple of ---
* --- information criteria, so you can see how sensitive the result is ---
* --- to the lag choice rather than committing to just one ---
dfgls invest, maxlag(8)

* --- KPSS (if installed): opposite null, see the table above for how ---
* --- to read it alongside the tests above ---
capture which kpss
if _rc {
    display as error "kpss not installed — run: ssc install kpss"
}
else {
    kpss invest, maxlag(4) notrend
    * use `notrend` only if you tested the trend-stationary alternative
    * via the other tests too; match specifications across tests so
    * they're actually comparable
}
```

**To point this at real data instead of the demo dataset:** replace
`webuse investment2, clear` with `use "yourfile.dta", clear` and `invest`
with the real variable name; re-plot it before deciding whether `trend`
still applies.

## Common mistakes

- **Running only one test and treating its result as definitive.** Every
  test here has known weaknesses in some setting (ADF has low power in
  small samples; PP's non-parametric correction can behave poorly with
  strong negative moving-average residuals; DF-GLS is more powerful but
  still shares ADF's null and its own specification sensitivity; KPSS's
  power depends heavily on the bandwidth/lag choice). Corroborating
  across two tests with opposite nulls (an ADF-family test plus KPSS) is
  far more informative than either alone — see the table above.
- **Comparing results from tests run with different deterministic
  specifications** (one with `trend`, another with `notrend`) **as if
  they were testing the same thing.** Match the specification (trend,
  drift, or neither) across every test in the comparison, based on what
  the plotted series actually looks like — not per-test defaults.
- **Treating a conflicting result as "inconclusive, so I'll just pick
  the answer that supports my regression."** A conflict is itself
  information — it usually means look for a structural break (a test
  that allows for one, e.g. Zivot-Andrews, would be the next step) or
  accept that the sample doesn't have the power to resolve the question
  cleanly, rather than silently picking whichever result is convenient.
- **Assuming a community-contributed command like `kpss` is present.**
  Unlike `dfuller`/`pperron`/`dfgls` (all official, built into Stata),
  `kpss` needs `ssc install kpss` first — check with `which kpss` (as the
  script above does) rather than assuming every Stata install has it.
