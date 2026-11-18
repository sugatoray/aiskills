# /scrolls-compact — Example-17: Check first, or stage without committing

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the state [Example-01](example_001.md) leaves, just before its `--finalize` (its step 2 edits are in place).

<!--- example:start fixture=condensed-01 --->
## Example-17

Check first, or stage without committing. The edits from Example-01 step 2 are in place.

### Premise

- You want to check the edits, or commit them yourself.

### Caveats

- `--finalize -n` writes nothing.
- `--no-commit` stages everything. It prints the commit and tag commands.

1️⃣ `--finalize -n` validates and shows what it would write, but writes nothing:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --finalize -n
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Validation passed (dry run: nothing written).
  would write: docs/.scrolls/compacted/scrolls_compact_20261115_4b02463.md, docs/.scrolls/COMPACT.md, docs/.scrolls/STARTER.md

maint(memory): scrolls-compacted

- checkpoint: #4b02463f3d8c318e3a64fc91d3d9577988ec4506
- base: #6d7530546033756d755e79434b1d8ddc5004f633 (2026-11-03; rule: 7 days)

Notes:
- compacted: docs/.scrolls/SPEC.md (3 units condensed, 17 → 14 lines)
- compacted: docs/.scrolls/PLAN.md (3 units condensed, 10 → 10 lines)
- compacted: docs/.scrolls/GAP_CONTEXT.md (2 units condensed, 6 → 9 lines)
- unchanged: docs/.scrolls/HANDOFF.md
- unchanged: docs/.scrolls/GAP_ANALYSIS.md
- report: docs/.scrolls/compacted/scrolls_compact_20261115_4b02463.md
- checkpoint tag: scrolls-compact/20261115-4b02463
- STARTER.md: added the COMPACT.md entry

Scrolls-Action: compact
Scrolls-Checkpoint: 4b02463f3d8c318e3a64fc91d3d9577988ec4506
Scrolls-Compact-Base: 6d7530546033756d755e79434b1d8ddc5004f633
Scrolls-Compact-Rule: newer-of days=7 commits=20 -> days
Scrolls-Previous-Compaction: none
Scrolls-Folder: docs/.scrolls
Scrolls-Compacted: docs/.scrolls/SPEC.md
Scrolls-Compacted: docs/.scrolls/PLAN.md
Scrolls-Compacted: docs/.scrolls/GAP_CONTEXT.md
Scrolls-Report: docs/.scrolls/compacted/scrolls_compact_20261115_4b02463.md
```
<!--- prompt-output:end --->

2️⃣ `--finalize --no-commit` writes and stages everything, and prints the commands to finish with:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --finalize --no-commit
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Staged the compaction; not committed (--no-commit). Finish with:
  git commit -F /work/shop/.git/SCROLLS_COMPACT_MSG
Then protect the checkpoint:
  git tag scrolls-compact/20261115-4b02463 4b02463f3d8c318e3a64fc91d3d9577988ec4506
```
<!--- prompt-output:end --->
<!--- prompt-block:start --->
```bash
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

git status --short
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
A  docs/.scrolls/COMPACT.md
M  docs/.scrolls/GAP_CONTEXT.md
M  docs/.scrolls/PLAN.md
M  docs/.scrolls/SPEC.md
M  docs/.scrolls/STARTER.md
A  docs/.scrolls/compacted/scrolls_compact_20261115_4b02463.md
```
<!--- prompt-output:end --->
<!--- example:end --->
