# Examples: `/code-review`

List of example prompts and their outputs for the usage of `/code-review` skill.

**How to read these examples**

- Every example uses one small demo repository, described next.
- Command output (the detector, `check_formats.py`, linters, reproductions) is real: each command
  was run on the demo repository and its output pasted. To save width, `read:` lines show file
  names only; each is `references/review_<language>/<file>`.
- The report in Example-01 was written by following the skill on a repository seeded with these
  defects, by the skill's author. It shows the form of a report. It does not measure how many
  defects the skill finds in code it has not seen.

**The demo repository**

```text
shop/                          branch feature/search, one commit ahead of main
├── .github/workflows/ci.yml   new on the branch
├── app/users.py               changed: adds search_users()
├── config/settings.json       changed
├── scripts/deploy.sh          new on the branch
├── web/render.js              new on the branch
├── README.md                  unchanged
└── notes.xml                  untracked
```

| Example | Prompt | Shows |
| --- | --- | --- |
| [01](#example-01) | `/code-review` | A full review of the current branch, with the whole report |
| [02](#example-02) | `/code-review -l py,sh` | Limit the review to chosen languages |
| [03](#example-03) | `/code-review -s` | A security review alone |
| [04](#example-04) | `/code-review -s -l js,yaml` | Security review of chosen languages |
| [05](#example-05) | `/code-review -p app -p scripts` | Chosen folders, with and without `-r` |
| [06](#example-06) | `/code-review -t -l json,yaml,toml,xml` | Whole repository; tool-first formats |
| [07](#example-07) | `/code-review --local` | The current folder; bare `-l` |
| [08](#example-08) | Plain words | No flags at all |
| [09](#example-09) | Mistakes | What a wrong flag returns |
| [10](#example-10) | Follow-ups | Apply fixes; post to a pull request |

<!--- example:start --->
## Example-01

A full review of the current branch: what changed against the default branch, plus uncommitted
and untracked files.

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-12"
##   agent: "devin"
## ---

/code-review
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

1️⃣ The skill finds the languages in scope and the references to read
(`python3 scripts/detect_languages.py --base main`).

```text
javascript (1 file)
  read: REVIEW.md, PATTERNS.md, TOOLING.md, SECURITY.md, WISDOM.md
  - web/render.js
json (1 file) [tool-first: run the checks in TOOLING.md before reading]
  read: REVIEW.md, PATTERNS.md, TOOLING.md, SECURITY.md, WISDOM.md
  - config/settings.json
python (1 file)
  read: REVIEW.md, PATTERNS.md, TOOLING.md, SECURITY.md, WISDOM.md
  - app/users.py
shellscript (1 file)
  read: REVIEW.md, PATTERNS.md, TOOLING.md, SECURITY.md, WISDOM.md
  - scripts/deploy.sh
xml (1 file) [tool-first: run the checks in TOOLING.md before reading]
  read: REVIEW.md, PATTERNS.md, TOOLING.md, SECURITY.md, WISDOM.md
  - notes.xml
yaml (1 file) [tool-first: run the checks in TOOLING.md before reading]
  read: REVIEW.md, PATTERNS.md, TOOLING.md, SECURITY.md, WISDOM.md
  - .github/workflows/ci.yml
```

2️⃣ It checks the tool-first formats before reading them
(`python3 scripts/check_formats.py --base main`, exit code 1).

```text
ok     .github/workflows/ci.yml [python yaml (PyYAML)]
error  config/settings.json [python json]: duplicate key: 'debug'
ok     notes.xml [python expat]
2 ok, 1 with errors, 0 unchecked
tools on PATH: xmllint, xsltproc, jq, actionlint
not found: yamllint, taplo, prettier, check-jsonschema
```

3️⃣ It runs the linters the machine has, reads the code, confirms each finding, and reports.

````markdown
# Code review: branch `feature/search` against `main` ("Add user search")

**Verdict: Request changes** — the new search is open to SQL injection and returns other
searches' rows, and the new workflow runs pull-request code with the repository's token.

The branch adds a user search (`search_users`), a results renderer, a deploy script, a settings
change and a CI workflow. The search works for a plain name on its first call only. Fix findings
1 to 3 before merge; 4 to 6 are small changes that belong in the same pull request.

| Severity | Count |
| --- | --- |
| Blocker | 3 |
| Major | 3 |
| Minor | 0 |
| Nit | 0 |

## Scope and method

- **Mode:** Full review
- **Reviewed:** `main..feature/search` (5 files, 33 lines added, 1 removed) and 1 untracked file
- **Languages:** python (1 file), javascript (1), shellscript (1), json (1), yaml (1), xml (1)
- **Checks run:** `check_formats.py` — 2 ok, 1 error (finding 6); `shellcheck` 0.11.0 — 2 notes,
  used in finding 5; `actionlint` 1.7.12 — 1 error, used in finding 3; `xmllint --noout`
  (libxml 2.9.13) on `notes.xml` — well-formed; findings 1, 2 and 5 reproduced by running the
  code; finding 4 reproduced in Chromium
- **Not run / not reviewed:** the project has no tests to run. No Python or JavaScript linter is
  installed, and none was added. The workflow was not run on GitHub.

## Findings

| # | Severity | Where | Finding |
| --- | --- | --- | --- |
| 1 | Blocker | `app/users.py:13` | The search text is pasted into the SQL statement |
| 2 | Blocker | `app/users.py:12` | A shared default list makes each search return earlier searches' rows |
| 3 | Blocker | `.github/workflows/ci.yml:2-11` | `pull_request_target` checks out and runs the pull request's code |
| 4 | Major | `web/render.js:2` | The query is written into the page as HTML |
| 5 | Major | `scripts/deploy.sh:2-5` | With no argument the script deletes `/releases/old` and reports success |
| 6 | Major | `config/settings.json:3,5` | `debug` is set twice; the second value, `true`, wins |

### 1. The search text is pasted into the SQL statement — Blocker

- **Where:** `app/users.py:13` (`search_users`)
- **Confidence:** confirmed — ran it against an in-memory database with a third column, `secret`.
- **Problem:** `name` goes into the statement through an f-string, so it is read as SQL.
  `find_user`, just above it, uses a `?` parameter.
- **Impact:** `search_users(conn, "x' UNION SELECT secret, name FROM users --")` returned
  `[('s1', 'ann'), ('s2', 'bob')]`: any column of any table. An honest name fails too:
  `o'brien` raises `OperationalError: near "brien": syntax error`.
- **Suggested change:**

  ```diff
  -    rows = conn.execute(f"SELECT id, name FROM users WHERE name LIKE '%{name}%'").fetchall()
  +    rows = conn.execute(
  +        "SELECT id, name FROM users WHERE name LIKE ?", (f"%{name}%",)
  +    ).fetchall()
  ```

  With this change the injection returns `[]` and `o'brien` is found. `%` and `_` in `name`
  still act as wildcards; escape them if that matters. Add a test for a name with a quote.

### 2. A shared default list makes each search return earlier searches' rows — Blocker

- **Where:** `app/users.py:12-15` (`search_users`)
- **Confidence:** confirmed — two calls in one process.
- **Problem:** `seen=[]` is created once, when the function is defined. Every call that leaves
  out `seen` appends to that same list and returns it.
- **Impact:** after one earlier search, a search for `ann` (one match) returned 3 rows. In a
  server, one user's results are returned to the next user, and the list grows until restart.
- **Suggested change:**

  ```diff
  -def search_users(conn, name, seen=[]):
  -    rows = conn.execute(...).fetchall()
  -    seen.extend(rows)
  -    return seen
  +def search_users(conn, name):
  +    return conn.execute(...).fetchall()
  ```

  Nothing in the repository passes `seen`. If a caller needs to accumulate, it can do so itself.

### 3. `pull_request_target` checks out and runs the pull request's code — Blocker

- **Where:** `.github/workflows/ci.yml:2`, `7-11`
- **Confidence:** likely — `actionlint` reports line 10. What the trigger grants is from
  GitHub's documentation; the workflow was not run.
- **Problem:** `pull_request_target` runs with the base repository's token and secrets. The job
  then checks out the pull request's head and runs `python -m pytest` on it. Line 10 also puts
  the pull request title into a shell command.
- **Impact:** anyone who can open a pull request, from a fork too, runs their own code with a
  token that can write to the repository. A title such as `"; curl … | sh #` runs as well.
- **Suggested change:**

  ```diff
  -on: pull_request_target
  +on: pull_request
  +permissions:
  +  contents: read
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
  -        with:
  -          ref: ${{ github.event.pull_request.head.sha }}
  -      - run: echo "Testing ${{ github.event.pull_request.title }}"
  +      - run: echo "Testing $PR_TITLE"
  +        env:
  +          PR_TITLE: ${{ github.event.pull_request.title }}
         - run: python -m pytest
  ```

  `actionlint` passes on this version.

### 4. The query is written into the page as HTML — Major

- **Where:** `web/render.js:2` (`showResults`)
- **Confidence:** confirmed for the function — in Chromium, a query of
  `<img src=x onerror="…">` ran its script. No caller exists yet, so where `query` comes from
  is not known; a search query is normally user input, often from the URL.
- **Problem:** `innerHTML` parses `query` as markup. The user names on line 5 use `textContent`
  and are safe.
- **Impact:** a link with a crafted query runs script in the page of whoever opens it.
- **Suggested change:**

  ```diff
  -  container.innerHTML = `<h2>Results for ${query}</h2>`;
  +  const heading = document.createElement("h2");
  +  heading.textContent = `Results for ${query}`;
  +  container.replaceChildren(heading);
  ```

### 5. With no argument the script deletes `/releases/old` and reports success — Major

- **Where:** `scripts/deploy.sh:2-5`
- **Confidence:** confirmed — ran it with no argument in an empty folder: `cp` failed, the script
  printed `deployed to` and exited 0.
- **Problem:** `$1` is not checked, `$TARGET` is not quoted (ShellCheck SC2086, lines 3 and 4),
  and nothing stops the script when a command fails.
- **Impact:** an empty `TARGET` turns line 3 into `rm -rf /releases/old`. A failed copy is
  reported as a deploy. A target path with a space deletes the wrong folders.
- **Suggested change:**

  ```diff
   #!/bin/bash
  -TARGET=$1
  -rm -rf $TARGET/releases/old
  -cp -r build $TARGET/releases/current
  +set -euo pipefail
  +TARGET=${1:?usage: deploy.sh <target-dir>}
  +rm -rf -- "$TARGET/releases/old"
  +cp -r build "$TARGET/releases/current"
   echo "deployed to $TARGET"
  ```

  With this change, no argument prints the usage line and exits 1, and ShellCheck is clean.

### 6. `debug` is set twice; the second value, `true`, wins — Major

- **Where:** `config/settings.json:3`, `5`
- **Confidence:** confirmed — Python's `json`, `jq` 1.6 and Node's `JSON.parse` all read
  `debug` as `true`.
- **Problem:** line 3 says `"debug": false`; line 5, added by this branch, says `"debug": true`.
- **Impact:** debug mode ships on, while a reader of the top of the file sees it off.
- **Suggested change:**

  ```diff
     "debug": false,
  -  "search": {"limit": 50},
  -  "debug": true
  +  "search": {"limit": 50}
   }
  ```

## Tests

The branch adds no tests, and the project has none. Add at least:

- `search_users`: a plain name; a name with `'`; two calls in a row return only their own rows.
- `showResults`: a query that contains markup is shown as text.
- `deploy.sh`: no argument exits non-zero and deletes nothing.

## Suggested order of work

1. Findings 1 and 2 together (one function), then 3.
2. Findings 4, 5 and 6, with the tests above.
````
<!--- prompt-output:end --->
<!--- example:end --->

<!--- example:start --->
## Example-02

Limit the review to chosen languages with `-l`. Give short forms or full names, separated by
commas: `py,sh` is the same as `python,shellscript`.

<!--- prompt-block:start --->
```prompt
/code-review -l py,sh
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

The detector (`--base main -l py,sh`) lists the other files as `filtered`, so they are not lost
from view:

```text
python (1 file)
  read: REVIEW.md, PATTERNS.md, TOOLING.md, SECURITY.md, WISDOM.md
  - app/users.py
shellscript (1 file)
  read: REVIEW.md, PATTERNS.md, TOOLING.md, SECURITY.md, WISDOM.md
  - scripts/deploy.sh
filtered (4): .github/workflows/ci.yml, config/settings.json, notes.xml, web/render.js
```

The report has the same form as Example-01, with findings 1, 2 and 5 only. Its scope says what
was left out:

```markdown
- **Languages:** python (1 file), shellscript (1); `--lang py,sh` left out 4 files
```

The verdict covers only what was read. Here it is still "Request changes".
<!--- prompt-output:end --->
<!--- example:end --->

<!--- example:start --->
## Example-03

A security review alone, with `-s`.

<!--- prompt-block:start --->
```prompt
/code-review -s
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

The detector (`--base main -s`) lists only `SECURITY.md` and `WISDOM.md` for each language:

```text
security review: read only the references listed
javascript (1 file)
  read: SECURITY.md, WISDOM.md
  - web/render.js
json (1 file) [tool-first: run the checks in TOOLING.md before reading]
  read: SECURITY.md, WISDOM.md
  - config/settings.json
python (1 file)
  read: SECURITY.md, WISDOM.md
  - app/users.py
…
```

The report opens by saying what it is, and keeps only findings with a security consequence:

```markdown
**Verdict: Request changes** — SQL injection in the new search, and a workflow that runs
pull-request code with the repository's token.

This is a security-only review. It does not judge correctness, design, performance or tests.

- **Mode:** Security-only review (`-s`)
- **Not run / not reviewed:** no running application was tested, so response headers and the
  deployed Content Security Policy are not covered. The repository's settings (default token
  permissions, fork approval rules) are not in the files. Git history was not searched for secrets.
```

| Finding in Example-01 | In the `-s` report? |
| --- | --- |
| 1. SQL injection | Yes |
| 2. Shared default list | Yes: one user's results reach another user |
| 3. `pull_request_target` | Yes |
| 4. Query written as HTML | Yes |
| 5. Deploy script | No: a reliability defect; no untrusted input reaches it |
| 6. `debug` set twice | Yes: debug mode ships on |

A clean `-s` report means no finding in what was read. It is not an audit.
<!--- prompt-output:end --->
<!--- example:end --->

<!--- example:start --->
## Example-04

`-s` and `-l` together: a security review of chosen languages.

<!--- prompt-block:start --->
```prompt
/code-review -s -l js,yaml
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
security review: read only the references listed
javascript (1 file)
  read: SECURITY.md, WISDOM.md
  - web/render.js
yaml (1 file) [tool-first: run the checks in TOOLING.md before reading]
  read: SECURITY.md, WISDOM.md
  - .github/workflows/ci.yml
filtered (4): app/users.py, config/settings.json, notes.xml, scripts/deploy.sh
```

The report holds findings 3 and 4. For a TypeScript file, `-s` reads the JavaScript `SECURITY.md`
as well, because TypeScript runs as JavaScript.
<!--- prompt-output:end --->
<!--- example:end --->

<!--- example:start --->
## Example-05

Review chosen files or folders with `-p`, whatever git says has changed. Repeat `-p` for more
than one. A folder means the files directly in it; add `-r` to go into subfolders.

<!--- prompt-block:start --->
```prompt
/code-review -p app -p scripts
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
python (1 file)
  read: REVIEW.md, PATTERNS.md, TOOLING.md, SECURITY.md, WISDOM.md
  - app/users.py
shellscript (1 file)
  read: REVIEW.md, PATTERNS.md, TOOLING.md, SECURITY.md, WISDOM.md
  - scripts/deploy.sh
```

The whole of each file is reviewed, not only the lines a branch changed.

Variations:

```prompt
/code-review -p app/users.py              one file
/code-review -p . -r                      this folder and everything below it
/code-review -p src -r -l ts,sql          the TypeScript and SQL below src/
/code-review -p services/billing -r -s    a security review of one service
```
<!--- prompt-output:end --->
<!--- example:end --->

<!--- example:start --->
## Example-06

Review every tracked file with `-t`. Combined with `-l json,yaml,toml,xml` it is a check of the
repository's configuration. These four formats are tool-first: a parser or linter decides
syntax, format and schema, and the skill then reads the files for what no tool judges.

<!--- prompt-block:start --->
```prompt
/code-review -t -l json,yaml,toml,xml
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

`python3 scripts/check_formats.py -t -l json,yaml,toml,xml` (exit code 1):

```text
ok     .github/workflows/ci.yml [python yaml (PyYAML)]
error  config/settings.json [python json]: duplicate key: 'debug'
1 ok, 1 with errors, 0 unchecked
tools on PATH: xmllint, xsltproc, jq, actionlint
not found: yamllint, taplo, prettier, check-jsonschema
```

- `notes.xml` is not listed: it is untracked, and `-t` means tracked files.
- Each file is `ok`, `error` or `unchecked`. `unchecked` means no parser was available (TOML on
  Python older than 3.11; YAML without PyYAML), and the report says so. It is never shown as `ok`.
- The skill uses the linters it finds (here `actionlint`, `xmllint`, `jq`) and names each in the
  report with its version. It does not install any.
- `ci.yml` is `ok` here because it is valid YAML. Finding 3 comes from `actionlint` and from
  reading the workflow: a tool-first format is still read.

`-t` on a large repository is a large review. The skill first agrees an order with you (entry
points, authentication, data access, money, public API) and says what it did not reach.

Variations:

```prompt
/code-review -t                the whole repository, every language
/code-review -t -s             a security review of the whole repository
/code-review -t -l md          every Markdown file
```

From a subfolder, `-t` still covers the whole repository. Files are named from where you are
(`-t -l py,json`, run in `app/`):

```text
json (1 file) [tool-first: run the checks in TOOLING.md before reading]
  - ../config/settings.json
python (1 file)
  - users.py
filtered (4): ../.github/workflows/ci.yml, ../README.md, ../scripts/deploy.sh, ../web/render.js
```
<!--- prompt-output:end --->
<!--- example:end --->

<!--- example:start --->
## Example-07

`--local` reviews the files in the current folder. It has no short form, because `-l` is
`--lang`. Add `-r` for subfolders.

<!--- prompt-block:start --->
```prompt
/code-review --local
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

At the top of the demo repository, only two files are directly in the folder:

```text
markdown (1 file)
  read: REVIEW.md, PATTERNS.md, TOOLING.md, SECURITY.md, WISDOM.md
  - README.md
xml (1 file) [tool-first: run the checks in TOOLING.md before reading]
  read: REVIEW.md, PATTERNS.md, TOOLING.md, SECURITY.md, WISDOM.md
  - notes.xml
```

`--local` includes untracked files (`notes.xml`). `--local -r` gives all seven files.

`-l` with no list means every language, the same as leaving it out. These three are the same
review:

```prompt
/code-review --local -r
/code-review --local -r -l
/code-review --local -r --lang
```
<!--- prompt-output:end --->
<!--- example:end --->

<!--- example:start --->
## Example-08

No flags are needed. Say what to review in plain words; the skill works out the scope, and asks
when it cannot tell.

<!--- prompt-block:start --->
```prompt
/code-review PR 128
/code-review my changes against origin/develop
/code-review the last commit
/code-review src/billing/, and look hardest at the refund path
review this diff before I open the pull request
is scripts/deploy.sh safe to run in production?
do a security review of the Python in services/auth
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

| You say | The skill reviews |
| --- | --- |
| A pull request number or link | That pull request's diff, read with its description and comments |
| "my changes", a branch, "against `<ref>`" | The diff against that ref, plus uncommitted and untracked files (`--base <ref>`) |
| A file or folder | Those files in full (`-p`) |
| "the repo", "the codebase" | Every tracked file (`-t`), in an agreed order |
| "security review of the Python in …" | `-s -l py -p … -r` |
<!--- prompt-output:end --->
<!--- example:end --->

<!--- example:start --->
## Example-09

What a wrong flag returns.

<!--- prompt-block:start --->
```prompt
/code-review -l py,go
/code-review -t --local
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

An unknown language is named, with the values you can use. Nothing is reviewed:

```text
detect_languages: unknown language 'go'; use one of: css, html, javascript, js, json, markdown,
md, powershell-script, ps1, py, python, rs, rust, sh, shellscript, sql, toml, ts, typescript,
xml, yaml, yml
```

Go has no checklist in this skill. To review a Go file anyway, leave out `-l`: the file is
listed as `unsupported` and gets the cross-language review.

Use at most one of `-p`, `-t` and `--local`:

```text
detect_languages.py: error: argument --local: not allowed with argument -t/--reporoot
```
<!--- prompt-output:end --->
<!--- example:end --->

<!--- example:start --->
## Example-10

After a report. The skill reviews and suggests; it changes files or posts comments only when you
ask.

<!--- prompt-block:start --->
```prompt
apply the suggested changes for findings 1, 2 and 5
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

The skill edits `app/users.py` and `scripts/deploy.sh` as the report's diffs show, then checks
the result the way it confirmed the findings:

```text
search_users(conn, "x' UNION SELECT secret, name FROM users --")   ->  []
search_users(conn, "ann"), twice                                   ->  [(1, 'ann')] each time
search_users(conn, "o'brien")                                      ->  [(3, "o'brien")]
shellcheck scripts/deploy.sh                                       ->  no findings
bash scripts/deploy.sh   (no argument)                             ->  usage message, exit 1
```

Other follow-ups:

```prompt
post the review to PR 128        one summary comment, and one inline comment per finding
write the report to REVIEW.md    a file instead of the chat
explain finding 3 in more detail
```
<!--- prompt-output:end --->
<!--- example:end --->
