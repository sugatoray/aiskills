# code-review

Runs a thorough code review of a pull request, branch, diff, set of files or whole repository, at
the bar a senior or staff engineer holds at a large engineering organisation, and returns a
structured report.

- **Languages:** Python, JavaScript, TypeScript, Rust, shell scripts (sh, bash, zsh, ksh),
  PowerShell and SQL. Each has its own checklist, before/after fix patterns and tool commands.
  Files in other languages get the cross-language review.
- **Report:** a verdict, then findings ranked `blocker`, `major`, `minor`, `nit`, each with file
  and line, the failure it causes, a confidence level, and a suggested code change where the fix
  is clear.
- **Evidence:** every finding is traced or reproduced before it is reported; what wasn't run or
  read is listed.
- **Read-only by default:** it suggests changes. It edits files or posts PR comments only when
  asked.

## Layout

```text
code-review/
├── agents/
│   ├── claude-code.yaml          display name and invocation policy
│   └── openai.yaml
├── meta/
│   └── MAINTAINERS.md
├── references/
│   ├── CROSS_LANGUAGE.md         the questions for each review pass, for any language
│   ├── REPORT_TEMPLATE.md        the report structure and the rules for filling it in
│   ├── SEVERITY.md               severities, confidence levels, and the verdict they produce
│   ├── review_python/            REVIEW.md  PATTERNS.md  TOOLING.md
│   ├── review_javascript/        REVIEW.md  PATTERNS.md  TOOLING.md
│   ├── review_typescript/        REVIEW.md  PATTERNS.md  TOOLING.md
│   ├── review_rust/              REVIEW.md  PATTERNS.md  TOOLING.md
│   ├── review_shellscript/       REVIEW.md  PATTERNS.md  TOOLING.md
│   ├── review_powershell-script/ REVIEW.md  PATTERNS.md  TOOLING.md
│   └── review_sql/               REVIEW.md  PATTERNS.md  TOOLING.md
├── scripts/
│   └── detect_languages.py       files under review -> languages and the references to read
├── tests/
│   └── test_detect_languages.py
├── CHANGELOG.md
├── README.md
└── SKILL.md
```

In each language folder:

| File | Holds | Read |
| --- | --- | --- |
| `REVIEW.md` | What to look for in that language, and why each item matters | Before reviewing that language's files |
| `PATTERNS.md` | Before/after code for the fixes that come up most | When writing suggested changes |
| `TOOLING.md` | Linters, type checkers and test commands, and how to read their output | Before running any of them |

- **Runtime instructions**: [`SKILL.md`](SKILL.md)
- **Development notes**: [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md)
- **Version history**: [`CHANGELOG.md`](CHANGELOG.md)
- **Skill subgroup**: [`../README.md`](../README.md)

## Usage

Invoke as `/code-review`, or ask for a review in plain words ("review this PR", "check my changes
before I merge"). Say what to review; with nothing named, it reviews the current branch against
the default branch plus uncommitted work.

```text
/code-review                              the current branch and uncommitted changes
/code-review PR 128                       a pull request
/code-review src/billing/                 a folder, in full
/code-review the repo, security first     a whole repository, with a priority
```

Install it with `npx skills add sugatoray/aiskills` (choose `code-review`), or as part of the
`reviews-skills` Claude Code plugin; see [`../README.md`](../README.md).

## The language detector

`scripts/detect_languages.py` is what the skill runs to decide which references to load. It needs
only Python 3 and, for `--base`, git:

```bash
python3 scripts/detect_languages.py --base origin/main      # files changed against a ref, plus untracked
python3 scripts/detect_languages.py src/app.py db/001.sql   # explicit paths
git ls-files | python3 scripts/detect_languages.py -        # paths on stdin
python3 scripts/detect_languages.py --json --base main      # JSON instead of text
```

It goes by file extension, then by the `#!` line for files without one. Vendored and generated
files (`node_modules/`, `dist/`, `target/`, `*.min.js`, `*_pb2.py`, …) are listed as `skipped`,
and files in other languages as `unsupported`, so nothing drops out of the review unnoticed.
