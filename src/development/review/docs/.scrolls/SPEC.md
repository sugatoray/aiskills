# SPEC.md — Feature Spec

What review (aiskills) does, feature by feature. Add a section per feature when it ships — describe *what* it does and *why* it matters to a user, not the implementation detail (that belongs in code comments or `WISDOM.md`).

Up to 1.1.0, everything below is on `master`: [#215](https://github.com/sugatoray/aiskills/pull/215) was squash-merged as `7c0afec` on 2026-11-13. The 1.2.0 section is in [#223](https://github.com/sugatoray/aiskills/pull/223), open into `master`. The version-by-version record is `skills/development/review/run-code-review/CHANGELOG.md`; this file says what a user gets.

## `/run-code-review`: a structured review at a staff engineer's bar (1.0.0)

Reviews a pull request, branch, diff, set of files or whole repository and returns a report: a verdict first, then findings ranked `blocker` / `major` / `minor` / `nit`, each with file and line, the problem, its impact, a confidence level (`confirmed`, `likely`, `to verify`) and a suggested code change. It follows eight steps (fix the scope, detect languages, build context, run the project's own checks, review in passes, verify every finding, write the suggested changes, report). It reads and suggests; it edits files or posts review comments only when asked. Lives in `skills/development/review/run-code-review/SKILL.md`, with `references/SEVERITY.md`, `REPORT_TEMPLATE.md` and `CROSS_LANGUAGE.md` applying to every review.

## Per-language references, loaded only for the languages in the change (1.0.0, 1.1.0)

Fourteen languages: Python, JavaScript, TypeScript, Rust, shellscript, PowerShell-script, SQL (1.0.0), and HTML, CSS, Markdown, XML, JSON, YAML, TOML (1.1.0). Each has `references/review_<language>/` with the same five files: `REVIEW.md` (what to look for and why), `PATTERNS.md` (before/after fixes), `TOOLING.md` (commands to run and how to read them), `SECURITY.md` and `WISDOM.md`. A Rust review never loads the SQL checklist; TypeScript also loads JavaScript's `REVIEW.md` and `SECURITY.md`.

## `-l` / `--lang`: review only chosen languages (1.1.0)

`-l py,js,ts,sh,ps1,html,sql,xml,css,rs,md,json,yaml,toml`, or the full names. `-l` alone, an empty list, or no `-l` reviews every supported language. Files in a supported language the list leaves out are reported as `filtered`, so the report shows what was not read. An unknown name is an error, not a silent skip.

## `-s` / `--security`: a security review alone (1.1.0)

Reads only each selected language's `SECURITY.md` and `WISDOM.md` plus the shared cross-language security questions, runs the security pass only, and says so in the report's **Mode** line. A clean result is not presented as a complete audit: each `SECURITY.md` ends with what the review does not establish. A full review still includes security as one of its passes.

## Scope options: which files are reviewed (1.1.0)

`-p` / `--path` (repeatable, files or folders), `-t` / `--reporoot` (every tracked file), `--local` (the current folder), `-r` / `--recurse` (descend into folders), and `--base REF` (files changed against a ref, plus untracked files). `-p`, `-t` and `--local` exclude each other. The flags follow `scrolls-setup`'s, except that `--local` has no short form because `-l` is `--lang`. Paths are always named from the folder the command runs in, so they can be opened from there. A folder walked by `-p` or `--local` leaves out what git ignores, and a vendored folder such as `node_modules/` is listed once as skipped, so a review never wades through build output or dependencies; a path that doesn't exist is an error.

## Tool-first formats: XML, JSON, YAML, TOML (1.1.0)

A parser, formatter or validator checks these before anything is read, and the report names each tool, its version, the command and the outcome. The model then reads for what no tool judges (secrets, dangerous settings, wrong values, breaking schema changes). XML keeps its full review on top of the tool run. `scripts/check_formats.py` does the syntax check with Python's own parsers, reports each file as `ok`, `error` or `unchecked` (a duplicate key is an error in JSON, TOML and YAML alike), and lists which linters are on `PATH`. It installs nothing and runs no external program.

## Language detection: `scripts/detect_languages.py` (1.0.0, extended in 1.1.0)

Maps the files in scope to languages and to the reference files to read, and lists vendored, generated, lock, `filtered` and unsupported files separately so nothing is dropped silently. It owns the option parsing that `check_formats.py` reuses, and has `--json` for machine-readable output. Standard library only.

## Worked examples: `assets/EXAMPLE.md` (1.1.0)

Ten examples on one small demo repository: a full review with the complete report, each option, the options combined, plain-language requests, what a wrong flag returns, and follow-ups (apply the fixes, post to a PR). Linked from `SKILL.md`, `README.md` and `CHANGELOG.md`.

## `-o` / `--output`: the report as a page, Markdown or JSON, with line links (1.2.0)

In [#223](https://github.com/sugatoray/aiskills/pull/223), not yet on `master`. Besides the report in the chat, `-o review.html` writes a self-contained page (offline; severity, file and text filters; copy buttons; light and dark; prints cleanly), `-o review.md` the Markdown report and `-o review.json` the report as data (`references/report.schema.json`, `schema_version` 1) for other tools. A folder or bare `-o` gets a dated `.html`; `-f` overwrites a different file, `--open` opens the page. Each finding links to its line at the reviewed commit on GitHub or GitLab, chosen from the URL of the remote the branch tracks; `--host-type github|gitlab` covers a self-hosted server whose name doesn't say. A link is left out, with the reason shown, when it would be wrong (commit not pushed, file changed since or untracked, host unknown). Quoted code in the report is shown, never run, and credentials in a remote URL never reach it. Done by `scripts/render_report.py`, which also refuses a report whose verdict disagrees with its findings.

## Packaging: the `review-skills` plugin (1.0.0)

`skills/development/review/` is its own subgroup with a `.claude-plugin/plugin.json` (`review-skills`), listed in the root `.claude-plugin/marketplace.json` as `./development/review`. The skill installs with `npx skills add sugatoray/aiskills` (choose `run-code-review`), with `/plugin install review-skills@sugatoray`, or through the `@sugatoray-ai/aiskills` npm package (group alias `review`), which lists it under `[Unreleased]`.
