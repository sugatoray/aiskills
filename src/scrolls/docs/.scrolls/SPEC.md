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

All five `scrolls-*` skills share a single version number instead of bumping independently (`skills/scrolls/meta/MAINTAINERS.md`'s Versioning entry). A change anywhere in the family that's visible to an actual `/scrolls-*` invocation bumps every skill to the same new number in the same commit; skills with nothing of their own that release get a short "synced to vX.Y.Z" `CHANGELOG.md` entry. Currently `2.1.0` everywhere.

## Idempotent `SCROLLS.md`/`CLAUDE.md`/`AGENTS.md` backfill on `/scrolls-update`

`/scrolls-setup` already scaffolds the pointer chain (previous entry) for a brand-new project, but until `2.1.0` only that one-time command did so — a project set up before `2.0.0` and never re-running `/scrolls-setup` by hand stayed stuck without `SCROLLS.md`/`AGENTS.md`. `/scrolls-update` (the command actually run every session) now backfills all three itself: creates `SCROLLS.md`/`AGENTS.md` if missing, and inserts the `CLAUDE.md` stub if it doesn't already reference `SCROLLS.md` — even against a `CLAUDE.md` that still has the old pre-`1.2.0` direct embed, additive only, never touching what's already there. Reads its pointer content from `scrolls-setup`'s own `assets/templates/` rather than duplicating it. The same tightened insertion rule was also applied back to `scrolls-setup` itself, fixing a related bug where a legacy direct-embed `CLAUDE.md` was being left alone forever instead of gaining the new stub.

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
