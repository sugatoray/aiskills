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
| `scrolls-setup` | 1.3.0 |
| `scrolls-update` | 1.3.0 |
| `scrolls-hide` | 1.3.0 |
| `scrolls-unhide` | 1.3.0 |
| `scrolls-help` | 1.3.0 |

## 2026-08-20

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
