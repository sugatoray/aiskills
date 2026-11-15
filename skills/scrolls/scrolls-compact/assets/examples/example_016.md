# /scrolls-compact — Example-16: An edit that breaks the rules

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the `shop` demo repository.

<!--- example:start fixture=shop --->
## Example-16

An edit that breaks the rules. `--finalize` refuses, names every problem, and keeps your edits so you can fix them.

### Premise

- While condensing, the agent deleted an open ticket from `PLAN.md`, and made other bad edits.

### Caveats

- The skill does not commit. Your edits stay in the working tree.
- Put the ticket back, then run `--finalize` again.

1️⃣ The plan:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --before=20261025
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     docs/.scrolls
  checkpoint: 4b02463 (4b02463f3d8c318e3a64fc91d3d9577988ec4506)
  base:       7e09b64 2026-10-21  [rule: --before]
              --before -> 7e09b64 (2026-10-21)
  files:      SPEC.md, PLAN.md, HANDOFF.md, GAP_ANALYSIS.md, GAP_CONTEXT.md
  report:     docs/.scrolls/compacted/scrolls_compact_20261115_4b02463.md
  marker:     <!-- scrolls-compact: checkpoint=4b02463 date=2026-11-15 report=compacted/scrolls_compact_20261115_4b02463.md -->

docs/.scrolls/SPEC.md (17 lines; 2 old, 0 live, 2 new)
  old   L5-7     ## Product search (#12)   (last changed 8c94000 2026-10-06)
  old   L9-11    ## Checkout (#18)   (last changed 7e09b64 2026-10-21)
  new   L13-14   ## Order history (#23)   (last changed 6d75305 2026-11-03)
  new   L16-17   ## Wishlist (#27)   (last changed 9b2c58d 2026-11-12)

docs/.scrolls/PLAN.md (10 lines; 2 old, 1 live, 3 new)
  old   L5       - [x] SHOP-1: Product search. Merged in #12.   (last changed 8c94000 2026-10-06)
  live  L6       - [ ] SHOP-2: Saved carts.   (last changed 8c94000 2026-10-06)
  old   L7       - [x] SHOP-3: Checkout. Merged in #18.   (last changed 7e09b64 2026-10-21)
  new   L8       - [x] SHOP-4: Order history. Merged in #23.   (last changed 6d75305 2026-11-03)
  new   L9       - [x] SHOP-5: Wishlist. Merged in #27.   (last changed 9b2c58d 2026-11-12)
  new   L10      - [ ] SHOP-6: Gift cards.   (last changed 9b2c58d 2026-11-12)

docs/.scrolls/HANDOFF.md (14 lines; 0 old, 1 live, 4 new)
  new   L6       - main has search, checkout, order history and wishlist.   (last changed 9b2c58d 2026-11-12)
  new   L9       - Shipped wishlist (#27).   (last changed 9b2c58d 2026-11-12)
  new   L10      - Started gift cards (SHOP-6).   (last changed 4b02463 2026-11-14)
  live  L13      - Search is slow on catalogs over 10k items.   (last changed 8c94000 2026-10-06)
  new   L14      - Wishlists don't sync across devices yet.   (last changed 9b2c58d 2026-11-12)

docs/.scrolls/GAP_ANALYSIS.md (6 lines; 0 old, 2 live, 0 new)
  live  L5       - No saved carts.   (last changed 8c94000 2026-10-06)
  live  L6       - Search is English-only.   (last changed 8c94000 2026-10-06)

docs/.scrolls/GAP_CONTEXT.md (6 lines; 2 old, 0 live, 0 new)
  old   L5       - **No saved carts**: a deliberate cut for v1. The user wanted checkout…   (last changed 8c94000 2026-10-06)
  old   L6       - **Search is English-only**: a blocker. The stemming library supports…   (last changed 8c94000 2026-10-06)

Dry run: nothing changed. 6 old unit(s) can be condensed.
Next: condense only the `old` units (keep `live` and `new` word for word), put the marker
line above the condensed text in every file you change, then run again with --finalize.
```
<!--- prompt-output:end --->

2️⃣ The agent removes an open ticket, rewords the intro, leaves out the marker, and edits `WISDOM.md` (out of scope):

<!--- setup-block:start --->
```bash
sed -i '/SHOP-2/d; s/Highest priority first./Top first./' docs/.scrolls/PLAN.md
echo '- Never trust client prices.' >> docs/.scrolls/WISDOM.md
```
<!--- setup-block:end --->

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
**Output** (exit 3):

```text
Refused: the edits don't fit the plan. Nothing was committed; your edits are left in place.
  - docs/.scrolls/WISDOM.md: outside this compaction's scope; only SPEC.md, PLAN.md, HANDOFF.md, GAP_ANALYSIS.md, GAP_CONTEXT.md may change.
  - docs/.scrolls/PLAN.md: needs exactly one marker line, this run's:
    <!-- scrolls-compact: checkpoint=4b02463 date=2026-11-15 report=compacted/scrolls_compact_20261115_4b02463.md -->
  - docs/.scrolls/PLAN.md: live unit `- [ ] SHOP-2: Saved carts.` was changed or removed (missing line: '- [ ] SHOP-2: Saved carts.'). Only `old` units may be condensed.
  - docs/.scrolls/PLAN.md: text outside the units was changed or removed: 'Highest priority first.'
```
<!--- prompt-output:end --->

3️⃣ Undo the bad edits. Now nothing was condensed:

<!--- setup-block:start --->
```bash
git checkout -- docs/.scrolls
```
<!--- setup-block:end --->

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
**Output** (exit 1):

```text
Nothing was condensed: no in-scope file changed since the plan.
```
<!--- prompt-output:end --->
<!--- example:end --->
