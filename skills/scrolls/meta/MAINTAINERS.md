# Maintaining the scrolls family

Family-wide maintainer notes for all five `scrolls-*` skills under
`skills/scrolls/` — not read as part of answering any `/scrolls-*`
request; each skill's own `SKILL.md` is what's actually read at
invocation time. For a specific skill's own layout, running its tests,
and its versioning rule, see that skill's own `meta/MAINTAINERS.md`:

- [`scrolls-setup/meta/MAINTAINERS.md`](../scrolls-setup/meta/MAINTAINERS.md)
- [`scrolls-update/meta/MAINTAINERS.md`](../scrolls-update/meta/MAINTAINERS.md)
- [`scrolls-hide/meta/MAINTAINERS.md`](../scrolls-hide/meta/MAINTAINERS.md)
- [`scrolls-unhide/meta/MAINTAINERS.md`](../scrolls-unhide/meta/MAINTAINERS.md)
- [`scrolls-help/meta/MAINTAINERS.md`](../scrolls-help/meta/MAINTAINERS.md)
  (plus [`SECURITY.md`](../scrolls-help/meta/SECURITY.md) for its local
  `-e`/`--online` server)

## What's shared across all five

- **License / authorship**: MIT, `metadata.author: sugatoray` — keep
  both consistent across every skill's `SKILL.md`.
- **Cross-platform**: every bundled script ships as both bash (`.sh`)
  and PowerShell (`.ps1`) with identical flags and behavior.
  `scrolls-setup` is the one exception — no bundled script at all; see
  its own `meta/MAINTAINERS.md`.
- **Shared location flags** (`-p`/`-t`/`-l`/`-r`, plus `-u` on
  `scrolls-setup` only): keep semantics and defaults identical across
  every command that takes them. `../README.md`'s "Shared flags" table
  is the source of truth users are pointed at — update it whenever a
  flag's behavior changes on any one skill, not just that skill's own
  `SKILL.md`.
- **Red/Green TDD**: every bundled script (`scripts/*.sh`/`*.ps1`) is
  developed and changed test-first — write or update the failing test
  in that skill's `tests/` before touching the script, confirm it fails
  for the right reason, then make it pass.
- **Versioning**: each skill bumps its own `metadata.version`
  independently in its own `SKILL.md` — there's no shared family
  version number. Bump only for changes visible to an actual
  `/scrolls-*` invocation (new/changed flag, changed default, changed
  behavior); leave it alone for documentation-only or test-only
  changes. Each skill's own `meta/MAINTAINERS.md` states this rule for
  that skill specifically.
- **Changelogs**: each skill has its own `CHANGELOG.md` at its top
  level — update it in the same commit as any `metadata.version` bump,
  under an `## [Unreleased]` heading for doc/test-only changes that
  don't bump the version. This directory's own `CHANGELOG.md` is for
  family-wide changes that aren't tied to a single skill's version (a
  shared-flags table update, a `README.md` reorganization, and so on).
- **`../README.md`** (this directory's README) is the user-facing
  overview across all five commands — update it whenever a skill's
  directory layout or shared-flag behavior changes, not just that
  skill's own docs.

## Where the installable artifacts live

Only `skills/scrolls/` is what actually ships and gets installed.
`src/scrolls/CLAUDE.md`, elsewhere in this repository, is a pointer for
anyone (human or agent) who lands in `src/` looking for these skills —
not a second copy. Never duplicate skill content into `src/`; if the
pointer's install commands or target-folder note go stale, fix them in
place rather than growing a parallel source of truth.

## Installing for local testing

See `src/scrolls/CLAUDE.md` for the tested `npx skills add
sugatoray/aiskills ...` commands (local/project, global/user, and
install-everywhere forms) — the same commands work against any fork or
branch by adjusting the `owner/repo` (and optional `#branch`) argument.
