---
name: run-code-review
description: "Runs a thorough, evidence-based code review of a pull request, branch, diff, set of files or whole repository, at the bar a senior or staff engineer holds at a large engineering organisation, and returns a structured report: a verdict, findings ranked by severity (blocker, major, minor, nit) with file and line, the failure each one causes, and a concrete suggested code change wherever a fix is clear. Covers Python, JavaScript, TypeScript, Rust, shell scripts (sh, bash, zsh), PowerShell, SQL, HTML, CSS, Markdown, XML, JSON, YAML and TOML, each with its own checklist, fix patterns, tool commands, security scope and review wisdom under references/review_<language>/; XML, JSON, YAML and TOML are checked with tools first; files in other languages get the cross-language review only. Options: -l/--lang limits the review to chosen languages, -s/--security runs a security review alone, and -p, -t, --local, -r and --base choose which files are reviewed; -o writes it as HTML, Markdown or JSON with line links. Use this whenever the user asks to review code, review a PR or merge request, do a code review or security review, audit or critique code, check a change before merging, look for bugs, security problems or bad practices in code, or invokes /run-code-review, even when they don't name a language. It reviews and suggests; it changes files or posts review comments only when asked."
license: MIT
compatibility: "Read access to the code under review. git for diff-based scope (2.30 or later for --base). python3 (standard library only) for scripts/detect_languages.py, scripts/check_formats.py and scripts/render_report.py. The linters, type checkers and test runners named in each TOOLING.md are used when the project already has them; none is required."
metadata:
  name: run-code-review
  type: skill
  author: sugatoray
  version: "1.2.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/development/review/run-code-review"
---

# Code review

Reviews code the way a senior or staff engineer reviews it at Microsoft, AWS, Amazon, Google,
Netflix, Meta, Anthropic or OpenAI: for what will break, leak, corrupt data, page someone at 3 a.m.
or slow the next engineer down, and with a fix attached wherever one is clear. The output is a
structured report, not a stream of remarks.

Paths below (`references/…`, `scripts/…`) are relative to this skill's folder.

See [assets/EXAMPLE.md](assets/EXAMPLE.md) for example `/run-code-review` prompts and their outputs.

## The bar you hold

Engineers at that level are not distinguished by knowing more style rules. Hold yourself to what
they do differently:

- **Read for failure, not for taste.** For each piece of code ask: what input, timing, load or
  partial failure makes this wrong? Who finds out, and how late? A finding names that scenario.
- **Evidence or it isn't a finding.** Every finding cites a file and line you read and a concrete
  way it goes wrong. Reproduce it or trace it through the code. If you can't, say so with a lower
  confidence, or drop it. Never report a problem in code you haven't opened.
- **Proportion.** Spend the review where the risk is: money, auth, data writes, concurrency,
  public interfaces, migrations, anything hard to undo. A report with three real problems is worth
  more than one with thirty remarks. Leave to the formatter and linter what they already enforce.
- **Review the change against its purpose.** Does it do what the description, issue or commit
  message says, completely? Missing cases and missing tests are findings as much as wrong lines.
- **Think one level up.** Is this the right place and the right shape for the change? Will it
  still hold at ten times the data, with a second caller, during a deploy, on retry? Say so when
  the design is the problem, and say what you'd do instead.
- **Respect the codebase.** Judge against the project's own conventions, supported versions and
  constraints first, general best practice second. A suggestion the project can't adopt (newer
  syntax than its minimum version, a dependency it avoids) is noise.
- **Be direct and useful.** State the problem and the fix. No hedging to soften it, no praise to
  pad it. Write about the code, never the author.
- **Approve when it's good.** The goal is code health improving over time, not perfection. If the
  change is sound, say so plainly and keep the nits few and marked as optional.

## Options

`/run-code-review [scope] [-l <languages>] [-s] [-o <path>]`. With no option it reviews every
supported language in the current branch's changes, in full, and gives the report in the chat.

| Option | Meaning |
| --- | --- |
| `-l`, `--lang <list>` | Review only these languages: a comma-separated list of names or short forms, such as `py,js,ts,sh,ps1,html,sql,xml,css,rs,md,json,yaml,toml`. `-l` with no list, or no `-l` at all, means every language. |
| `-s`, `--security` | Security review alone (see "Security-only review" below). |
| `-p`, `--path <path>` | Review this file or folder. Repeatable. A folder means the files directly in it, unless `-r` is given. In a git checkout, files git ignores are left out. |
| `-t`, `--reporoot` | Review every tracked file in the repository. |
| `--local` | Review the files in the current folder. It has no short form: `-l` is `--lang`. |
| `-r`, `--recurse` | With `-p` or `--local`: include subfolders. |
| `--base <ref>` | Review what changed against this git ref, plus untracked files. |
| `-o`, `--output [<path>]` | Also write the report to a file. The extension sets the format: `.html` (a self-contained page), `.md` or `.json`. A folder, or `-o` alone for the current folder, gets `run-code-review-<title>-<date>.html`. Repeatable. |
| `-f`, `--force` | With `-o`: overwrite a different file. Without it, an existing file is kept and nothing is written. |
| `--open` | With `-o`: open the HTML report afterwards. |
| `--host-type github\|gitlab` | With `-o`: the code host to link findings to, when the remote's host name doesn't say (a self-hosted `git.acme.com`, say). |

Use at most one of `-p`, `-t` and `--local`. `-l`, `-s` and `-r` combine with any of them, so
`/run-code-review -p src -r -l py,sql -s` is a security review of the Python and SQL under `src/`.
The detector and `check_formats.py` take the same scope flags, so pass the user's options through
unchanged; `-o`, `-f`, `--open` and `--host-type` go to `render_report.py` in step 8. When the user
describes the scope in words instead, map it to these options.

## Workflow

### 1. Fix the scope

Decide exactly what is under review before reading any code:

| The user gave you | Review |
| --- | --- |
| A PR or merge request | Its diff against the base branch, plus its description, linked issues and existing review comments |
| A branch, or "my changes" (`--base <ref>`) | `git diff --merge-base <base>` plus uncommitted and untracked files |
| Files or a folder (`-p`, `--local`, with `-r` for subfolders) | Those files in full |
| "The repo" or "the codebase" (`-t`) | Everything tracked, minus vendored and generated code; for a large repo, agree on a priority order first (entry points, auth, data access, money, public API) and say what you didn't reach |

If nothing is named, review the current branch against the default branch plus uncommitted work.
If that is empty too, ask what to review. Read the PR description, linked issue and commit
messages: a review needs to know what the change is *for*.

### 2. Detect the languages and load their references

Run the detector on the files in scope. It lists each language, its files, and the reference
files to read:

```bash
python3 scripts/detect_languages.py --base origin/main           # changed files in a git checkout
python3 scripts/detect_languages.py -p src -r -l py,sql          # Python and SQL under src/
python3 scripts/detect_languages.py -t -s                        # the whole repository, security only
python3 scripts/detect_languages.py src/app.py db/001.sql        # explicit paths
```

These paths are relative to this skill's folder. Run the script from the project under review,
by its full path: `python3 <skill-dir>/scripts/detect_languages.py --base origin/main`. It names
every file from the folder it runs in, so with `-t` or `--base` in a subfolder a file higher up
reads `../x.py`. A folder that `-p` or `--local` walks leaves out what git ignores, and a vendored
folder such as `node_modules/` is listed once as `skipped`, not file by file.

For each language it reports, read:

- `references/review_<language>/WISDOM.md` — first, and for every review. Constraints the
  review must stay within, traps in the language, ditches a review falls into, and the
  judgement that keeps it on the road.
- `references/review_<language>/REVIEW.md` — before reviewing that language's files. The
  checklist of what to look for and why.
- `references/review_<language>/SECURITY.md` — for the security pass in step 5. The
  language's security scope: where untrusted data enters, what to check, which tools help,
  and what the review does not establish.
- `references/review_<language>/PATTERNS.md` — when you write suggested changes. Before/after
  pairs for the fixes that come up most.
- `references/review_<language>/TOOLING.md` — before running any linter, type checker or test.

| Language | `--lang` value | Folder | Files |
| --- | --- | --- | --- |
| Python | `python`, `py` | `references/review_python/` | `.py`, `.pyi` |
| JavaScript | `javascript`, `js` | `references/review_javascript/` | `.js`, `.mjs`, `.cjs`, `.jsx` |
| TypeScript | `typescript`, `ts` | `references/review_typescript/` (and the JavaScript `REVIEW.md` and `SECURITY.md`) | `.ts`, `.tsx`, `.mts`, `.cts` |
| Rust | `rust`, `rs` | `references/review_rust/` | `.rs` |
| Shell (sh, bash, zsh, ksh) | `shellscript`, `sh` | `references/review_shellscript/` | `.sh`, `.bash`, `.zsh`, `.ksh` |
| PowerShell | `powershell-script`, `ps1` | `references/review_powershell-script/` | `.ps1`, `.psm1`, `.psd1` |
| SQL | `sql` | `references/review_sql/` | `.sql` |
| HTML | `html` | `references/review_html/` | `.html`, `.htm` |
| CSS | `css` | `references/review_css/` | `.css`, `.scss`, `.less` |
| Markdown | `markdown`, `md` | `references/review_markdown/` | `.md`, `.markdown` |
| XML (tool-first) | `xml` | `references/review_xml/` | `.xml`, `.xsd`, `.xsl`, `.xslt` |
| JSON (tool-first) | `json` | `references/review_json/` | `.json`, `.jsonc`, `.json5` |
| YAML (tool-first) | `yaml`, `yml` | `references/review_yaml/` | `.yaml`, `.yml` |
| TOML (tool-first) | `toml` | `references/review_toml/` | `.toml` |

Read only the folders for languages that are present. The detector goes by file extension and
`#!` line, so also look for code embedded in other files and load that language's references too:
SQL inside application strings or ORM calls, shell inside CI workflows, Dockerfiles and
Makefiles, PowerShell inside pipeline YAML.

Files the detector lists as `unsupported` (Go, Java, Dockerfiles, and so on) still get the
cross-language review in step 5; say in the report that no language checklist was applied to
them. Files it lists as `skipped` are vendored, generated or lock files: don't review them, but
do flag one that was edited by hand. Files it lists as `filtered` are in a supported language
that `--lang` left out: don't review them, and name the filter in the report.

### 3. Build context

A diff shows what changed, not what it broke. Before judging:

- Read every changed file in full, not only the hunks.
- For each changed function, type, table or command-line flag, find its callers and what it
  calls (`git grep`, the language server, or reading). Changed behaviour with unchanged callers
  is where regressions hide.
- Read the tests that cover the change, and note what has none.
- Find the project's rules: `CONTRIBUTING`, `AGENTS.md`/`CLAUDE.md`, linter and formatter config,
  the minimum language or runtime version, CI workflows. These define "correct here".

### 4. Run what the project already runs

Use `TOOLING.md` for the language. Run the project's own configured checks (tests, type checker,
linter) on the code under review when they are installed and safe to run, and record each
command and its result. Rules:

- Don't install tools into the project, change its config, or run anything that writes outside
  it, touches a real database, or needs credentials, unless the user says to.
- A tool's output is a lead, not a finding. Confirm it in the code and judge whether it matters.
- If you couldn't run something, say so in the report. Don't imply checks you didn't make.

**Tool-first formats.** XML, JSON, YAML and TOML are marked `tool-first` by the detector. A
parser, formatter or schema validator judges their syntax, formatting and validity better and
far more cheaply than reading does, so for these:

1. Run the syntax check, which needs nothing installed, on the same scope:

   ```bash
   python3 scripts/check_formats.py -p config -r      # same flags as the detector
   ```

   It reports each file as `ok`, `error` or `unchecked`, and lists which linters and validators
   are on `PATH`. It parses only: it never installs, formats, fetches or expands entities.
2. Run the further checks in the language's `TOOLING.md`, in its order of preference: the
   tool that reads the file, then the project's own linter configuration, then a standard
   tool that is already installed.
3. Report each tool that ran, with its version and result. `unchecked` is not `ok`: YAML has
   no parser in Python's standard library, and TOML has one only from Python 3.11, so name
   the files that nothing parsed.
4. Then read for what no tool judges: a wrong value, a compatibility break, a dangerous
   setting, a secret. A parse `error` is a finding; confirm it and rate it like any other.

Tool-first changes the order of work, not the depth. XML keeps its full review: every section
of `references/review_xml/REVIEW.md` and `SECURITY.md` still applies after the tools have run.

### 5. Review in passes

Go through the code once per concern, in this order; the order is the priority.
`references/CROSS_LANGUAGE.md` has the questions for each pass, and applies to every language;
each `REVIEW.md` adds the language's own traps.

1. **Correctness** — logic, edge cases, error paths, state.
2. **Security** — untrusted input, authn/authz, secrets, injection, unsafe defaults.
3. **Data integrity and concurrency** — races, transactions, idempotency, partial failure.
4. **Failure handling and operability** — timeouts, retries, cleanup, logs, rollout and rollback.
5. **Design and interfaces** — fit with the codebase, coupling, API and schema compatibility.
6. **Performance and cost** — complexity on realistic sizes, I/O in loops, memory, queries.
7. **Tests** — do they exist, can they fail, do they cover the risky paths?
8. **Readability and maintainability** — names, structure, comments that explain why.
9. **Language idioms** — what the language's checklist adds.

### 6. Verify every finding

Before a finding goes in the report:

- **Check it is real.** Trace the path that triggers it, or run it. Check for a guard elsewhere
  (a caller that validates, a constraint in the schema, a wrapper). Look for a comment or commit
  message explaining why the code is the way it is.
- **Set its confidence**: `confirmed` (reproduced, or traced end to end), `likely` (the code
  reads that way, not exercised), or `to verify` (depends on something you couldn't see; say
  what). Don't present a `to verify` as fact.
- **Set its severity** with `references/SEVERITY.md`. Severity is impact times likelihood, not
  how strongly you feel.
- **Say whether the change introduced it.** Problems that were already there go under
  "Pre-existing issues", and don't count toward the verdict unless the change makes them worse.
- **Merge duplicates.** One finding per root cause, listing every location.

### 7. Write the suggested changes

For each finding with a clear fix, give the code, not a description of it:

- The smallest change that fixes the problem, in the file's existing style, valid for the
  project's minimum language version. Use `PATTERNS.md` for the idiomatic shape.
- A `diff` block, or the replacement for the exact lines cited, so it can be applied as is.
- If the fix needs a test, write the test. If it has a trade-off or changes behaviour for
  callers, say so.
- Check your suggestion: at least re-read it against the surrounding code; where you can, run
  it (syntax check, type check, the affected test). A suggested fix that doesn't compile costs
  the author more than no suggestion.
- When there are several reasonable fixes, or the right one is a design decision, lay out the
  options and recommend one instead of writing code for a guess.

Don't edit the files under review, commit, or post comments to the PR unless the user asked for
that. If they did, apply or post only the findings they chose, and re-run the checks from step 4.

### 8. Report

Write the report with `references/REPORT_TEMPLATE.md`: verdict first, then findings from most to
least severe, each with location, problem, impact, suggested change and confidence. Keep the
template's section order so reports are comparable from one review to the next. Give the report
in the chat by default.

With `-o`, or when the user asks for the report as a file or page, write the same report as JSON
following `references/report.schema.json` (fields named as in the template; `assets/report-example.json`
is a complete one) to a temporary file outside the project, and render it from the project's folder:

```bash
python3 scripts/render_report.py /tmp/run-code-review-report.json -o <path> [-f] [--open] [--host-type github|gitlab]
```

It checks the report (the verdict must agree with the findings), writes each `-o` file, and links
every finding to its line at the reviewed commit on GitHub or GitLab, chosen from the remote the
branch tracks. It leaves a link out where it would be wrong (commit not pushed, file changed since,
host unknown) and says why. Exit 3 means a different file is already there: tell the user and
offer `-f`. Then give in the chat the verdict, the counts, the path of each file written and the
line-links line it printed, not the whole report again.

## Security-only review

With `-s`/`--security`, or when the user asks for a security review alone:

- The detector lists only `SECURITY.md` and `WISDOM.md` for each language (and the JavaScript
  `SECURITY.md` for TypeScript). Read those, and the Security section of
  `references/CROSS_LANGUAGE.md`.
- Steps 1 to 4 are unchanged: scope, context and the project's own checks matter as much. In
  step 4 run the commands under "Tools" in each `SECURITY.md`.
- In step 5 do the security pass only, across the whole scope. Follow untrusted data from where
  it enters to where it is used. Report a correctness or reliability defect only when it has a
  security consequence.
- Steps 6 to 8 are unchanged. Open the report's summary by saying it is a security-only review,
  and copy what applies from each "What this review does not establish" list into "Not run /
  not reviewed". A clean result means no finding in what was read; it is not an audit.

## What this skill doesn't do

- It doesn't replace the project's tests, CI, or a security audit or penetration test. Say so
  when a change needs one (new crypto, auth flows, payment logic).
- It doesn't certify code it didn't read. Anything out of scope or unreached is listed as such.
- It doesn't rewrite the change. Suggestions fix findings; a different design is proposed in
  words, for the author to decide.
