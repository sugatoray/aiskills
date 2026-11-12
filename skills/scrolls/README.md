# Scrolls skills

Custom slash commands for managing `docs/.scrolls/` (or `docs/scrolls/`), a
small set of markdown files that act as a project's working memory across
sessions — what it does, what state it's in, what's known-missing and why,
what's next, and what traps to avoid. `STARTER.md` inside that folder is the
entry point; a `SCROLLS.md` file tells new sessions to read it first, with
a short `CLAUDE.md` pointer to `SCROLLS.md` and a matching `AGENTS.md`
pointer to `CLAUDE.md` for other agent harnesses.

All eight commands work the same way on macOS, Linux, and Windows. Every
bundled script — all but `/scrolls-setup`, which needs none — ships as
both a bash (`.sh`) and a PowerShell (`.ps1`, PowerShell 7+) version.

Run `/scrolls-help` for the full example-driven reference (add `-e`/`--online`
to view it as a styled local web page instead of chat text), or
`/scrolls-explainer` for an animated, offline page that walks through what
each command does, step by step.

## Commands

| Command | Purpose |
| --- | --- |
| [`/scrolls-setup`](scrolls-setup/) | Creates `docs/.scrolls/` for a project that doesn't have it yet: `STARTER.md`, `SPEC.md`, `HANDOFF.md`, `GAP_ANALYSIS.md`, `GAP_CONTEXT.md`, `PLAN.md`, `WISDOM.md`, plus `SCROLLS.md`, a short `CLAUDE.md` pointer to it, and a matching `AGENTS.md` pointer to `CLAUDE.md`. |
| [`/scrolls-update`](scrolls-update/) | Updates an existing `docs/.scrolls/` to reflect what happened in the current session, following each file's own update rule. The counterpart to `/scrolls-setup` — use this one for every session afterward. |
| [`/scrolls-hide`](scrolls-hide/) | Renames an already-set-up `docs/scrolls/` to dotfile-hidden `docs/.scrolls/`, rewriting path references so nothing breaks. Retrofit path for a project set up visible. |
| [`/scrolls-unhide`](scrolls-unhide/) | The opposite of `/scrolls-hide`: renames `docs/.scrolls/` to visible `docs/scrolls/`, rewriting path references so nothing breaks. |
| [`/scrolls-remove`](scrolls-remove/) | The opposite of `/scrolls-setup`. It removes `docs/.scrolls/` and `SCROLLS.md` and strips the scrolls pointers from `CLAUDE.md`/`AGENTS.md`, all as one `maint(memory): scrolls-removed` commit that records the previous commit's SHA for restoring. `-x`/`--purge` deletes pointer files outright. |
| [`/scrolls-restore`](scrolls-restore/) | The counterpart to `/scrolls-remove`. Restores the memory from the newest removal checkpoint, or from any commit, into the repo as it is now: the folders come back and the stubs are re-inserted, and nothing else is rolled back. `--onto` mounts it on another branch through a temporary worktree. |
| [`/scrolls-help`](scrolls-help/) | Crisp, example-driven reference for the whole family — what each command does, their shared flags, and common usage examples. Supports `-e`/`--online` to serve it as a styled local page (light/dark and colorize/plain toggles) instead of chat text. |
| [`/scrolls-explainer`](scrolls-explainer/) | Writes `scrolls-explainer.html`: an interactive, offline page with one tab per command that animates what it does, step by step, with a callout for each step and full keyboard navigation. `-o` picks the file or folder, `-f` overwrites, `--open` opens it. |

## Shared flags

`/scrolls-setup`, `/scrolls-update`, `/scrolls-hide`, `/scrolls-unhide`,
`/scrolls-remove`, and `/scrolls-restore` share a common set of flags for
targeting *where* the scrolls folder lives, so the same mental model
applies across all six:

| Flag | Meaning |
| --- | --- |
| `-p`, `--path` | Custom docs location. Repeatable on `/scrolls-hide`/`/scrolls-unhide`/`/scrolls-remove`/`/scrolls-restore` to target multiple locations in one run. |
| `-t`, `--reporoot` | Pin to the git repository's top level, regardless of which subdirectory you're in. |
| `-l`, `--local` | Pin explicitly to the current directory. |
| `-r`, `--recurse` | Scan/sweep recursively instead of checking one exact location (e.g. every package in a monorepo in one run). |
| `-x`, `--purge [files]` | `/scrolls-remove` only. Deletes the named pointer files outright (`SCROLLS.md`, `CLAUDE.md`, `AGENTS.md`, another file name, or `all`, the default), even when they hold other content. |
| `--onto REF`, `-b NAME` | `/scrolls-restore` only. Commit the restored memory onto another branch (or a new branch `NAME` at any commit) through a temporary worktree. |
| `-u`, `--unhide` | `/scrolls-setup` only — create the folder visible (`scrolls`) instead of dotfile-hidden (`.scrolls`). |

Default (no `-p`/`-t`/`-l`): the current directory, with a warning first if
that differs from the repo root, so a subdirectory invocation doesn't
silently create or miss a disconnected scrolls system. `/scrolls-hide`,
`/scrolls-unhide`, and `/scrolls-remove` also honor a `DEFAULT_SCROLLS_RELPATH` environment
variable to change that default location.

## Layout

Every command's directory has:

- `assets/EXAMPLES.md` — worked examples (premise, usage, caveats,
  expected output), linked from that skill's `SKILL.md` and `README.md`.

- `SKILL.md` — the skill's runtime instructions.
- `README.md` — a minimal, human-facing pointer to the files below;
  not read at invocation time.
- `agents/openai.yaml` — OpenAI-agent interface metadata.
- `meta/MAINTAINERS.md` — development notes: layout, versioning, and
  (where applicable) running tests.
- `CHANGELOG.md` — that skill's own version history.

Command-specific additions:

- `/scrolls-setup` — `assets/templates/` for the scaffolded markdown
  files. No bundled script or `tests/`: file creation goes through
  Read/Write/Edit tools directly, not a script.
- `/scrolls-remove`, `/scrolls-restore` — `scripts/remove.py` /
  `scripts/restore.py` (all the logic, stdlib Python) with thin `.sh`/`.ps1`
  launchers, and `tests/`.
- `/scrolls-update`, `/scrolls-hide`, `/scrolls-unhide` — `scripts/`
  (bash + PowerShell) and `tests/` (bash + PowerShell, Red/Green TDD) for
  their one bundled script.
- `/scrolls-help` — `references/HELP.md`, its canonical,
  presented-to-users content; `scripts/`/`tests/` for its `-e`/`--online`
  local server; and `meta/SECURITY.md` alongside `MAINTAINERS.md`,
  covering that server's scope, network exposure, and bounded lifecycle.
- `/scrolls-explainer` — `assets/scrolls-explainer.html`, the prebuilt
  page it writes; `scripts/explain.py` with thin `.sh`/`.ps1` launchers;
  `meta/generator/` (the page's source, rendered with the `network-flow`
  skill and rebuilt by `build.py`); and `tests/` (bash + PowerShell,
  Red/Green TDD, plus a Playwright browser check).

`tests/` and `meta/` are development-only — for maintaining bundled
scripts and documenting design decisions, not part of using the skills.
`SKILL.md` may point to them by name, but only to say they're not part of
carrying out a request — neither is ever read as instructions while a
`/scrolls-*` command is actually running.

This directory (`skills/scrolls/`) has its own `meta/MAINTAINERS.md` and
`CHANGELOG.md` too — family-wide maintainer notes (shared conventions
across all eight, versioning, where the installable artifacts live) and a
family-wide change log for anything that isn't tied to a single skill's
own version, neither of which belong in any single skill's own docs.
