# /scrolls-compact — Examples

> **Writing rule for this file.** Write the prose in ASD-STE100 Simplified Technical English, at about 80% conformance. Keep to these rules when you change it:
>
> - Use short sentences: 20 words max for instructions, 25 words max for descriptions.
> - Use the active voice. Use the imperative for instructions.
> - Put one instruction in one sentence.
> - Use simple, approved words. Use one word for one meaning.
> - Prefer bullet points to paragraphs.
> - Put each example in one `<!--- example:start fixture=… --->` block, headed `## Example-NN`, with **Premise**, **Caveats**, then the prompt and its output.
> - Never edit an output by hand. `tests/test_examples.sh` replays every example and fails on any difference.

`/scrolls-compact` condenses old history in the scrolls. The full old text stays in git, at a checkpoint commit.

**How to read these examples**

- Every output is real. `tests/test_examples.sh` replays each example against the bundled script in a
  freshly built demo repository and fails if any output differs from what is shown here.
- Each prompt is what you type. The agent runs `scripts/compact.sh` with the same flags (step 1 of
  `SKILL.md`), and shows you its output. Between the plan and `--finalize`, the agent edits the files
  itself; those edits are shown as `bash` blocks.
- The `date` in each prompt's metadata is the clock: 08:00 UTC that day. The demo repository's commits
  have fixed dates and authors, so their hashes are the same on every run. The repository is shown at
  `/work/shop`.
- `bash` prompt blocks are commands you can run yourself to look at the result.

**The demo repository (`shop`)**

```text
shop/                              branch main, 5 commits
├── app/store.py
└── docs/.scrolls/
    ├── STARTER.md  SPEC.md  PLAN.md  HANDOFF.md
    ├── GAP_ANALYSIS.md  GAP_CONTEXT.md  WISDOM.md

8c94000  2026-10-06  Add product search (#12)   scrolls set up; SPEC, PLAN, HANDOFF, GAP files
7e09b64  2026-10-21  Add checkout (#18)
6d75305  2026-11-03  Add order history (#23)
9b2c58d  2026-11-12  Add wishlist (#27)         HANDOFF rewritten
4b02463  2026-11-14  Start gift cards           HANDOFF: one line added
```

Other fixtures: `busy-shop` (the same, plus 24 small commits on 2026-11-14), `monorepo` (the scrolls in
`packages/api/docs/.scrolls`), `fresh-shop` (every commit in the last two days), `no-scrolls`, `no-git`,
and `after-NN` / `condensed-NN` (the state Example-NN leaves, or leaves just before its `--finalize`).

| Example | Prompt | Shows |
| --- | --- | --- |
| [01](#example-01) | `/scrolls-compact`, `--finalize` | A full compaction with the default rules |
| [02](#example-02) | `-n` | Preview only |
| [03](#example-03) | `-y` | The commit rule wins |
| [04](#example-04) | `--keep-days`, `--keep-commits`, `--trunk` | Tune the windows, or count on another branch |
| [05](#example-05) | `--before` | Compact before a date |
| [06](#example-06) | `--base` | Compact up to a commit or tag |
| [07](#example-07) | `--before` + `--base` | --before and --base together |
| [08](#example-08) | `--include`, `--exclude` | Choose the files |
| [09](#example-09) | `-l`, `-t`, `-p` | Run from a subfolder |
| [10](#example-10) | `-r`, `-p` | A monorepo package |
| [11](#example-11) | `/scrolls-compact` | Nothing is old enough |
| [12](#example-12) | Refusals | Safety refusals |
| [13](#example-13) | Mistakes | Usage errors |
| [14](#example-14) | `-r` | No scrolls folder |
| [15](#example-15) | `/scrolls-compact` | Not a git repository |
| [16](#example-16) | `--finalize` | An edit that breaks the rules |
| [17](#example-17) | `--finalize -n`, `--no-commit` | Check first, or stage without committing |
| [18](#example-18) | `--finalize` | A commit hook rejects the commit |
| [19](#example-19) | `--no-tag` | No checkpoint tag |
| [20](#example-20) | `/scrolls-compact`, `--finalize` | A second compaction, a month later |
| [21](#example-21) | `--list`, `--show`, `--extract`, `-o` | Read the old text back |
| [22](#example-22) | `--list`, `--show`, `--extract` | After a squash merge and /scrolls-unhide |
| [23](#example-23) | `git revert` | Undo a compaction |

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

<!--- example:start fixture=shop --->
## Example-02

Preview only. `-n` prints the plan and stops. (The plan is always read-only; `-n` tells the agent not to go on.)

### Premise

- You want to see what is old. You do not want changes yet.

### Caveats

- The plan is always read-only. With `-n`, the skill stops after it shows the plan.

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact -n
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
<!--- example:end --->

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

<!--- example:start fixture=busy-shop --->
## Example-04

Tune the two default rules, or count commits on another branch.

### Premise

- The default windows keep too much, or too little.
- Releases are cut from a `release` branch.

### Caveats

- A rule with no candidate is ignored. The other rule decides.
- `--trunk` changes the branch that both rules walk.

1️⃣ Keep 30 commits instead of 20. The repository has only 29, so that rule has no candidate, and the 7-day rule decides:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --keep-commits=30
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     docs/.scrolls
  checkpoint: 865a9a7 (865a9a73e677e7f49dc6acbb67c465d468cfa7e7)
  base:       6d75305 2026-11-03  [rule: 7 days]
              7 days -> 6d75305 (2026-11-03); 30 commits -> none (only 29 commits on main)
  files:      SPEC.md, PLAN.md, HANDOFF.md, GAP_ANALYSIS.md, GAP_CONTEXT.md
  report:     docs/.scrolls/compacted/scrolls_compact_20261115_865a9a7.md
  marker:     <!-- scrolls-compact: checkpoint=865a9a7 date=2026-11-15 report=compacted/scrolls_compact_20261115_865a9a7.md -->

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

2️⃣ Keep only 2 days, and 40 commits (no candidate). Content up to the wishlist commit is now old:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --keep-days=2 --keep-commits=40
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     docs/.scrolls
  checkpoint: 865a9a7 (865a9a73e677e7f49dc6acbb67c465d468cfa7e7)
  base:       9b2c58d 2026-11-12  [rule: 2 days]
              2 days -> 9b2c58d (2026-11-12); 40 commits -> none (only 29 commits on main)
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

docs/.scrolls/HANDOFF.md (14 lines; 2 old, 2 live, 1 new)
  old   L6       - main has search, checkout, order history and wishlist.   (last changed 9b2c58d 2026-11-12)
  old   L9       - Shipped wishlist (#27).   (last changed 9b2c58d 2026-11-12)
  new   L10      - Started gift cards (SHOP-6).   (last changed 4b02463 2026-11-14)
  live  L13      - Search is slow on catalogs over 10k items.   (last changed 8c94000 2026-10-06)
  live  L14      - Wishlists don't sync across devices yet.   (last changed 9b2c58d 2026-11-12)

docs/.scrolls/GAP_ANALYSIS.md (6 lines; 0 old, 2 live, 0 new)
  live  L5       - No saved carts.   (last changed 8c94000 2026-10-06)
  live  L6       - Search is English-only.   (last changed 8c94000 2026-10-06)

docs/.scrolls/GAP_CONTEXT.md (6 lines; 2 old, 0 live, 0 new)
  old   L5       - **No saved carts**: a deliberate cut for v1. The user wanted checkout…   (last changed 8c94000 2026-10-06)
  old   L6       - **Search is English-only**: a blocker. The stemming library supports…   (last changed 8c94000 2026-10-06)

Dry run: nothing changed. 12 old unit(s) can be condensed.
Next: condense only the `old` units (keep `live` and `new` word for word), put the marker
line above the condensed text in every file you change, then run again with --finalize.
```
<!--- prompt-output:end --->

3️⃣ Count commits on a `release` branch instead of `main`. `release` ends at the wishlist commit, before the busy commits, so keeping 1 commit there makes order history the base:

<!--- setup-block:start --->
```bash
git branch release HEAD~25
```
<!--- setup-block:end --->
<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --trunk=release --keep-commits=1
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     docs/.scrolls
  checkpoint: 865a9a7 (865a9a73e677e7f49dc6acbb67c465d468cfa7e7)
  base:       6d75305 2026-11-03  [rule: 1 commit]
              7 days -> 6d75305 (2026-11-03); 1 commit -> 6d75305 (2026-11-03)
  files:      SPEC.md, PLAN.md, HANDOFF.md, GAP_ANALYSIS.md, GAP_CONTEXT.md
  report:     docs/.scrolls/compacted/scrolls_compact_20261115_865a9a7.md
  marker:     <!-- scrolls-compact: checkpoint=865a9a7 date=2026-11-15 report=compacted/scrolls_compact_20261115_865a9a7.md -->

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
<!--- example:end --->

<!--- example:start fixture=shop --->
## Example-05

Compact everything last changed before a date. `--before` replaces both default rules.

### Premise

- You want to keep only the notes from the last few weeks.

### Caveats

- `--before` replaces the default rules.
- The base is the newest `main` commit before 00:00 local time on that date.
- `YYYY-MM-DD` is also correct.

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

The same date, written `YYYY-MM-DD`:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --before=2026-10-25
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
<!--- example:end --->

<!--- example:start fixture=shop --->
## Example-06

Compact everything last changed in a commit or its ancestors. Here the base is a release tag.

### Premise

- A release tag marks the point to compact up to.

### Caveats

- `--base` replaces the default rules.
- The commit must be an ancestor of HEAD.

The checkout release was tagged `v1.0`:

<!--- setup-block:start --->
```bash
git tag v1.0 HEAD~3
```
<!--- setup-block:end --->

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --base=v1.0
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     docs/.scrolls
  checkpoint: 4b02463 (4b02463f3d8c318e3a64fc91d3d9577988ec4506)
  base:       7e09b64 2026-10-21  [rule: --base]
              --base -> 7e09b64 (2026-10-21)
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
<!--- example:end --->

<!--- example:start fixture=shop --->
## Example-07

`--before` and `--base` together. The newer of the two wins: here `--before=20261110` (order history) is newer than `--base=HEAD~3` (checkout).

### Premise

- You give a date and a commit.

### Caveats

- The newer of the two is the base.

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --before=20261110 --base=HEAD~3
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     docs/.scrolls
  checkpoint: 4b02463 (4b02463f3d8c318e3a64fc91d3d9577988ec4506)
  base:       6d75305 2026-11-03  [rule: --before]
              --before -> 6d75305 (2026-11-03); --base -> 7e09b64 (2026-10-21)
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
<!--- example:end --->

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

<!--- example:start fixture=shop --->
## Example-09

Run from a subfolder (`app/`). The location flags are the same as `/scrolls-update`'s.

### Premise

- You are in a subfolder, `app/`.

### Caveats

- `-l` (the default) looks only in the current folder.
- `-t` looks under the repository root. `-p` names the folder.

1️⃣ `-l` (the default) looks in the current folder only. Nothing is there:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
##   cwd: "app"
## ---

/scrolls-compact -l
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 1):

```text
No scrolls folder found under /work/shop/app. Try -t (repository root) or -r (search recursively). Set one up with /scrolls-setup.
```
<!--- prompt-output:end --->

2️⃣ `-t` looks under the repository's top level:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
##   cwd: "app"
## ---

/scrolls-compact -t -n
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

3️⃣ `-p` names the folder:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
##   cwd: "app"
## ---

/scrolls-compact -p ../docs --keep-days=30
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     docs/.scrolls
  checkpoint: 4b02463 (4b02463f3d8c318e3a64fc91d3d9577988ec4506)
  base:       8c94000 2026-10-06  [rule: 30 days]
              30 days -> 8c94000 (2026-10-06); 20 commits -> none (only 5 commits on main)
  files:      SPEC.md, PLAN.md, HANDOFF.md, GAP_ANALYSIS.md, GAP_CONTEXT.md
  report:     docs/.scrolls/compacted/scrolls_compact_20261115_4b02463.md
  marker:     <!-- scrolls-compact: checkpoint=4b02463 date=2026-11-15 report=compacted/scrolls_compact_20261115_4b02463.md -->

docs/.scrolls/SPEC.md (17 lines; 1 old, 0 live, 3 new)
  old   L5-7     ## Product search (#12)   (last changed 8c94000 2026-10-06)
  new   L9-11    ## Checkout (#18)   (last changed 7e09b64 2026-10-21)
  new   L13-14   ## Order history (#23)   (last changed 6d75305 2026-11-03)
  new   L16-17   ## Wishlist (#27)   (last changed 9b2c58d 2026-11-12)

docs/.scrolls/PLAN.md (10 lines; 1 old, 1 live, 4 new)
  old   L5       - [x] SHOP-1: Product search. Merged in #12.   (last changed 8c94000 2026-10-06)
  live  L6       - [ ] SHOP-2: Saved carts.   (last changed 8c94000 2026-10-06)
  new   L7       - [x] SHOP-3: Checkout. Merged in #18.   (last changed 7e09b64 2026-10-21)
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

Dry run: nothing changed. 4 old unit(s) can be condensed.
Next: condense only the `old` units (keep `live` and `new` word for word), put the marker
line above the condensed text in every file you change, then run again with --finalize.
```
<!--- prompt-output:end --->
<!--- example:end --->

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

<!--- example:start fixture=fresh-shop --->
## Example-11

Nothing is old enough: every scroll line was written in the last two days.

### Premise

- The project is new. All scroll text is from the last few days.

### Caveats

- The skill stops with exit 1. It makes no changes.
- To cut deeper, use a smaller `--keep-days` or `--keep-commits`, or give `--base`.
- If old commits exist but every old unit is live state, the message is: `Nothing to compact: every unit is newer than the base, or is live state.`

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
**Output** (exit 1):

```text
Scrolls compaction plan
  repository: /work/shop
  folder:     docs/.scrolls
  checkpoint: 74bb40f (74bb40fe135098a612b01d6c387fc2d272eaff82)
  base:       none  [7 days -> none (older than 2026-11-08); 20 commits -> none (only 5 commits on main)]

Nothing to compact: no commit is old enough under these rules.
```
<!--- prompt-output:end --->
<!--- example:end --->

<!--- example:start fixture=shop --->
## Example-12

Safety refusals. The skill reports the reason and changes nothing. It never commits, stashes or deletes your files to get past one.

### Premise

- The scrolls folder or the index is not clean, or `--base` is wrong.

### Caveats

- The skill stops with exit 3. It changes nothing.
- Do not commit, stash or delete files to get past a refusal. Decide yourself.

1️⃣ An uncommitted edit in the scrolls folder. The checkpoint would not contain it:

<!--- setup-block:start --->
```bash
echo '- [ ] SHOP-7: Coupons.' >> docs/.scrolls/PLAN.md
```
<!--- setup-block:end --->

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
**Output** (exit 3):

```text
docs/.scrolls has uncommitted, untracked or ignored changes. The checkpoint would not contain them, so they could be lost. Commit or clear them first:
M docs/.scrolls/PLAN.md
```
<!--- prompt-output:end --->

2️⃣ An unrelated change is staged. It would end up in the compaction commit:

<!--- setup-block:start --->
```bash
git checkout -- docs/.scrolls/PLAN.md
echo '# coupons' >> app/store.py && git add app/store.py
```
<!--- setup-block:end --->

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
**Output** (exit 3):

```text
Other changes are already staged and would end up in the compaction commit:
app/store.py
```
<!--- prompt-output:end --->

3️⃣ `--base` names a commit that is not an ancestor of HEAD:

<!--- setup-block:start --->
```bash
git reset -q && git checkout -- app/store.py
git switch -q -c spike HEAD~2 && git commit -q --allow-empty -m 'Spike' && git switch -q main
```
<!--- setup-block:end --->

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --base=spike
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 3):

```text
--base=spike is not an ancestor of HEAD, so it can't mark what is old here.
```
<!--- prompt-output:end --->
<!--- example:end --->

<!--- example:start fixture=shop --->
## Example-13

Usage errors (exit 2).

### Premise

- A flag is wrong, or `--finalize` runs before a plan.

### Caveats

- The skill stops with exit 2. It changes nothing.

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact -p docs -t
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 2):

```text
Pass at most one of -p/--path, -t/--reporoot and -l/--local.
```
<!--- prompt-output:end --->

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact --before=2026-13-01
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 2):

```text
--before=2026-13-01: use YYYYMMDD or YYYY-MM-DD.
```
<!--- prompt-output:end --->

`--finalize` before any plan:

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
**Output** (exit 2):

```text
No compaction plan found. Run /scrolls-compact without --finalize first.
```
<!--- prompt-output:end --->
<!--- example:end --->

<!--- example:start fixture=no-scrolls --->
## Example-14

A repository with no scrolls folder. Set one up with `/scrolls-setup` first.

### Premise

- The repository has no scrolls folder.

### Caveats

- Set up the scrolls with `/scrolls-setup` first.

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
**Output** (exit 1):

```text
No scrolls folder found under /work/shop. Try -t (repository root) or -r (search recursively). Set one up with /scrolls-setup.
```
<!--- prompt-output:end --->

`-r` searches the whole tree, and finds nothing either:

<!--- prompt-block:start --->
```prompt
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

/scrolls-compact -r
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output** (exit 1):

```text
No scrolls folder found under /work/shop. Set one up with /scrolls-setup.
```
<!--- prompt-output:end --->
<!--- example:end --->

<!--- example:start fixture=no-git --->
## Example-15

Not a git repository. The old text has to live in git, so the skill needs one.

### Premise

- The folder is not a git repository.

### Caveats

- The old text must live in git. The skill needs a repository.

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
**Output** (exit 2):

```text
Not inside a git repository. /scrolls-compact keeps old history in git, so it needs one.
```
<!--- prompt-output:end --->
<!--- example:end --->

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

<!--- example:start fixture=condensed-01 --->
## Example-18

A commit hook rejects the commit (exit 4). The compaction stays staged; never retry with `--no-verify`.

### Premise

- The repository has a strict `commit-msg` hook.

### Caveats

- The compaction stays staged (exit 4).
- Never retry with `--no-verify`.

The repository has a strict `commit-msg` hook:

<!--- setup-block:start --->
```bash
printf '#!/bin/sh\necho "commit-msg: use a Conventional Commits type" >&2\nexit 1\n' > .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
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
**Output** (exit 4):

```text
commit-msg: use a Conventional Commits type

git commit failed; the compaction is left staged. Fix the cause, then run:
  git commit -F /work/shop/.git/SCROLLS_COMPACT_MSG
(Never retry with --no-verify.)
```
<!--- prompt-output:end --->

After the hook is fixed (here: removed), finish with the printed command, then tag the checkpoint:

<!--- prompt-block:start --->
```bash
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

rm .git/hooks/commit-msg
git commit -q -F .git/SCROLLS_COMPACT_MSG && git tag scrolls-compact/20261115-4b02463 4b02463
git log -1 --format=%s && git tag
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
maint(memory): scrolls-compacted
scrolls-compact/20261115-4b02463
```
<!--- prompt-output:end --->
<!--- example:end --->

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

<!--- example:start fixture=after-01 --->
## Example-23

Undo a compaction. It is one commit, so `git revert` brings the condensed text back. (`/scrolls-restore 4b02463 -f` would bring back the whole folder as it was.) The tag stays; delete it with `git tag -d` if you want.

### Premise

- You want the condensed text back.

### Caveats

- The compaction is one commit, so `git revert` undoes it.
- The checkpoint tag stays. Delete it with `git tag -d` if you want.

<!--- prompt-block:start --->
```bash
## ---
## metadata:
##   date: "2026-11-15"
##   agent: "claude-code"
## ---

git revert --no-edit HEAD >/dev/null
git log -1 --format=%s
sed -n '5,9p' docs/.scrolls/PLAN.md
ls docs/.scrolls
```
<!--- prompt-block:end --->

<!--- prompt-output:start --->
**Output**:

```text
Revert "maint(memory): scrolls-compacted"
- [x] SHOP-1: Product search. Merged in #12.
- [ ] SHOP-2: Saved carts.
- [x] SHOP-3: Checkout. Merged in #18.
- [x] SHOP-4: Order history. Merged in #23.
- [x] SHOP-5: Wishlist. Merged in #27.
GAP_ANALYSIS.md
GAP_CONTEXT.md
HANDOFF.md
PLAN.md
SPEC.md
STARTER.md
WISDOM.md
```
<!--- prompt-output:end --->
<!--- example:end --->
