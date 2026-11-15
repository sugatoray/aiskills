# /scrolls-compact — Example-11: Nothing is old enough

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the `fresh-shop` fixture (every commit in the last two days).

<!--- example:start fixture=fresh-shop --->
## Example-11

Nothing is old enough: every scroll line was written in the last two days.

### Premise

- The project is new. All scroll text is from the last few days.

### Caveats

- The skill stops with exit 1. It makes no changes.
- To cut deeper, use a smaller `--keep-days` or `--keep-commits`, or give `--base`.
- If old commits exist but every old unit is live state, the message is: `Nothing to compact: every unit is newer than the base, or is live state.`

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 1):

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     docs/.scrolls
  checkpoint: 74bb40f (74bb40fe135098a612b01d6c387fc2d272eaff82)
  base:       none  [7 days -> none (older than 2026-11-08); 20 commits -> none (only 5 commits on main)]

Nothing to compact: no commit is old enough under these rules.
```
<!--- prompt-output:end --->
<!--- example:end --->
