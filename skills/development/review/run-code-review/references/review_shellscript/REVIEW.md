# Shell script review

What to look for in shell scripts (`sh`, `bash`, `zsh`, `ksh`), beyond `../CROSS_LANGUAGE.md`,
including shell embedded in CI workflows, Dockerfiles, Makefiles and `package.json` scripts. Shell
fails quietly and expands eagerly: most serious findings are an unquoted expansion, an unchecked
failure, or input reaching `eval`. `PATTERNS.md` has the fix for the common items, `TOOLING.md`
the commands, `SECURITY.md` the security scope, and `WISDOM.md` the constraints and traps to keep
in mind for every review.

## Before you start

- **Which shell runs it.** The `#!` line decides, not the file extension. `#!/bin/sh` is POSIX
  `sh` (`dash` on Debian and Ubuntu, `ash` in Alpine/BusyBox): arrays, `[[ ]]`, `local`
  (widely supported but not POSIX), `function name`, `source`, `<<<`, `<( )`, `${var//a/b}`,
  `echo -e`, `&>` and `$'…'` are bashisms that fail or misbehave there, and `set -o pipefail`
  entered POSIX only in 2024 (older `dash` rejects it). A script with no `#!` runs in whatever shell invokes it.
- **Which bash.** macOS ships bash 3.2: no associative arrays, `mapfile`/`readarray`,
  `${var,,}`/`${var^^}`, `|&`, `declare -n` or `wait -n`. If the script must run on macOS,
  those are findings.
- **Where it runs:** developer machines (GNU and BSD tools differ), CI images, containers
  (BusyBox has fewer options), `cron` (minimal `PATH`, no terminal), as root.
- **Whether shell is the right tool.** A script with data structures, JSON handling by regex,
  arithmetic on floats, or several hundred lines of logic is a maintainability finding:
  recommend a language with real error handling and tests. Say so once, at the top.

## Failure handling

- **No strict mode.** Without `set -e` a failed command is ignored and the script carries on;
  without `set -u` a mistyped variable expands to nothing; without `pipefail` a pipeline's
  status is its last command's only. Expect `set -euo pipefail` in bash (and `set -eu` in `sh`),
  or explicit checks on every command that matters.
- **Trusting `set -e` where it doesn't apply.** It is ignored inside `if`/`while`/`until`
  conditions, on either side of `&&`/`||` except the last command, after `!`, and for every
  command inside a function called in one of those contexts. `local x=$(cmd)`,
  `export x=$(cmd)` and `readonly x=$(cmd)` return the status of `local`/`export`, hiding the
  failure: declare first, assign second. Command substitutions inside a larger command
  (`echo "$(false)"`) don't stop the script either.
- **`cd` unchecked.** `cd "$dir"` followed by `rm` or a relative write runs in the wrong
  directory when `cd` fails. `cd "$dir" || exit 1` (even under `set -e`, it documents intent).
- **Failures hidden on purpose:** `|| true`, `2>/dev/null`, `set +e` left on, `cmd || :`.
  Each should say why the failure is acceptable.
- **`pipefail` side effects:** `cmd | head -n1` or `cmd | grep -q x` can fail with SIGPIPE
  (status 141) when the reader exits early.
- **Exit status lost:** `$?` read after another command has run; a function with no `return`
  taking the status of its last command by accident; `wait` not called, or its status ignored,
  for background jobs.
- **No cleanup.** Temp files, lock files, background processes and mounts left behind on error
  or Ctrl-C. Use `trap cleanup EXIT` (bash runs it on signals too; in `sh` add `INT TERM`).
- **Errors on stdout, or with no context.** Diagnostics go to stderr (`>&2`), name the script
  and the failing thing, and the script exits non-zero.
- **Partial output treated as complete:** writing straight to the destination file. Write to
  a temp file in the same directory and `mv` it into place.
- **Downloads:** `curl` without `-f` exits 0 on an HTTP 404 and saves the error page; no
  retry or timeout (`--retry`, `--max-time`); output piped into a consumer that runs on partial
  data.

## Quoting and expansion

- **Unquoted variables and command substitutions:** `$var`, `$(cmd)`, `${arr[*]}`. Unquoted,
  the value is split on whitespace and each word is glob-expanded: a filename with a space
  becomes two arguments, `*` becomes a file list, an empty value disappears. Quote every
  expansion (`"$var"`, `"$(cmd)"`) unless splitting is intended and commented.
- **`$*` and unquoted `$@`.** Only `"$@"` passes arguments through unchanged; same for arrays:
  `"${arr[@]}"`.
- **`rm -rf "$dir/"*`, `rm -rf "$prefix/$name"` with a variable that can be empty** becomes
  `rm -rf /*`. Guard with `${dir:?}` and validate the value.
- **A command built as a string** (`cmd="ls -l $file"; $cmd`) breaks on spaces and quotes, and
  invites `eval`. Build it as an array (bash) or a function.
- **`eval`,** `bash -c "$string"`, `sh -c "… $var …"`, `source`/`.` on a file an attacker can
  write, `ssh host "cmd $var"` (expanded again remotely), `xargs` without `-0`, `find -exec sh
  -c "… {} …"`. All re-parse data as code.
- **`[ ]` with unquoted operands:** `[ $a = b ]` is a syntax error when `$a` is empty and a
  different test when it contains spaces or `-o`. In bash prefer `[[ ]]`; note that the right
  side of `==`/`=~` inside `[[ ]]` is a pattern unless quoted.
- **`printf "$var"` and `echo $var`:** the value is used as a format string, or mangled by
  `echo` (`-n`, backslashes). Use `printf '%s\n' "$var"`.
- **Filenames starting with `-`** are parsed as options: use `--` or `./` (`rm -- "$f"`).
- **Globs that match nothing** stay literal (`for f in *.log` runs once with `*.log`): set
  `nullglob` in bash or test `[ -e "$f" ]`.
- **Here-documents:** unquoted `<<EOF` expands `$var` and `` `cmd` `` inside; quote the
  delimiter (`<<'EOF'`) when the body is literal.
- **Tilde and braces don't expand in quotes or variables:** `"~/x"` is a literal tilde; use
  `"$HOME/x"`.

## Reading and iterating

- **Parsing `ls`,** or `for f in $(ls)`, `$(find …)`, `$(cat file)`: breaks on spaces,
  newlines and glob characters. Use a glob (`for f in ./*.txt`), `find … -exec … {} +`, or
  `find … -print0 | while IFS= read -r -d '' f` (bash).
- **`read` without `-r`** eats backslashes; without `IFS=` it trims leading and trailing
  whitespace. The idiom is `while IFS= read -r line; do … done < file`. A last line with no
  trailing newline is skipped unless the loop also tests `|| [ -n "$line" ]`.
- **Variables set in a pipeline's loop are lost:** `cmd | while read …; do count=$((count+1));
  done` runs the loop in a subshell. Use `while …; done < <(cmd)` (bash) or a temp file.
- **Commands inside a `while read` loop that read stdin** (`ssh`, `ffmpeg`, `read`) swallow
  the rest of the input: give them `</dev/null` (or `ssh -n`).
- **Word-splitting to parse structured data** (CSV with quoted commas, JSON, YAML): use `jq`,
  a real parser, or another language.

## Security

Read `SECURITY.md` for the full scope; it is part of every full review. The items that most
often matter in ordinary review: command injection through the re-parsing forms above
(`eval`, `sh -c`, unquoted expansions, CI `${{ }}` interpolation), `curl … | sh`, secrets on
command lines and in `set -x` output, predictable temp files, `sudo` and untrusted `PATH`,
and `rm -rf` with a computed argument.

## Portability

- **GNU against BSD/macOS tools:** `sed -i` (BSD needs `sed -i ''`), `date -d` (BSD uses
  `-v`/`-j -f`), `readlink -f`, `grep -P`, `xargs -r`, `stat -c`, `sort -V`, `mktemp` templates,
  `base64 -w0`, `find -printf`, `timeout`. Flag them when the script is meant to run on both.
- **`echo` with options or escapes** behaves differently per shell; use `printf`.
- **`which`** is not standard and its output varies; use `command -v`.
- **Obsolete syntax:** backticks (don't nest, mangle backslashes) in place of `$( )`;
  `$[ ]`; `[ a -a b ]` and `-o` (ambiguous; use `[ a ] && [ b ]`); `==` inside `[ ]` (not
  POSIX); `function f()`.
- **Assumptions about the environment:** current directory (derive the script's own directory
  instead), locale (`LC_ALL=C` for sorting and byte-wise text processing), `/bin/bash`
  existing (use `#!/usr/bin/env bash` where bash may live elsewhere), a tool being installed
  (check with `command -v` and fail with a clear message).
- **Line endings:** CRLF in a script gives `$'\r': command not found` or a `#!` that names
  `bash\r`.

## Structure

- Functions for anything used twice or longer than a screen, with `local` variables (bash),
  and a `main "$@"` at the bottom so nothing runs half-defined.
- Globals in upper case and `readonly` when constant; no reuse of names like `PATH`, `HOME`,
  `USER`, `IFS`, `RANDOM`, `SECONDS`, `LINENO` for ordinary variables.
- Arguments parsed and validated up front (`getopts`, or a `case` loop), with a usage message,
  `-h`/`--help`, and a non-zero exit on misuse.
- **Idempotent and re-runnable:** `mkdir -p`, `ln -sfn`, check-before-create, safe to run
  twice after a partial failure.
- **Concurrency:** two copies running at once (cron overlap, parallel CI jobs) corrupting
  shared files: use `flock` or an atomic `mkdir` lock. Background jobs are waited for, and
  their statuses checked.
- Comments for anything non-obvious (a `sed` expression, a workaround, why a failure is
  ignored). Long pipelines broken across lines.
- Interactive behaviour (prompts, colours, `read`) guarded by a terminal check (`[ -t 0 ]`,
  `[ -t 1 ]`) so the script also works in CI and pipes.

## Performance

- A process started per item in a loop (`$(echo "$x" | sed …)`, `$(basename "$f")`,
  `grep` per line) over many items: use parameter expansion (`${f##*/}`, `${x%.txt}`), or one
  `awk`/`sed` over the whole input.
- Reading a large file line by line in shell where `awk`, `grep` or `sort` would do it at once.
- Repeated `find`/`grep -r` over the same tree; unbounded `find /`.
- Serial work that is safely parallel (`xargs -P`, background jobs with a limit).

## Tests

- `shellcheck` clean, with any `# shellcheck disable=SCxxxx` carrying a reason.
- Logic that matters has tests (`bats`, `shunit2`, `shellspec`) or is thin enough to check by
  reading; the script is exercised in CI on the shells and platforms it claims.
- Destructive scripts have a dry-run mode, and it is what the tests use.

## Usually not worth a finding

- `cat file | cmd` against `cmd < file` on small inputs.
- `[[ ]]` against `[ ]` style in a bash script that is consistent and correct.
- Indentation and line length (`shfmt` settles them).
- Braces around every variable (`${var}` against `$var`) where there is no ambiguity.
