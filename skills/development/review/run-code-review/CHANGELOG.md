# Changelog

All notable changes to the `run-code-review` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] - 2026-11-12

### Changed

- Renamed from `/code-review` to `/run-code-review`, folder and all, so the skill doesn't collide
  with the built-in `/code-review` that Claude Code ships. The plugin is still `review-skills`.

### Added

- `-l`/`--lang <list>`: review only the named languages, by name or short form
  (`py,js,ts,sh,ps1,html,sql,xml,css,rs,md,json,yaml,toml`). `-l` alone, or no `-l`, reviews all.
  Files in a supported language that the list leaves out are reported as `filtered`.
- `-s`/`--security`: a security review alone. It reads each language's `SECURITY.md` and
  `WISDOM.md`, runs the security pass only, and says so in the report.
- Scope options, after `scrolls-setup`: `-p`/`--path` (repeatable), `-t`/`--reporoot`, `--local`
  and `-r`/`--recurse`, beside the existing `--base`. `--local` has no short form because `-l`
  is `--lang`.
- `SECURITY.md` in every language folder: scope, where untrusted data enters, checks, tools, and
  what the review does not establish.
- `WISDOM.md` in every language folder, with four sections: Constraints, Traps, Ditches, Wisdom.
- Seven more languages, each with the five reference files: `review_html/`, `review_css/`,
  `review_markdown/`, `review_xml/`, `review_json/`, `review_yaml/`, `review_toml/`.
- Tool-first formats: XML, JSON, YAML and TOML are checked by a parser, formatter or validator
  before they are read, and the report names each tool that ran. XML keeps its full review.
- `scripts/check_formats.py`: syntax-checks the tool-first formats with Python's standard
  library, reports each file as `ok`, `error` or `unchecked`, and lists the linters on `PATH`.
  It takes the same flags as the detector, installs nothing and runs no external program. A
  duplicate key is an error in JSON, TOML and YAML alike.
- `-p` and `--local` leave out files git ignores, list a vendored folder such as
  `node_modules/` once instead of file by file, and reject a path that doesn't exist. The text
  output shows at most 20 names per skipped, filtered or unsupported list; `--json` shows all.
- `tests/test_reference_code.py`: every Python, JSON, TOML, YAML and shell block in the
  references parses, unless its first line says it shows an error.
- `assets/EXAMPLE.md` with example prompts and outputs for each option and a complete report,
  linked from `SKILL.md` and `README.md`.

### Changed

- The Security section of each existing `REVIEW.md` now points to that language's `SECURITY.md`
  instead of repeating it.
- TypeScript reviews also read `review_javascript/SECURITY.md`.
- The detector lists lock files (`package-lock.json`, `pnpm-lock.yaml`, `*.lock`, …) and
  `*.min.css` as `skipped`, and marks each language `tool_first` or not in its JSON output.
- With `--base`, the detector names files from the folder it runs in, as it does for every other
  scope, and lists untracked files from the whole repository. In a subfolder it used to name
  changed files from the repository's top level and miss untracked files outside the folder.
- `references/REPORT_TEMPLATE.md`: a **Mode** line (full or security-only), the `--lang` filter
  under **Languages**, and tool versions under **Checks run**.

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
