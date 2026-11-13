# Maintaining run-code-review

For people developing this skill. None of this is read when answering a `/run-code-review` request;
that's `../SKILL.md`.

## Layout

- `../SKILL.md` is the only file loaded when the skill triggers: the reviewer's bar, the
  eight-step workflow, and which reference to read at which step. Keep it under about 250 lines;
  detail belongs in `../references/`.
- `../references/SEVERITY.md`, `REPORT_TEMPLATE.md` and `CROSS_LANGUAGE.md` apply to every review.
- `../assets/EXAMPLE.md` shows each option on one small demo repository. Its command output was
  pasted from real runs, with `read:` lines shortened to file names. When a script's output or
  an option changes, rebuild the demo repository described at the top of that file, re-run the
  commands and paste the new output. Its sample report was written by the skill's author on
  seeded defects: it shows the report's form, not a measured detection rate.
- `../references/review_<language>/` holds one language each, always with the same five files:
  - `REVIEW.md`: what to look for and why. Prose and bullets, no long code.
  - `PATTERNS.md`: before/after pairs, one `##` section per fix.
  - `TOOLING.md`: commands, a table of checks, how to read the output, how to reproduce a finding.
  - `SECURITY.md`: Scope, Where untrusted data enters, Checks, Tools, What this review does not
    establish, in that order. Read alone, with `WISDOM.md`, under `-s`.
  - `WISDOM.md`: exactly four `##` sections, Constraints, Traps, Ditches, Wisdom. One line per
    item; the detail stays in `REVIEW.md` and `SECURITY.md`.

  Loading is per language, so a Rust review never pays for the SQL checklist. TypeScript is the
  one exception: it also loads `review_javascript/REVIEW.md` and `SECURITY.md`, because
  TypeScript is JavaScript at run time and repeating those would let the two drift.
- `../scripts/detect_languages.py` maps files to languages and reference files, and owns the
  option parsing (`build_parser`, `collect_paths`). Standard library only.
- `../scripts/check_formats.py` syntax-checks the languages in `TOOL_FIRST`, reusing the
  detector's parser so both take the same flags. Standard library only; PyYAML is used when it
  happens to be importable and never required.
- `../scripts/render_report.py` renders the report, kept as JSON (`../references/report.schema.json`),
  to Markdown, HTML or JSON and adds line links from git. Its `REQUIRED`, `FINDING_REQUIRED`,
  `SEVERITIES` and `VERDICTS` must match the schema; a test compares them. The HTML is
  `../assets/report-template.html` with the report put in place of `__REPORT_JSON__`, escaped so it
  can't leave its `<script type="application/json">` block; the page builds every element with
  `textContent`. Keep both properties: reports quote untrusted code. `tests/test_report_page.py`
  drives the rendered page in Chromium through Node's Playwright (skipped without them): the
  pinned header, the collapsible verdict, the sidebar and section links below the pinned block,
  and the phone layout. When the template changes, also look at it at 1280 and 390 px in light
  and dark, and check that a title with `</script><img onerror>` in it shows as text.
- `../assets/report-example.json` is Example-01's report as JSON. The tests use it; keep it valid.
- `../tests/` tests the three scripts, that every language the detector knows has its folder and
  five files, and (`test_reference_code.py`) that every Python, JSON, TOML, YAML and shell block
  in the references parses; `test_report_page.py` covers the HTML page in a browser.
- `../agents/*.yaml`: display metadata for the `npx skills add --agent <name>` packaging.
- `../CHANGELOG.md`: update it together with `metadata.version` in `SKILL.md`, and keep the
  subgroup manifest (`../../.claude-plugin/plugin.json`) equal to it. Two files, one version (see
  [`../../meta/MAINTAINERS.md`](../../meta/MAINTAINERS.md)).

There is no per-skill `.claude-plugin/plugin.json`: the skill installs through the subgroup's
`review-skills` plugin, as `skills/docs/` and `skills/scrolls/` skills do.

## Tests

```bash
python3 -m pytest skills/development/review/run-code-review/tests
```

## Adding a language

1. Add a test first: the language's extensions, and its name in the list in
   `test_every_language_has_its_reference_folder_with_its_five_files`. Run the tests and see
   them fail.
2. Add the language to `LANGUAGES` in `scripts/detect_languages.py`, a short form to `ALIASES`
   if it has one, and to `_INTERPRETERS` if scripts in it start with a `#!` line. If a parser
   or validator judges it better than reading does, add it to `TOOL_FIRST` and give
   `scripts/check_formats.py` a checker for it.
3. Create `references/review_<language>/` with the five files, following an existing folder's
   section order. The folder name is `review_` plus the key used
   in `LANGUAGES`.
4. Add a row to the language table in `SKILL.md` step 2, the layout in `../README.md`, and the
   language lists in `SKILL.md`'s `description`, `../../README.md` and the subgroup manifest.
5. Bump `metadata.version` (minor), the subgroup manifest's version, and `CHANGELOG.md`.

## Changing a checklist or pattern

- **Every claim about a language's behaviour must be checked** against the language, not
  recalled. For 1.0.0 the examples were run on: CPython 3.10, Node.js 20.18, TypeScript 5.6,
  Rust 1.99, bash 5.1 and dash with ShellCheck 0.11, PowerShell 7.4 with PSScriptAnalyzer and
  Pester 5, and PostgreSQL 16. Statements about other versions and engines (Windows PowerShell
  5.1, MySQL, SQL Server, older PostgreSQL) come from their documentation and were not run.
- **Code blocks must at least parse.** "After" blocks are what the skill hands to users as
  suggested fixes; a broken one is worse than none. `tests/test_reference_code.py` enforces it for
  Python, JSON, TOML, YAML and shell; a block that shows an error on purpose must say "error" on
  its first line. In YAML, a plain scalar can't contain `: `, so a `run:` command with a colon
  in it needs a block (`run: |`). Extract the fenced blocks and run them through
  `python3 -m ast`, `node --check`, `tsc`, `rustfmt --check`, `bash -n` and `shellcheck`, the
  PowerShell parser, and `sqlfluff parse`, as fits.
- **Version gates are stated where a fix needs a recent version** ("Python 3.11+", "Node 17.3+",
  "Rust 1.80+", "PowerShell 7"), because the skill must not suggest code the project can't run.
  For 1.1.0, additionally: Chromium (through Playwright) for HTML and CSS, `xmllint` 2.9 and
  Python's `expat` for XML, `marked` and `commonmark` for Markdown, Node.js 24 and `jq` 1.6 for
  JSON, PyYAML 5.4 and 6.0, the JavaScript `yaml` package, `yamllint` 1.38 and `actionlint` 1.7
  for YAML, `tomllib` on Python 3.12, `taplo` 0.9 and Cargo 1.99 for TOML, and
  `check-jsonschema` 0.38 and Prettier 3. Statements about GitHub Actions, Kubernetes, Docker
  Compose, Ansible, Ruby, SnakeYAML and package-index resolution come from their documentation.
- **Each `REVIEW.md` ends with "Usually not worth a finding".** That section matters as much as
  the rest: it is what keeps reports short.
- When writing a shell heredoc that contains one of these files, don't use `EOF` as the
  delimiter: several patterns contain a line that is exactly `EOF`.

## Design notes

- **Why the workflow verifies findings before reporting them:** the commonest failure of an
  automated review is a confident finding that is wrong, or true but unreachable. One of those
  costs the author more than a missed nit, and makes the rest of the report easy to dismiss.
  Hence step 6, the confidence field, and "evidence or it isn't a finding".
- **Why severity is fixed at four levels with a rule for the verdict:** so reports are
  comparable between reviews and the verdict isn't a matter of tone.
- **Why read-only by default:** a review that also rewrites the change stops being a review.
  Suggested changes are complete enough to apply; applying them is the author's decision.
- **Why the persona is a list of behaviours, not a job title:** "act as a staff engineer" alone
  changes the tone and little else. The section in `SKILL.md` says what such a reviewer does
  differently (reads for failure, demands evidence, keeps proportion, thinks one level up), which
  is what changes the output.
- **Why the detector lists `skipped` and `unsupported` files:** silently dropping files makes a
  review look more complete than it was.
- **Why XML, JSON, YAML and TOML are tool-first:** a parser decides syntax, formatting and schema
  validity exactly and for almost nothing; a model reading every line decides them worse and at
  a price. The review's attention goes to what no tool judges. XML keeps a full checklist
  because parser configuration and schema compatibility need reading that the tools don't do.
- **Why `check_formats.py` reports `unchecked`:** Python has no YAML parser and, before 3.11, no
  TOML parser. Saying so is better than a silent pass, and the skill must not install one.
- **Why `WISDOM.md` is separate from `REVIEW.md`:** it is short enough to read every time, in
  both modes, and it is about how to review the language, not what to look for in it.
- **Why `--local` has no short form:** `scrolls-setup` uses `-l` for it, but here `-l` is
  `--lang`, which is used far more often.
- **Why `review_powershell-script` and `review_shellscript`:** the folder names follow the
  language names the skill was specified with.
