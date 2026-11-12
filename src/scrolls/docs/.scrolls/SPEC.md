# SPEC.md — Feature Spec

What scrolls (aiskills) does, feature by feature. Add a section per feature when it ships — describe *what* it does and *why* it matters to a user, not the implementation detail (that belongs in code comments or `WISDOM.md`).

Scope note: "features" here are the capabilities the `scrolls-*` skill family itself ships to the people who install it via `npx skills add sugatoray/aiskills`, not features of this `src/scrolls/` pointer directory (which has none of its own — it just points elsewhere and records this history).

## Bounded lifecycle for scrolls-help's local server

`/scrolls-help -e`/`--online` serves the reference as a local styled HTML page. It now shuts itself down automatically (default: 30 min idle, 2 hours max lifetime) and can be stopped explicitly with `open_help.sh --stop <port>` / `--stop --all`, instead of requiring the user to find and kill a PID. Fixes a real Snyk safety-audit finding: an unbounded, unsupervised background listener.

## scrolls-help SKILL.md / MAINTAINERS.md / SECURITY.md split

`SKILL.md` no longer mixes maintainer-only procedural instructions with its runtime scope statement — that pairing (a "does not modify anything outside X" claim next to a same-document instruction to modify X) is exactly the shape Snyk's E004 prompt-injection detector flags, even when the two aren't actually in conflict. Maintainer procedure moved to `meta/MAINTAINERS.md`; a new `meta/SECURITY.md` documents the skill's full threat model and security posture.

## Family-wide `meta/MAINTAINERS.md` and `CHANGELOG.md`

Every one of the five `scrolls-*` skills now has its own `meta/MAINTAINERS.md` (layout, versioning, running tests) and `CHANGELOG.md` (Keep a Changelog format, reconstructed from real commit history). A family-level `skills/scrolls/meta/MAINTAINERS.md` and `skills/scrolls/CHANGELOG.md` cover conventions and history that span all five rather than belonging to any one skill.

## Cross-agent-harness compatibility: `AGENTS.md` and `SCROLLS.md`

`/scrolls-setup` now scaffolds three pointer files instead of one: `SCROLLS.md` (the actual "read `STARTER.md` first" content), a short `CLAUDE.md` pointer to it, and a matching `AGENTS.md` pointer to `CLAUDE.md` for harnesses (Codex CLI and others) that follow the [agents.md](https://agents.md) convention instead of reading `CLAUDE.md` directly. `scrolls-hide`/`scrolls-unhide` rewrite `SCROLLS.md` on rename now, not `CLAUDE.md` — this is the one breaking change in the family's `2.0.0` release; see `GAP_CONTEXT.md` and `WISDOM.md`.

## Family version lockstep

All `scrolls-*` skills share a single version number instead of bumping independently (`skills/scrolls/meta/MAINTAINERS.md`'s Versioning entry). A change anywhere in the family that's visible to an actual `/scrolls-*` invocation bumps every skill to the same new number in the same commit; skills with nothing of their own that release get a short "synced to vX.Y.Z" `CHANGELOG.md` entry. Currently `2.4.0` on `master` (seven skills), `2.5.0` on `claude/brave-mccarthy-m6aut0` (eight skills, with `/scrolls-explainer`).

## Idempotent `SCROLLS.md`/`CLAUDE.md`/`AGENTS.md` backfill on `/scrolls-update`

`/scrolls-setup` already scaffolds the pointer chain (previous entry) for a brand-new project, but until `2.1.0` only that one-time command did so — a project set up before `2.0.0` and never re-running `/scrolls-setup` by hand stayed stuck without `SCROLLS.md`/`AGENTS.md`. `/scrolls-update` (the command actually run every session) now backfills all three itself: creates `SCROLLS.md`/`AGENTS.md` if missing, and inserts the `CLAUDE.md` stub if it doesn't already reference `SCROLLS.md` — even against a `CLAUDE.md` that still has the old pre-`1.2.0` direct embed, additive only, never touching what's already there. Reads its pointer content from `scrolls-setup`'s own `assets/templates/` rather than duplicating it. The same tightened insertion rule was also applied back to `scrolls-setup` itself, fixing a related bug where a legacy direct-embed `CLAUDE.md` was being left alone forever instead of gaining the new stub.

## `/scrolls-remove` (2.2.0)

Removes the scrolls system from a git repository: the exact opposite of `/scrolls-setup`. It deletes the scrolls folder (and a `docs/` folder left empty) and `SCROLLS.md`, and strips the scrolls stub out of `CLAUDE.md` (and the dangling pointer out of `AGENTS.md`, once `CLAUDE.md` is gone). A pointer file is deleted only when nothing else is left in it. Everything lands as one `maint(memory): scrolls-removed` commit whose body names the previous commit (`- previous commit: #<sha>`), followed by human-readable `Notes:` and machine-readable `Scrolls-*` git trailers, so the removal can always be undone.

- Shows the plan first and applies only with `-y`.
- `-r` sweeps every scrolls folder under a directory into one commit.
- `-x/--purge [SCROLLS.md|CLAUDE.md|AGENTS.md|<file>|all]` deletes pointer files outright, even when they hold other content.
- Refuses when the removal couldn't be undone: uncommitted, untracked, or ignored content under the targets, or no commits yet. Also refuses when unrelated changes are staged.

Merged via PR #110; tracked by issues #111 (with sub-issues #112, #113).

## `/scrolls-restore` (2.3.0; shipped on `master` in 2.4.0, #114)

The counterpart to `/scrolls-remove`. It brings back only the agentic memory, into the repository as it is now: folders are checked out from the source commit, and pointer stubs are re-inserted into today's `CLAUDE.md`/`AGENTS.md` instead of overwriting them. Nothing else is rolled back, which is the point compared with `git revert`.

- The default source is the newest removal checkpoint in HEAD's history, read from its trailers. A checkpoint that was already restored is not restored again. With no checkpoint at all, it falls back to the commit before the last plain deletion of a scrolls folder.
- Any `<COMMIT>` works as a source.
- `--onto REF` (plus `-b NEW_BRANCH`) mounts the memory onto another branch through a temporary worktree, without touching the current checkout.
- `--full` brings back the whole content of purged files, `-f` replaces an existing folder, and `--list [--all]` finds checkpoints.
- Records the restore as one `maint(memory): scrolls-restored` commit with `Scrolls-*` trailers.

Built and tested (88 assertions, end to end through the real `remove.sh`). Merged in #114.

## `/scrolls-explainer` (2.5.0, on branch `claude/brave-mccarthy-m6aut0`)

Shows `scrolls-explainer.html`, an interactive, offline page that shows how the family works: an Overview, a New session tab (how an agent follows `AGENTS.md`/`CLAUDE.md` → `SCROLLS.md` → `STARTER.md`), and one tab per command that animates its steps with a callout next to the file being touched.

- Everything works from the keyboard: arrows step, `[` `]` or `0`–`8` switch tabs, `Space` pauses, `R` replays, `?` lists every key.
- With no flags (= `--show`, the user's call) it opens the bundled page in place and copies nothing; `-o` copies it to a file or folder (`-o .` for `./scrolls-explainer.html`), `-f` overwrites a different file, `--open` opens the copy, `--version`.
- `--build` regenerates it from the `scrolls-*` skills as they are now (tabs, lockstep version, a review stop when a `SKILL.md` changed, `--reviewed` to confirm).
- It never touches the user's scrolls memory.

Tested: 109 assertions in `test_explain.sh`, including Playwright browser checks and a build-freshness check.

## `src/scrolls/` install pointer

A pointer at `src/scrolls/CLAUDE.md`, separate from the real skill artifacts at `skills/scrolls/`, documenting tested `npx skills add sugatoray/aiskills` install commands: local (project-level), global (user-level), and install-everywhere-for-every-supported-agent (`--all`) forms, plus `owner/repo#branch` pinning. Every command was actually run against the real repo before being written down, then fully cleaned up.

## Per-skill `README.md`

Each of the five `scrolls-*` skill directories now has its own minimal
`README.md` — previously only `SKILL.md` (the runtime manifest, not
rendered specially by GitHub) and the family-level `skills/scrolls/README.md`
existed, so browsing into a skill folder directly on GitHub showed a bare
file list. Each `README.md` has: purpose, how to run it, a `## Layout`
section (a verified `tree`-style listing of that skill's actual files),
a `## Installing` section (five tested `npx skills add` forms —
interactive, this-skill-only, unattended all-five, unattended
this-skill-only, and from-a-local-clone, with single-skill examples using
that folder's own skill name), and links to `SKILL.md`/
`meta/MAINTAINERS.md`/`CHANGELOG.md`. Not read at invocation time —
purely for human readers; `SKILL.md` remains the only file read while a
`/scrolls-*` command runs. Documentation-only, no version bump.

The install examples confirmed a previously-undocumented `skills` CLI
behavior: omitting `--agent` entirely (with `--yes`) makes the unattended
form auto-detect whichever agents are already set up on the machine —
the same set the interactive picker pre-checks — rather than requiring
an explicit `--agent <name>` or `--agent '*'`.

## GitHub issue tracking for the above

The safety-hardening, governance-rollout, compatibility, and backfill work above is tracked as GitHub issues with real sub-issues (not just checklists) where the work had multiple distinct parts: #8 (scrolls-help hardening, subs #9–#12), #13 (governance rollout, subs #14–#17), #18 (AGENTS.md/SCROLLS.md compatibility, standalone), #19 (idempotent backfill, subs #20–#23), and #24 (per-skill README.md, standalone). All reference PR #7, left open until it merges.
