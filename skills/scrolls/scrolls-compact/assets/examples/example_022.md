# /scrolls-compact — Example-22: After a squash merge and /scrolls-unhide

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the state [Example-01](example_001.md) leaves, after its `--finalize`.

<!--- example:start fixture=after-01 --->
## Example-22

After a squash merge rewrote the commit message, and `/scrolls-unhide` renamed the folder. The traversal reads `COMPACT.md` and the reports, so it still works.

### Premise

- A squash merge rewrote the compaction commit's message.
- `/scrolls-unhide` renamed the folder.

### Caveats

- The commands read `COMPACT.md` and the reports, not commit messages. They still work.

The history now:

<!--- setup-block:start --->
```bash
git commit -q --amend -m 'Compact the shop scrolls (#31)'
git mv docs/.scrolls docs/scrolls && git commit -q -m 'Unhide the scrolls'
```
<!--- setup-block:end --->

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --list
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Compactions of docs/scrolls, newest first:
  #1  2026-11-15  4b02463  base `6d75305` (2026-11-03)  [SPEC, PLAN, GAP_CONTEXT]  reachable  compacted/scrolls_compact_20261115_4b02463.md
```
<!--- prompt-output:end --->

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --show scrolls_compact_20261115_4b02463 GAP_ANALYSIS.md
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text

```
<!--- prompt-output:end --->

`GAP_ANALYSIS.md` was not changed, so the diff is empty. The old `SPEC.md`, at its old path:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --extract 1 SPEC.md
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
# SPEC.md — Feature Spec

What shop does, feature by feature.

## Product search (#12)
Search by name or SKU, with typo tolerance.
The results page shows 20 items at a time.

## Checkout (#18)
Card payments through the payment gateway.
A receipt goes out by email.

## Order history (#23)
Signed-in users see their past orders.

## Wishlist (#27)
A heart icon saves an item for later.
```
<!--- prompt-output:end --->
<!--- example:end --->
