# Maintaining scrolls-unhide

For people developing this skill — not read as part of answering a
`/scrolls-unhide` request (that's `../SKILL.md`).

## Layout

- `../assets/EXAMPLES.md`: worked examples, linked from `SKILL.md` and `README.md`. Follow the writing rule at its top (ASD-STE100, about 80%) when you change it, and keep each example's expected output true to what the skill really prints.
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

## Frontmatter validation

Run `yamllint --strict` against `../SKILL.md`'s frontmatter every time this
skill is updated — it catches unquoted URLs, trailing whitespace, and other
formatting slips before they land. Extract the block between the two `---`
markers and lint it (`line-length`/`document-start` disabled since prose
descriptions and bare `SKILL.md` frontmatter both fail those on purpose):

```bash
awk '/^---$/{c++; if(c==2){exit}} c==1' ../SKILL.md | \
  yamllint --strict -d "{extends: default, rules: {line-length: disable, document-start: disable}}" -
```

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter when something
visible to a `/scrolls-unhide` invocation changes (new flag, changed
default, changed rename/rewrite behavior) — not for pure documentation or
test-only changes.

This skill's version is locked in step with the other six `scrolls-*`
skills — see `../../meta/MAINTAINERS.md`'s Versioning entry. Any bump
here means bumping all seven to the same new number in the same commit,
even the ones with nothing of their own to report that release.
