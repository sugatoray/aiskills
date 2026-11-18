# /scrolls-compact — Example-13: Usage errors

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the `shop` demo repository.

<!--- example:start fixture=shop --->
## Example-13

Usage errors (exit 2).

### Premise

- A flag is wrong, or `--finalize` runs before a plan.

### Caveats

- The skill stops with exit 2. It changes nothing.

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact -p docs -t
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 2):

```text
Pass at most one of -p/--path, -t/--reporoot and -l/--local.
```
<!--- prompt-output:end --->

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --before=2026-13-01
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 2):

```text
--before=2026-13-01: use YYYYMMDD or YYYY-MM-DD.
```
<!--- prompt-output:end --->

`--finalize` before any plan:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --finalize
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 2):

```text
No compaction plan found. Run /scrolls-compact without --finalize first.
```
<!--- prompt-output:end --->
<!--- example:end --->
