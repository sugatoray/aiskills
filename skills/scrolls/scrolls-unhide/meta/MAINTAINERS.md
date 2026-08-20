# Maintaining scrolls-unhide

For people developing this skill — not read as part of answering a
`/scrolls-unhide` request (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the only file read at invocation time.
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
