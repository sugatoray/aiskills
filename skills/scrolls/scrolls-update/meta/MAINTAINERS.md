# Maintaining scrolls-update

For people developing this skill — not read as part of answering a
`/scrolls-update` request (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the only file read at invocation time.
- `../scripts/` — `session_diff.sh` (bash), `session_diff.ps1`
  (PowerShell): cross-checks conversation memory against git for step 3.
- `../tests/` — Red/Green regression suite for both.
- `../agents/openai.yaml` — OpenAI-agent interface metadata.

## Running tests

After touching either script:

```
bash tests/test_session_diff.sh
pwsh tests/test_session_diff.ps1   # where pwsh is available
```

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter when something
visible to a `/scrolls-update` invocation changes (new flag, changed
default, changed update rule) — not for pure documentation or test-only
changes.
