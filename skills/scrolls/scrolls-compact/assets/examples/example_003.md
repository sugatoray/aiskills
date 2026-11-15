# /scrolls-compact — Example-03: The commit rule wins

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the `busy-shop` fixture (`shop` plus 24 small commits).

<!--- example:start fixture=busy-shop --->
## Example-03

A busy repository: 24 small commits landed in the last day. The 21st commit back is newer than the 7-day cutoff, so the **20 commits** rule wins and more is old. `-y` skips the confirmation step.

### Premise

- Many small commits landed in the last day.

### Caveats

- The 21st commit is newer than the 7-day cutoff, so the commit rule decides.
- `-y` skips the confirmation step. The plan is still shown.

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact -y
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     docs/.scrolls
  checkpoint: 865a9a7 (865a9a73e677e7f49dc6acbb67c465d468cfa7e7)
  base:       280df8f 2026-11-14  [rule: 20 commits]
              7 days -> 6d75305 (2026-11-03); 20 commits -> 280df8f (2026-11-14)
  files:      SPEC.md, PLAN.md, HANDOFF.md, GAP_ANALYSIS.md, GAP_CONTEXT.md
  report:     docs/.scrolls/compacted/scrolls_compact_20261115_865a9a7.md
  marker:     <!-- scrolls-compact: checkpoint=865a9a7 date=2026-11-15 report=compacted/scrolls_compact_20261115_865a9a7.md -->

docs/.scrolls/SPEC.md (17 lines; 4 old, 0 live, 0 new)
  old   L5-7     ## Product search (#12)   (last changed 8c94000 2026-10-06)
  old   L9-11    ## Checkout (#18)   (last changed 7e09b64 2026-10-21)
  old   L13-14   ## Order history (#23)   (last changed 6d75305 2026-11-03)
  old   L16-17   ## Wishlist (#27)   (last changed 9b2c58d 2026-11-12)

docs/.scrolls/PLAN.md (10 lines; 4 old, 2 live, 0 new)
  old   L5       - [x] SHOP-1: Product search. Merged in #12.   (last changed 8c94000 2026-10-06)
  live  L6       - [ ] SHOP-2: Saved carts.   (last changed 8c94000 2026-10-06)
  old   L7       - [x] SHOP-3: Checkout. Merged in #18.   (last changed 7e09b64 2026-10-21)
  old   L8       - [x] SHOP-4: Order history. Merged in #23.   (last changed 6d75305 2026-11-03)
  old   L9       - [x] SHOP-5: Wishlist. Merged in #27.   (last changed 9b2c58d 2026-11-12)
  live  L10      - [ ] SHOP-6: Gift cards.   (last changed 9b2c58d 2026-11-12)

docs/.scrolls/HANDOFF.md (14 lines; 3 old, 2 live, 0 new)
  old   L6       - main has search, checkout, order history and wishlist.   (last changed 9b2c58d 2026-11-12)
  old   L9       - Shipped wishlist (#27).   (last changed 9b2c58d 2026-11-12)
  old   L10      - Started gift cards (SHOP-6).   (last changed 4b02463 2026-11-14)
  live  L13      - Search is slow on catalogs over 10k items.   (last changed 8c94000 2026-10-06)
  live  L14      - Wishlists don't sync across devices yet.   (last changed 9b2c58d 2026-11-12)

docs/.scrolls/GAP_ANALYSIS.md (6 lines; 0 old, 2 live, 0 new)
  live  L5       - No saved carts.   (last changed 8c94000 2026-10-06)
  live  L6       - Search is English-only.   (last changed 8c94000 2026-10-06)

docs/.scrolls/GAP_CONTEXT.md (6 lines; 2 old, 0 live, 0 new)
  old   L5       - **No saved carts**: a deliberate cut for v1. The user wanted checkout…   (last changed 8c94000 2026-10-06)
  old   L6       - **Search is English-only**: a blocker. The stemming library supports…   (last changed 8c94000 2026-10-06)

Dry run: nothing changed. 13 old unit(s) can be condensed.
Next: condense only the `old` units (keep `live` and `new` word for word), put the marker
line above the condensed text in every file you change, then run again with --finalize.
```
<!--- prompt-output:end --->
<!--- example:end --->
