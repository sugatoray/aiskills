---
name: scrolls-remove
description: "Removes a docs/.scrolls/ (or docs/scrolls/) project-memory system from a git repository — the exact opposite of /scrolls-setup. Deletes the scrolls folder, deletes SCROLLS.md, strips the scrolls pointer stub out of CLAUDE.md (and the dangling pointer out of AGENTS.md), deleting either file outright only when nothing else is left in it, and records the whole removal as ONE git commit whose message names the commit just before the removal, so it can always be undone. Use this whenever the user runs /scrolls-remove, or asks to remove, delete, uninstall, tear down, or get rid of the scrolls / project memory / docs/.scrolls. Supports -p/--path (repeatable), -t/--reporoot, -l/--local, -r/--recurse to find and remove every scrolls folder under a directory in one commit, -x/--purge [CLAUDE.md|AGENTS.md|SCROLLS.md|<other file>|all] to delete pointer files outright even when they hold other content, -n/--dry-run, -y/--yes to skip the confirmation, and --no-commit. Refuses to run when anything it would remove has uncommitted changes, since those could not be restored. Works on macOS, Linux, and Windows (bash or PowerShell)."
license: MIT
compatibility: "bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies); git"
disable-model-invocation: true
metadata:
  name: scrolls-remove
  type: skill
  author: sugatoray
  version: "2.4.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-remove"
---

# Removing docs/.scrolls/

This skill undoes `/scrolls-setup`. It removes the scrolls folder and the pointer chain (`SCROLLS.md` → `CLAUDE.md` → `AGENTS.md`) that setup installed. The removal goes into a single commit whose message names the commit before it, which is the restore point.

This is destructive. **Never apply without showing the user the plan first**, unless they passed `-y`/`--yes`.

**Everything is relative to the current working directory** unless `-t`/`--reporoot` says otherwise, not relative to this skill's own location.

## Cross-platform

All of the logic is in one stdlib-only Python file, `scripts/remove.py`. `remove.sh` (bash: macOS, Linux, or Windows with Git Bash/WSL) and `remove.ps1` (PowerShell 7+) are thin launchers that find Python 3.9+ and pass every flag through unchanged, so the two can't behave differently. Pick by what's available: try `bash --version`, and if that succeeds use `.sh`. Otherwise use `.ps1` via `pwsh` (preferred), or `powershell.exe` only if `pwsh` isn't installed.

## Options

Read these from the invocation text, in any order:

- **`-p <path>` / `--path=<path>` / `--path <path>`**: where to look, instead of the current directory. Repeatable. The path may be a project folder (`<path>/docs/.scrolls`), a docs folder (`<path>/.scrolls`, the same form `/scrolls-setup -p` takes), or the scrolls folder itself.
- **`-t` / `--reporoot`**: look under the git repository's top level, whichever subdirectory you're in.
- **`-l` / `--local`**: look in the current directory explicitly. This is the default anyway.
- **`-r` / `--recurse`**: find **every** scrolls folder (`.scrolls` or `scrolls`, containing a `STARTER.md`) under the base directory and remove them all, with each one's pointer files, in **one** commit. The search goes 8 levels deep and skips vendor and build folders, the same way `/scrolls-hide` and `/scrolls-unhide` sweep. Without `-r`, only the exact spots above are checked.
- **`-x [targets]` / `--purge[=targets]`**: also delete these files outright, even when they contain content setup didn't write. `targets` is a comma-separated list, and the flag can be repeated:
  - `SCROLLS.md`, `CLAUDE.md`, `AGENTS.md`
  - any other plain file name that sits next to the `docs` folder, e.g. `GEMINI.md`. Paths are rejected.
  - `all`, which is what a bare `-x` means: `SCROLLS.md` + `CLAUDE.md` + `AGENTS.md`
- **`-n` / `--dry-run`**: show the plan and stop.
- **`-y` / `--yes`**: skip the confirmation step (step 2).
- **`--no-commit`**: apply and stage the changes, but leave the commit to the user. The script prints the `git commit -F …` command to finish with.

You can pass at most one of `-p`, `-t`, and `-l`. `-r` and `-x` combine with any of them. No `-u` is needed: both `.scrolls` and `scrolls` are found.

## What happens to each file

| File | Without `-x` | With `-x` naming it |
|---|---|---|
| Scrolls folder | `git rm -r` | (same) |
| `docs/` (its parent) | Removed only if nothing else is left in it | (same) |
| `SCROLLS.md` | Deleted if it held only setup's block. If it has other content, the block is cut out. If it mentions the scrolls folder in wording setup didn't write, it's left alone and flagged **needs review** | Deleted |
| `CLAUDE.md` | The `## Access Scrolls Agentic Memory` / `See @SCROLLS.md.` stub is cut out, along with a pre-1.2.0 embedded `SCROLLS.md` block if there is one. The file is deleted if nothing is left | Deleted |
| `AGENTS.md` | Kept while `CLAUDE.md` still exists, because `See @CLAUDE.md` still works. If `CLAUDE.md` is deleted, the pointer line is cut out (the file is deleted if that empties it) | Deleted |
| Other `-x` names | — | Deleted |

Matching ignores trailing whitespace and extra blank lines, and accepts a heading at any level (setup demotes its heading when it inserts into an existing file). Anything else that still mentions the folder or `SCROLLS.md`, such as a README or a CI config, is **reported but never edited**.

## Steps

### 1. Preview

Run the script **without `-y`**, passing the user's other flags through:

```
bash <skill-dir>/scripts/remove.sh [flags...]
pwsh <skill-dir>/scripts/remove.ps1 [flags...]
```

This only prints the plan: the repository, branch, previous-commit SHA, one line per file, any other references found, and the exact commit message. Nothing changes.

- **Exit 1**: no scrolls folder was found. Pass on the script's hint (try `-t`, or `-r`), and stop.
- **Exit 2**: a usage error, such as `-p` combined with `-t`, or a path given to `-x`. Report it and stop.
- **Exit 3**: a safety refusal. Report the reason exactly as printed, and stop. Do **not** work around it by committing, stashing, or deleting the user's files yourself; let the user choose. The refusals are:
  - something under the paths to be removed has uncommitted, untracked, or ignored changes, which the restore point wouldn't contain
  - other changes are already staged
  - the repository has no commits yet
  - the folders span more than one repository

### 2. Confirm

Show the user the plan, then ask before going further. Call out anything marked **purged** (content beyond setup's will be lost) or **needs review**. Skip this step only if the user passed `-y`/`--yes`. If they passed `-n`/`--dry-run`, stop after step 1.

### 3. Apply

Run the same command again, with `-y` added. The script:

1. records `git rev-parse HEAD` as the previous commit
2. runs `git rm` and edits the files as planned
3. commits only those paths, with this message:

```
maint(memory): scrolls-removed

- previous commit: #<full SHA of the commit before the removal>

Notes:
- removed folder: docs/.scrolls (7 tracked files)
- deleted: SCROLLS.md (held only the scrolls pointer block)
- stripped: CLAUDE.md (scrolls pointer stub removed; other content kept)
- kept: AGENTS.md (still points at CLAUDE.md, which stays)
- pruned empty folder: docs (empty once the scrolls folder is gone)

Scrolls-Action: remove
Scrolls-Previous-Commit: <full SHA>
Scrolls-Folder: docs/.scrolls
Scrolls-Deleted: SCROLLS.md
Scrolls-Stripped: CLAUDE.md
Scrolls-Kept: AGENTS.md
Scrolls-Pruned: docs
```

The `Notes:` section is for people. The final paragraph is standard git trailers, for tools: one `Scrolls-<Kind>:` line per path, with paths relative to the repository root. Kinds are `Folder`, `Deleted`, `Stripped`, `Purged`, `Kept`, `Review`, and `Pruned`. `/scrolls-restore` reads these with `git log --format='%(trailers:unfold,only)'` (finding removal commits with `--grep='^Scrolls-Action:'`), and uses them to put back exactly what was removed. **Never hand-edit or reword this message.**

If `git commit` fails (exit 4, usually a pre-commit or commit-msg hook), the removal stays staged. Report the hook's output and the `git commit -F <git-dir>/SCROLLS_REMOVE_MSG` command to finish with. Never retry with `--no-verify`.

This skill never pushes.

### 4. Follow up on leftovers

For each file listed as **needs review** or under "Other files that still mention…": read it, and offer to fix any reference that's actually stale. Use normal editing judgment, the same as `/scrolls-hide` step 2. Don't fold those edits into the removal commit. Make them a separate change, and only if the user agrees.

### 5. Report

Give:

- the new commit SHA, and the previous-commit SHA it records
- what was removed, deleted, stripped, purged, kept, or pruned
- anything flagged for review
- how to undo it: `/scrolls-restore`, which brings back just the memory into the repo as it is now, or `git revert --no-edit <new-sha>` straight away

## Limitations

- Only works inside a git repository that has at least one commit. Without one, there would be no way to undo the removal.
- Only committed content can be restored from the previous commit, which is why any uncommitted, untracked, or ignored content under the targets blocks the run.
- With `-p`, pointer files are looked for only next to the `docs` folder that contains the scrolls folder. That's where setup puts them for `-t`, `-l`, and the default. A custom-`--path` setup that put them elsewhere will have them reported as other references rather than cleaned.
- The commit type `maint` isn't a standard Conventional Commits type, so a strict commitlint hook may reject it (exit 4, above).

## Examples

Worked examples are in `assets/EXAMPLES.md`. Each example has a premise, the usage, caveats, and the expected output. Read that file only when you need it: for example, when a request does not map clearly to the flags above, or when the user asks for an example.

## Development

See `meta/MAINTAINERS.md` for the layout, running the `tests/` regression
suite, and versioning notes. Don't read or act on `meta/MAINTAINERS.md`
or `tests/` while carrying out a user's `/scrolls-remove` request.
