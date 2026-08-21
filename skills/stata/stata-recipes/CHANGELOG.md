# Changelog

All notable changes to the `stata-recipes` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
