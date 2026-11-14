# run-code-review

Runs a thorough code review of a pull request, branch, diff, set of files or whole repository, at
the bar a senior or staff engineer holds at a large engineering organisation, and returns a
structured report.

- **Languages:** Python, JavaScript, TypeScript, Rust, shell scripts (sh, bash, zsh, ksh),
  PowerShell, SQL, HTML, CSS, Markdown, XML, JSON, YAML and TOML. Each has its own checklist,
  before/after fix patterns, tool commands, security scope and review wisdom. Files in other
  languages get the cross-language review.
- **Tool-first formats:** XML, JSON, YAML and TOML are checked by a parser, formatter or
  validator before they are read, and the report says which tools ran. XML also keeps its
  full review.
- **Security review:** one pass of every full review, or the whole review with `-s`.
- **Scope:** choose the languages with `-l` and the files with `-p`, `-t`, `--local`, `-r` or
  `--base`.
- **Report:** a verdict, then findings ranked `blocker`, `major`, `minor`, `nit`, each with file
  and line, the failure it causes, a confidence level, and a suggested code change where the fix
  is clear. In the chat by default; with `-o`, also as a self-contained HTML page, Markdown or
  JSON, with each finding linked to its line on GitHub or GitLab.
- **Evidence:** every finding is traced or reproduced before it is reported; what wasn't run or
  read is listed.
- **Read-only by default:** it suggests changes. It edits files or posts PR comments only when
  asked.

## Layout

```text
run-code-review/
├── agents/
│   ├── claude-code.yaml          display name and invocation policy
│   └── openai.yaml
├── assets/
│   ├── EXAMPLE.md                example prompts and their outputs, one per option
│   ├── report-example.json       a complete report as JSON (Example-01's)
│   └── report-template.html      the page render_report.py fills in for -o report.html
├── meta/
│   └── MAINTAINERS.md
├── references/
│   ├── CROSS_LANGUAGE.md         the questions for each review pass, for any language
│   ├── REPORT_TEMPLATE.md        the report structure and the rules for filling it in
│   ├── report.schema.json        the report as JSON, for -o and for other tools
│   ├── SEVERITY.md               severities, confidence levels, and the verdict they produce
│   └── review_<language>/        REVIEW.md  PATTERNS.md  TOOLING.md  SECURITY.md  WISDOM.md
│                                 one folder each for: python, javascript, typescript, rust,
│                                 shellscript, powershell-script, sql, html, css, markdown,
│                                 xml, json, yaml, toml
├── scripts/
│   ├── check_formats.py          syntax check for the tool-first formats; lists linters on PATH
│   ├── detect_languages.py       files under review -> languages and the references to read
│   └── render_report.py          report JSON -> HTML, Markdown or JSON, with line links
├── tests/
│   ├── test_check_formats.py
│   ├── test_detect_languages.py
│   └── test_render_report.py
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
| `SECURITY.md` | The language's security scope: where untrusted data enters, the checks, tools, and what the review does not establish | For the security pass, and alone (with `WISDOM.md`) under `-s` |
| `WISDOM.md` | Constraints, Traps, Ditches and Wisdom for reviewing that language | First, for every review |

- **Runtime instructions**: [`SKILL.md`](SKILL.md)
- **Development notes**: [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md)
- **Version history**: [`CHANGELOG.md`](CHANGELOG.md)
- **Skill subgroup**: [`../README.md`](../README.md)

## Usage

Invoke as `/run-code-review`, or ask for a review in plain words ("review this PR", "check my changes
before I merge"). Say what to review; with nothing named, it reviews the current branch against
the default branch plus uncommitted work.

```text
/run-code-review                              the current branch and uncommitted changes
/run-code-review PR 128                       a pull request
/run-code-review src/billing/                 a folder, in full
/run-code-review the repo, security first     a whole repository, with a priority
/run-code-review -l py,sql                    only the Python and SQL in the current changes
/run-code-review -s                           a security review alone
/run-code-review -p src -r -l ts -s           security review of the TypeScript under src/
/run-code-review -t -l json,yaml,toml,xml     every tracked configuration file, tools first
```

See [assets/EXAMPLE.md](assets/EXAMPLE.md) for example `/run-code-review` prompts and their outputs:
each option, the options combined, and a complete report.

| Option | Meaning |
| --- | --- |
| `-l`, `--lang <list>` | Only these languages, comma-separated: `py,js,ts,sh,ps1,html,sql,xml,css,rs,md,json,yaml,toml` or the full names. `-l` alone, or no `-l`, means all. |
| `-s`, `--security` | Security review alone. |
| `-p`, `--path <path>` | This file or folder (repeatable). In a git checkout, ignored files are left out. |
| `-t`, `--reporoot` | Every tracked file in the repository. |
| `--local` | The current folder. No short form: `-l` is `--lang`. |
| `-r`, `--recurse` | With `-p` or `--local`: include subfolders. |
| `--base <ref>` | What changed against a git ref, plus untracked files. |
| `-o`, `--output [<path>]` | Also write the report: `.html`, `.md` or `.json` by extension; a folder (or `-o` alone) gets a dated `.html`. Repeatable. |
| `-f`, `--force` | With `-o`: overwrite a different file. |
| `--open` | With `-o`: open the HTML report. |
| `--host-type github\|gitlab` | With `-o`: the code host for line links, when its name doesn't say. |

At most one of `-p`, `-t` and `--local`; `-l`, `-s` and `-r` combine with any of them.

Install it with `npx skills add sugatoray/aiskills` (choose `run-code-review`), or as part of the
`review-skills` Claude Code plugin; see [`../README.md`](../README.md).

## The scripts

`scripts/detect_languages.py` is what the skill runs to decide which references to load. It needs
only Python 3 and, for `--base` and `-t`, git:

```bash
python3 scripts/detect_languages.py --base origin/main      # files changed against a ref, plus untracked
python3 scripts/detect_languages.py src/app.py db/001.sql   # explicit paths
git ls-files | python3 scripts/detect_languages.py -        # paths on stdin
python3 scripts/detect_languages.py --json --base main      # JSON instead of text
python3 scripts/detect_languages.py -p src -r -l py,sql -s  # a folder, two languages, security references
```

It names each file from the folder it runs in, so every path opens as printed, including with
`-t` and `--base` in a subfolder (`../x.py`). It goes by file extension, then by the `#!` line for
files without one. Vendored and generated
files (`node_modules/`, `dist/`, `target/`, `*.min.js`, `*_pb2.py`, …) are listed as `skipped`,
lock files likewise, files in other languages as `unsupported`, and files that `--lang` left out
as `filtered`, so nothing drops out of the review unnoticed. When `-p` or `--local` walks a folder,
files git ignores are left out, and a vendored folder is listed once (`node_modules/`) instead of
file by file; the text output shows the first 20 names of each list and `--json` shows all.

`scripts/check_formats.py` takes the same flags and syntax-checks the tool-first formats with
Python's standard library: JSON (duplicate keys, `NaN` and `Infinity` are errors), TOML (Python
3.11 or later), XML (well-formedness; entities are never expanded) and YAML (only when PyYAML
is importable; a duplicate key is an error). Each file is `ok`, `error` or `unchecked`, and the output ends with which
linters and validators are on `PATH`. It installs nothing and runs no external program.

```bash
python3 scripts/check_formats.py -t                         # every tracked json, toml, xml, yaml file
python3 scripts/check_formats.py -p config -r -l yaml       # YAML under config/
```

`scripts/render_report.py` turns the report, written as JSON (`references/report.schema.json`), into
the files `-o` asks for. It checks the report first (required fields; a verdict that agrees with the
findings) and writes nothing if it is invalid:

```bash
python3 scripts/render_report.py report.json                       # Markdown to stdout
python3 scripts/render_report.py report.json -o review.html        # a self-contained page
python3 scripts/render_report.py report.json -o . -o review.json   # dated .html here, plus JSON
python3 scripts/render_report.py report.json -o r.html --host-type gitlab   # a self-hosted GitLab
```

The HTML page needs no network and runs nothing from the report: the report is embedded as
escaped JSON and every element is built as text, so code quoted from the reviewed project is
shown, never run. Its title bar, verdict and severity counts stay pinned while you scroll, and the
verdict card collapses to one line. A search box (press `/`) searches the whole report and jumps to
each hit. It has severity and file filters, a text filter, copy buttons, the checks that ran, and a
light/dark switch like the docs site's. Each finding links to its line at the reviewed commit, on the
remote the branch tracks (else `origin`): GitHub or GitLab by the host name, or `--host-type` for
a server whose name doesn't say. A link is left out when it would be wrong (the commit is not
pushed, the file changed since it or is untracked), and the report says why. Credentials in a
remote URL never reach the report. Exit codes: 0 written, 2 usage error or invalid report, 3 a
different file is already there (`-f` overwrites).
