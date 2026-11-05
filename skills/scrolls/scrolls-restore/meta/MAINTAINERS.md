# Maintaining scrolls-restore

These notes are for people developing this skill. They aren't read when answering a
`/scrolls-restore` request; that's `../SKILL.md`.

## Layout

- `../SKILL.md`: the only file read at invocation time.
- `../README.md`: a short pointer for humans. Not read at invocation time.
- `../CHANGELOG.md`: this skill's version history.
- `../scripts/restore.py`: **all** of the logic. Stdlib only, Python 3.9+.
- `../scripts/restore.sh`, `../scripts/restore.ps1`: thin launchers that
  pass the arguments through unchanged. Any flag or behavior change goes in
  `restore.py`, never in only one launcher.
- `../tests/test_restore.sh`: the full Red/Green behavior suite. It uses
  the real `../../scrolls-remove/scripts/remove.sh` to create
  checkpoints, so the commit-message contract between the two skills is
  tested end to end.
- `../tests/test_restore.ps1`: a parity harness for the PowerShell launcher.
- `../agents/openai.yaml`: OpenAI-agent interface metadata.

## Design decisions worth keeping

- **Contract with `/scrolls-remove`.** Restore reads remove's trailers:
  `Scrolls-Action`, `Scrolls-Previous-Commit`, `Scrolls-Folder`,
  `Scrolls-Deleted`, `Scrolls-Stripped` and `Scrolls-Purged`. A change
  to remove's message format must be mirrored here, with a test.
- **Memory only.** Folders come back with `git checkout <source> -- <folder>`.
  Pointer files are never overwritten if they exist. The stub is inserted
  setup-style instead.
- **Restored once.** A restore commit's `Scrolls-Removal-Commit` marks that
  checkpoint as done. The default search stops at the newest removal and
  reports "already restored" rather than reaching for an older one.
- **`--onto` uses a temporary worktree.** The user's checkout is never
  touched. The worktree is removed in a `finally` block, unless the commit
  failed or `--no-commit` was given. Then it's kept so the staged work
  isn't lost.
- **`--all` only applies to `--list`.** It finds checkpoints across all
  branches but never restores from them implicitly.
- **Templates** come from `../../scrolls-setup/assets/templates/` when
  that skill is installed alongside, with copies embedded in `restore.py`
  as a fallback. Scenario 16 of the suite fails if the two drift apart.

## Running tests

```
bash tests/test_restore.sh
pwsh tests/test_restore.ps1   # where pwsh is available
```

## Frontmatter validation

```bash
awk '/^---$/{c++; if(c==2){exit}} c==1' ../SKILL.md | \
  yamllint --strict -d "{extends: default, rules: {line-length: disable, document-start: disable}}" -
```

## Versioning

This skill's version moves in lockstep with the other `scrolls-*` skills.
See the Versioning entry in `../../meta/MAINTAINERS.md`.
