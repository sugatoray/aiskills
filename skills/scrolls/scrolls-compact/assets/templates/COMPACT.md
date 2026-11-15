# COMPACT.md — Compaction History

The scrolls in this folder are compacted from time to time. Older detail in `SPEC.md`, `PLAN.md`, `HANDOFF.md`, `GAP_ANALYSIS.md` and `GAP_CONTEXT.md` is condensed, and the full text is kept in git at a **checkpoint** commit. Read this file only when a condensed summary isn't enough. Don't edit it or `compacted/` by hand: `/scrolls-compact` maintains both, and `/scrolls-update` leaves them alone.

## Reaching pre-compaction history

Take `<checkpoint>` from the table below, or the full SHA from its report. Paths are as they were at that checkpoint; each report names the folder.

- The whole file as it was: `git show <checkpoint>:{{SCROLLS_PATH}}/SPEC.md`
- The exact content, even after the folder moved: `git cat-file -p <blob id from the report>`
- The compaction commit: `git log -1 --diff-filter=A --format=%H -- {{SCROLLS_PATH}}/compacted/<report>`
- What was condensed: `git diff <checkpoint> <compaction commit> -- {{SCROLLS_PATH}}/`
- Every compaction, newest first: `git log --grep='^Scrolls-Action: compact'`

## Compaction History

| # | Date | Checkpoint | Base (cutoff) | Rule | Files | Lines | Report |
|---|------|------------|---------------|------|-------|-------|--------|
