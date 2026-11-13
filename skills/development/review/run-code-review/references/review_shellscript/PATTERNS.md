# Shell fix patterns

Before/after pairs for the findings that come up most. Use them to shape a suggested change.
The "after" code is bash unless marked POSIX; check the script's `#!` line first, and don't
introduce bash features into a `#!/bin/sh` script.

## Script header

```bash
# Before: failures and unset variables are ignored
#!/bin/bash
cd $1
make build
```

```bash
#!/usr/bin/env bash
# After
set -euo pipefail

usage() {
  printf 'usage: %s <project-dir>\n' "${0##*/}" >&2
  exit 2
}

[[ $# -eq 1 ]] || usage
cd -- "$1" || exit 1
make build
```

POSIX `sh`: `set -eu`, and `[ "$#" -eq 1 ] || usage`.

## Quote expansions

```bash
# Before: breaks on spaces and glob characters; an empty $file changes the command
if [ -f $file ]; then
  cp $file $dest_dir
fi
```

```bash
# After
if [[ -f "$file" ]]; then
  cp -- "$file" "$dest_dir/"
fi
```

## Pass arguments through unchanged

```bash
# Before: re-splits arguments that contain spaces
run_tool $*
```

```bash
# After
run_tool "$@"
```

## Build commands as arrays, not strings

```bash
# Before: breaks when $out has a space; tempts `eval`
opts="--output $out --verbose"
if [ "$dry_run" = 1 ]; then opts="$opts --dry-run"; fi
tool $opts "$input"
```

```bash
# After
opts=(--output "$out" --verbose)
if [[ "$dry_run" == 1 ]]; then
  opts+=(--dry-run)
fi
tool "${opts[@]}" "$input"
```

POSIX `sh` has no arrays: use the positional parameters (`set -- --output "$out" --verbose`,
then `tool "$@" "$input"`).

## Guard destructive paths

```bash
# Before: with BUILD_DIR unset or empty this is `rm -rf /*`
rm -rf $BUILD_DIR/*
```

```bash
# After: aborts with a message if the variable is unset or empty
rm -rf -- "${BUILD_DIR:?BUILD_DIR is not set}"/*
```

## Keep the exit status of a command substitution

```bash
# Before: `local` returns 0, so a failed `git` goes unnoticed even under `set -e`
deploy() {
  local version=$(git describe --tags)
  push_image "$version"
}
```

```bash
# After
deploy() {
  local version
  version=$(git describe --tags)
  push_image "$version"
}
```

## Temp files with cleanup

```bash
# Before: predictable name, left behind on failure
tmp=/tmp/report.$$
generate > $tmp
upload $tmp
rm $tmp
```

```bash
# After
tmp=$(mktemp)
trap 'rm -f -- "$tmp"' EXIT
generate > "$tmp"
upload "$tmp"
```

In POSIX `sh` the `EXIT` trap doesn't run when a signal kills the script: add
`trap 'exit 129' HUP; trap 'exit 130' INT; trap 'exit 143' TERM`.

## Write files atomically

```bash
# Before: a failure half-way leaves a truncated config in place
render_config > /etc/app/config.yml
```

```bash
# After: readers see the old file or the new one, never part of one
dest=/etc/app/config.yml
tmp=$(mktemp "${dest}.XXXXXX")
trap 'rm -f -- "$tmp"' EXIT
render_config > "$tmp"
chmod 0644 "$tmp"
mv -f -- "$tmp" "$dest"
```

## Iterate over files

```bash
# Before: splits names on whitespace and expands glob characters in them
for f in $(ls *.csv); do
  process $f
done
```

```bash
# After
shopt -s nullglob
for f in ./*.csv; do
  process "$f"
done
```

Recursively, with any file name (bash):

```bash
while IFS= read -r -d '' f; do
  process "$f"
done < <(find . -type f -name '*.csv' -print0)
```

Or without a loop: `find . -type f -name '*.csv' -exec process {} +`.

## Read lines

```bash
# Before: mangles backslashes, trims whitespace, loses `count` (subshell)
count=0
cat "$file" | while read line; do
  count=$((count + 1))
done
echo "$count"
```

```bash
# After
count=0
while IFS= read -r line || [[ -n "$line" ]]; do
  count=$((count + 1))
done < "$file"
echo "$count"
```

## No `eval` on data

```bash
# Before: $key or $value can run arbitrary commands
eval "$key=\"$value\""
```

```bash
# After (bash 4+): an associative array holds named values
declare -A settings
settings["$key"]=$value
```

To set a variable by name in bash 3.2+, validate the name and use `printf -v`:

```bash
[[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || { printf 'invalid name: %s\n' "$key" >&2; exit 1; }
printf -v "$key" '%s' "$value"
```

## Untrusted values in CI `run:` blocks

```yaml
# Before: the PR title is pasted into the script text and executed
- run: echo "Building ${{ github.event.pull_request.title }}"
```

```yaml
# After: it arrives as data in an environment variable
- run: printf 'Building %s\n' "$PR_TITLE"
  env:
    PR_TITLE: ${{ github.event.pull_request.title }}
```

## Downloads

```bash
# Before: runs whatever the server returns, including an error page or a truncated file
curl https://example.com/install.sh | sh
```

```bash
# After: fail on HTTP errors, verify, then run
curl --fail --silent --show-error --location --retry 3 --max-time 60 \
  --output install.sh https://example.com/releases/v1.4.2/install.sh
printf '%s  install.sh\n' "$EXPECTED_SHA256" | sha256sum --check --strict -
sh install.sh
```

On macOS use `shasum -a 256 --check`.

## Secrets off the command line

```bash
# Before: visible in `ps` and in `set -x` output
curl -u "admin:$API_PASSWORD" "$url"
```

```bash
# After: read from a file descriptor; tracing off around the secret
{ set +x; } 2>/dev/null
curl --fail --silent --show-error --config - "$url" <<EOF
user = "admin:$API_PASSWORD"
EOF
```

## Check dependencies up front

```bash
# Before: fails half-way through with "jq: command not found"
result=$(curl -s "$url" | jq -r .id)
```

```bash
# After
for cmd in curl jq; do
  command -v "$cmd" >/dev/null 2>&1 || { printf 'error: %s is required\n' "$cmd" >&2; exit 127; }
done
result=$(curl --fail --silent --show-error "$url" | jq -er .id)
```

## Locate the script's own directory

```bash
# Before: only works when run from the repository root
source lib/common.sh
```

```bash
# After
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=lib/common.sh
source "$script_dir/lib/common.sh"
```

POSIX `sh`: `script_dir=$(cd -- "$(dirname -- "$0")" && pwd)` and `. "$script_dir/lib/common.sh"`.

## One instance at a time

```bash
# Before: two cron runs overlap and corrupt the output
sync_data
```

```bash
# After (Linux, util-linux `flock`)
exec 9>/var/lock/sync_data.lock
flock -n 9 || { printf 'another run is in progress\n' >&2; exit 0; }
sync_data
```

Where `flock` is unavailable (macOS), `mkdir` is atomic:
`mkdir /tmp/sync_data.lock 2>/dev/null || exit 0`, with a trap that removes it.

## Avoid a process per item

```bash
# Before: three processes per file
for f in ./*.txt; do
  name=$(basename "$f" | sed 's/\.txt$//')
  echo "$name"
done
```

```bash
# After: parameter expansion, no processes
for f in ./*.txt; do
  name=${f##*/}
  name=${name%.txt}
  printf '%s\n' "$name"
done
```

## Portable in-place edit

```bash
# Before: GNU only; on macOS/BSD `sed -i` takes the next argument as a backup suffix
sed -i 's/DEBUG=1/DEBUG=0/' "$conf"
```

```bash
# After: works with GNU and BSD sed
tmp=$(mktemp)
sed 's/DEBUG=1/DEBUG=0/' "$conf" > "$tmp" && mv -f -- "$tmp" "$conf"
```

`mktemp` creates the file with mode `0600`: copy the original's permissions if they matter.
