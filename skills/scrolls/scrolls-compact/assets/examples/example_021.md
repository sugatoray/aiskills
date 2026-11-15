# /scrolls-compact — Example-21: Read the old text back

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the state [Example-01](example_001.md) leaves, after its `--finalize`.

<!--- example:start fixture=after-01 --->
## Example-21

Read the old text back. These commands are read-only. `ID` is a row number (`1` or `#1`), a checkpoint hash, or a report name.

### Premise

- A summary in `SPEC.md` is too short. You need the old section.

### Caveats

- `1` is the row number in `COMPACT.md`. A checkpoint hash or a report name is also correct.
- These commands are read-only.

1️⃣ Every compaction:

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
Compactions of docs/.scrolls, newest first:
  #1  2026-11-15  4b02463  base `6d75305` (2026-11-03)  [SPEC, PLAN, GAP_CONTEXT]  reachable  compacted/scrolls_compact_20261115_4b02463.md
```
<!--- prompt-output:end --->

2️⃣ What the compaction removed from `PLAN.md`:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --show 1 PLAN.md
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
diff --git a/docs/.scrolls/PLAN.md b/docs/.scrolls/PLAN.md
index 1a91c2f..bb8cff9 100644
--- a/docs/.scrolls/PLAN.md
+++ b/docs/.scrolls/PLAN.md
@@ -2,9 +2,9 @@
 
 Highest priority first.
 
-- [x] SHOP-1: Product search. Merged in #12.
+<!-- scrolls-compact: checkpoint=4b02463 date=2026-11-15 report=compacted/scrolls_compact_20261115_4b02463.md -->
+> Done tickets SHOP-1, SHOP-3 and SHOP-4 were compacted on 2026-11-15. See `COMPACT.md`.
+
 - [ ] SHOP-2: Saved carts.
-- [x] SHOP-3: Checkout. Merged in #18.
-- [x] SHOP-4: Order history. Merged in #23.
 - [x] SHOP-5: Wishlist. Merged in #27.
 - [ ] SHOP-6: Gift cards.
```
<!--- prompt-output:end --->

3️⃣ `SPEC.md` as it was at the checkpoint:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --extract #1 SPEC.md
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

4️⃣ By checkpoint hash, into a file:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --extract 4b02463 GAP_CONTEXT.md -o old-gap-context.md
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Wrote old-gap-context.md
```
<!--- prompt-output:end --->

<!--- prompt-block:start --->
```bash
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

head -5 old-gap-context.md
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
# GAP_CONTEXT.md — Why Each Gap Exists

One reason per gap.

- **No saved carts**: a deliberate cut for v1. The user wanted checkout first, and saved carts need accounts, which are not built yet.
```
<!--- prompt-output:end --->
<!--- example:end --->
