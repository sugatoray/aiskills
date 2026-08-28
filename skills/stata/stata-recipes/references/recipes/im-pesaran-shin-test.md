# Recipe: Im-Pesaran-Shin (IPS) panel unit-root test

## When to use this

The user has panel data (multiple units observed over time) and wants to
test whether a variable has a unit root *across the panel* — the panel
counterpart to `dickey-fuller-test.md`/`unit-root-test.md`, and a natural
step before `panel-regression.md` when the variables involved might be
non-stationary. Typical asks: "panel unit root test", "Im-Pesaran-Shin
test in Stata", "is this panel variable stationary", "test for unit
roots before my panel regression".

**Not this when:**
- There's only one series, no panel dimension — use
  `dickey-fuller-test.md`/`unit-root-test.md` instead; those are what IPS
  is generalizing.
- The economic assumption is that *every* panel unit shares the same
  autoregressive root under the alternative (a strong homogeneity
  assumption) — Levin-Lin-Chu (`xtunitroot llc`) matches that alternative
  more directly. IPS's alternative is *heterogeneous* (some panels
  stationary, others not), which is usually the more defensible
  assumption for real panels of firms/countries/individuals — that's why
  it's the default recommended here, but it's worth knowing LLC exists
  and tests a genuinely different hypothesis, not just a variant.
- There's strong cross-sectional dependence across panel units (e.g. all
  countries share exposure to a global shock). Plain IPS assumes
  cross-sectional independence; the `demean` option (cross-sectional
  demeaning) only partially addresses this. A cross-sectionally augmented
  version (CIPS, via the community-contributed `multipurt` or `pescadf`
  commands) is the more correct tool when dependence is a real concern —
  worth flagging to the user rather than silently proceeding with plain
  IPS if the panel units plausibly share common shocks.

## Data shape this assumes

Panel data, `xtset` on the panel and time identifiers. IPS is
asymptotically justified as both N (panel count) and T (time periods per
panel) grow, and its power in practice depends on having a reasonable T —
it's not the right tool for a panel with only 2-3 periods per unit.

## Worked script

Uses `webuse nlswork` — the same dataset as `panel-regression.md`, so the
two recipes chain naturally (test for a unit root first, then decide
whether the panel regression on that variable needs differencing or an
error-correction-style specification).

```stata
* ips_recipe.do
clear all
set more off

webuse nlswork, clear
xtset idcode year

* --- Step 1: look at the panel structure first ---
* IPS's power depends on T; a very short/unbalanced panel is a reason to
* interpret the result cautiously regardless of what it says.
xtdescribe

* --- Step 2: run the IPS test ---
* demean removes the cross-sectional average at each time period before
* testing — a partial correction for common time effects (like an
* economy-wide shock affecting every panel unit similarly). lags(aic 4)
* lets Stata pick each panel's own augmenting lag length by AIC, up to a
* max of 4, rather than forcing one lag length on every unit — matches
* IPS's own heterogeneous design better than a fixed lag would.
xtunitroot ips ln_wage, demean lags(aic 4)

* --- Step 3: read the result against the heterogeneous alternative ---
* H0: every panel has a unit root. Rejecting H0 means *at least some*
* panels are stationary — not that all of them are. That's the whole
* point of choosing IPS over LLC: it doesn't force a single answer onto
* every unit.
```

**To point this at real data instead of the demo dataset:** replace
`webuse nlswork, clear` with `use "yourfile.dta", clear`, `xtset` on the
real panel/time identifiers, and swap `ln_wage` for the real variable
being tested. Re-check `xtdescribe` (step 1) on the real panel — the
balance/typical-T picture directly affects how much to trust the result.

## Common mistakes

- **Running `dfuller` separately on every panel unit and eyeballing how
  many reject, instead of using a proper panel test.** This is a common
  shortcut, but it throws away the extra power a panel test gets from
  pooling information across units, and doesn't correctly control the
  overall test size the way IPS's construction does.
- **Choosing LLC over IPS (or vice versa) without noticing they test
  different alternative hypotheses.** LLC assumes every panel shares the
  same autoregressive parameter under the alternative — a homogeneity
  assumption that's often unrealistic for firms/countries with genuinely
  different dynamics. Picking between them should follow from which
  assumption is actually defensible for the panel at hand, not from
  which command comes to mind first.
- **Ignoring cross-sectional dependence.** Plain IPS (even with `demean`)
  assumes panel units are independent of each other conditional on the
  time effect it removes. For panels of countries or firms in the same
  industry, that's frequently false, and it inflates the test's rejection
  rate (false positives for stationarity) — flag this to the user as a
  real limitation rather than treating `demean` as a complete fix.
- **Applying the test to a variable that hasn't been checked for the
  panel actually being long enough.** A 3-period panel doesn't give IPS
  much to work with regardless of N — check `xtdescribe` (step 1) and
  say so explicitly if T looks too short to trust the result, rather than
  reporting the test's p-value at face value.
