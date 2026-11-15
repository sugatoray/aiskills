# /scrolls-compact — Example-08: Choose the files

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the `shop` demo repository.

<!--- example:start fixture=shop --->
## Example-08

Choose the files. `--include` adds a project-specific scroll that `STARTER.md` lists; `--exclude` leaves one of the default five alone.

### Premise

- The project keeps an extra scroll, `DECISIONS.md`.
- You want to leave `HANDOFF.md` and `GAP_CONTEXT.md` as they are.

### Caveats

- `--include` takes a file that `STARTER.md` lists.
- `WISDOM.md`, `STARTER.md` and `COMPACT.md` are never compacted (exit 2).

The project keeps a `DECISIONS.md` scroll:

<!--- setup-block:start --->
```bash
printf '# DECISIONS.md\n\n## Use cents for prices\nFloats lost a cent on refunds.\n' > docs/.scrolls/DECISIONS.md
git add -A && git commit -q -m 'Add DECISIONS.md'
```
<!--- setup-block:end --->

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --include=DECISIONS.md --exclude=HANDOFF.md,GAP_CONTEXT.md
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     docs/.scrolls
  checkpoint: 2eda0be (2eda0be472131becd227fdedb18acf7d4e68937c)
  base:       6d75305 2026-11-03  [rule: 7 days]
              7 days -> 6d75305 (2026-11-03); 20 commits -> none (only 6 commits on main)
  files:      SPEC.md, PLAN.md, GAP_ANALYSIS.md, DECISIONS.md
  report:     docs/.scrolls/compacted/scrolls_compact_20261115_2eda0be.md
  marker:     <!-- scrolls-compact: checkpoint=2eda0be date=2026-11-15 report=compacted/scrolls_compact_20261115_2eda0be.md -->

docs/.scrolls/SPEC.md (17 lines; 3 old, 0 live, 1 new)
  old   L5-7     ## Product search (#12)   (last changed 8c94000 2026-10-06)
  old   L9-11    ## Checkout (#18)   (last changed 7e09b64 2026-10-21)
  old   L13-14   ## Order history (#23)   (last changed 6d75305 2026-11-03)
  new   L16-17   ## Wishlist (#27)   (last changed 9b2c58d 2026-11-12)

docs/.scrolls/PLAN.md (10 lines; 3 old, 1 live, 2 new)
  old   L5       - [x] SHOP-1: Product search. Merged in #12.   (last changed 8c94000 2026-10-06)
  live  L6       - [ ] SHOP-2: Saved carts.   (last changed 8c94000 2026-10-06)
  old   L7       - [x] SHOP-3: Checkout. Merged in #18.   (last changed 7e09b64 2026-10-21)
  old   L8       - [x] SHOP-4: Order history. Merged in #23.   (last changed 6d75305 2026-11-03)
  new   L9       - [x] SHOP-5: Wishlist. Merged in #27.   (last changed 9b2c58d 2026-11-12)
  new   L10      - [ ] SHOP-6: Gift cards.   (last changed 9b2c58d 2026-11-12)

docs/.scrolls/GAP_ANALYSIS.md (6 lines; 0 old, 2 live, 0 new)
  live  L5       - No saved carts.   (last changed 8c94000 2026-10-06)
  live  L6       - Search is English-only.   (last changed 8c94000 2026-10-06)

docs/.scrolls/DECISIONS.md (4 lines; 0 old, 0 live, 1 new)
  new   L3-4     ## Use cents for prices   (last changed 2eda0be 2026-11-15)

Dry run: nothing changed. 6 old unit(s) can be condensed.
Next: condense only the `old` units (keep `live` and `new` word for word), put the marker
line above the condensed text in every file you change, then run again with --finalize.
```
<!--- prompt-output:end --->

`WISDOM.md`, `STARTER.md` and `COMPACT.md` are never compacted:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --include=WISDOM.md
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 2):

```text
--include=WISDOM.md: WISDOM.md is never compacted.
```
<!--- prompt-output:end --->
<!--- example:end --->
