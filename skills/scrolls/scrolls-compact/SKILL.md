---
name: scrolls-compact
description: "Compacts the history in a docs/.scrolls/ (or docs/scrolls/) project-memory system at a point in time, and saves a git checkpoint of everything it condenses. Condenses the parts of SPEC.md, PLAN.md, HANDOFF.md, GAP_ANALYSIS.md and GAP_CONTEXT.md that git blame shows are older than a compaction base — by default the newer of 7 days ago and the 20th-latest first-parent commit on main/master — while open tickets, open gaps and HANDOFF's open threads always stay word for word. Records ONE commit whose message names the checkpoint (the commit just before the compaction), writes compacted/scrolls_compact_<yyyymmdd>_<githash>.md with one marker section per compacted file, adds a row to COMPACT.md's Compaction History table, lists COMPACT.md in STARTER.md, and tags the checkpoint. --list, --show and --extract read old history back out of git. Use this only when the user runs /scrolls-compact, or explicitly asks to compact, condense, prune or checkpoint the scrolls / project memory history. Supports --before=YYYYMMDD, --base=COMMIT, --keep-days=N, --keep-commits=N, --trunk, --include/--exclude, -p/--path, -t/--reporoot, -l/--local, -r/--recurse, -n/--dry-run, -y/--yes, --no-commit and --no-tag. Refuses to run when the scrolls folder has uncommitted changes, since the checkpoint would not contain them. Works on macOS, Linux, and Windows (bash or PowerShell)."
license: MIT
compatibility: "bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies); git"
disable-model-invocation: true
metadata:
  name: scrolls-compact
  type: skill
  author: sugatoray
  version: "2.6.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-compact"
---

# Compacting docs/.scrolls/

`/scrolls-setup`, `/scrolls-update`, `/scrolls-hide`/`-unhide` and `/scrolls-remove`/`-restore` manage *where* the scrolls are. This skill works on *when*: it condenses the history that has piled up in the scrolls, and keeps the full older text in git at a **checkpoint**. The checkpoint is the commit just before the compaction. Nothing is copied into a file. `COMPACT.md` and the `compacted/` reports are only an index that leads back to git.

**Rule: compaction removes history, never live state.** Open `[ ]` tickets, every `GAP_ANALYSIS.md` line, and HANDOFF's "Known issues / open threads" stay word for word, whatever their age. `WISDOM.md` and `STARTER.md` are never compacted.

Run this only when the user asks for it. Show the plan before changing anything, unless they passed `-y`/`--yes`.

**Everything is relative to the current working directory** unless `-t`/`--reporoot` says otherwise, not relative to this skill's own location.

## Cross-platform

All of the logic is in one stdlib-only Python file, `scripts/compact.py`. `compact.sh` (bash: macOS, Linux, or Windows with Git Bash/WSL) and `compact.ps1` (PowerShell 7+) are thin launchers that find Python 3.9+ and pass every flag through unchanged. Pick by what's available: try `bash --version`, and if that succeeds use `.sh`. Otherwise use `.ps1` via `pwsh` (preferred), or `powershell.exe` only if `pwsh` isn't installed.

## Command interface

```
/scrolls-compact [--before=YYYYMMDD] [--base=COMMIT]
                 [--keep-days=N] [--keep-commits=N] [--trunk=BRANCH]
                 [--include=FILE[,FILE]] [--exclude=FILE[,FILE]]
                 [-p PATH | -t | -l] [-r] [-n] [-y] [--no-commit] [--no-tag]
/scrolls-compact --list
/scrolls-compact --show <ID> [FILE]
/scrolls-compact --extract <ID> FILE [-o OUT]
```

Read these from the invocation text, in any order.

**When: the compaction base.** A line is *old* when the commit that last changed it (from `git blame -w -M`) is the base commit or one of its ancestors.

- **No `--before`/`--base` (the default).** Two rules each give a candidate base:
  - `--keep-days=N` (default 7): the newest trunk commit older than N days.
  - `--keep-commits=N` (default 20): the trunk commit just past the newest N, counted on the first-parent line (one merged PR is one commit).
  - The base is **whichever candidate is newer**. A rule with no candidate (the repository is too young) is ignored.
- **`--before=YYYYMMDD`** (or `YYYY-MM-DD`): the newest trunk commit before 00:00 local time on that date.
- **`--base=COMMIT`**: that commit. It must be an ancestor of HEAD.
- `--before` or `--base` replaces the default rules. With both, the newer one wins.
- **`--trunk=BRANCH`**: the branch the rules walk. The default is `origin/HEAD`, then `main`, then `master`.

**Where: the scrolls folder.** These are the same flags `/scrolls-update` uses.

- **`-p <path>` / `--path=<path>`**: a project folder, a docs folder, or the scrolls folder itself.
- **`-t` / `--reporoot`**: look under the git repository's top level.
- **`-l` / `--local`**: look in the current directory. This is the default anyway.
- **`-r` / `--recurse`**: search recursively if the exact spot has no scrolls folder. If more than one turns up, the script lists them and stops. Ask the user which one, then pass it with `-p`. One run compacts one folder.

**What: the files in scope.** The default five are `SPEC.md`, `PLAN.md`, `HANDOFF.md`, `GAP_ANALYSIS.md` and `GAP_CONTEXT.md`.

- **`--include=FILE`**: also compact a project-specific scroll that `STARTER.md` lists. `STARTER.md`, `WISDOM.md` and `COMPACT.md` are refused. Don't include an append-only log whose own rule says never to edit it.
- **`--exclude=FILE`**: leave one of the default five alone this run.

**Other**

- **`-n` / `--dry-run`**: show the plan and stop.
- **`-y` / `--yes`**: skip the confirmation step.
- **`--no-commit`**: stage everything, but leave the commit to the user. The script prints the `git commit -F …` command, and the tag command to run after it.
- **`--no-tag`**: don't tag the checkpoint (see step 4).

`-p`, `-t` and `-l` are mutually exclusive.

## How each file is compacted

The plan splits each file into **units**: a `##` section in `SPEC.md` (and in an `--include`d file with `##` headings), and a top-level list item with its indented lines everywhere else. A unit is `old` only if **every** line in it is old. One fresh edit keeps the whole unit as it is. Lines written on an unmerged branch are never old.

| File | An `old` unit | Condense it to |
|---|---|---|
| `SPEC.md` | A shipped-feature section | One line under `## Compacted features`: `**Name** — what it does for a user (#PR, sha)`. Keep every feature listed; drop only the detail. |
| `PLAN.md` | A done `[x]` ticket | Remove it. The report lists it. |
| `HANDOFF.md` | A stale "Current state" or "What just happened" bullet | Remove it, or fold several into one short line. |
| `GAP_CONTEXT.md` | The reasoning for a gap | Tighten it to the decision and its reason. **Keep the entry**: the file stays in lockstep with `GAP_ANALYSIS.md`. |
| `--include` file | A section or item | Follow the convention `STARTER.md` gives for that file. |

The plan marks the units that must not change: `live` units (old, but live state: open tickets, all of `GAP_ANALYSIS.md`, HANDOFF's open threads) and `new` units. It also checks the text outside the units, such as headings and intros. Keep all of these word for word.

Every file you change gets **exactly one marker line**, the one the plan prints, placed where the condensed text starts. Put a one-line `>` note under it, for example `> Older detail was compacted on 2026-11-15. See COMPACT.md to reach the full text.` On a later compaction, **replace** the old marker and its `>` note. Don't stack them.

## Steps

### 1. Plan

Run the script with the user's flags. It is read-only:

```
bash <skill-dir>/scripts/compact.sh [flags...]
pwsh <skill-dir>/scripts/compact.ps1 [flags...]
```

It prints the checkpoint, the base and the rule that chose it, the report path, the **marker** line, and one line per unit: `old`, `live` or `new`, its line range, and when it last changed. It saves the plan in the git directory for step 4.

If it exits with an error, report it and stop:

- **Exit 1, nothing to compact.** No commit is old enough, or every unit is new or live. Say so. Mention `--keep-days`, `--keep-commits`, `--before` or `--base` if the user wants a deeper cut.
- **Exit 2, usage error.** For example `-p` with `-t`, a bad date, `--include=WISDOM.md`, more than one folder under `-r`, or not a git repository.
- **Exit 3, safety refusal.** The scrolls folder has uncommitted, untracked or ignored changes; other changes are staged; the clone is shallow; the repository has no commits; or `--base` isn't an ancestor of HEAD. Report the reason as printed. Don't work around it by committing, stashing or deleting the user's files yourself; let the user choose.

### 2. Confirm

Show the user the plan: the base and why it was chosen, and the `old` units per file. Ask before going on. Skip this only if they passed `-y`/`--yes`. If they passed `-n`/`--dry-run`, stop here.

### 3. Condense

Edit the in-scope files in the working tree yourself, following the table above:

- Change only `old` units. Leave `live` and `new` units, and the text around them, exactly as they are.
- Summarize from the file's own text and the git history. Don't invent. Keep PR numbers and SHAs that the old text cites, so a reader can follow them back.
- Add the marker line and its `>` note to every file you change.
- Leave a file alone if nothing in it is worth condensing.

Don't edit any other file in the scrolls folder or anywhere else, and don't commit.

### 4. Finalize

```
bash <skill-dir>/scripts/compact.sh --finalize [--no-commit] [--no-tag]
pwsh <skill-dir>/scripts/compact.ps1 --finalize [--no-commit] [--no-tag]
```

It checks the edits against the saved plan first:

- HEAD hasn't moved since the plan.
- Only in-scope files changed.
- Every `live` and `new` unit, and the text around the units, is still there word for word.
- Each changed file has exactly one marker, this run's.
- `GAP_CONTEXT.md` kept all its entries.

If a check fails, it exits **3**, names the unit or line, and leaves your edits in place. Fix them and run `--finalize` again. Exit **1** means no file changed. Exit **2** means there is no plan: run step 1 again.

When every check passes, it:

1. writes `compacted/scrolls_compact_<yyyymmdd>_<githash>.md`. The hash is the checkpoint, and the date is the day of the run. It has one marker section per compacted file: the file's blob id at the checkpoint, lines before and after, the units condensed, and the `git show` command for the full text.
2. adds a row to the **Compaction History** table in `COMPACT.md`, newest first, creating the file on the first run.
3. adds a `COMPACT.md` entry to `STARTER.md`'s reading list and "When to update" list, once.
4. makes **one** commit:

```
maint(memory): scrolls-compacted

- checkpoint: #<full SHA of HEAD before the compaction>
- base: #<full base SHA> (2026-11-08; rule: 20 commits)

Notes:
- compacted: docs/.scrolls/SPEC.md (3 units condensed, 23 → 14 lines)
- compacted: docs/.scrolls/PLAN.md (5 units condensed, 13 → 10 lines)
- unchanged: docs/.scrolls/GAP_ANALYSIS.md
- report: docs/.scrolls/compacted/scrolls_compact_20261115_904e593.md
- checkpoint tag: scrolls-compact/20261115-904e593
- STARTER.md: added the COMPACT.md entry

Scrolls-Action: compact
Scrolls-Checkpoint: <full sha>
Scrolls-Compact-Base: <full sha>
Scrolls-Compact-Rule: newer-of days=7 commits=20 -> commits
Scrolls-Previous-Compaction: <full sha of the last compaction commit, or none>
Scrolls-Folder: docs/.scrolls
Scrolls-Compacted: docs/.scrolls/SPEC.md
Scrolls-Compacted: docs/.scrolls/PLAN.md
Scrolls-Report: docs/.scrolls/compacted/scrolls_compact_20261115_904e593.md
```

`Scrolls-Previous-Compaction` chains each compaction to the one before it. **Never hand-edit or reword this message.**

5. tags the checkpoint `scrolls-compact/<yyyymmdd>-<githash>`, unless `--no-tag`. The tag keeps the checkpoint commit alive if the branch is later squash-merged and deleted.

If `git commit` fails (exit 4, usually a hook), the compaction stays staged. Report the hook's output and the `git commit -F <git-dir>/SCROLLS_COMPACT_MSG` command to finish with. Never retry with `--no-verify`.

This skill never pushes, not even the tag.

### 5. Report

Give:

- the new commit SHA, the checkpoint, and the base with the rule that chose it
- per file: lines before → after, and what was condensed
- the tag, and `git push origin <tag>` to share it (needed if the branch will be squash-merged)
- how to undo it: `git revert --no-edit <new-sha>`, or `/scrolls-restore <checkpoint> -f` to bring back the whole folder as it was

## Reading old history: --list, --show, --extract

These are read-only. They make no commit, so skip the confirmation step.

- **`--list`**: every compaction in `COMPACT.md`, newest first, and whether its checkpoint commit is still in this clone.
- **`--show <ID> [FILE]`**: the diff of what that compaction condensed, for the whole folder or one file.
- **`--extract <ID> FILE [-o OUT]`**: the file as it was at the checkpoint.

`<ID>` is a row number (`1` or `#1`), a checkpoint hash prefix, or a report file name. These commands read `COMPACT.md` and the reports, not commit messages, so they still work after a squash merge rewrote the message, and after `/scrolls-hide` or `/scrolls-unhide` moved the folder. Exit 1 means the ID isn't in `COMPACT.md`, or the checkpoint isn't in this clone. Suggest fetching the `scrolls-compact/*` tags.

An agent that can't run this skill can use the plain git commands that `COMPACT.md` lists. That is why they are written there.

## Limitations

- Needs a git repository with full history (not a shallow clone).
- Only committed content is in the checkpoint. That is why uncommitted, untracked or ignored files in the scrolls folder block the plan.
- Units are worked out from markdown structure. A file with no `##` sections and no top-level list items has no units, so nothing in it is ever `old`.
- A reworded line counts as new from the rewording commit on, so heavy rewording delays its compaction. That errs on the side of keeping text.
- `maint` isn't a standard Conventional Commits type, so a strict commitlint hook may reject the commit (exit 4).

## Examples

There are 23 worked examples, covering every flag, refusal and exit code, all run on one small demo repository. Each has a premise, caveats, the prompt, and its **real** output: a test replays every one, so the outputs are exactly what the script prints.

- `assets/EXAMPLES.md` is the index: how to read the examples, the demo repository, and a table with one row per example and its file.
- `assets/examples/example_NNN.md` holds one example each (`example_001.md` to `example_023.md`).
- `assets/example-viewer.html` shows the same files on one page for people. Don't read it; read the Markdown files. To show the examples to the user, point them to it.

Read them only when you need them: for example, when a request does not map clearly to the flags above, or when the user asks for an example. Read the index first, then only the example file you need. If that example starts from another example's state, its `Starts from:` line links to it.

## Development

See `meta/MAINTAINERS.md` for the layout, running the `tests/` suite, and versioning notes, and `meta/DESIGN.md` for why it works this way. Don't read or act on `meta/` or `tests/` while carrying out a user's `/scrolls-compact` request.
