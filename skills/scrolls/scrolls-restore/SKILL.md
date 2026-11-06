---
name: scrolls-restore
description: "Restores a docs/.scrolls/ (or docs/scrolls/) project-memory system from git history — the counterpart to /scrolls-remove. By default finds the newest /scrolls-remove checkpoint in HEAD's history and brings back exactly what it removed; or takes any COMMIT (a removal commit, or an ordinary commit containing a scrolls folder). Restores ONLY the agentic memory — the scrolls folders plus the SCROLLS.md/CLAUDE.md/AGENTS.md pointer stubs, re-inserted into those files as they are today — never rolling back anything else in the repository, and records it as one git commit. --onto REF mounts the memory onto another branch (or, with -b, a new branch at any commit) through a temporary worktree, without touching the current checkout. Use this whenever the user runs /scrolls-restore, or asks to restore, bring back, recover, undo the removal of, or re-mount the scrolls / project memory / docs/.scrolls. Supports -p/--path (repeatable), -t/--reporoot, -l/--local, -r/--recurse, --onto, -b/--branch, --full, -f/--force, --list [--all], -n/--dry-run, -y/--yes, and --no-commit. Works on macOS, Linux, and Windows (bash or PowerShell)."
license: MIT
compatibility: "bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies); git"
disable-model-invocation: true
metadata:
  name: scrolls-restore
  type: skill
  author: sugatoray
  version: "2.4.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-restore"
---

# Restoring docs/.scrolls/

This skill reverses `/scrolls-remove`. It brings back only the agentic memory: the scrolls folders, plus the pointer stubs in `SCROLLS.md`, `CLAUDE.md` and `AGENTS.md`. It brings them back into the repository **as it is now**, and never rolls back anything else. That is the difference from `git revert`: a revert would conflict with later edits to `CLAUDE.md` or `AGENTS.md`, or undo them. This skill adds the stub back into each file instead.

Show the user the plan before applying anything, unless they passed `-y`/`--yes`.

## Cross-platform

All of the logic is in one stdlib-only Python file, `scripts/restore.py`. `restore.sh` (bash: macOS, Linux, or Windows with Git Bash/WSL) and `restore.ps1` (PowerShell 7+) are thin launchers. They find Python 3.9+ and pass every flag through unchanged. Pick one by what's available: try `bash --version`, and if that succeeds use `.sh`. Otherwise use `.ps1` via `pwsh` (preferred), or `powershell.exe` only if `pwsh` isn't installed.

## Command interface

```
/scrolls-restore [<COMMIT>] [-p PATH ...] [-t | -l] [-r]
                 [--onto REF [-b NEW_BRANCH]] [--full] [-f]
                 [-n] [-y] [--no-commit]
/scrolls-restore --list [--all]
```

Read these from the invocation text, in any order.

**Source**: where the memory comes from.

- **No `<COMMIT>` (the default).** The script uses the newest `/scrolls-remove` commit in HEAD's history, found by its `Scrolls-Action: remove` trailer. Its `Scrolls-Previous-Commit` is the source, and its other trailers say exactly what to put back.
  - If that newest checkpoint has already been restored, the script does nothing and says so.
  - If there is no removal commit at all, it falls back to the commit just before the newest one that deleted a scrolls `STARTER.md`, for example a plain `git rm`. The plan flags this so the user can check it.
- **`<COMMIT>` (or `--from <COMMIT>`).** This can be a commit, branch or tag.
  - If it's a removal commit, it's used exactly as above.
  - Any other commit must contain a scrolls folder. The script finds the folders and pointer stubs in that commit's tree.

**Target**: where the memory goes.

- **Default**: the current checkout.
- **`--onto <REF>`**: a local branch. The script commits there through a temporary `git worktree`, then removes it. The current checkout, branch and working tree are never touched. `--onto` naming the current branch is the same as the default.
- **`-b` / `--branch <NAME>`**: use with `--onto` when it names a SHA, tag or remote-tracking ref. The script creates branch `NAME` at that commit and commits there. Without `-b`, those refs are refused, because the commit would otherwise end up on no branch. An existing branch name is refused too.

**Scope**: which folders. These are the same flags `/scrolls-setup` and `/scrolls-update` use, relative to the current directory.

- **`-p <path>` / `--path=<path>`** (repeatable): restore only the folders at this path. The path can be a project folder (`<path>/docs/.scrolls`), a docs folder (`<path>/.scrolls`), or the scrolls folder itself.
- **`-t` / `--reporoot`**: measure from the repository's top level.
- **`-l` / `--local`**: measure from the current directory. This is the default anyway; with no flag, the script warns when the current directory isn't the repo root.
- **`-r` / `--recurse`**: restore every folder under the base directory. Without it, only the exact spots above are used. Use `-r` to undo a `/scrolls-remove -r` sweep.

**Other**

- **`--full`**: for pointer files the removal *purged* (`-x`), bring back the whole old file instead of just the scrolls stub. This only applies when the file is absent now. If it exists, only the stub is inserted, and the plan says so.
- **`-f` / `--force`**: replace a scrolls folder that already exists at the target with the source's version. Without it, the script refuses and points the user at `/scrolls-update`. A folder that exists under the *other* name (`scrolls` vs `.scrolls`) is always skipped, never duplicated. For that case, suggest `/scrolls-hide` or `/scrolls-unhide`.
- **`--list`**: list the removal checkpoints, newest first, then stop. Each entry shows its SHA, date, source commit, folders, and whether it has been restored yet.
- **`--all`**: use with `--list` to search every branch, not just HEAD's history. It only finds checkpoints. To restore one, pass its SHA as `<COMMIT>`.
- **`-n` / `--dry-run`**: show the plan only.
- **`-y` / `--yes`**: skip the confirmation step.
- **`--no-commit`**: stage the changes but don't commit. With `--onto`, the worktree is left in place and its path is printed.

`-p`, `-t` and `-l` are mutually exclusive.

## What gets put back

| In the removal commit | Restore does |
|---|---|
| `Scrolls-Folder` | Checks the folder out from the source commit. |
| `Scrolls-Deleted` | If the file is absent now, restores it whole from the source. If it exists, inserts the stub, unless the file already points at the scrolls. |
| `Scrolls-Stripped` | Inserts the stub back into the file as it is now. If the file has since been deleted, recreates it with the stub only. |
| `Scrolls-Purged` | Uses the stub only, by default. `--full` restores the whole old file if it's absent now. |
| `Scrolls-Kept`, `Scrolls-Review`, `Scrolls-Pruned` | Nothing. Those files were never touched, and a pruned `docs/` comes back with the folder. |

For an ordinary source commit, each pointer file that had a scrolls stub in that commit gets the same treatment. The stub goes in near the top of the file. If the file opens with a top-level heading, the stub goes under it, and the `SCROLLS.md` block's own heading becomes a subsection. This is the same placement `/scrolls-setup` uses.

## Steps

### 1. Preview

Run the script **without `-y`**, passing the user's flags through:

```
bash <skill-dir>/scripts/restore.sh [args...]
pwsh <skill-dir>/scripts/restore.ps1 [args...]
```

The output shows the source and how it was chosen, the target, one line per folder or file, and the exact commit message. Nothing changes yet.

If it exits with an error, report it and stop:

- **Exit 1, nothing to restore.** Explain why, using the script's hint: already restored, no checkpoint found, or nothing in scope. Suggest `--list` (or `--list --all`), `-t`, or `-r` as fits.
- **Exit 2, usage error.** For example: `-b` without `--onto`, `--all` without `--list`, or `--onto` naming a non-branch without `-b`.
- **Exit 3, safety refusal.** A target folder already exists (suggest `/scrolls-update`, or `-f`). A path to be written has uncommitted, untracked or ignored changes. Unrelated changes are already staged. A worktree couldn't be opened, for example because the `--onto` branch is checked out elsewhere. Don't work around any of these yourself; let the user decide.

### 2. Confirm

Show the plan and ask before applying. Call out these cases:

- a **fallback** source
- `-f` replacements
- `--full`

Skip this step only if the user passed `-y`/`--yes`. Stop here if they passed `-n`.

### 3. Apply

Run the same command again with `-y` added. It makes one commit:

```
maint(memory): scrolls-restored

- restored from: #<source sha>
- removal commit: #<removal sha>

Notes:
- restored folder: docs/.scrolls (from <short sha>)
- restored: SCROLLS.md (file was absent; restored whole from the source)
- inserted: CLAUDE.md (stub re-added near the top; existing content kept)
- target: branch main

Scrolls-Action: restore
Scrolls-Source-Commit: <source sha>
Scrolls-Removal-Commit: <removal sha>
Scrolls-Folder: docs/.scrolls
Scrolls-Restored: SCROLLS.md
Scrolls-Inserted: CLAUDE.md
```

Some lines change with the source:

- The `removal commit` line and `Scrolls-Removal-Commit` trailer appear only when the source came from a removal commit.
- A fallback source gets `deletion commit` and `Scrolls-Deletion-Commit` instead.

The trailer kinds are `Folder`, `Replaced`, `Restored`, `Created`, `Inserted`, `Kept` and `Skipped`. Later runs read `Scrolls-Removal-Commit` to tell that a checkpoint has been restored. **Never reword this message.**

If `git commit` fails (exit 4, usually a hook), the restore is left staged. With `--onto`, the temporary worktree is kept so nothing is lost. Report the hook output and the `git commit -F …` command the script printed. Never retry with `--no-verify`.

This skill never pushes.

### 4. Report

Give:

- the new commit SHA and which branch it landed on
- the source commit, and how it was chosen
- what was restored, created, inserted, kept or skipped
- how to undo: `git revert --no-edit <sha>`

Always finish by suggesting `/scrolls-update`. The restored memory describes the code as it was at the source commit, not as it is now.

## Limitations

- Needs a git repository, and the source commit must be present locally. In a shallow clone, the script says so and suggests `git fetch --unshallow`.
- The default search only looks at HEAD's history. A checkpoint that exists only on another branch has to be passed as `<COMMIT>`. Use `--list --all` to find it.
- Folders come back at their original paths. If the project's layout has moved since then, scope with `-p`; moving folders to a new location isn't supported.
- `maint` isn't a standard Conventional Commits type, so a strict commitlint hook may reject the commit (exit 4).

## Examples

Worked examples are in `assets/EXAMPLES.md`. Each example has a premise, the usage, caveats, and the expected output. Read that file only when you need it: for example, when a request does not map clearly to the flags above, or when the user asks for an example.

## Development

See `meta/MAINTAINERS.md` for the layout, how to run the `tests/` suite, and versioning notes. They are not part of carrying out a user's `/scrolls-restore` request; don't read or act on `meta/MAINTAINERS.md` or `tests/` while answering one.
