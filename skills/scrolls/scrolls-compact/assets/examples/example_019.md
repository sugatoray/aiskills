# /scrolls-compact — Example-19: No checkpoint tag

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the state [Example-01](example_001.md) leaves, just before its `--finalize` (its step 2 edits are in place).

<!--- example:start fixture=condensed-01 --->
## Example-19

No checkpoint tag. Use this when the branch will be merged with a merge commit (the checkpoint stays reachable), or if you don't want the tag.

### Premise

- You do not want a tag.

### Caveats

- Without a tag, a squash merge can make the checkpoint unreachable later.

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --finalize --no-tag
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Compacted.
  commit:     6b729d6ab068587cc240e3cd21fc4b6eb5fa59f3
  checkpoint: 4b02463f3d8c318e3a64fc91d3d9577988ec4506
  base:       6d7530546033756d755e79434b1d8ddc5004f633 (2026-11-03; rule: 7 days)
  compacted:  docs/.scrolls/SPEC.md (17 → 14 lines)
  compacted:  docs/.scrolls/PLAN.md (10 → 10 lines)
  compacted:  docs/.scrolls/GAP_CONTEXT.md (6 → 9 lines)
  report:     docs/.scrolls/compacted/scrolls_compact_20261115_4b02463.md
Undo: git revert --no-edit 6b729d6ab068587cc240e3cd21fc4b6eb5fa59f3
```
<!--- prompt-output:end --->

<!--- prompt-block:start --->
```bash
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

git tag | wc -l
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
0
```
<!--- prompt-output:end --->
<!--- example:end --->
