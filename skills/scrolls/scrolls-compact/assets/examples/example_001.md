# /scrolls-compact — Example-01: A full compaction with the default rules

[← All examples](../EXAMPLES.md) · The demo repository, the fixtures and how to read the blocks are described there.

Starts from: the `shop` demo repository.

<!--- example:start fixture=shop --->
## Example-01

A full compaction with the default rules: plan, condense, finalize, then the files it leaves behind.

### Premise

- The scrolls have grown over many sessions.
- `PLAN.md` has many done tickets. `SPEC.md` has long feature sections.

### Caveats

- The base is the newer of two commits: the newest commit older than 7 days, and the 21st commit on `main`. Here `main` has only 5 commits, so the 7-day rule decides.
- The skill keeps open tickets, gaps and open threads. Their age does not matter.
- You see the plan first. The skill condenses only after you confirm.

1️⃣ Ask for a compaction. The skill runs the plan first. It changes nothing yet.

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
**Output**:

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     docs/.scrolls
  checkpoint: 4b02463 (4b02463f3d8c318e3a64fc91d3d9577988ec4506)
  base:       6d75305 2026-11-03  [rule: 7 days]
              7 days -> 6d75305 (2026-11-03); 20 commits -> none (only 5 commits on main)
  files:      SPEC.md, PLAN.md, HANDOFF.md, GAP_ANALYSIS.md, GAP_CONTEXT.md
  report:     docs/.scrolls/compacted/scrolls_compact_20261115_4b02463.md
  marker:     <!-- scrolls-compact: checkpoint=4b02463 date=2026-11-15 report=compacted/scrolls_compact_20261115_4b02463.md -->

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

Dry run: nothing changed. 8 old unit(s) can be condensed.
Next: condense only the `old` units (keep `live` and `new` word for word), put the marker
line above the condensed text in every file you change, then run again with --finalize.
```
<!--- prompt-output:end --->

2️⃣ After you confirm, the agent condenses the `old` units, and puts the marker line in each file it changes. `SPEC.md`, `PLAN.md` and `GAP_CONTEXT.md` have `old` units. `HANDOFF.md` has none (only `live` and `new`), and every `GAP_ANALYSIS.md` line is `live`, so the agent leaves those two alone.

<!--- setup-block:start --->
```bash
cat > docs/.scrolls/SPEC.md <<'EOF'
# SPEC.md — Feature Spec

What shop does, feature by feature.

## Compacted features
<!-- scrolls-compact: checkpoint=4b02463 date=2026-11-15 report=compacted/scrolls_compact_20261115_4b02463.md -->
> Older detail was compacted on 2026-11-15. See `COMPACT.md` to reach the full text.

- **Product search** — search by name or SKU, with typo tolerance (#12).
- **Checkout** — card payments, with an emailed receipt (#18).
- **Order history** — signed-in users see their past orders (#23).

## Wishlist (#27)
A heart icon saves an item for later.
EOF
cat > docs/.scrolls/PLAN.md <<'EOF'
# PLAN.md — Prioritized Backlog

Highest priority first.

<!-- scrolls-compact: checkpoint=4b02463 date=2026-11-15 report=compacted/scrolls_compact_20261115_4b02463.md -->
> Done tickets SHOP-1, SHOP-3 and SHOP-4 were compacted on 2026-11-15. See `COMPACT.md`.

- [ ] SHOP-2: Saved carts.
- [x] SHOP-5: Wishlist. Merged in #27.
- [ ] SHOP-6: Gift cards.
EOF
cat > docs/.scrolls/GAP_CONTEXT.md <<'EOF'
# GAP_CONTEXT.md — Why Each Gap Exists

One reason per gap.

<!-- scrolls-compact: checkpoint=4b02463 date=2026-11-15 report=compacted/scrolls_compact_20261115_4b02463.md -->
> Reasons were tightened on 2026-11-15. See `COMPACT.md` for the full text.

- **No saved carts**: a deliberate v1 cut; saved carts need accounts, not built yet.
- **Search is English-only**: a blocker; the stemming library is English-only.
EOF
```
<!--- setup-block:end --->

3️⃣ The skill finalizes: it checks the edits against the plan, writes the report and the table row, commits and tags.

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
**Output**:

```text
Compacted.
  commit:     ffa3cd2316af575c08904e208b4c650f8a23dbc7
  checkpoint: 4b02463f3d8c318e3a64fc91d3d9577988ec4506
  base:       6d7530546033756d755e79434b1d8ddc5004f633 (2026-11-03; rule: 7 days)
  compacted:  docs/.scrolls/SPEC.md (17 → 14 lines)
  compacted:  docs/.scrolls/PLAN.md (10 → 10 lines)
  compacted:  docs/.scrolls/GAP_CONTEXT.md (6 → 9 lines)
  report:     docs/.scrolls/compacted/scrolls_compact_20261115_4b02463.md
  tag:        scrolls-compact/20261115-4b02463
Push the tag so the checkpoint survives squash merges: git push origin scrolls-compact/20261115-4b02463
Undo: git revert --no-edit ffa3cd2316af575c08904e208b4c650f8a23dbc7
```
<!--- prompt-output:end --->

4️⃣ The Compaction History table in `COMPACT.md`:

<!--- prompt-block:start --->
```bash
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

sed -n '/^## Compaction History/,$p' docs/.scrolls/COMPACT.md
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
## Compaction History

| # | Date | Checkpoint | Base (cutoff) | Rule | Files | Lines | Report |
|---|------|------------|---------------|------|-------|-------|--------|
| 1 | 2026-11-15 | `4b02463` | `6d75305` (2026-11-03) | 7 days | SPEC, PLAN, GAP_CONTEXT | 33 → 33 | [report](compacted/scrolls_compact_20261115_4b02463.md) |
```
<!--- prompt-output:end --->

5️⃣ The report. It has one marker section per compacted file:

<!--- prompt-block:start --->
```bash
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

cat docs/.scrolls/compacted/scrolls_compact_20261115_4b02463.md
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
# Scrolls compaction — 2026-11-15

- Checkpoint: `4b02463f3d8c318e3a64fc91d3d9577988ec4506` (tag `scrolls-compact/20261115-4b02463`)
- Base: `6d7530546033756d755e79434b1d8ddc5004f633` (2026-11-03) — rule: 7 days
- Candidates: 7 days -> 6d75305 (2026-11-03); 20 commits -> none (only 5 commits on main)
- Folder at checkpoint: `docs/.scrolls`
- Previous compaction: none

Each section below is a marker for one compacted file. Read a file as it was with `git show 4b02463f3d8c318e3a64fc91d3d9577988ec4506:<path>`, or by its blob id with `git cat-file -p <blob>`.

## docs/.scrolls/SPEC.md
- Blob at checkpoint: `7ecb0440fe8bab29eedd0dff57765bdfe7e7b414` → `git cat-file -p 7ecb0440fe8bab29eedd0dff57765bdfe7e7b414`
- Lines: 17 → 14
- Condensed or removed:
  - `## Product search (#12)`
  - `## Checkout (#18)`
  - `## Order history (#23)`
- Full text: `git show 4b02463f3d8c318e3a64fc91d3d9577988ec4506:docs/.scrolls/SPEC.md`

## docs/.scrolls/PLAN.md
- Blob at checkpoint: `1a91c2fdf044011c0c50d225711180dd3254c9ae` → `git cat-file -p 1a91c2fdf044011c0c50d225711180dd3254c9ae`
- Lines: 10 → 10
- Condensed or removed:
  - `- [x] SHOP-1: Product search. Merged in #12.`
  - `- [x] SHOP-3: Checkout. Merged in #18.`
  - `- [x] SHOP-4: Order history. Merged in #23.`
- Full text: `git show 4b02463f3d8c318e3a64fc91d3d9577988ec4506:docs/.scrolls/PLAN.md`

## docs/.scrolls/GAP_CONTEXT.md
- Blob at checkpoint: `5e6d88d77233ee6271203b8d736ee1a25ba33018` → `git cat-file -p 5e6d88d77233ee6271203b8d736ee1a25ba33018`
- Lines: 6 → 9
- Condensed or removed:
  - `- **No saved carts**: a deliberate cut for v1. The user wanted checkout…`
  - `- **Search is English-only**: a blocker. The stemming library supports…`
- Full text: `git show 4b02463f3d8c318e3a64fc91d3d9577988ec4506:docs/.scrolls/GAP_CONTEXT.md`

## Unchanged

- docs/.scrolls/HANDOFF.md
- docs/.scrolls/GAP_ANALYSIS.md
```
<!--- prompt-output:end --->

6️⃣ The commit message, the checkpoint tag, and the new `STARTER.md` entry:

<!--- prompt-block:start --->
```bash
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

git log -1 --format=%B && git tag && grep -n COMPACT docs/.scrolls/STARTER.md
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
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

scrolls-compact/20261115-4b02463
11:7. **`docs/.scrolls/COMPACT.md`** — The compaction history. Read it only when you need detail older than the condensed summaries in the files above: it names the git checkpoint that holds the full text, and the commands to reach it. Never edit it or `compacted/` by hand.
19:- **COMPACT.md**: never by hand. Only `/scrolls-compact` writes it and `compacted/`; `/scrolls-update` leaves both alone.
```
<!--- prompt-output:end --->
<!--- example:end --->
