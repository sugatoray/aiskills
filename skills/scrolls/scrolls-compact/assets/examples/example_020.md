# /scrolls-compact — Example-20: A second compaction, a month later

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the state [Example-01](example_001.md) leaves, after its `--finalize`.

<!--- example:start fixture=after-01 --->
## Example-20

A second compaction, a month later. Example-01's compaction commit is now old too, so the base is that commit. The new row goes on top, and the commit names the previous compaction.

### Premise

- A month has passed since the first compaction.

### Caveats

- The first compaction is now old too. Its summaries can be condensed again.
- The new row goes on top. The commit names the previous compaction.

1️⃣ The plan:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-12-15"
##   agent: "claude-code"
## ---

/scrolls-compact
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     docs/.scrolls
  checkpoint: ffa3cd2 (ffa3cd2316af575c08904e208b4c650f8a23dbc7)
  base:       ffa3cd2 2026-11-15  [rule: 7 days]
              7 days -> ffa3cd2 (2026-11-15); 20 commits -> none (only 6 commits on main)
  files:      SPEC.md, PLAN.md, HANDOFF.md, GAP_ANALYSIS.md, GAP_CONTEXT.md
  report:     docs/.scrolls/compacted/scrolls_compact_20261215_ffa3cd2.md
  marker:     <!-- scrolls-compact: checkpoint=ffa3cd2 date=2026-12-15 report=compacted/scrolls_compact_20261215_ffa3cd2.md -->

docs/.scrolls/SPEC.md (14 lines; 2 old, 0 live, 0 new)
  old   L5-11    ## Compacted features   (last changed ffa3cd2 2026-11-15)
  old   L13-14   ## Wishlist (#27)   (last changed 9b2c58d 2026-11-12)

docs/.scrolls/PLAN.md (10 lines; 1 old, 2 live, 0 new)
  live  L8       - [ ] SHOP-2: Saved carts.   (last changed 8c94000 2026-10-06)
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

docs/.scrolls/GAP_CONTEXT.md (9 lines; 2 old, 0 live, 0 new)
  old   L8       - **No saved carts**: a deliberate v1 cut; saved carts need accounts…   (last changed ffa3cd2 2026-11-15)
  old   L9       - **Search is English-only**: a blocker; the stemming library is…   (last changed ffa3cd2 2026-11-15)

Dry run: nothing changed. 8 old unit(s) can be condensed.
Next: condense only the `old` units (keep `live` and `new` word for word), put the marker
line above the condensed text in every file you change, then run again with --finalize.
```
<!--- prompt-output:end --->

2️⃣ The agent removes the done SHOP-5 ticket and replaces the old marker with this run's:

<!--- setup-block:start --->
```bash
cp=$(git rev-parse --short HEAD)
sed -i "/SHOP-5/d; s/^<!-- scrolls-compact:.*-->$/<!-- scrolls-compact: checkpoint=$cp date=2026-12-15 report=compacted\/scrolls_compact_20261215_$cp.md -->/; s/^> Done tickets.*/> Done tickets SHOP-1, SHOP-3, SHOP-4 and SHOP-5 were compacted. See \`COMPACT.md\`./" docs/.scrolls/PLAN.md
```
<!--- setup-block:end --->

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-12-15"
##   agent: "claude-code"
## ---

/scrolls-compact --finalize
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Compacted.
  commit:     0da6cd8eb4e5df46b60c9d01f70cf7351a4de081
  checkpoint: ffa3cd2316af575c08904e208b4c650f8a23dbc7
  base:       ffa3cd2316af575c08904e208b4c650f8a23dbc7 (2026-11-15; rule: 7 days)
  compacted:  docs/.scrolls/PLAN.md (10 → 9 lines)
  report:     docs/.scrolls/compacted/scrolls_compact_20261215_ffa3cd2.md
  tag:        scrolls-compact/20261215-ffa3cd2
Push the tag so the checkpoint survives squash merges: git push origin scrolls-compact/20261215-ffa3cd2
Undo: git revert --no-edit 0da6cd8eb4e5df46b60c9d01f70cf7351a4de081
```
<!--- prompt-output:end --->

3️⃣ Two rows, newest first, and the chain in the trailers:

<!--- prompt-block:start --->
```bash
## ---
## metadata:
##   date: "2026-12-15"
##   agent: "claude-code"
## ---

sed -n '/^| #/,$p' docs/.scrolls/COMPACT.md
git log -1 --format='%(trailers:key=Scrolls-Previous-Compaction)'
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
| # | Date | Checkpoint | Base (cutoff) | Rule | Files | Lines | Report |
|---|------|------------|---------------|------|-------|-------|--------|
| 2 | 2026-12-15 | `ffa3cd2` | `ffa3cd2` (2026-11-15) | 7 days | PLAN | 10 → 9 | [report](compacted/scrolls_compact_20261215_ffa3cd2.md) |
| 1 | 2026-11-15 | `4b02463` | `6d75305` (2026-11-03) | 7 days | SPEC, PLAN, GAP_CONTEXT | 33 → 33 | [report](compacted/scrolls_compact_20261115_4b02463.md) |
Scrolls-Previous-Compaction: ffa3cd2316af575c08904e208b4c650f8a23dbc7
```
<!--- prompt-output:end --->
<!--- example:end --->
