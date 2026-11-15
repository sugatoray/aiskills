# /scrolls-compact — Examples

> **Writing rule for this file.** Write it in ASD-STE100 Simplified Technical English, at about 80% conformance. Keep to these rules when you change it:
>
> - Use short sentences: 20 words max for instructions, 25 words max for descriptions.
> - Use the active voice. Use the imperative for instructions.
> - Put one instruction in one sentence.
> - Use simple, approved words. Use one word for one meaning.
> - Prefer bullet points to paragraphs.
> - Put each example in one `## Example: NN — Title` block, with four sections: **Premise**, **Usage**, **Caveats**, **Expected Output**.

`/scrolls-compact` condenses old history in the scrolls. The full old text stays in git, at a checkpoint commit.

For every flag with its exact, tested output, see `EXAMPLE.md`.

---

## Example: 01 — Compact with the default rules

### Premise

- The scrolls have grown over many sessions.
- `PLAN.md` has many done tickets. `SPEC.md` has long feature sections.

### Usage

```
/scrolls-compact
```

### Caveats

- The base is the newer of two commits: the newest commit older than 7 days, and the 21st commit on `main`.
- The skill keeps open tickets, gaps and open threads. Their age does not matter.
- You see the plan first. The skill condenses only after you confirm.

### Expected Output

```
Scrolls compaction plan
  folder:     docs/.scrolls
  checkpoint: 904e593 (904e593…)
  base:       6b1afbf 2026-11-06  [rule: 20 commits]
              7 days -> 6b1afbf (2026-11-06); 20 commits -> 6b1afbf (2026-11-06)
  report:     docs/.scrolls/compacted/scrolls_compact_20261115_904e593.md
  marker:     <!-- scrolls-compact: checkpoint=904e593 date=2026-11-15 report=… -->

docs/.scrolls/PLAN.md (13 lines; 5 old, 4 live, 0 new)
  old   L5       - [x] ROOT-1: …
  live  L8       - [ ] ROOT-9: …
```

- After you confirm, the skill condenses the `old` units and commits:

```
Compacted.
  commit:     a1b2c3d…
  checkpoint: 904e593…
  report:     docs/.scrolls/compacted/scrolls_compact_20261115_904e593.md
  tag:        scrolls-compact/20261115-904e593
Push the tag so the checkpoint survives squash merges: git push origin scrolls-compact/20261115-904e593
Undo: git revert --no-edit a1b2c3d…
```

---

## Example: 02 — Compact everything before a date

### Premise

- You want to keep only the notes from this month.

### Usage

```
/scrolls-compact --before=20261101
```

### Caveats

- `--before` replaces the default rules.
- The base is the newest `main` commit before 00:00 local time on that date.
- `YYYY-MM-DD` is also correct: `--before=2026-11-01`.

### Expected Output

```
  base:       58c1e52 2026-10-31  [rule: --before]
              --before -> 58c1e52 (2026-10-31)
```

---

## Example: 03 — Preview only (dry run)

### Premise

- You want to see what is old. You do not want changes yet.

### Usage

```
/scrolls-compact -n
```

### Caveats

- The plan is always read-only. With `-n`, the skill stops after it shows the plan.

### Expected Output

- The plan, as in Example 01. Then:

```
Dry run: nothing changed. 9 old unit(s) can be condensed.
```

---

## Example: 04 — Nothing is old enough

### Premise

- The project is new. All scroll text is from the last few days.

### Usage

```
/scrolls-compact
```

### Caveats

- The skill stops with exit 1. It makes no changes.
- To cut deeper, use a smaller `--keep-days` or `--keep-commits`, or give `--base`.

### Expected Output

```
Nothing to compact: no commit is old enough under these rules.
```

- If old commits exist but every old unit is live state, the message is: `Nothing to compact: every unit is newer than the base, or is live state.`

---

## Example: 05 — Read the full text from before a compaction

### Premise

- A summary in `SPEC.md` is too short. You need the old section.

### Usage

```
/scrolls-compact --list
/scrolls-compact --extract 1 SPEC.md
/scrolls-compact --show 1 PLAN.md
```

### Caveats

- `1` is the row number in `COMPACT.md`. A checkpoint hash or a report name is also correct.
- These commands are read-only.
- They work after a squash merge, and after `/scrolls-unhide` moves the folder.

### Expected Output

```
Compactions of docs/.scrolls, newest first:
  #1  2026-11-15  904e593  base `6b1afbf` (2026-11-06)  [SPEC, PLAN, HANDOFF]  reachable  compacted/scrolls_compact_20261115_904e593.md
```

- `--extract` prints `SPEC.md` as it was at the checkpoint.
- `--show` prints the diff of what the compaction removed from `PLAN.md`.

---

## Example: 06 — An edit that the skill refuses

### Premise

- While condensing, the agent deleted an open ticket from `PLAN.md`.

### Usage

```
/scrolls-compact --finalize
```

### Caveats

- The skill does not commit. Your edits stay in the working tree.
- Put the ticket back, then run `--finalize` again.

### Expected Output

```
Refused: the edits don't fit the plan. Nothing was committed; your edits are left in place.
  - docs/.scrolls/PLAN.md: live unit `- [ ] ROOT-9: …` was changed or removed (missing line: …). Only `old` units may be condensed.
```
