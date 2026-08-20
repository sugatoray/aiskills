# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state

All five `scrolls-*` skills (`scrolls-setup`, `scrolls-update`, `scrolls-hide`, `scrolls-unhide`, `scrolls-help`) are at version `2.1.0`, on branch `claude/snyk-scrolls-help-safety-ue9pkk`, tracked by open PR #7 (not yet merged) and GitHub issues #8–#24. `src/scrolls/docs/.scrolls/` (this scroll set) was scaffolded via `/scrolls-setup`, dogfooding the family's own convention — including `docs/.scrolls/` itself, `SCROLLS.md`, and the `CLAUDE.md`/`AGENTS.md` pointer chain.

## What just happened

After the `2.1.0` idempotent-backfill work (previous snapshot), added a minimal `README.md` to each of the five `scrolls-*` skill directories in three incremental commits: the file itself with purpose/links, a `## Layout` section (a `tree`-style listing of that skill's actual files, verified against the real directory), and a `## Installing` section with five tested `npx skills add` forms (interactive selection, this-skill-only, unattended all-five, unattended this-skill-only, and from-a-local-clone — single-skill examples using that folder's own skill name, not a fixed example).

Every install command form was run for real, in isolated scratch project/global directories against the actual `skills` CLI (`v1.5.23`), then fully cleaned up — including reading the CLI's own bundled source (`node_modules/skills/dist/cli.mjs`, cached by `npx` locally) to confirm and then verify empirically that omitting `--agent` (with `--yes`) auto-detects whichever agents are already set up on the machine, the same set the interactive picker pre-checks, rather than requiring an explicit agent list.

Documentation-only throughout: no `metadata.version` bump (per the family's own rule — nothing about how a `/scrolls-*` command runs changed), recorded instead as a new dated, unversioned entry in `skills/scrolls/CHANGELOG.md` (which explicitly covers `README.md` updates). Opened issue #24 for this work and updated this scroll set (`SPEC.md`, `GAP_ANALYSIS.md`/`GAP_CONTEXT.md`, `PLAN.md`, `WISDOM.md`) accordingly.

**Still to do this session**: refresh PR #7's title/body and mapped-issues list to include #24.

## Known issues / open threads

- PR #7 hasn't merged yet; issues #8–#24 stay open until it does.
- `.ps1` script changes throughout this branch were hand-mirrored from verified `.sh` behavior — `pwsh` isn't available in this sandboxed environment, so none of the PowerShell paths have actually been executed here.
- The backfill logic itself has no automated test (steps 2/4 in both skills are followed via Read/Write/Edit at invocation time, not a script) — correctness rests on the SKILL.md prose plus the manual dry-run from the previous session, not a regression suite.
- The new README `## Installing` examples are verified against `skills` CLI `v1.5.23` specifically; a future CLI release could change flag behavior without this repo noticing — see `GAP_ANALYSIS.md`.
