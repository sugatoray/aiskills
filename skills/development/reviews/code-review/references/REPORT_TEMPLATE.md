# Report template

Use this structure for every review, in this order. Drop a section only where the template says
it may be dropped. Fill every `<placeholder>`; delete the guidance in parentheses.

````markdown
# Code review: <what was reviewed — PR title and number, branch, or path>

**Verdict: <Request changes | Approve with comments | Approve | No verdict>** — <one sentence: the reason>

<Two to four sentences: what the change does, whether it achieves it, and the one or two things
the author most needs to know.>

| Severity | Count |
| --- | --- |
| Blocker | <n> |
| Major | <n> |
| Minor | <n> |
| Nit | <n> |

## Scope and method

- **Mode:** <Full review | Security-only review (`-s`)>
- **Reviewed:** <base..head, commit, or file list; number of files and roughly how many lines>
- **Languages:** <language (n files), …; files with no language checklist, if any; and any `--lang` filter with the number of files it left out>
- **Checks run:** <each command, the tool's version, and its result, e.g. `pytest -q` — 212 passed; `ruff check` — 3 findings, 1 used below; `check_formats.py` — 14 ok, 1 error, 2 unchecked (no YAML parser)>
- **Not run / not reviewed:** <what you couldn't run or didn't read, and why — or "nothing">

## Findings

| # | Severity | Where | Finding |
| --- | --- | --- | --- |
| 1 | Blocker | `path/to/file.py:42` | <one line> |
| 2 | Major | `path/to/query.sql:10-18` | <one line> |

### 1. <Short title stating the problem> — Blocker

- **Where:** `path/to/file.py:42-47` (`function_or_symbol`)
- **Confidence:** <confirmed | likely | to verify> — <how you know, or what would settle it>
- **Problem:** <What the code does, and what it should do. Quote the line if it helps.>
- **Impact:** <The concrete failure: which input or timing triggers it, and what happens — wrong
  result, exception, data lost, access granted, latency.>
- **Suggested change:**

  ```diff
  - <current lines>
  + <replacement lines>
  ```

  <One or two sentences on why this fix, any trade-off, and the test that should accompany it.>

### 2. <Title> — Major

(Same fields. Order findings by severity, then by file. Every blocker and major gets a full
entry. A minor may be one short paragraph: where, what is wrong, the fix. Give nits one line each
in a single list under a "Nits" heading; they are counted in the summary but left out of the
findings table.)

## Questions

(Things you need answered to finish judging. Each says what it becomes depending on the answer.
Drop the section if there are none.)

- `path/to/file.ts:88` — <question>? If not, this is a <severity>: <why>.

## Tests

<Are the risky paths covered? Name the cases that are missing, as a list an author can turn into
tests. Say so if the existing tests are good.>

## Pre-existing issues

(Problems that were already there, found while reviewing. Not part of the verdict. Drop the
section if there are none.)

- `path/to/file.rs:120` — <severity it would have>: <one line>.

## What works well

(At most three specific points worth keeping or repeating elsewhere — a design choice, a
thorough test, a tricky case handled. Drop the section instead of writing generic praise.)

## Suggested order of work

1. <The blocker and major fixes, in the order that unblocks the rest.>
2. <What can follow in a later change.>
````

## Rules for filling it in

- **Verdict and counts match the findings.** Recount after editing. `references/SEVERITY.md`
  defines which verdict the findings produce.
- **Locations are exact:** `path:line` or `path:start-end`, from the version under review, in a
  form the reader can click or paste. For a diff, use the new file's line numbers.
- **One finding per root cause.** If the same mistake is in five places, write it once and list
  the five locations.
- **Every finding has an impact.** If you can't write what goes wrong, it isn't a finding yet.
- **Suggested changes are code** whenever the fix is clear: a `diff` block against the cited
  lines, or a complete replacement for them. When the right fix is a design decision, give the
  options and your recommendation instead.
- **No finding without a suggestion or a question.** If you don't know the fix, say what you'd
  investigate.
- **Keep the author's time in mind.** Put the summary where it will be read first, keep each
  finding to what is needed to understand and fix it, and don't repeat the diff back.

## Short form

For a small change (under about fifty changed lines, no findings above `minor`) the report may
be shortened to: the verdict line, the summary, "Scope and method" as one or two lines, and the
findings as a list of `path:line — severity — problem — fix`. Keep the full form whenever there
is a `blocker` or `major`.

## Posting to a pull request

Only when the user asks. Then: one top-level review comment with the verdict, summary and counts,
and one inline comment per finding on its line, each starting with the severity
(`Blocker:`, `Major:`, `Minor:`, `Nit:`). Where the host supports suggested changes (GitHub's
` ```suggestion ` blocks), use one for fixes that replace the commented lines exactly, so the
author can apply it with a click. Use the host's "request changes", "comment" or "approve" state
that matches the verdict.
