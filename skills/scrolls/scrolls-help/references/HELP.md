# Scrolls — Command Reference

Scrolls are a small, checked-in `docs/.scrolls/` (or `docs/scrolls/`) file set that gives Claude cross-session memory for a project — what it does, what state it's in, what's known-missing, what's next, and what traps to avoid — plus a `SCROLLS.md` pointer (with a short `CLAUDE.md` pointer to it) that makes every future session read it first instead of re-discovering everything from scratch.

Every command here works the same way on macOS, Linux, and Windows — each bundled script ships as both a bash (`.sh`) and a PowerShell (`.ps1`, PowerShell 7+) version with identical flags and behavior, and Claude picks whichever matches the current environment. Nothing about the examples below changes per platform.

**Prefer a formatted page over chat text?** `/scrolls-help -e` (or `--online`) serves this same content locally and opens it in your browser. The server stops itself automatically after 30 minutes idle or 2 hours total, whichever comes first — or stop it sooner with `open_help.sh --stop <port>` (or `open_help.ps1 --stop <port>`; add `--all` instead of a port to stop every running instance).

## Quick start

```
/scrolls-setup          # once, the first time in a project
/scrolls-update         # at the end of every session after that
```

That covers the typical single-repo workflow completely. Everything below is for less common cases: running from a subdirectory, monorepos, and toggling the folder's visibility.

## The six commands

| Command | Does |
|---|---|
| `/scrolls-setup` | Creates the scrolls system for a project that doesn't have one yet. |
| `/scrolls-update` | Updates an existing scrolls system to reflect what happened this session — the one to run regularly. |
| `/scrolls-hide` | Renames an existing `scrolls/` folder to dotfile-hidden `.scrolls/`. |
| `/scrolls-unhide` | Renames an existing `.scrolls/` folder to visible `scrolls/`. |
| `/scrolls-remove` | Removes the scrolls system and commits the removal, recording the previous commit so it can be undone. |
| `/scrolls-restore` | Brings the memory back from the newest removal checkpoint (or any commit) into the repo as it is now, optionally `--onto` another branch. |

`/scrolls-hide` and `/scrolls-unhide` are retrofit tools — for a brand-new project, `/scrolls-setup -u` already creates it visible in one step, no separate toggle needed.

**See it animated:** `/scrolls-explainer` opens `scrolls-explainer.html`, an offline page with one tab per command that animates what each one does, step by step, with a callout for every step. Drive it from the keyboard: `→`/`←` step, `[` `]` switch tabs, `Space` pauses, `?` lists every key. It never touches your scrolls and takes its own flags, not the location flags below. With no flags (the same as `--show`) it opens the page that ships with the skill and copies nothing; `-o PATH` copies it to a file or folder instead (`-o .` for `./scrolls-explainer.html`), with `-f` to replace a different file already there and `--open` to open the copy; and `--build` to regenerate that page from the scrolls skills as they are now (it stops and names any skill whose `SKILL.md` changed until its tab is reviewed; `--build --reviewed` confirms).

## Flags

All six commands share the same location flags. `-u` only makes sense on `setup`, `-x` only on `remove`, and `--onto`/`-b` only on `restore`; `-r` means something specific to each command.

| Flag | Meaning | setup | update | hide / unhide | remove | restore |
|---|---|---|---|---|---|---|
| `-p`, `--path <dir>` | Use a specific docs folder / base directory instead of the default | single value | single value | repeatable | repeatable | repeatable |
| `-t`, `--reporoot` | Use the git repository's top level, regardless of cwd | ✓ | ✓ | ✓ | ✓ | ✓ |
| `-l`, `--local` | Use the current directory explicitly (same as the default, stated on purpose) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `-r`, `--recurse` | See below — meaning differs per command | pre-creation duplicate scan | fallback search | sweep mode | sweep mode | sweep mode |
| `-u`, `--unhide` | Create the folder visible (`scrolls`) instead of hidden (`.scrolls`) | ✓ | — | — | — | — |
| `-x`, `--purge [files]` | Also delete these pointer files outright: `SCROLLS.md`, `CLAUDE.md`, `AGENTS.md`, another file name, or `all` (default) | — | — | — | ✓ | — |
| `--onto REF`, `-b NAME` | Put the restored memory on another branch (or a new branch at any commit), without touching the current checkout | — | — | — | — | ✓ |

`-p`, `-t`, and `-l` are three ways to answer the same question ("where?") — pick at most one. `-r` is independent and stacks with any of them, or with none.

**What `-r`/`--recurse` does on each command**, since it's the one flag that isn't a location picker:
- `/scrolls-setup -r` — before creating anything, scans recursively for a scrolls folder that already exists nearby, and checks with you rather than silently creating a disconnected duplicate.
- `/scrolls-update -r` — if nothing's at the exact expected spot, searches recursively instead of just reporting "not set up" (and asks you to pick if it finds more than one).
- `/scrolls-hide -r` / `/scrolls-unhide -r` — without it, these check exactly one location; with it, they sweep an entire directory tree for every matching folder (e.g. every package in a monorepo, in one run).
- `/scrolls-remove -r` — removes every scrolls folder under the directory, with each one's pointer files, in a single commit.
- `/scrolls-restore -r` — restores every folder from the checkpoint under the directory, not just the one at the exact spot (undoes a `remove -r` sweep).

**Default, with no flags at all**: everything happens relative to the current directory. If that's not the git repository's root, `/scrolls-setup` and `/scrolls-update` say so and check with you before proceeding — cwd still wins if you don't have a preference, it just won't happen silently.

## Examples

**First time in a new project, standing at the repo root:**
```
/scrolls-setup
```

**First time, but you're a couple of directories deep and want it at the repo root:**
```
/scrolls-setup -t
```

**Setting up scrolls for one package inside a monorepo:**
```
/scrolls-setup -p packages/api/docs
```

**Wrapping up a work session:**
```
/scrolls-update
```
Not sure exactly where the scrolls live relative to here:
```
/scrolls-update -r
```

**Want the scrolls folder visible in a normal directory listing instead of dotfile-hidden:**
```
/scrolls-unhide
```

**Convert every scrolls folder in a monorepo to visible, in one shot, from anywhere in the repo:**
```
/scrolls-unhide -t -r
```

**Put it back to hidden, same way:**
```
/scrolls-hide -t -r
```

**Remove the scrolls system (shows the plan and asks first):**
```
/scrolls-remove
```
Also delete `CLAUDE.md`/`AGENTS.md` outright, even though they hold other notes:
```
/scrolls-remove -x CLAUDE.md,AGENTS.md
```
Remove every scrolls folder in a monorepo, in one commit:
```
/scrolls-remove -t -r
```
The commit is `maint(memory): scrolls-removed`, and its body names the previous commit.

**Bring it back later** — just the memory, into the code as it is now:
```
/scrolls-restore
```
See every checkpoint (`--all` searches other branches too), then restore a specific one:
```
/scrolls-restore --list --all
/scrolls-restore 1a2b3c4d
```
Mount the memory onto another branch, or a new branch at a release tag, without leaving your current checkout:
```
/scrolls-restore --onto feature/x
/scrolls-restore --onto v1.4.0 -b memory/v1.4.0
```

**Show someone how it works** — an animated, offline page, one tab per command:
```
/scrolls-explainer
/scrolls-explainer -o docs/ --open
/scrolls-explainer --build
```

## How the pieces fit together

- `docs/.scrolls/STARTER.md` (or `docs/scrolls/STARTER.md`) is the entry point: it lists the other six files in reading order and says when to update each.
- `SCROLLS.md`, at the same level as `docs`, points every session at `STARTER.md` first — that's the whole mechanism that makes this "memory." A short `CLAUDE.md` pointer (`See @SCROLLS.md.`) sits next to it, and a matching `AGENTS.md` pointer (`See @CLAUDE.md`) beside that, for harnesses that read those files instead.
- The six other files: `SPEC.md` (features, updated when they ship), `HANDOFF.md` (session snapshot, overwritten each time, not appended), `GAP_ANALYSIS.md`/`GAP_CONTEXT.md` (known gaps and why they exist), `PLAN.md` (prioritized backlog), `WISDOM.md` (constraints, traps, ditches, and lessons worth reusing).

## Troubleshooting

- **"`/scrolls-restore` says the folder already exists."** The memory is already there. Run `/scrolls-update` to bring it up to date, or pass `-f` to replace it with the checkpoint's version.
- **"`/scrolls-remove` refused to run."** Something it would delete has uncommitted, untracked, or ignored changes, or unrelated changes are already staged. The restore point only holds committed content, so it won't risk anything else. Commit or discard those changes, then run it again.
- **"It created a second scrolls system in a subdirectory I didn't expect."** You ran `/scrolls-setup` or `/scrolls-update` from somewhere other than the repo root without `-t`. Re-run with `-t` to target the repo root, or `-p`/`-l` to be explicit about where you meant.
- **"hide/unhide didn't find anything."** By default they check exactly one location (`<base>/docs/.scrolls` or `.../scrolls`). Add `-r` to search recursively, or `-t` if you meant the repo root.
- **"A monorepo package's `SCROLLS.md` got the wrong text after a sweep."** Shouldn't happen — hide/unhide only ever touch the one `SCROLLS.md` that's a direct sibling of the `docs` folder being renamed, never a broader search, specifically to avoid cross-wiring sibling packages that happen to share the same short reference text. `CLAUDE.md` itself is never touched by a sweep — it's a fixed pointer to `SCROLLS.md`, not a scrolls-path reference. If this happens, it's a bug worth reporting.
