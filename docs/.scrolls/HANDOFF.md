# HANDOFF.md — Change of Guard

Snapshot of where the project stands *right now*. This file is short-lived: **overwrite** it at the end of every session rather than appending — it's a state snapshot, not a changelog.

## Current state
- **`master` is at `75700d3`:**
  - #241 merged: the docs workflow on `actions/checkout@v5` and `actions/setup-node@v5`, building on Node 22.
  - Its first run, [run 17](https://github.com/sugatoray/aiskills/actions/runs/43618384405), succeeded with no Node 20 warning and built the same six pages: `/` = 1.2.0, `/v/1.1.0/`–`/v/0.8.0/`, `/dev/` = 1.3.0-dev.
  - Issues #242–#244 closed.
- **npm:** `@sugatoray-ai/aiskills` 1.2.0 is still the latest; `package.json` on `master` is `1.3.0-dev`.
- **`claude/cli-colors`** (from `75700d3`; pushed; **no PR yet**):
  1. **`6c4697a` Colored CLI output.**
     - On a terminal: the `[aiskills]` prefix dim, errors red, warnings yellow, upgrade success green, commands cyan; bold and dim in `--help`, `info`, `rel`, `groups` and `installed`.
     - Piped output is plain, and `--json` is never colored.
     - `--color` / `--no-color` work with every command; `NO_COLOR` and `FORCE_COLOR` are honoured.
     - New shipped module `src/scripts/core/colors.mjs`, no dependencies. CHANGELOG `[1.3.0]` Added.
  2. **`714984b` The CLI outputs page.**
     - `docs/docsite/reference/cli-outputs.html`, shown under Reference → "CLI outputs": every command's colored output, 19 commands in 6 groups.
     - Built by `npm run cli-outputs` from `docs/cli-outputs/commands.json`, in the docs examples' sandbox with sample data. `cli-outputs:check` checks it, and `npm run docs` includes it.
  471 package tests pass on the branch.

## What just happened
- Ticked ROOT-8 after checking run 17's log: no Node 20 warning.
- Created `claude/cli-colors`. The user chose the scope "messages plus key output", and the `--color`/`--no-color` switches.
- Built colored output Red/Green: `colors.test.mjs`, 13 tests. Two terminal-run tests compare plain text, so they now set `NO_COLOR`, and the test sandbox no longer inherits `NO_COLOR`/`FORCE_COLOR`.
- Published a private artifact with every command's live output: [aiskills Command Outputs](https://claude.ai/artifact/FEsS7FdbmoDJe4rcG71SUY). The user liked it, and asked for a reproducible version in the docs; that became `714984b`.

## Known issues / open threads
- **No PR for `claude/cli-colors` yet** (ROOT-9). When opened: file its issues and update the package scrolls (SPEC once merged).
- **The CLI outputs page uses sample data.** The stand-in `npx skills` prints nothing of its own, so `list`, `install` and `skills` show only aiskills's lines. The live artifact shows the real `npx skills` output.
- #230's scrolls commit has no issue. Filing one under #231 was offered; the user hasn't answered.
- `claude/keen-babbage-2khhu9` (this session's designated branch) still holds merged #215-era history. Reusing it needs a reset from `master` and a force push, which the user must approve.
