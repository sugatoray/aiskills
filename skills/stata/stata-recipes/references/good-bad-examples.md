# Good vs. bad Stata: common footguns

Each pair below runs without error on both sides. That's the point — the
bad version isn't a syntax error you'd catch immediately, it's a command
that executes cleanly and gives you a plausible-looking, wrong answer, or
quietly discards something you needed. When writing or reviewing Stata
code, check it against these before handing it back.

## 1. Merging without checking `_merge`

**Bad:**
```stata
merge 1:1 id using "other.dta"
regress y x1 x2
```
Silently includes rows that only matched on one side (`_merge == 1` or
`== 2`), or duplicates rows on a bad key, and you'd never know from the
output — `regress` just runs on whatever ended up in memory.

**Good:**
```stata
merge 1:1 id using "other.dta"
tab _merge
* Confirm the match rate makes sense for this dataset before proceeding.
* Common next step, once you've looked:
keep if _merge == 3
drop _merge
regress y x1 x2
```
`tab _merge` costs one line and turns a silent assumption into something
you actually looked at. Don't `drop _merge` (or filter on it) before
you've checked what it says — the whole point is to see the mismatch
rate first.

## 2. Time-series/panel operations before `tsset`/`xtset`

**Bad:**
```stata
use "sales.dta", clear
gen sales_l1 = sales[_n-1]
regress sales l.spend
```
`sales[_n-1]` grabs the *previous row in the dataset's current sort
order*, not the previous period — if there's a gap in the series or the
data isn't sorted by date, this is silently wrong. `l.spend` without a
prior `tsset` either errors or (worse, in a panel that happens to be
sorted right) uses the wrong observation as "lagged."

**Good:**
```stata
use "sales.dta", clear
tsset date
gen sales_l1 = l.sales
regress sales l.spend
```
`tsset` (or `xtset panelvar timevar` for panel data) makes Stata aware of
the actual time structure, so `l.`/`f.`/`d.` operators respect gaps and
panel boundaries instead of just walking the physical row order.

## 3. `gen` vs `egen` for row-wise aggregates

**Bad:**
```stata
gen total_score = q1 + q2 + q3 + q4
```
If *any* of `q1`–`q4` is missing (`.`) for a row, the whole sum becomes
missing for that row — Stata's arithmetic propagates missing values,
which is correct behavior for `gen` but usually not what you meant for a
"total across these columns" calculation.

**Good:**
```stata
egen total_score = rowtotal(q1 q2 q3 q4)
* rowtotal() treats missing as 0 by default; add `missing` to instead
* require all four to be non-missing:
egen total_score_strict = rowtotal(q1 q2 q3 q4), missing
```
Pick whichever missing-value behavior is actually correct for the
question and say so in a comment — the bug isn't "using `gen`," it's
using either function without deciding on purpose.

## 4. Deprecated indicator-variable syntax (`xi i.`)

**Bad:**
```stata
xi i.region
regress y _Iregion_2 _Iregion_3 x1
```
`xi` (and its generated `_I*` variable names) is a pre-factor-variable
relic. It still runs, but it litters the dataset with extra variables,
doesn't interact cleanly with modern postestimation (`margins`,
factor-variable interactions like `c.x1#i.region`), and is easy to get
subtly wrong when the reference category changes between runs.

**Good:**
```stata
regress y i.region x1
* interaction, if needed:
regress y i.region##c.x1
```
Factor-variable notation (`i.`, `c.`, `#`, `##`) has been the documented,
correct way to do this since Stata 11 — use it directly in the estimation
command, no `xi` prefix, no manual dummy creation.

## 5. Overwriting data without meaning to

**Bad:**
```stata
use "rawdata.dta", clear
drop if missing(income)
save "rawdata.dta", replace
```
This permanently destroys the original raw file the moment it runs. If
the drop condition turns out to be wrong, or you need the full data for a
different analysis later, it's gone — there's no undo.

**Good:**
```stata
use "rawdata.dta", clear
drop if missing(income)
save "rawdata_clean.dta", replace
```
Treat raw/source data as read-only and write cleaned output to a new
filename (or a `derived/`/`clean/` subfolder). `save ..., replace`
targeting the *same* file you just loaded is a specific decision to
overwrite a source file — only do it when that's actually the intent
(e.g., re-running an idempotent cleaning `.do` file that's meant to
regenerate its own output file each time).

## 6. Hardcoded variable lists instead of macros/`foreach`

**Bad:**
```stata
summarize q1
summarize q2
summarize q3
summarize q4
summarize q5
```
Works, but doesn't scale, is easy to mistype one line of, and silently
goes stale the moment a `q6` is added and someone forgets to add the
sixth line.

**Good:**
```stata
unab qvars: q*
foreach v of varlist `qvars' {
    summarize `v'
}
```
`unab` expands a wildcard into an explicit macro *once*, so the list is
visible and stable for the rest of the script even if new `q*` variables
get added to the dataset later in the same session. Use `foreach ... of
varlist` (not `of local`) when you want Stata's variable-list expansion
(wildcards, `-` ranges) rather than a literal token list.

## 7. Reading results off the screen instead of exporting them

**Bad:**
```stata
regress y x1 x2
* "coefficient on x1 was 0.42, I'll type that into the paper"
```
Manually retyping numbers from Stata's output window into a document is
how transcription errors and stale results (someone reruns the
regression, the number changes, the write-up doesn't) end up in a paper.

**Good:**
```stata
regress y x1 x2
eststo m1
esttab m1 using "results.rtf", replace label ///
    b(%9.3f) se(%9.3f) star(* 0.10 ** 0.05 *** 0.01) ///
    title("Effect of X1 and X2 on Y")
```
`esttab` (from the `estout` package — `ssc install estout` if not already
installed) or `outreg2` writes a formatted table straight from the
estimation results, so the number in the document always matches what
Stata actually produced, and re-running the `.do` file regenerates it.

## 8. Comparing across types silently

**Bad:**
```stata
gen is_2020 = (year_str == "2020")
```
If `year_str` is actually stored as a numeric variable (or `year_str ==
"2020"` is compared against a numeric `year_str`), Stata's type coercion
rules can make this comparison always evaluate false without erroring —
`is_2020` ends up all-zero and nothing flags it.

**Good:**
```stata
describe year_str
* confirm it's actually a string before writing string comparisons; if
* it's numeric, drop the quotes:
gen is_2020 = (year == 2020)
```
One `describe` (or `codebook year_str`) before writing a comparison
against a variable you didn't create yourself removes the guesswork.

## General style notes

- `set more off` and `clear all` at the top of a `.do` file makes it
  runnable end-to-end without pausing on `--more--` prompts or fighting
  leftover state from a previous run — do this by default for any
  multi-step script, not just when something has already gone wrong.
- Comment the *why*, not the *what*: `* using AIC over BIC here because
  the sample is small and BIC over-penalizes` is worth writing;
  `* generate total score` above an obviously-named `gen total_score = …`
  is not.
- Prefer the currently-documented syntax for a command over an older form
  that happens to still work (`xi i.` above is one example, but this
  applies generally — if unsure, it's worth a quick `help <command>` to
  confirm the modern syntax rather than pattern-matching off old code the
  user pasted in).
