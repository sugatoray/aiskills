# Maintaining scrolls-help

For people developing this skill — not read as part of answering a
`/scrolls-help` request (that's `../SKILL.md`). For the security rationale
behind how this skill is built, see `SECURITY.md`.

## Layout

- `../SKILL.md` — the only file read at invocation time.
- `../CHANGELOG.md` — this skill's version history; update it alongside
  `metadata.version` in `SKILL.md`.
- `references/HELP.md` — the canonical reference content presented to
  users, in chat or via the local page.
- `scripts/` — `open_help.sh` (bash), `open_help.ps1` (PowerShell), and
  `serve_help.py` (stdlib-only Python), backing `-e`/`--online`.
- `tests/` — Red/Green regression suite for the two launcher scripts.
- `agents/openai.yaml` — OpenAI-agent interface metadata.

## Updating `references/HELP.md`

It needs to stay accurate as `scrolls-setup`/`scrolls-update`/
`scrolls-hide`/`scrolls-unhide` evolve, since it's the thing users are told
to trust, in chat and on the rendered page alike. If you notice it's
drifted from what those four skills actually do (a flag behaves
differently than documented, a new flag exists that isn't listed), edit it
directly — it's a normal file in this repo like any other.

## Running tests

After touching either launcher or `scripts/serve_help.py`:

```
bash tests/test_open_help.sh
pwsh tests/test_open_help.ps1   # where pwsh is available
```

Covers: URL/PID reporting, the server actually answering a real request,
`--stop`, and the idle-timeout auto-shutdown.

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter when something visible
to a `/scrolls-help` invocation changes (new flag, changed default,
changed behavior) — not for pure documentation or test-only changes.
