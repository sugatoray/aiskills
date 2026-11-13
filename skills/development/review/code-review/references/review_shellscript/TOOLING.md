# Shell tooling

Commands to run during a review, and how to read them. Follow `SKILL.md` step 4: run what the
project already has, don't install into it, and treat output as leads to confirm.

**Never run a script under review to see what it does** unless you have read all of it and it
is safe in your environment. Static checks first; then a dry-run mode, a container or a
throwaway directory.

## Find the scripts and their shells

```bash
git ls-files -z | xargs -0 awk 'FNR == 1 && /^#!.*[\/ ](sh|bash|zsh|ksh|dash)( |$)/ { print FILENAME ": " $0 } { nextfile }' 2>/dev/null
git grep -nE '^\s*(run|script|command|entrypoint):' -- '*.yml' '*.yaml' | head -50   # shell in CI and compose files
git grep -nE '^(RUN|CMD|ENTRYPOINT) ' -- '*Dockerfile*'                                # shell in Dockerfiles
ls .shellcheckrc .editorconfig 2>/dev/null
```

## Checks

| Purpose | Command | Notes |
| --- | --- | --- |
| Syntax, with the shell that will run it | `bash -n script.sh`, `sh -n script.sh`, `zsh -n script.zsh` | Parses without executing. Use the interpreter from the `#!` line: `bash -n` accepts bashisms a `#!/bin/sh` script must not contain. |
| Lint | `shellcheck -x script.sh` | The most valuable single check. `-x` follows `source`d files. For a file with no `#!` or extension, add `-s bash` or `-s sh`. `--severity=warning` hides style notes. |
| Lint every script in the repository | `git ls-files '*.sh' '*.bash' \| xargs -r shellcheck -x` | Add the extensionless scripts found above. |
| Bashisms in `sh` scripts | `shellcheck -s sh script.sh`, or `checkbashisms script.sh` (Debian `devscripts`) | Also run the script's tests under `dash` if it claims POSIX. |
| Format | `shfmt -d script.sh` | Shows the diff `shfmt` would make. Only mention if the project uses it. |
| Tests | `bats test/`, `shellspec`, or the project's runner | |
| Shell inside GitHub Actions workflows | `actionlint` | Runs `shellcheck` on `run:` blocks and flags untrusted `${{ }}` in scripts. |
| Shell inside Dockerfiles | `hadolint Dockerfile` | Includes `shellcheck` on `RUN` lines. |
| Trace a run you have decided is safe | `bash -x script.sh args`, or `PS4='+ ${BASH_SOURCE}:${LINENO}: ' bash -x …` | Tracing prints secrets: don't paste it into the report unredacted. |

## Reading shellcheck output

Codes that usually mean a real defect:

| Code | Meaning |
| --- | --- |
| SC2086 | Unquoted expansion: word splitting and globbing |
| SC2046 | Unquoted command substitution |
| SC2068, SC2048 | Unquoted `$@` / `$*` |
| SC2115 | `rm -rf "$var/"…` can expand to `/` |
| SC2164 | `cd` without `\|\| exit` |
| SC2155 | `local`/`export` with a command substitution masks its exit status |
| SC2045, SC2012 | Iterating over, or parsing, `ls` output |
| SC2162 | `read` without `-r` |
| SC2030, SC2031 | Variable modified in a subshell and used afterwards |
| SC2294, SC2091 | `eval` on an array / executing a command's output |
| SC2181 | Checking `$?` separately from the command |
| SC3xxx | Feature not available in POSIX `sh` (the script's `#!` says `sh`) |
| SC1090, SC1091 | Sourced file not followed: the lint didn't see that code |

A `# shellcheck disable=SCxxxx` added in the change needs a reason next to it. A clean
`shellcheck` run doesn't cover logic, `set -e` gaps, portability of external tools (`sed -i`,
`date -d`) or security of what the script downloads and runs: read for those.

## Reproducing a finding

Reproduce in a temp directory with hostile-but-legal input, not against real files:

```bash
dir=$(mktemp -d) && cd "$dir" || exit
touch 'two words.txt' './-rf' 'star*.txt' $'new\nline.txt'
for f in $(ls); do printf '[%s]\n' "$f"; done      # shows the splitting
for f in ./*; do printf '[%s]\n' "$f"; done        # correct
```

For `set -e` questions, a three-line script answers faster than reasoning:

```bash
bash -c 'set -e; f() { false; echo "still running"; }; if f; then :; fi'
```
