# Maintaining code-review

For people developing this skill. None of this is read when answering a `/code-review` request;
that's `../SKILL.md`.

## Layout

- `../SKILL.md` is the only file loaded when the skill triggers: the reviewer's bar, the
  eight-step workflow, and which reference to read at which step. Keep it under about 250 lines;
  detail belongs in `../references/`.
- `../references/SEVERITY.md`, `REPORT_TEMPLATE.md` and `CROSS_LANGUAGE.md` apply to every review.
- `../references/review_<language>/` holds one language each, always with the same three files:
  - `REVIEW.md`: what to look for and why. Prose and bullets, no long code.
  - `PATTERNS.md`: before/after pairs, one `##` section per fix.
  - `TOOLING.md`: commands, a table of checks, how to read the output, how to reproduce a finding.

  Loading is per language, so a Rust review never pays for the SQL checklist. TypeScript is the
  one exception: it also loads `review_javascript/REVIEW.md`, because TypeScript is JavaScript at
  run time and repeating that checklist would let the two drift.
- `../scripts/detect_languages.py` maps files to languages and reference files. Standard library
  only, pure functions plus `main()`.
- `../tests/test_detect_languages.py` tests the script, and that every language it knows has its
  folder and three files.
- `../agents/*.yaml`: display metadata for the `npx skills add --agent <name>` packaging.
- `../CHANGELOG.md`: update it together with `metadata.version` in `SKILL.md`, and keep the
  subgroup manifest (`../../.claude-plugin/plugin.json`) equal to it. Two files, one version (see
  [`../../meta/MAINTAINERS.md`](../../meta/MAINTAINERS.md)).

There is no per-skill `.claude-plugin/plugin.json`: the skill installs through the subgroup's
`reviews-skills` plugin, as `skills/docs/` and `skills/scrolls/` skills do.

## Tests

```bash
python3 -m pytest skills/development/reviews/code-review/tests
```

## Adding a language

1. Add a test first: the language's extensions in `test_extensions_map_to_languages`, and its
   name in the list in `test_every_language_has_its_reference_folder_with_the_three_files`.
   Run the tests and see them fail.
2. Add the language to `LANGUAGES` in `scripts/detect_languages.py` (and to `_INTERPRETERS` if
   scripts in it start with a `#!` line).
3. Create `references/review_<language>/` with `REVIEW.md`, `PATTERNS.md` and `TOOLING.md`,
   following an existing folder's section order. The folder name is `review_` plus the key used
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
  suggested fixes; a broken one is worse than none. Extract the fenced blocks and run them through
  `python3 -m ast`, `node --check`, `tsc`, `rustfmt --check`, `bash -n` and `shellcheck`, the
  PowerShell parser, and `sqlfluff parse`, as fits.
- **Version gates are stated where a fix needs a recent version** ("Python 3.11+", "Node 17.3+",
  "Rust 1.80+", "PowerShell 7"), because the skill must not suggest code the project can't run.
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
- **Why `review_powershell-script` and `review_shellscript`:** the folder names follow the
  language names the skill was specified with.
