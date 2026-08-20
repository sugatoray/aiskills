# Maintaining scrolls-hide

For people developing this skill — not read as part of answering a
`/scrolls-hide` request (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the only file read at invocation time.
- `../CHANGELOG.md` — this skill's version history; update it alongside
  `metadata.version` in `SKILL.md`.
- `../scripts/` — `hide.sh` (bash), `hide.ps1` (PowerShell): the rename +
  reference-rewrite logic.
- `../tests/` — Red/Green regression suite for both.
- `../agents/openai.yaml` — OpenAI-agent interface metadata.

## Running tests

After touching either script:

```
bash tests/test_hide.sh
pwsh tests/test_hide.ps1   # where pwsh is available
```

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter when something
visible to a `/scrolls-hide` invocation changes (new flag, changed default,
changed rename/rewrite behavior) — not for pure documentation or test-only
changes.
