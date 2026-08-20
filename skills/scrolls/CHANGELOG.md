# Scrolls family changelog

Family-wide changes that aren't tied to any single skill's own version
— new shared conventions, cross-cutting reorganizations, `README.md`
updates. For a specific skill's own version history, see its own
`CHANGELOG.md`:

- [`scrolls-setup/CHANGELOG.md`](scrolls-setup/CHANGELOG.md)
- [`scrolls-update/CHANGELOG.md`](scrolls-update/CHANGELOG.md)
- [`scrolls-hide/CHANGELOG.md`](scrolls-hide/CHANGELOG.md)
- [`scrolls-unhide/CHANGELOG.md`](scrolls-unhide/CHANGELOG.md)
- [`scrolls-help/CHANGELOG.md`](scrolls-help/CHANGELOG.md)

## Current versions

All five skills are versioned in lockstep (see `meta/MAINTAINERS.md`'s
Versioning entry) — one shared number across the family, currently:

| Skill | Version |
| --- | --- |
| `scrolls-setup` | 2.1.0 |
| `scrolls-update` | 2.1.0 |
| `scrolls-hide` | 2.1.0 |
| `scrolls-unhide` | 2.1.0 |
| `scrolls-help` | 2.1.0 |

## 2026-08-20 (2.1.0)

- **Idempotent `SCROLLS.md`/`CLAUDE.md`/`AGENTS.md` backfill.**
  `scrolls-update` now backfills all three pointer files (step 2) for a
  project set up by a pre-`2.0.0` `scrolls-setup` — not just the
  one-time `/scrolls-setup`, which already did this in step 4. Since
  `/scrolls-update` is the command people actually run every session,
  this is the point where such a project catches up automatically,
  without anyone having to remember to re-run `/scrolls-setup` by hand.
  Minor, additive, backward-compatible: existing `CLAUDE.md` content is
  never removed or rewritten, only the pointer stub is inserted if
  missing — see `scrolls-update/CHANGELOG.md`.
- **`CLAUDE.md` leave-alone condition tightened, both skills.**
  Previously, a `CLAUDE.md` that already pointed straight at
  `SCROLLS_PATH/STARTER.md` (the pre-`1.2.0` direct-embed convention,
  from before `SCROLLS.md` existed) was left alone entirely — meaning
  such a project's `CLAUDE.md` would never gain a `SCROLLS.md` pointer,
  even on a fresh `/scrolls-setup` re-run. Now the stub is inserted
  whenever `CLAUDE.md` doesn't already reference `SCROLLS.md`
  specifically, regardless of any older direct reference already
  there — additive only, so both the old reference and the new stub
  can coexist. See `scrolls-setup/CHANGELOG.md` and
  `scrolls-update/CHANGELOG.md`.

## 2026-08-20 (2.0.0)

- **Major version bump, all five skills: `1.3.0` → `2.0.0`.** The
  `SCROLLS.md`/`CLAUDE.md`/`AGENTS.md` restructuring below is a
  breaking change for any project already set up by a pre-`2.0.0`
  `scrolls-setup`: `scrolls-hide`/`scrolls-unhide` `2.0.0` rewrite
  `SCROLLS.md` on rename, not `CLAUDE.md` — a project without a
  `SCROLLS.md` (i.e. set up before this release) won't have its
  `CLAUDE.md` reference rewritten anymore. Re-running `/scrolls-setup`
  against such a project is safe (it never overwrites existing
  content) and adds the missing `SCROLLS.md`, restoring rewrite
  coverage. `scrolls-update` and `scrolls-help` have no functional
  change of their own in this release; see each skill's own
  `CHANGELOG.md` for the version-by-version detail behind this bump.

## 2026-08-20 (1.3.0 and earlier same-day changes)

- **Memory-pointer chain restructured.** `scrolls-setup` now writes
  `SCROLLS.md` (the actual "read `STARTER.md` first" content) with
  `CLAUDE.md` and `AGENTS.md` as short, fixed pointers to it
  (`AGENTS.md` → `CLAUDE.md` → `SCROLLS.md` → `STARTER.md`), instead of
  embedding that content directly in `CLAUDE.md`. `scrolls-hide` and
  `scrolls-unhide` updated to match — they now rewrite `SCROLLS.md` on
  rename, since `CLAUDE.md` no longer holds a scrolls-path reference.
  See `scrolls-setup`/`scrolls-hide`/`scrolls-unhide`'s own changelogs.
- **`AGENTS.md` support added.** `scrolls-setup` now also drops an
  `AGENTS.md` pointer, for agent harnesses that follow the
  [agents.md](https://agents.md) convention instead of reading
  `CLAUDE.md` directly.
- **`meta/` rolled out family-wide.** Every skill now has its own
  `meta/MAINTAINERS.md`; `scrolls-help` additionally has
  `meta/SECURITY.md` for its local `-e`/`--online` server. Added this
  directory's own `meta/MAINTAINERS.md`, covering conventions shared
  across all five (license/authorship, cross-platform script
  convention, shared location flags, Red/Green TDD, the per-skill
  versioning rule, and where installable artifacts live).
- **`scrolls-help` hardened.** Its local server gained a bounded
  lifetime (idle timeout, max lifetime, `--stop`) and a `MAINTAINERS.md`
  / `SECURITY.md` split that resolved a Snyk prompt-injection false
  positive — see `scrolls-help/CHANGELOG.md` for the version-by-version
  detail.
- **`README.md` Layout section** restructured as bullets (was two dense
  paragraphs) and corrected: `scrolls-setup` has no bundled script or
  `tests/`, and every command now documents `meta/MAINTAINERS.md`.
- Added `src/scrolls/CLAUDE.md`, elsewhere in this repository, pointing
  at this directory as where the installable skill artifacts actually
  live, plus tested `npx skills add sugatoray/aiskills` install
  instructions (local, global, and install-everywhere forms).
- Added this file and a `CHANGELOG.md` per skill; `meta/MAINTAINERS.md`
  (both this directory's and each skill's own) now says to update the
  relevant one alongside any `metadata.version` bump.
- **Versions locked in lockstep.** All five `scrolls-*` skills now share
  a single version number instead of bumping independently — before
  this, versions had drifted apart (`scrolls-setup` 1.2.0,
  `scrolls-update` 1.0.0, `scrolls-hide`/`scrolls-unhide` 1.1.0,
  `scrolls-help` 1.3.0). Brought every skill up to `1.3.0`, the highest
  version any of them had reached; `scrolls-setup`, `scrolls-hide`,
  `scrolls-unhide`, and `scrolls-update` had no functional change of
  their own in this bump — see each skill's own `CHANGELOG.md` for its
  "synced to 1.3.0" entry. `meta/MAINTAINERS.md` (this directory's and
  each skill's own) now states the lockstep rule going forward.

## 2026-08-18

- Initial `v1.0.0` release of all five `scrolls-*` skills:
  `scrolls-setup`, `scrolls-update`, `scrolls-hide`, `scrolls-unhide`,
  `scrolls-help`.
