# `/scrolls-compact` — design

Status: **draft for review**. Nothing here ships yet. This folder has no
`SKILL.md`, so it isn't installable and isn't listed in `plugin.json`.
Once the decisions in [Open questions](#11-open-questions) are settled,
this document becomes the source for `SKILL.md`, `scripts/compact.py`,
the tests, and the family-wide edits listed in
[§10](#10-family-integration-checklist).

## 1. What it is for

`/scrolls-setup`, `/scrolls-update`, `/scrolls-hide`/`-unhide` and
`/scrolls-remove`/`-restore` manage the scrolls *in space*: where the
folder is, and whether it exists. Remove/restore touch time only a
little: they leave one checkpoint so a removal can be undone.

`/scrolls-compact` works *in time*. When the user asks, it takes the
history-heavy scrolls (`SPEC`, `PLAN`, `HANDOFF`, `GAP_ANALYSIS`,
`GAP_CONTEXT`), condenses whatever is older than a cutoff, and records
a **checkpoint**: the commit just before the compaction. The full
pre-compaction text stays in git and is never copied into a file.
`COMPACT.md` and the `compacted/` reports are the index that leads back
to it.

Principle: **compaction removes history, never live state.** Open
tickets, open gaps and the current snapshot survive whatever their age.
Only finished, superseded or narrative content is condensed.

## 2. Layout it adds

```
docs/.scrolls/
├── STARTER.md        ← gets one new entry pointing at COMPACT.md (once)
├── COMPACT.md        ← new: "how to reach old history" + Compaction History table
├── compacted/        ← new
│   └── scrolls_compact_<githash>_<yyyymmdd>.md   ← one report per compaction
├── SPEC.md  PLAN.md  HANDOFF.md  GAP_ANALYSIS.md  GAP_CONTEXT.md   ← compacted
└── WISDOM.md         ← never compacted
```

- `<githash>`: the **checkpoint**, the abbreviated SHA of `HEAD` just
  before the compaction commit (`git rev-parse --short HEAD`, 7
  characters unless git needs more to stay unique). It is the same idea
  as `/scrolls-remove`'s "previous commit".
- `<yyyymmdd>`: the date the compaction ran. The cutoff date goes in
  the table and the report, not in the file name.

`COMPACT.md` and `compacted/` are created on the first run. Later runs
add to them.

## 3. Interface

```
/scrolls-compact [--before=YYYYMMDD] [--base=COMMIT]
                 [--keep-days=N] [--keep-commits=N] [--trunk=BRANCH]
                 [--include=FILE[,FILE...]] [--exclude=FILE[,FILE...]]
                 [-p PATH | -t | -l] [-r]
                 [-n] [-y] [--no-commit] [--no-tag]
/scrolls-compact --list
/scrolls-compact --show <ID> [FILE]      # what was folded (diff)
/scrolls-compact --extract <ID> FILE     # file as it was at the checkpoint
```

`<ID>` is a row number from `COMPACT.md` (`#3`), a checkpoint hash, or
a report file name.

### Shared with the family (same meaning everywhere)

| Flag | Meaning here |
|---|---|
| `-p`/`--path`, `-t`/`--reporoot`, `-l`/`--local` | Locate the scrolls folder, exactly as `/scrolls-update` does. Pass at most one. |
| `-r`/`--recurse` | Search for the folder recursively if it isn't at the exact spot. If more than one turns up, list them and ask; compact **one** folder per run, like `/scrolls-update`. |
| `-n`/`--dry-run` | Show the plan and stop. |
| `-y`/`--yes` | Skip the confirmation step. |
| `--no-commit` | Apply and stage the changes, and print the `git commit -F …` command to finish with. |

### New flags

| Flag | Default | Meaning |
|---|---|---|
| `--before=YYYYMMDD` | — | Compact content last changed before 00:00 local time on this date. `YYYY-MM-DD` is accepted too. |
| `--base=COMMIT` | — | Compact content last changed in `COMMIT` or one of its ancestors. It must be an ancestor of `HEAD`. |
| `--keep-days=N` | `7` | The default date rule: `--before` = today − N days. |
| `--keep-commits=N` | `20` | The default commit rule: `--base` = the Nth commit back on the trunk's first-parent history. |
| `--trunk=BRANCH` | auto | The branch the commit rule counts on: `origin/HEAD`, else `main`, else `master`. |
| `--include=FILE` | — | Also compact a project-specific scroll (one `STARTER.md` lists). |
| `--exclude=FILE` | — | Leave one of the default five alone this run. |
| `--no-tag` | off | Don't create the checkpoint tag (see [§7](#7-keeping-checkpoints-alive)). |

## 4. Choosing the compaction base

Everything reduces to one commit, **BASE**. A scroll line is *old* when
the commit that last changed it (from `git blame`) is BASE or an
ancestor of BASE.

1. **Candidates.**
   - Date rule → `B_date` = the newest trunk commit (first parent) whose
     committer date is before the cutoff (`--before`, or today − `--keep-days`).
   - Commit rule → `B_commits` = `git rev-list --first-parent <trunk>`,
     entry N (`--base`, or `--keep-commits`).
2. **Pick.** With no flags, both default rules apply and BASE is
   **whichever is newer**, as specified. Passing `--before` or `--base`
   replaces the defaults. Passing both applies the same newer-wins rule
   to the two values.
   - "Newer" means the descendant. Both candidates sit on the trunk's
     first-parent line, so one is always an ancestor of the other.
3. **Report the decision.** The plan, the commit message and the
   `COMPACT.md` row all say which rule won, for example
   `newer of 7 days → d611b65, 20 commits → d611b65`.

**Note on newer-wins.** It keeps the *smaller* window. A busy repo with
20 commits in two days gets compacted down to two days. A quiet repo
keeps its 7 days. The alternative, older-wins, would guarantee *both*
7 days and 20 commits stay verbatim. Open question 1 asks which you
want.

**Note on first-parent.** Counting on the trunk's first-parent line
means one squash-merged or merged PR counts as one commit, whatever
its branch history held. That matches how this repository merges.

## 5. Deciding *what* is old: blame, by unit

Markdown has no timestamps, but git does. The script runs
`git blame -w -M --line-porcelain HEAD -- <file>` and groups lines into
**units**:

- a `##`/`###` section, for `SPEC.md` and `HANDOFF.md`
- a top-level list item and its children, for `PLAN.md`,
  `GAP_ANALYSIS.md` and `GAP_CONTEXT.md`

A unit is old only if **every** line in it is old. That is the
conservative choice: one fresh edit keeps the whole unit verbatim.
Headings, file intros, and the template's own boilerplate are never
units.

Lines written on the current branch aren't ancestors of a trunk commit,
so they are always new. That is correct: unmerged work isn't history
yet.

### What happens to an old unit, by file

| File | Old unit | Condensed to |
|---|---|---|
| `SPEC.md` | A shipped-feature section | One line under `## Compacted features`: `**Name** — what it does for a user (#PR, sha)`. Features stay listed. Only the detail goes. |
| `PLAN.md` | A done `[x]` ticket | Removed. It is listed in the report. |
| `PLAN.md` | An open `[ ]` ticket | **Kept verbatim**, whatever its age. |
| `HANDOFF.md` | A stale bullet in "What just happened" or "Current state" | Removed. "Known issues / open threads" is **kept**. |
| `GAP_ANALYSIS.md` | An open gap | **Kept verbatim.** Closed gaps are already deleted by `/scrolls-update`. |
| `GAP_CONTEXT.md` | The reasoning for an open gap | Tightened to its decision and its reason. The entry stays, so the two files stay in lockstep. |
| `WISDOM.md`, `STARTER.md` | — | Never touched. Rules don't expire. |
| `--include` scrolls | — | Compacted by the convention `STARTER.md` gives for that file. An append-only log is refused. |

The agent does the condensing, because summarizing is judgment work.
The script does everything deterministic: choosing BASE, blame, units,
validation, the report, the table and the commit.

### Markers in the compacted scrolls

Each file that changed gets one marker block where its condensed
content lives, replaced on every later compaction rather than stacked:

```markdown
## Compacted features
<!-- scrolls-compact: checkpoint=904e593 base=d611b65 date=2026-11-15 report=compacted/scrolls_compact_904e593_20261115.md -->
> Older detail was compacted on 2026-11-15. See `COMPACT.md` to reach the full text.

- **Release tags (`aiskills-vX.Y.Z`)** — every npm release is tagged … (#162, `bbacbb3`)
```

On the next compaction, lines inside an earlier marker block count as
old as soon as their compaction commit is at or before the new BASE.
They can be condensed again, and the marker records the newest
checkpoint. The full chain stays reachable through `COMPACT.md`.

## 6. The run

Two script calls frame the agent's own editing. They follow the same
preview → confirm → apply rhythm as `/scrolls-remove` and
`/scrolls-restore`.

1. **Plan:** `compact.sh [flags]`, read-only.
   It prints the checkpoint, the BASE and the rule that won, and, per
   file, the old units: heading or first line, line range, and the
   newest commit and date among their lines. It ends with the planned
   commit message. The plan is saved to
   `<git-dir>/SCROLLS_COMPACT_PLAN.json`.
   Exit codes are the family's:
   - `1`: nothing is old enough
   - `2`: usage error
   - `3`: safety refusal (below)
2. **Confirm.** Show the plan and ask, unless `-y`. Stop here on `-n`.
3. **Condense.** The agent edits the files in the working tree,
   following [§5](#5-deciding-what-is-old-blame-by-unit), and touches
   only the units in the plan.
4. **Finalize:** `compact.sh --finalize`.
   It refuses if `HEAD` moved since the plan. It **validates**:
   - Only in-scope scroll files changed.
   - Every open `[ ]` ticket, every `GAP_ANALYSIS.md` line, and the
     HANDOFF open-threads section are still present, word for word.
   - No *new* unit (one with fresh lines) was edited.
   - `GAP_ANALYSIS.md` and `GAP_CONTEXT.md` have the same set of gaps.

   If any check fails, it exits 3, names the unit, and leaves the edits
   in place for the agent to fix. If all pass, it writes the report,
   adds the `COMPACT.md` row, adds the `STARTER.md` entry if missing,
   makes the **one** commit, and tags the checkpoint.
5. **Report** to the user: the new commit, the checkpoint, the rule
   that won, per-file line counts, and how to undo it
   (`git revert --no-edit <sha>`).

### Safety refusals (exit 3)

These mirror `/scrolls-remove`, for the same reason: the checkpoint
must contain everything that gets condensed.

- The scrolls folder has uncommitted, untracked or ignored changes.
  Those wouldn't be in the checkpoint, so they'd be lost.
- Other changes are already staged.
- The clone is shallow and BASE can't be resolved. Suggest
  `git fetch --unshallow`.
- `--base` isn't an ancestor of `HEAD`.
- `HEAD` moved between plan and finalize.

### The commit

This is one atomic commit, in the same format as remove and restore:

```
maint(memory): scrolls-compacted

- checkpoint: #<full SHA of HEAD before compaction>
- base: #<full BASE SHA> (2026-11-08; newer of 7 days → d611b65, 20 commits → d611b65)

Notes:
- compacted: docs/.scrolls/SPEC.md (3 sections → 3 lines, 23 → 11 lines)
- compacted: docs/.scrolls/PLAN.md (4 done tickets removed)
- unchanged: docs/.scrolls/GAP_ANALYSIS.md (all 3 gaps still open)
- report: docs/.scrolls/compacted/scrolls_compact_904e593_20261115.md

Scrolls-Action: compact
Scrolls-Checkpoint: <full sha>
Scrolls-Compact-Base: <full sha>
Scrolls-Compact-Rule: newer-of days=7 commits=20
Scrolls-Previous-Compaction: <full sha of the last compaction commit, or none>
Scrolls-Folder: docs/.scrolls
Scrolls-Compacted: docs/.scrolls/SPEC.md
Scrolls-Compacted: docs/.scrolls/PLAN.md
Scrolls-Report: docs/.scrolls/compacted/scrolls_compact_904e593_20261115.md
```

`Scrolls-Previous-Compaction` links each compaction to the one before
it, so the checkpoints form a chain that can be walked with nothing but
`git log`.

**Why one commit, not "commit, then report":** the report and the table
row only need the *checkpoint*, which is already known before the
commit. The checkpoint is the pre-compaction `HEAD`. A second commit
would only add the compaction commit's own SHA to the table, and that
SHA can always be recovered with
`git log -1 --format=%H -- docs/.scrolls/compacted/<report>`. In
exchange, it would leave an in-between state where the scrolls are
compacted but unindexed, and an undo would take two reverts. Open
question 2 checks this.

## 7. Keeping checkpoints alive

A checkpoint is only useful while its commit exists. Two things can
break that:

1. **Squash merges.** If you compact on a feature branch and the PR is
   squash-merged, the branch's commits, *including the checkpoint*,
   become unreachable once the branch is deleted, and `git gc` will
   eventually drop them. The squash commit also rewrites or flattens
   the message, so the trailers may not survive either.
2. **Shallow clones** don't have old commits locally.

The design handles both:

- **Tag the checkpoint** by default:
  `scrolls-compact/<yyyymmdd>-<githash>`, a lightweight tag on the
  checkpoint commit. A tag keeps the commit reachable whatever happens
  to the branch. The skill never pushes (family rule). Its report ends
  with the `git push origin <tag>` to run, and `--no-tag` skips the tag.
- **Treat the files in the tree as the source of truth, not the commit
  message.** `COMPACT.md` and the reports survive squash merges because
  they're content. `--list` and the traversal commands read
  `COMPACT.md` first, and use the trailers only to cross-check.
- **Warn** in the plan when `HEAD` isn't on the trunk and the checkpoint
  tag is turned off.

## 8. `COMPACT.md` and the report

Both are written for the next *agent*, not for the skill. Every
`/scrolls-*` skill sets `disable-model-invocation: true`, so an agent
can't call `/scrolls-compact --extract` by itself. It needs plain git
commands it can run. That is why both files spell them out.

### `COMPACT.md`

```markdown
# COMPACT.md — Compaction History

The scrolls in this folder are compacted from time to time: older detail in
SPEC, PLAN, HANDOFF, GAP_ANALYSIS and GAP_CONTEXT is condensed, and the full
text is kept in git at a **checkpoint** commit. Read this file only when a
condensed summary isn't enough. Never edit it by hand; `/scrolls-compact`
maintains it, and `/scrolls-update` leaves it alone.

## Reaching pre-compaction history

Replace `<checkpoint>` with a value from the table (paths are as they were
at that checkpoint; see each report):

- Whole file as it was:  `git show <checkpoint>:docs/.scrolls/SPEC.md`
- The compaction commit: `git log -1 --format=%H -- docs/.scrolls/compacted/<report>`
- What was condensed:    `git diff <checkpoint> <compaction commit> -- docs/.scrolls/`
- Exact blob:            `git cat-file -p <blob id from the report>`

## Compaction History

| # | Date | Checkpoint | Base (cutoff) | Rule | Files | Lines | Report |
|---|------|------------|---------------|------|-------|-------|--------|
| 1 | 2026-11-15 | `904e593` | `d611b65` (2026-11-08) | newer of 7d / 20 commits | SPEC, PLAN, HANDOFF | 154 → 98 | [report](compacted/scrolls_compact_904e593_20261115.md) |
```

The table is newest first, and numbers only ever increase. Links are
relative to the scrolls folder, so `/scrolls-hide` and
`/scrolls-unhide` don't break them.

### `compacted/scrolls_compact_<githash>_<yyyymmdd>.md`

This file is deterministic. The script writes it from the plan and the
diff, with nothing invented, and adds one **file marker** section per
compacted file:

```markdown
# Scrolls compaction — 2026-11-15

- Checkpoint: `<full sha>` (tag `scrolls-compact/20261115-904e593`)
- Base: `<full sha>` (2026-11-08) — rule: newer of 7 days → d611b65, 20 commits → d611b65
- Folder at checkpoint: `docs/.scrolls`
- Previous compaction: none

## docs/.scrolls/SPEC.md
- Blob at checkpoint: `<blob id>` → `git cat-file -p <blob id>`
- Lines: 23 → 11
- Condensed sections: `Versioned docs website` (#234), `Release tags` (#162), …
- Full text: `git show <checkpoint>:docs/.scrolls/SPEC.md`

## docs/.scrolls/PLAN.md
- Blob at checkpoint: `<blob id>`
- Removed done tickets: ROOT-3, ROOT-4, ROOT-6, ROOT-8
…
```

A blob id is content-addressed. Even if paths move later, for example
after `/scrolls-unhide`, `git cat-file -p <blob>` still returns the
exact old text.

### The `STARTER.md` entry, added once

> N. **`docs/.scrolls/COMPACT.md`** — the compaction history. Read it
> only when you need detail older than the condensed summaries. It
> tells you which git commit holds the full text. Never edit it or
> `compacted/` by hand: only `/scrolls-compact` updates them.

## 9. Traversal: the time-travel part

`--list`, `--show` and `--extract` are read-only. They make no commit
and need no confirmation.

| Command | Does | Under the hood |
|---|---|---|
| `--list` | Every compaction, newest first: #, date, checkpoint, base, files, and whether the checkpoint is still reachable | `COMPACT.md`, cross-checked with `git log --grep='^Scrolls-Action: compact'` |
| `--show <ID> [FILE]` | What that compaction condensed | `git diff <checkpoint> <compaction commit> -- <folder>/[FILE]` |
| `--extract <ID> FILE` | The full pre-compaction file, printed (or written with `-o`) | `git show <checkpoint>:<folder>/<FILE>` |

How the rest of the family relates:

- **Undo a compaction:** run `git revert` on the compaction commit, or
  use `/scrolls-restore <checkpoint> -f`, which brings back the whole
  folder as it was at the checkpoint. The design doesn't need its own
  undo command.
- **`/scrolls-remove`** removes `COMPACT.md` and `compacted/` along with
  the rest of the folder, and `/scrolls-restore` brings them back.
  Neither needs changes.
- **`/scrolls-hide` / `/scrolls-unhide`** rename the folder. Table links
  are relative, so they keep working. The repo-relative paths in old
  trailers and reports still name the path *at that checkpoint*, which
  is the right path for `git show <checkpoint>:<path>`.
- **`/scrolls-update`** must skip `COMPACT.md` and `compacted/`. The
  `STARTER.md` entry says so, and update follows `STARTER.md`.

## 10. Family integration checklist

When this design is approved:

- [ ] `scrolls-compact/` gets the standard layout: `SKILL.md`,
      `README.md`, `CHANGELOG.md`, `agents/openai.yaml`,
      `assets/EXAMPLES.md`, `assets/templates/COMPACT.md`,
      `meta/MAINTAINERS.md`, `scripts/compact.py` plus thin `.sh`/`.ps1`
      launchers (as in remove/restore), and `tests/` (bash +
      PowerShell, Red/Green).
- [ ] Add it to `.claude-plugin/plugin.json` and change "Eight commands"
      to nine.
- [ ] `skills/scrolls/README.md`: commands table, and new rows in the
      shared-flags table for `--before`, `--base`, `--keep-*`.
- [ ] `skills/scrolls/meta/MAINTAINERS.md`: "eight" → "nine", and the
      list of per-skill MAINTAINERS.
- [ ] `/scrolls-help` `references/HELP.md`, and a new
      `/scrolls-explainer` tab (`explain.sh --build`).
- [ ] `/scrolls-update` `SKILL.md` step 5: one line saying not to
      touch `COMPACT.md` or `compacted/`.
- [ ] `/scrolls-setup` templates: nothing. `COMPACT.md` is created on
      the first compaction, not at setup.
- [ ] Bump all nine skills to **2.6.0** in lockstep, with changelog
      entries for each skill and for the family.
- [ ] npm package docs: `docs/docsite/skills/scrolls-compact.md`, and
      the skills index.

### Tests to write first (Red/Green)

Build throwaway repos with `GIT_COMMITTER_DATE` and `GIT_AUTHOR_DATE`
set per commit:

1. Choosing BASE: date rule only, commit rule only, both (newer wins),
   explicit `--before` and `--base` together, `--trunk` detection,
   fewer than N commits, a shallow clone.
2. Unit classification: a fully old section, a mixed section (kept),
   lines from the current branch (kept), whitespace-only changes
   ignored (`-w`).
3. Validation in `--finalize`: an open ticket deleted → exit 3, a gap
   lockstep break → exit 3, a fresh unit edited → exit 3, `HEAD` moved
   → exit 3.
4. Outputs: report file name and content, `COMPACT.md` created then
   appended (newest first), the `STARTER.md` entry added only once,
   commit trailers, the checkpoint tag, and `--no-tag`.
5. Traversal: `--list`, `--show` and `--extract` after a later
   `/scrolls-unhide`, and after the compaction commit's message was
   squash-rewritten (trailers gone, `COMPACT.md` still works).
6. Refusals: dirty scrolls folder, other changes staged, exit 1 when
   nothing is old.

## 11. Open questions

1. **Newer-wins or older-wins** for the default rule? Newer-wins, as
   you specified, keeps the *smaller* window. Older-wins guarantees at
   least 7 days *and* 20 commits stay verbatim. This design follows
   your spec, and changing it is a one-line change.
2. **One commit, or a compaction commit followed by a record commit?**
   This design recommends one ([§6](#the-commit)). Choose two only if
   you want the compaction commit's own SHA written into the table.
3. **Checkpoint tag on by default?** It protects against squash merges
   ([§7](#7-keeping-checkpoints-alive)), but it adds tags the user has
   to push. The alternative is a `refs/scrolls/…` namespace, which is
   cleaner but isn't fetched by default.
4. **Date in the file name:** this design uses the run date. Use the
   cutoff date instead if you'd rather the name say "everything before
   this day".
