# Changelog

All notable changes to the `stata-recipes` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.2.0] - 2026-08-28

### Changed

- Restructured `references/recipes/` into `models/` (a model class to
  estimate) and `tests/` (a diagnostic/statistical test) subfolders, and
  renamed files to match: `ardl.md` → `models/ardl.md`,
  `timeseries-regression.md` → `models/regression-timeseries.md`,
  `panel-regression.md` → `models/regression-panel.md`,
  `dickey-fuller-test.md` → `tests/test-dickey-fuller.md`,
  `unit-root-test.md` → `tests/test-unit-root.md`, and (to match the new
  `test-` naming pattern) `im-pesaran-shin-test.md` →
  `tests/test-im-pesaran-shin.md`. `references/recipes/README.md` now
  documents the `models/`/`tests/` split and naming convention; all
  cross-recipe references, `SKILL.md`'s two recipe tables, and this
  skill's `README.md` updated to match.

## [1.1.0] - 2026-08-28

### Added

- Five new recipes in `references/recipes/`:
  `timeseries-regression.md` (single-equation regression on one time
  series: lag structure, Newey-West/HAC standard errors, autocorrelation
  diagnostics, avoiding spurious regression), `panel-regression.md`
  (fixed-effects vs. random-effects, the Hausman test, clustered
  standard errors), `dickey-fuller-test.md` (`dfuller` mechanics:
  trend/drift specification, lag-length choice, level vs. first
  difference), `unit-root-test.md` (the decision layer above any single
  test — choosing among ADF/Phillips-Perron/DF-GLS/KPSS and reading
  conflicting results), and `im-pesaran-shin-test.md` (panel unit-root
  testing via `xtunitroot ips`, its heterogeneous alternative vs.
  Levin-Lin-Chu, cross-sectional-dependence caveats). Each cross-
  references the others and the existing `ardl.md`/good-bad-examples
  content where the workflows chain together (e.g. unit-root testing
  before a time-series or panel regression).
- New recipes added to the table in `SKILL.md` and to `README.md`.

## [1.0.0] - 2026-08-21

### Added

- Initial release: turns a plain-language requirement into runnable
  Stata code, with `references/good-bad-examples.md` covering common
  footguns (merge checks, `tsset`/`xtset`, `gen` vs `egen`, deprecated
  syntax, unsafe overwrites, hardcoded variable lists, manual result
  transcription, silent type mismatches) and
  `references/python-interop.md` covering all three directions of
  Stata↔Python interop (Python from inside a `.do` file, Stata's dataset
  from Python via `sfi`, driving Stata from Python via `pystata`/
  `stata_setup` or batch mode).
- First recipe: `references/recipes/ardl.md` (Autoregressive Distributed
  Lag modeling — lag selection, bounds test, error-correction form,
  diagnostics), plus `references/recipes/README.md` as the template for
  future recipes.
