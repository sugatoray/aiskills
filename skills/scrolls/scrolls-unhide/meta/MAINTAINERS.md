# Maintaining scrolls-unhide

For people developing this skill — not read as part of answering a
`/scrolls-unhide` request (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the only file read at invocation time.
- `../README.md` — minimal, human-facing pointer to the files below;
  not read at invocation time.
- `../CHANGELOG.md` — this skill's version history; update it alongside
  `metadata.version` in `SKILL.md`.
- `../scripts/` — `unhide.sh` (bash), `unhide.ps1` (PowerShell): the
  rename + reference-rewrite logic.
- `../tests/` — Red/Green regression suite for both.
- `../agents/openai.yaml` — OpenAI-agent interface metadata.

## Running tests

After touching either script:

```
bash tests/test_unhide.sh
pwsh tests/test_unhide.ps1   # where pwsh is available
```

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter when something
visible to a `/scrolls-unhide` invocation changes (new flag, changed
default, changed rename/rewrite behavior) — not for pure documentation or
test-only changes.

This skill's version is locked in step with the other four `scrolls-*`
skills — see `../../meta/MAINTAINERS.md`'s Versioning entry. Any bump
here means bumping all five to the same new number in the same commit,
even the ones with nothing of their own to report that release.
