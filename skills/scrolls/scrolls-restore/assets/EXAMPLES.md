# /scrolls-restore — Examples

> **Writing rule for this file.** Write it in ASD-STE100 Simplified Technical English, at about 80% conformance. Keep to these rules when you change it:
>
> - Use short sentences: 20 words max for instructions, 25 words max for descriptions.
> - Use the active voice. Use the imperative for instructions.
> - Put one instruction in one sentence.
> - Use simple, approved words. Use one word for one meaning.
> - Prefer bullet points to paragraphs.
> - Put each example in one `## Example: NN — Title` block, with four sections: **Premise**, **Usage**, **Caveats**, **Expected Output**.

`/scrolls-restore` brings back only the scrolls memory. Other files in the repository keep their current state.

---

## Example: 01 — Restore the last removal

### Premise

- You removed the scrolls with `/scrolls-remove`.
- Since then, you changed the code and `CLAUDE.md`.

### Usage

```
/scrolls-restore
```

### Caveats

- The skill finds the newest removal commit in the history of HEAD.
- Your later code changes stay as they are.
- The skill adds the stub back into your current `CLAUDE.md`. It does not replace the file.

### Expected Output

```
Source:     67b08572a703...  (newest removal commit 494b31a6daa5)
Target:     branch main

Plan:
  restored folder  docs/.scrolls  — from 67b08572a703
  restored         SCROLLS.md  — file was absent; restored whole from the source
  inserted         CLAUDE.md  — stub re-added near the top; existing content kept
```

- After you confirm:

```
Committed: 9a298039704c...  on branch main
Undo:      git revert --no-edit 9a298039704c...
The restored memory reflects the source commit; run /scrolls-update to bring it up to date.
```

---

## Example: 02 — Preview only (dry run)

### Premise

- You want to see the source, the target and the plan.

### Usage

```
/scrolls-restore -n
```

### Caveats

- No file changes. No commit is made.

### Expected Output

- The plan and the full commit message:

```
maint(memory): scrolls-restored

- restored from: #<source-sha>
- removal commit: #<removal-sha>

Notes:
- restored folder: docs/.scrolls (from <short-sha>)
- ...

Scrolls-Action: restore
Scrolls-Source-Commit: <source-sha>
Scrolls-Removal-Commit: <removal-sha>
...
```

---

## Example: 03 — The last removal is already restored

### Premise

- You ran `/scrolls-restore` before. The newest checkpoint is already restored.

### Usage

```
/scrolls-restore
```

### Caveats

- The skill does not restore the same checkpoint two times.
- To use an older checkpoint, find it with `--list`. Then give its SHA.

### Expected Output

```
Nothing to restore: The newest scrolls checkpoint (494b31a6daa5) has already been restored. Use --list to see older checkpoints, then pass one as COMMIT.
```

- Exit code: `1`.

---

## Example: 04 — List the checkpoints

### Premise

- You want to see all removal checkpoints and their status.

### Usage

```
/scrolls-restore --list
/scrolls-restore --list --all     # also search all other branches
```

### Caveats

- `--all` works only with `--list`. It finds checkpoints. It does not restore them.

### Expected Output

```
Scrolls checkpoints in HEAD's history, newest first:

  494b31a6daa5  2026-11-06  [restored]  source 67b08572a703
      folders: docs/.scrolls

Restore one with: /scrolls-restore <sha>
```

---

## Example: 05 — Restore a specific checkpoint

### Premise

- `--list --all` shows a checkpoint on another branch.
- You want that checkpoint on your current branch.

### Usage

```
/scrolls-restore 1a2b3c4d
/scrolls-restore --from 1a2b3c4d     # same
```

### Caveats

- The SHA can be a removal commit. The skill then uses its trailers.
- The commit must be present in your local clone.

### Expected Output

```
Source:     <source-sha>  (removal commit 1a2b3c4d... (given))
```

---

## Example: 06 — Restore from an ordinary commit

### Premise

- The scrolls existed at commit `v1.2.0`.
- No removal commit exists. Someone deleted the folder by hand.

### Usage

```
/scrolls-restore v1.2.0
```

### Caveats

- The skill finds the scrolls folders in that commit.
- It adds a stub only to pointer files that had a stub in that commit.

### Expected Output

```
Source:     <sha>  (commit <short-sha> (given))
```

- The commit has no `Scrolls-Removal-Commit` trailer.

---

## Example: 07 — No removal commit (fallback)

### Premise

- Someone ran `git rm -r docs` and committed.
- No `/scrolls-remove` commit exists.

### Usage

```
/scrolls-restore
```

### Caveats

- The skill uses the commit before the deletion.
- The plan shows a note. Check the source before you confirm.

### Expected Output

```
Source:     4ef4c2fab6e2...  (fallback: commit before afd5b44b6af8, which deleted docs/.scrolls)

NOTE: no /scrolls-remove commit was found; this source was inferred from a plain deletion. Check it before applying.
```

- The commit has the trailer `Scrolls-Deletion-Commit: <sha>`.

---

## Example: 08 — Get back a purged file

### Premise

- You removed the scrolls with `/scrolls-remove -x CLAUDE.md`.
- `CLAUDE.md` had your own notes. Now it does not exist.

### Usage

```
/scrolls-restore            # CLAUDE.md comes back with the stub only
/scrolls-restore --full     # CLAUDE.md comes back with all its old content
```

### Caveats

- `--full` applies only when the file is absent now.
- If the file exists, the skill adds only the stub.

### Expected Output

```
  created          CLAUDE.md  — file was absent; created with the scrolls stub only
  restored         CLAUDE.md  — file was absent; restored whole (--full)
```

---

## Example: 09 — Undo a monorepo sweep

### Premise

- You ran `/scrolls-remove -t -r`. It removed three scrolls folders in one commit.

### Usage

```
/scrolls-restore -t -r              # all three folders
/scrolls-restore -p packages/api    # only one package
```

### Caveats

- Without `-r`, the skill restores only the folder at the exact location.
- From the repository root, that is `docs/.scrolls` only.

### Expected Output

```
Scrolls-Folder: docs/.scrolls
Scrolls-Folder: packages/api/docs/.scrolls
Scrolls-Folder: packages/web/docs/scrolls
```

---

## Example: 10 — Put the memory on another branch

### Premise

- You are on `main`.
- You want the memory on `feature/x`. You do not want to switch branches.

### Usage

```
/scrolls-restore --onto feature/x
```

### Caveats

- The skill uses a temporary git worktree. Your checkout does not change.
- The commit goes on top of `feature/x`.
- The branch must not be checked out in a different worktree.

### Expected Output

```
Target:     branch feature/x
...
Committed: <sha>  on branch feature/x
```

- `git worktree list` shows no extra worktree after the command.

---

## Example: 11 — Put the memory on a new branch at a tag

### Premise

- You want the memory on release `v1.4.0`, on a new branch.

### Usage

```
/scrolls-restore --onto v1.4.0 -b memory/v1.4.0
```

### Caveats

- A tag, a SHA or `origin/...` needs `-b`. Without `-b`, the commit would be on no branch.
- The skill refuses an existing branch name.

### Expected Output

- Without `-b`:

```
ERROR: --onto v1.4.0 is not a local branch. Add -b NEW_BRANCH to create one there (the restore commit would otherwise be on no branch).
```

- With `-b`: a new branch `memory/v1.4.0`, one commit above `v1.4.0`.

---

## Example: 12 — The scrolls folder already exists

### Premise

- `docs/.scrolls` exists now. You want the old version from a checkpoint.

### Usage

```
/scrolls-restore 1a2b3c4d        # refused
/scrolls-restore -f 1a2b3c4d     # replaces the folder
```

### Caveats

- Usually, `/scrolls-update` is the correct command for an existing folder.
- `-f` replaces the folder content with the old version.
- If the folder exists with the other name (`scrolls` and `.scrolls`), the skill skips it. Use `/scrolls-hide` or `/scrolls-unhide`.

### Expected Output

```
REFUSED: docs/.scrolls already exists at the target. Run /scrolls-update to update it, or pass -f/--force to replace it with the source's version.
```

- With `-f`: `replaced folder  docs/.scrolls`.

---

## Example: 13 — Stage the restore, commit it yourself

### Premise

- You want to examine the restored files before the commit.

### Usage

```
/scrolls-restore -y --no-commit
```

### Caveats

- With `--onto`, the temporary worktree stays. The skill shows its path.
- Do not change the saved commit message.

### Expected Output

```
Staged, not committed (--no-commit). Commit with:
    git -C <repo> commit -F <git-dir>/SCROLLS_RESTORE_MSG
```

---

## Example: 14 — Nothing to restore

### Premise

- The history has no removal commit and no deleted scrolls folder.

### Usage

```
/scrolls-restore
```

### Caveats

- Give a commit, or search other branches with `--list --all`.

### Expected Output

```
Nothing to restore: No scrolls checkpoint found in HEAD's history: no /scrolls-remove commit, and no commit that deleted a scrolls folder. Pass a COMMIT, or use --list --all to search every branch.
```

- Exit code: `1`.
