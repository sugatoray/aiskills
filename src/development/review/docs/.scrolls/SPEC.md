# SPEC.md — Feature Spec

What review (aiskills) does, feature by feature. Add a section per feature when it ships — describe *what* it does and *why* it matters to a user, not the implementation detail (that belongs in code comments or `WISDOM.md`).

Everything below is built, tested and pushed on branch `devin/1794523707-code-review-skill` ([#215](https://github.com/sugatoray/aiskills/pull/215), open, not merged), so none of it is on `master` yet. The version-by-version record is `skills/development/review/run-code-review/CHANGELOG.md`; this file says what a user gets.

## `/run-code-review`: a structured review at a staff engineer's bar (1.0.0)

Reviews a pull request, branch, diff, set of files or whole repository and returns a report: a verdict first, then findings ranked `blocker` / `major` / `minor` / `nit`, each with file and line, the problem, its impact, a confidence level (`confirmed`, `likely`, `to verify`) and a suggested code change. It follows eight steps (fix the scope, detect languages, build context, run the project's own checks, review in passes, verify every finding, write the suggested changes, report). It reads and suggests; it edits files or posts review comments only when asked. Lives in `skills/development/review/run-code-review/SKILL.md`, with `references/SEVERITY.md`, `REPORT_TEMPLATE.md` and `CROSS_LANGUAGE.md` applying to every review.

## Per-language references, loaded only for the languages in the change (1.0.0, 1.1.0)

Fourteen languages: Python, JavaScript, TypeScript, Rust, shellscript, PowerShell-script, SQL (1.0.0), and HTML, CSS, Markdown, XML, JSON, YAML, TOML (1.1.0). Each has `references/review_<language>/` with the same five files: `REVIEW.md` (what to look for and why), `PATTERNS.md` (before/after fixes), `TOOLING.md` (commands to run and how to read them), `SECURITY.md` and `WISDOM.md`. A Rust review never loads the SQL checklist; TypeScript also loads JavaScript's `REVIEW.md` and `SECURITY.md`.

## `-l` / `--lang`: review only chosen languages (1.1.0)

`-l py,js,ts,sh,ps1,html,sql,xml,css,rs,md,json,yaml,toml`, or the full names. `-l` alone, an empty list, or no `-l` reviews every supported language. Files in a supported language the list leaves out are reported as `filtered`, so the report shows what was not read. An unknown name is an error, not a silent skip.

## `-s` / `--security`: a security review alone (1.1.0)

Reads only each selected language's `SECURITY.md` and `WISDOM.md` plus the shared cross-language security questions, runs the security pass only, and says so in the report's **Mode** line. A clean result is not presented as a complete audit: each `SECURITY.md` ends with what the review does not establish. A full review still includes security as one of its passes.

## Scope options: which files are reviewed (1.1.0)

`-p` / `--path` (repeatable, files or folders), `-t` / `--reporoot` (every tracked file), `--local` (the current folder), `-r` / `--recurse` (descend into folders), and `--base REF` (files changed against a ref, plus untracked files). `-p`, `-t` and `--local` exclude each other. The flags follow `scrolls-setup`'s, except that `--local` has no short form because `-l` is `--lang`. Paths are always named from the folder the command runs in, so they can be opened from there.

## Tool-first formats: XML, JSON, YAML, TOML (1.1.0)

A parser, formatter or validator checks these before anything is read, and the report names each tool, its version, the command and the outcome. The model then reads for what no tool judges (secrets, dangerous settings, wrong values, breaking schema changes). XML keeps its full review on top of the tool run. `scripts/check_formats.py` does the syntax check with Python's own parsers, reports each file as `ok`, `error` or `unchecked`, and lists which linters are on `PATH`. It installs nothing and runs no external program.

## Language detection: `scripts/detect_languages.py` (1.0.0, extended in 1.1.0)

Maps the files in scope to languages and to the reference files to read, and lists vendored, generated, lock, `filtered` and unsupported files separately so nothing is dropped silently. It owns the option parsing that `check_formats.py` reuses, and has `--json` for machine-readable output. Standard library only.

## Worked examples: `assets/EXAMPLE.md` (1.1.0)

Ten examples on one small demo repository: a full review with the complete report, each option, the options combined, plain-language requests, what a wrong flag returns, and follow-ups (apply the fixes, post to a PR). Linked from `SKILL.md`, `README.md` and `CHANGELOG.md`.

## Packaging: the `review-skills` plugin (1.0.0)

`skills/development/review/` is its own subgroup with a `.claude-plugin/plugin.json` (`review-skills`), listed in the root `.claude-plugin/marketplace.json` as `./development/review`. The skill installs with `npx skills add sugatoray/aiskills` (choose `run-code-review`), with `/plugin install review-skills@sugatoray`, or through the `@sugatoray-ai/aiskills` npm package (group alias `review`), which lists it under `[Unreleased]`.
