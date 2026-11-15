# /scrolls-compact — Example-10: A monorepo package

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the `monorepo` fixture (the scrolls in `packages/api/docs/.scrolls`).

<!--- example:start fixture=monorepo --->
## Example-10

A monorepo: the scrolls live in `packages/api/docs/.scrolls`.

### Premise

- The scrolls live in one package of a monorepo.

### Caveats

- `-r` searches the tree. It compacts one folder per run.
- If it finds more than one folder, it stops and lists them. Pick one with `-p`.

1️⃣ From the root, `-r` searches for the folder:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact -r --before=20261025
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     packages/api/docs/.scrolls
  checkpoint: 7df39cd (7df39cd62d386ffaa03509ea83ff3266b58e217b)
  base:       d5200e4 2026-10-21  [rule: --before]
              --before -> d5200e4 (2026-10-21)
  files:      SPEC.md, PLAN.md, HANDOFF.md, GAP_ANALYSIS.md, GAP_CONTEXT.md
  report:     packages/api/docs/.scrolls/compacted/scrolls_compact_20261115_7df39cd.md
  marker:     <!-- scrolls-compact: checkpoint=7df39cd date=2026-11-15 report=compacted/scrolls_compact_20261115_7df39cd.md -->

packages/api/docs/.scrolls/SPEC.md (17 lines; 2 old, 0 live, 2 new)
  old   L5-7     ## Product search (#12)   (last changed 902d82a 2026-10-06)
  old   L9-11    ## Checkout (#18)   (last changed d5200e4 2026-10-21)
  new   L13-14   ## Order history (#23)   (last changed 32e17c0 2026-11-03)
  new   L16-17   ## Wishlist (#27)   (last changed 79ebcb8 2026-11-12)

packages/api/docs/.scrolls/PLAN.md (10 lines; 2 old, 1 live, 3 new)
  old   L5       - [x] SHOP-1: Product search. Merged in #12.   (last changed 902d82a 2026-10-06)
  live  L6       - [ ] SHOP-2: Saved carts.   (last changed 902d82a 2026-10-06)
  old   L7       - [x] SHOP-3: Checkout. Merged in #18.   (last changed d5200e4 2026-10-21)
  new   L8       - [x] SHOP-4: Order history. Merged in #23.   (last changed 32e17c0 2026-11-03)
  new   L9       - [x] SHOP-5: Wishlist. Merged in #27.   (last changed 79ebcb8 2026-11-12)
  new   L10      - [ ] SHOP-6: Gift cards.   (last changed 79ebcb8 2026-11-12)

packages/api/docs/.scrolls/HANDOFF.md (14 lines; 0 old, 1 live, 4 new)
  new   L6       - main has search, checkout, order history and wishlist.   (last changed 79ebcb8 2026-11-12)
  new   L9       - Shipped wishlist (#27).   (last changed 79ebcb8 2026-11-12)
  new   L10      - Started gift cards (SHOP-6).   (last changed 7df39cd 2026-11-14)
  live  L13      - Search is slow on catalogs over 10k items.   (last changed 902d82a 2026-10-06)
  new   L14      - Wishlists don't sync across devices yet.   (last changed 79ebcb8 2026-11-12)

packages/api/docs/.scrolls/GAP_ANALYSIS.md (6 lines; 0 old, 2 live, 0 new)
  live  L5       - No saved carts.   (last changed 902d82a 2026-10-06)
  live  L6       - Search is English-only.   (last changed 902d82a 2026-10-06)

packages/api/docs/.scrolls/GAP_CONTEXT.md (6 lines; 2 old, 0 live, 0 new)
  old   L5       - **No saved carts**: a deliberate cut for v1. The user wanted checkout…   (last changed 902d82a 2026-10-06)
  old   L6       - **Search is English-only**: a blocker. The stemming library supports…   (last changed 902d82a 2026-10-06)

Dry run: nothing changed. 6 old unit(s) can be condensed.
Next: condense only the `old` units (keep `live` and `new` word for word), put the marker
line above the condensed text in every file you change, then run again with --finalize.
```
<!--- prompt-output:end --->

2️⃣ Or name the package with `-p`:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact -p packages/api --before=20261025
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     packages/api/docs/.scrolls
  checkpoint: 7df39cd (7df39cd62d386ffaa03509ea83ff3266b58e217b)
  base:       d5200e4 2026-10-21  [rule: --before]
              --before -> d5200e4 (2026-10-21)
  files:      SPEC.md, PLAN.md, HANDOFF.md, GAP_ANALYSIS.md, GAP_CONTEXT.md
  report:     packages/api/docs/.scrolls/compacted/scrolls_compact_20261115_7df39cd.md
  marker:     <!-- scrolls-compact: checkpoint=7df39cd date=2026-11-15 report=compacted/scrolls_compact_20261115_7df39cd.md -->

packages/api/docs/.scrolls/SPEC.md (17 lines; 2 old, 0 live, 2 new)
  old   L5-7     ## Product search (#12)   (last changed 902d82a 2026-10-06)
  old   L9-11    ## Checkout (#18)   (last changed d5200e4 2026-10-21)
  new   L13-14   ## Order history (#23)   (last changed 32e17c0 2026-11-03)
  new   L16-17   ## Wishlist (#27)   (last changed 79ebcb8 2026-11-12)

packages/api/docs/.scrolls/PLAN.md (10 lines; 2 old, 1 live, 3 new)
  old   L5       - [x] SHOP-1: Product search. Merged in #12.   (last changed 902d82a 2026-10-06)
  live  L6       - [ ] SHOP-2: Saved carts.   (last changed 902d82a 2026-10-06)
  old   L7       - [x] SHOP-3: Checkout. Merged in #18.   (last changed d5200e4 2026-10-21)
  new   L8       - [x] SHOP-4: Order history. Merged in #23.   (last changed 32e17c0 2026-11-03)
  new   L9       - [x] SHOP-5: Wishlist. Merged in #27.   (last changed 79ebcb8 2026-11-12)
  new   L10      - [ ] SHOP-6: Gift cards.   (last changed 79ebcb8 2026-11-12)

packages/api/docs/.scrolls/HANDOFF.md (14 lines; 0 old, 1 live, 4 new)
  new   L6       - main has search, checkout, order history and wishlist.   (last changed 79ebcb8 2026-11-12)
  new   L9       - Shipped wishlist (#27).   (last changed 79ebcb8 2026-11-12)
  new   L10      - Started gift cards (SHOP-6).   (last changed 7df39cd 2026-11-14)
  live  L13      - Search is slow on catalogs over 10k items.   (last changed 902d82a 2026-10-06)
  new   L14      - Wishlists don't sync across devices yet.   (last changed 79ebcb8 2026-11-12)

packages/api/docs/.scrolls/GAP_ANALYSIS.md (6 lines; 0 old, 2 live, 0 new)
  live  L5       - No saved carts.   (last changed 902d82a 2026-10-06)
  live  L6       - Search is English-only.   (last changed 902d82a 2026-10-06)

packages/api/docs/.scrolls/GAP_CONTEXT.md (6 lines; 2 old, 0 live, 0 new)
  old   L5       - **No saved carts**: a deliberate cut for v1. The user wanted checkout…   (last changed 902d82a 2026-10-06)
  old   L6       - **Search is English-only**: a blocker. The stemming library supports…   (last changed 902d82a 2026-10-06)

Dry run: nothing changed. 6 old unit(s) can be condensed.
Next: condense only the `old` units (keep `live` and `new` word for word), put the marker
line above the condensed text in every file you change, then run again with --finalize.
```
<!--- prompt-output:end --->
<!--- example:end --->
