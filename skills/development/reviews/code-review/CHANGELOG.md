# Changelog

All notable changes to the `code-review` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-11-12

### Added

- `SKILL.md`: an eight-step review workflow (fix the scope, detect languages, build context, run
  the project's checks, review in passes, verify every finding, write suggested changes, report)
  held to the bar of a senior or staff engineer. It reviews and suggests; it edits files or posts
  review comments only when asked.
- `references/SEVERITY.md`: four severities (`blocker`, `major`, `minor`, `nit`), three confidence
  levels (`confirmed`, `likely`, `to verify`), and the verdict each combination produces.
- `references/REPORT_TEMPLATE.md`: the structured report (verdict, summary, counts, scope and
  method, findings with location, problem, impact, suggested change and confidence, questions,
  tests, pre-existing issues), a short form for small changes, and rules for posting to a PR.
- `references/CROSS_LANGUAGE.md`: the questions for each review pass, for any language.
- Language references, each a folder with `REVIEW.md` (what to look for and why), `PATTERNS.md`
  (before/after fixes) and `TOOLING.md` (commands to run and how to read them):
  `review_python/`, `review_javascript/`, `review_typescript/`, `review_rust/`,
  `review_shellscript/`, `review_powershell-script/`, `review_sql/`.
- `scripts/detect_languages.py`: maps the files under review (given paths, stdin, or a git base
  ref) to languages and the reference files to read, and lists vendored, generated and
  unsupported files separately. Standard library only, with tests in `tests/`.
