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
- [`scrolls-remove/CHANGELOG.md`](scrolls-remove/CHANGELOG.md)
- [`scrolls-restore/CHANGELOG.md`](scrolls-restore/CHANGELOG.md)
- [`scrolls-explainer/CHANGELOG.md`](scrolls-explainer/CHANGELOG.md)

## Current versions

All eight skills are versioned in lockstep (see `meta/MAINTAINERS.md`'s
Versioning entry) — one shared number across the family, currently:

| Skill | Version |
| --- | --- |
| `scrolls-setup` | 2.5.0 |
| `scrolls-update` | 2.5.0 |
| `scrolls-hide` | 2.5.0 |
| `scrolls-unhide` | 2.5.0 |
| `scrolls-help` | 2.5.0 |
| `scrolls-remove` | 2.5.0 |
| `scrolls-restore` | 2.5.0 |
| `scrolls-explainer` | 2.5.0 |

## 2026-11-12 (2.5.0)

- **New skill: `/scrolls-explainer`.** It shows `scrolls-explainer.html`, an interactive, offline page that explains the family.
  - One tab per command (setup, update, hide, unhide, remove, restore, help), plus **Overview** and **New session** (how a fresh agent session follows `AGENTS.md`/`CLAUDE.md` → `SCROLLS.md` → `STARTER.md`).
  - Each command tab animates its steps on the diagram, with a callout next to the file being touched.
  - Full keyboard navigation: arrows step, `[` `]` or `0`–`8` switch tabs, `Space` pauses, `R` replays, `?` lists every key.
  - The page ships prebuilt in `assets/`; `scripts/explain.py` (with thin `.sh`/`.ps1` launchers) opens it in place by default (= `--show`), or copies it with `-o` (`-f`, `--open`).
  - `--build` regenerates the page from the `scrolls-*` skills as they are now: one tab per skill (a skill switched off with `SKILL.md.deprecated` loses its tab), the lockstep version stamped on it, and a stop (exit 4) naming any skill whose `SKILL.md` changed since its tab was last reviewed (`--build --reviewed` confirms). It renders with the `network-flow` skill.
  - Built Red/Green: `tests/test_explain.sh` (109 assertions: copying, `--show`, every `--build` outcome on throwaway copies of the skills, page content, freshness, Playwright browser checks) and `tests/test_explain.ps1`.
  - **Maintainers:** after changing any scrolls skill's `SKILL.md`, run `scrolls-explainer/scripts/explain.sh --build`; its test suite fails until the page is reviewed and rebuilt.
- **All eight skills bumped to `2.5.0`** together, in lockstep, along with `.claude-plugin/plugin.json` (which now lists `./scrolls-explainer`). MINOR, for the new skill; no other skill changes behavior.
- `/scrolls-help`: `references/HELP.md` and its `description` now cover `/scrolls-explainer`.
- Every install command that lists all the skills, `marketplace.json`, the repository `README.md` and `src/scrolls/CLAUDE.md` now include `scrolls-explainer`.

## 2026-11-06 (2.4.0)

- **All seven skills bumped to `2.4.0`** together, in lockstep, along with `.claude-plugin/plugin.json`.
- **`assets/EXAMPLES.md` added to every `scrolls-*` skill.**
  - Each file holds worked examples, one `## Example: NN — Title` block each, with Premise / Usage / Caveats / Expected Output.
  - Written in ASD-STE100 Simplified Technical English (about 80%), with that rule stated at the top of each file.
  - Expected output for the bundled scripts (hide, unhide, remove, restore, help `-e`/`--stop`) was captured from real runs.
  - Each `SKILL.md` links the file as an on-demand read (progressive disclosure), and each `README.md` links it and lists it in `## Layout`.
- **`/scrolls-restore`:** the message for an already-restored checkpoint no longer says "Nothing to restore" twice.
- **`/scrolls-remove`:** `SKILL.md` states again exactly how `/scrolls-restore` reads the trailers (`git log --format='%(trailers:unfold,only)'`, with `--grep='^Scrolls-Action:'`).

## 2026-11-05 (2.3.0)

- **New skill: `/scrolls-restore`**, the counterpart to `/scrolls-remove`.
  - It restores only the agentic memory: the scrolls folders, plus the
    pointer stubs re-inserted into `SCROLLS.md`/`CLAUDE.md`/`AGENTS.md`
    as those files are now. Nothing else in the repository is rolled back.
  - By default it uses the newest removal checkpoint in HEAD's history
    and skips it if that checkpoint was already restored. With no
    checkpoint, it falls back to the commit before a plain deletion.
  - It also takes any `<COMMIT>`. `--onto REF` (with `-b NEW_BRANCH` for
    non-branch refs) commits onto another branch through a temporary
    worktree, leaving the current checkout untouched.
  - Flags: `-p`/`-t`/`-l`/`-r`, `--full`, `-f`, `--list [--all]`, `-n`,
    `-y`, `--no-commit`.
  - The restore is recorded as one `maint(memory): scrolls-restored`
    commit with `Scrolls-*` trailers.
- All six existing skills, `.claude-plugin/plugin.json`, and the root
  `marketplace.json` were bumped to `2.3.0`. `/scrolls-remove`'s docs now
  point at `/scrolls-restore`. HELP.md, the READMEs, and the install
  commands cover the seventh command.

## 2026-11-05 (2.2.0)

- **New skill: `/scrolls-remove`**, which undoes `/scrolls-setup`.
  - It deletes the scrolls folder and `SCROLLS.md`. It strips the scrolls
    pointers out of `CLAUDE.md` and `AGENTS.md`, deleting either file only
    if nothing else is left in it.
  - It commits everything as one `maint(memory): scrolls-removed` commit.
    The commit records the previous commit's SHA, plus `Scrolls-*` git
    trailers that a future `/scrolls-restore` can parse.
  - It takes the shared `-p`/`-t`/`-l`/`-r` flags, with `-r` sweeping
    every match into the one commit, as on hide/unhide. It also adds
    `-x`/`--purge`, `-n`/`--dry-run`, `-y`/`--yes`, and `--no-commit`.
  - All five existing skills, `.claude-plugin/plugin.json`, and the root
    `marketplace.json` are bumped to `2.2.0` to stay in lockstep.
    `/scrolls-help`'s `references/HELP.md`, this directory's `README.md`,
    and the install commands in every per-skill README now cover the
    sixth command.

## 2026-09-21 (2.1.1)

- **Frontmatter `metadata` flattened from a list back to a flat
  mapping**, across all five skills — GitLab Duo requires `metadata` to
  be a map, and the list form it had briefly taken on broke
  compatibility with it. `source_url` kept pointing at each skill's
  GitHub source. No functional change to any skill's behavior — see
  each skill's own `CHANGELOG.md` for its "synced to 2.1.1" entry.
  `.claude-plugin/plugin.json` (this family's shared manifest) bumped
  to match.

## 2026-08-20 (docs, no version bump)

- **Per-skill `README.md` added to all five `scrolls-*` skills.** Each
  skill directory previously had only `SKILL.md` (the runtime manifest)
  and the family-level `README.md` here — browsing into a skill folder
  directly on GitHub showed a bare file list. Each now has a minimal
  `README.md`: purpose, how to run it, a `## Layout` section with a
  verified `tree`-style listing of that skill's actual files, a
  `## Installing` section with five tested `npx skills add` forms
  (interactive, this-skill-only, unattended all-five, unattended
  this-skill-only, and from-a-local-clone — single-skill examples using
  that folder's own skill name), and links to `SKILL.md`/
  `meta/MAINTAINERS.md`/`CHANGELOG.md`/this file. Every install command
  was run in isolated scratch project/global directories against the
  real `skills` CLI (v1.5.23) before being written down, then fully
  cleaned up — including confirming that omitting `--agent` (with
  `--yes`) auto-detects whichever agents are already set up on the
  machine, the same set the interactive picker pre-checks. `README.md`
  is not read at invocation time; `SKILL.md` remains the only file read
  while a `/scrolls-*` command actually runs. Tracked as #24.

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
