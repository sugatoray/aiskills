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
- **Versioning — locked in lockstep**: all five `scrolls-*` skills
  share a single version number, kept identical across every skill's
  `metadata.version` in `SKILL.md` — as of this writing, `2.0.0`
  everywhere. A version bump is still only warranted by a change
  visible to an actual `/scrolls-*` invocation (new/changed flag,
  changed default, changed behavior) somewhere in the family — pure
  documentation or test-only changes don't trigger one. But once
  *anything* in the family earns a bump, bump **all five** to that
  same new number in the same commit, including skills with no
  functional change of their own. Never let one skill's version number
  outpace or lag the others — a mismatched set of versions across the
  family is itself a bug to fix, not a state to leave alone.
- **Changelogs**: each skill has its own `CHANGELOG.md` at its top
  level — update it in the same commit as any `metadata.version` bump.
  A skill bumped only to stay in lockstep (no functional change of its
  own that release) gets a short "synced to vX.Y.Z — no functional
  change" entry rather than a substantive one; use an `## [Unreleased]`
  heading for doc/test-only changes that don't themselves trigger a
  family-wide bump. This directory's own `CHANGELOG.md` is the place to
  look for what actually shipped in each shared version, across the
  whole family.
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

## Claude Code plugin manifest (`.claude-plugin/plugin.json`)

**Design choice**: this manifest lives inside `skills/scrolls/`, not at
the repo root. The repo root only holds `.claude-plugin/marketplace.json`
(the catalog), with `metadata.pluginRoot: "./skills"` set so each plugin
entry's `source` can just be `"./<group>"`. Scrolls's entry is
`"./scrolls"`, resolving to `skills/scrolls/.claude-plugin/plugin.json`.
The point of this layout: any future skill-group folder that lands next
to `skills/scrolls/` (e.g. `skills/<newgroup>/`) gets its own
`.claude-plugin/plugin.json` inside its own directory plus one new
one-line entry in the root `marketplace.json` — never a second manifest
competing for the repo root, and no other group's skills ever get pulled
into an unrelated install.

**Keep it in sync — every time**:

- **Version**: `plugin.json`'s top-level `"version"` must match the
  family's lockstep `metadata.version` (see "Versioning" above) exactly.
  Bump it in the same commit as any family-wide version bump — a
  mismatched plugin version is the same class of bug as a mismatched
  skill version.
- **New skill published**: add its `./scrolls-<name>` path to the
  `"skills"` array in the same commit that adds the skill directory.
- **Skill deprecated/deactivated**: when a skill's `SKILL.md` is renamed
  to `SKILL.md.deprecated`, `SKILL.md.deactivated`, or `SKILL.md.inactive`
  (see below), remove that skill's entry from the `"skills"` array in the
  same commit. The Claude Code plugin loader already silently drops a
  skill whose directory has no file literally named `SKILL.md` — verified
  with `claude --plugin-dir <path> plugin details <name>`, which reported
  4 skills in the component inventory instead of 5 the moment one
  `SKILL.md` was renamed away, with no warning from `claude plugin
  validate` either, `--strict` or not. So a stale entry left in the array
  costs nothing functionally, but it's still wrong: anyone reading
  `plugin.json` to see what ships would be misled into thinking a
  deactivated skill is still installed. Keep the array as the accurate
  list of what's live, not a superset of it.

**Renaming convention that discards a skill from installing**: the
loader's discovery rule is an exact match on the filename `SKILL.md`
inside a skill directory — nothing else. Any rename off that exact name
is sufficient by itself to drop the skill from both `/plugin` installs
and the `skills/` auto-discovery convention, independent of whatever
suffix is chosen. This repo's convention is `SKILL.md.deprecated` /
`SKILL.md.deactivated` / `SKILL.md.inactive` (pick whichever best states
why it's off), because it keeps the file sitting right next to its own
skill directory, keeps its content one `mv` away from being live again,
and reads clearly in a directory listing — but the mechanism that
actually makes it inert is simply "the file is no longer named
`SKILL.md`," not the specific suffix used.

## Codex plugin manifest (`.codex-plugin/plugin.json`)

**Design choice**: mirrors the Claude Code plugin above — the manifest
lives inside `skills/scrolls/`, not at the repo root, so this family
never competes for a repo-root manifest with any future
`skills/<newgroup>/` that adds its own `.codex-plugin/plugin.json` later.

Codex's plugin schema (verified against `openai/codex`'s own
`plugin-json-spec.md` and its bundled `validate_plugin.py`, both under
`codex-rs/skills/src/assets/samples/plugin-creator/`) requires a
`"skills"` field, when present, to resolve to exactly `skills` — a
directory literally named `skills/` directly under the plugin root, not
an arbitrary path. Since the five `scrolls-*` skill directories live as
siblings of `.codex-plugin/` (matching the Claude Code layout, and never
duplicated per "Where the installable artifacts live" below),
`skills/scrolls/skills/` holds one symlink per skill
(`scrolls-setup -> ../scrolls-setup`, etc.) rather than a real copy —
zero content duplication, and each symlink resolves straight to that
skill's real `SKILL.md`, scripts, and tests. Note for Windows
maintainers: a `git clone` there needs `core.symlinks=true` (and
Developer Mode/admin) for these five entries to check out as real
symlinks rather than plain text files containing the link target — every
other cross-platform concern in this family (the bundled scripts
themselves) is unaffected, since only this `skills/` indirection uses
symlinks at all.

**Known caveat — `disable-model-invocation`**: `validate_plugin.py`
rejects any skill whose frontmatter sets `disable-model-invocation` to
anything other than `false`/absent. All five `scrolls-*` skills set it
to `true` on purpose — explicit-`/scrolls-*`-command-only, matching each
skill's own `agents/openai.yaml` (`policy.allow_implicit_invocation:
false`) — so as of this writing this plugin will fail that validator,
and possibly Codex's real plugin installer if it enforces the same rule
(unconfirmed — `validate_plugin.py` is a bundled sample validator, not
something run against this repo). This is a deliberate tradeoff, not an
oversight: flipping the flag would let Codex (and Claude) trigger these
skills without an explicit command, a real behavior change to the whole
family, not something to change silently for one packaging format. Leave
it as `true` unless a maintainer deliberately decides the family should
allow implicit invocation everywhere — if that ever happens, update both
this note and `../README.md`.

**Keep it in sync — every time**, same as the Claude Code plugin's own
rules above: version lockstep with `metadata.version`, add/remove a
symlink in `skills/scrolls/skills/` in the same commit a skill is
added/deprecated (mirroring the `"skills"` array update on the Claude
side), and never let this manifest's `"version"` drift from the other
one's.

## Installing for local testing

See `src/scrolls/CLAUDE.md` for the tested `npx skills add
sugatoray/aiskills ...` commands (local/project, global/user, and
install-everywhere forms) — the same commands work against any fork or
branch by adjusting the `owner/repo` (and optional `#branch`) argument.
