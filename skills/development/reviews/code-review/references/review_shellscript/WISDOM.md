# Shell script review wisdom

Read this before forming findings on shell scripts, in a full review and in a security-only
one. **Constraints** are limits the review must stay within. **Traps** are things in the
language that mislead a reader. **Ditches** are the ways a review of this language goes off
the road. **Wisdom** is the judgement that keeps it on.

## Constraints

- **The shebang decides the language.** `#!/bin/sh` means POSIX `sh` (often `dash`): no
  arrays, no `[[ ]]`, no `local` guarantee, no `pipefail` before POSIX 2024. Don't suggest
  bash features for it, and don't flag bash features in a `#!/usr/bin/env bash` script.
- **The bash version matters.** macOS ships bash 3.2: no associative arrays, no `mapfile`,
  no `${var,,}`. Check where the script runs.
- **External tools differ by platform.** GNU and BSD `sed -i`, `date -d`, `readlink -f`,
  `grep -P`, `xargs -r`, `stat` are not interchangeable.
- **Never run a script under review to see what it does** unless it is known to be safe and
  you were told to. Read it; use `bash -n` for syntax and `shellcheck` for analysis.
- **A script that is sourced must not `exit`, change options or leak variables** into its
  caller. Find out whether it is executed or sourced.
- **`shellcheck` output is a lead,** and a `disable` directive is a decision that needs a
  reason beside it.

## Traps

- **`set -e` does not do what it appears to.** It is ignored inside `if`, `while`, `&&`,
  `||` and `!` conditions, and in functions called from those; `local x=$(cmd)` and
  `export x=$(cmd)` hide the failure of `cmd`.
- **A pipeline's status is its last command's** unless `pipefail` is set: `curl … | tar x`
  succeeds when `curl` fails.
- **A `while read` loop fed by a pipe runs in a subshell** in bash: variables set inside are
  gone afterwards.
- **`cd "$dir"` can fail, and the next command then runs in the wrong directory.**
- **Unquoted `$var` is split and globbed;** an empty one disappears, turning
  `rm -rf "$dir"/` plus an empty variable into `rm -rf /`.
- **`[ $a = b ]` with an empty `$a` is a syntax error;** `[[ $a == $b ]]` treats an unquoted
  right side as a pattern.
- **`$(( ))` and `[[ -eq ]]` evaluate their operands as expressions,** recursively, so a
  variable holding `a[$(cmd)]` runs `cmd`.
- **`echo` is not portable** for values starting with `-` or containing backslashes; `printf
  '%s\n'` is.
- **`read` without `-r` eats backslashes, and without `IFS=` trims whitespace;** a last line
  with no newline is dropped by a plain `while read` loop.
- **`for f in $(ls)` and `for f in *.txt`:** the first breaks on spaces; the second runs once
  with the literal pattern when nothing matches.
- **`2>&1 > file` and `> file 2>&1` differ:** redirections apply left to right.
- **`trap` on `EXIT` does not run on `SIGKILL`,** and a trap set in a function is global.
- **`sudo cmd > /root/file` redirects as the calling user,** not as root.
- **`$?` is overwritten by every command,** including the `[` that tests it.

## Ditches

- **Reporting every unquoted variable** with the same weight, including integers the script
  set itself, and burying the one that reaches `rm` or `eval`.
- **Recommending `set -euo pipefail` as a cure.** It changes behaviour in ways that need
  testing, and it is not available in POSIX `sh`. Recommend it with its caveats.
- **Rewriting the script in another language** in a review of a small change. Do say so when
  the script has outgrown shell: data structures, error handling, parsing of structured data.
- **Reviewing for GNU/Linux only** when the script runs on macOS, Alpine (BusyBox) or in a
  minimal container.
- **Trusting the happy path.** Trace what happens when each command fails, a variable is
  empty, a file name has a space, or the script is interrupted half-way.
- **Missing the shell that is not in a `.sh` file:** `run:` blocks, `RUN` lines, Makefile
  recipes, `package.json` scripts, heredocs passed to `ssh`.
- **Arguing style** (`[[` against `[`, `$( )` against backticks) where both are correct for
  the target shell.

## Wisdom

- **Quote everything, and explain the exceptions.**
- **Fail loudly and early:** check the commands that matter explicitly, print what failed to
  stderr, exit non-zero.
- **Make it safe to run twice and safe to interrupt:** idempotent steps, `mktemp` plus a
  cleanup `trap`, write to a temporary file and `mv` into place.
- **Validate before destroying.** Any `rm -rf`, `mv` or `chown -R` with a computed path
  deserves a guard (`${var:?}`) and a look at what the path can be.
- **Keep data out of code.** Pass values as arguments and environment variables, never by
  pasting them into a command string.
- **Prefer the tool that understands the format:** `jq` for JSON, `find -print0 | xargs -0`
  for file lists, not `grep`, `cut` and `ls`.
- **A long script is a program.** When it needs arrays of records, retries with back-off or
  real error handling, say that shell is the wrong tool.
- **Reproduce in a scratch directory before rating.** A two-line demonstration with a file
  named `a b` or an empty variable is the strongest evidence.
- **Say what you did not check:** shells and platforms not run, commands not executed.
