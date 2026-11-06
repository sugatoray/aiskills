# /scrolls-remove — Examples

> **Writing rule for this file.** Write it in ASD-STE100 Simplified Technical English, at about 80% conformance. Keep to these rules when you change it:
>
> - Use short sentences: 20 words max for instructions, 25 words max for descriptions.
> - Use the active voice. Use the imperative for instructions.
> - Put one instruction in one sentence.
> - Use simple, approved words. Use one word for one meaning.
> - Prefer bullet points to paragraphs.
> - Put each example in one `## Example: NN — Title` block, with four sections: **Premise**, **Usage**, **Caveats**, **Expected Output**.

`/scrolls-remove` removes the scrolls memory and records the removal in one git commit. Use `/scrolls-restore` to bring the memory back.

---

## Example: 01 — Remove the scrolls (plan first)

### Premise

- The project has `docs/.scrolls/`, `SCROLLS.md`, `CLAUDE.md` and `AGENTS.md` from `/scrolls-setup`.
- All changes are committed.

### Usage

```
/scrolls-remove
```

### Caveats

- The skill shows the plan first. It asks you before it changes files.
- Nothing changes until you confirm.

### Expected Output

```
Plan:
  removed folder       docs/.scrolls  — 7 tracked files
  deleted              SCROLLS.md  — held only the scrolls pointer block
  deleted              CLAUDE.md  — held only the scrolls pointer stub
  deleted              AGENTS.md  — held only a pointer to a file this removal deletes
  pruned empty folder  docs  — empty once the scrolls folder is gone
```

- After you confirm, one commit is made:

```
maint(memory): scrolls-removed

- previous commit: #<full-sha>

Notes:
- removed folder: docs/.scrolls (7 tracked files)
- ...

Scrolls-Action: remove
Scrolls-Previous-Commit: <full-sha>
Scrolls-Folder: docs/.scrolls
...
```

---

## Example: 02 — Preview only (dry run)

### Premise

- You want to see what the skill will do.
- You do not want to change files.

### Usage

```
/scrolls-remove -n
```

### Caveats

- `-n` wins over `-y`. With `-y -n`, the skill still makes no change.

### Expected Output

- The plan and the full commit message.
- The last line: `Dry run — nothing changed. Re-run with -y/--yes to apply.`

---

## Example: 03 — Remove without a confirmation step

### Premise

- You already know the plan. You do not want the skill to ask again.

### Usage

```
/scrolls-remove -y
```

### Caveats

- The safety checks still apply. The skill still refuses if the removal could not be undone.

### Expected Output

```
Committed: 4faafe21c799ae5bb17c95ca905b60042ea27105
Undo:      git revert --no-edit 4faafe21c799ae5bb17c95ca905b60042ea27105
```

---

## Example: 04 — CLAUDE.md has your own content

### Premise

- `CLAUDE.md` has the scrolls stub and also your own project rules.

### Usage

```
/scrolls-remove
```

### Caveats

- The skill removes only the stub (`## Access Scrolls Agentic Memory` / `See @SCROLLS.md.`).
- Your rules stay in the file.
- `AGENTS.md` stays, because `See @CLAUDE.md` is still correct.

### Expected Output

```
  stripped             CLAUDE.md  — scrolls pointer stub removed; other content kept
  kept                 AGENTS.md  — still points at CLAUDE.md, which stays
```

---

## Example: 05 — Delete pointer files fully (purge)

### Premise

- You want `CLAUDE.md` and `AGENTS.md` gone, including your own content in them.

### Usage

```
/scrolls-remove -x CLAUDE.md,AGENTS.md
```

Other forms:

```
/scrolls-remove -x                  # same as -x all: SCROLLS.md, CLAUDE.md, AGENTS.md
/scrolls-remove -x all -x GEMINI.md # also delete another file next to docs/
/scrolls-remove --purge=CLAUDE.md
```

### Caveats

- Purge deletes content that `/scrolls-setup` did not write. Check the plan carefully.
- `-x` accepts file names only. A path such as `../x` is refused (exit 2).
- `/scrolls-restore` brings back only the stub for a purged file, unless you use `--full`.

### Expected Output

```
  purged               CLAUDE.md  — deleted by -x/--purge, including content setup didn't write
```

- The commit has the trailer `Scrolls-Purged: CLAUDE.md`.

---

## Example: 06 — Monorepo: remove all scrolls folders at once

### Premise

- The repository has scrolls at the root and in `packages/api` and `packages/web`.
- You are in a subdirectory.

### Usage

```
/scrolls-remove -t -r
```

### Caveats

- `-t` starts at the repository root. `-r` finds every scrolls folder below it.
- All folders go into one commit, with one restore point.
- The search goes 8 levels deep. It skips `node_modules`, `.git`, `vendor`, `dist`, `build` and similar folders.

### Expected Output

```
Scrolls-Folder: docs/.scrolls
Scrolls-Folder: packages/api/docs/.scrolls
Scrolls-Folder: packages/web/docs/scrolls
```

---

## Example: 07 — Remove the scrolls of one package only

### Premise

- A monorepo has scrolls in several packages.
- You want to remove only the `packages/api` scrolls.

### Usage

```
/scrolls-remove -p packages/api
```

Equivalent forms:

```
/scrolls-remove -p packages/api/docs
/scrolls-remove -p packages/api/docs/.scrolls
```

### Caveats

- The skill looks for pointer files next to `packages/api/docs`, that is, in `packages/api/`.
- Other packages and the root scrolls do not change.

### Expected Output

```
  removed folder       packages/api/docs/.scrolls  — 7 tracked files
  deleted              packages/api/SCROLLS.md  — held only the scrolls pointer block
```

---

## Example: 08 — Refused: uncommitted changes

### Premise

- You changed `docs/.scrolls/HANDOFF.md` and did not commit it.

### Usage

```
/scrolls-remove
```

### Caveats

- The restore point holds only committed content. The skill does not remove content that it cannot restore.
- Commit or discard the change, then run the skill again.
- The same refusal applies to untracked and ignored files under the targets.

### Expected Output

```
REFUSED: Uncommitted, untracked, or ignored changes under the paths this would remove — they are NOT in the previous commit, so removing them could not be undone:
     M docs/.scrolls/HANDOFF.md
  Commit (or discard) them first, then re-run.
```

- Exit code: `3`. No files change.

---

## Example: 09 — Refused: other changes are staged

### Premise

- You staged `app.txt` for a different commit.

### Usage

```
/scrolls-remove
```

### Caveats

- The skill does not mix your staged work into the removal commit.

### Expected Output

```
REFUSED: Other changes are already staged; they'd be swept into the removal commit:
    app.txt
  Commit or unstage them first (git restore --staged <file>), then re-run.
```

---

## Example: 10 — Stage the removal, commit it yourself

### Premise

- You want to examine the staged changes before the commit.

### Usage

```
/scrolls-remove -y --no-commit
```

### Caveats

- The commit message is saved in the git directory. Do not change it. `/scrolls-restore` reads it.

### Expected Output

```
Staged, not committed (--no-commit). Commit with:
    git commit -F <repo>/.git/SCROLLS_REMOVE_MSG
```

---

## Example: 11 — A commit hook rejects the commit

### Premise

- The repository has a commit-msg hook, for example a strict commitlint rule.
- The hook does not accept the `maint` type.

### Usage

```
/scrolls-remove -y
```

### Caveats

- The skill never uses `--no-verify`.
- The removal stays staged. Fix the hook rule, then commit with the saved message.

### Expected Output

```
ERROR: git commit failed — the removal is staged but not committed.
<hook output>
Fix the cause (e.g. a pre-commit hook), then: git commit -F <git-dir>/SCROLLS_REMOVE_MSG
```

- Exit code: `4`.

---

## Example: 12 — Nothing to remove

### Premise

- The current directory has no scrolls folder.

### Usage

```
/scrolls-remove
```

### Caveats

- Without `-r`, the skill checks only the exact default locations.
- Use `-t` for the repository root. Use `-r` to search below the current directory.

### Expected Output

```
No scrolls folder (.scrolls or scrolls with a STARTER.md) found under: <path>
Checked the exact default locations only — pass -r/--recurse to search recursively.
Nothing to remove.
```

- Exit code: `1`.
