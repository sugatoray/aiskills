# Maintaining scrolls-remove

For people developing this skill. It isn't read when answering a
`/scrolls-remove` request; that's `../SKILL.md`.

## Layout

- `../assets/EXAMPLES.md`: worked examples, linked from `SKILL.md` and `README.md`. Follow the writing rule at its top (ASD-STE100, about 80%) when you change it, and keep each example's expected output true to what the skill really prints.
- `../SKILL.md`: the only file read at invocation time.
- `../README.md`: a short, human-facing pointer to the files below. Not
  read at invocation time.
- `../CHANGELOG.md`: this skill's version history. Update it alongside
  `metadata.version` in `SKILL.md`.
- `../scripts/remove.py`: **all** of the logic, stdlib-only Python 3.9+.
- `../scripts/remove.sh` and `../scripts/remove.ps1`: thin launchers.
  They find Python and pass `"$@"` / `@args` through unchanged. Keep them
  that way: a flag or behavior change goes in `remove.py`, never in only
  one launcher. This is how the family's identical-flags-on-both-shells
  rule is enforced here.
- `../tests/`: `test_remove.sh` is the full Red/Green behavior suite.
  `test_remove.ps1` is a parity harness for the PowerShell launcher.
- `../agents/openai.yaml`: OpenAI-agent interface metadata.

## Design decisions worth keeping

- **One commit, recorded restore point.** The commit message format is a
  contract. `/scrolls-restore` parses it (and tests it end to end), so treat any change
  to it as breaking:
  - the subject, `maint(memory): scrolls-removed`
  - the `- previous commit: #<sha>` line
  - the `Scrolls-*` trailers
- **Refuse rather than lose data.** The script refuses if anything under
  the targets is uncommitted, untracked, or ignored, because the restore
  point wouldn't contain it. It also refuses if anything unrelated is
  staged, because that would end up in the removal commit.
- **Pointer templates.** `SCROLLS.md`, `CLAUDE.md`, and `AGENTS.md` blocks
  are read from `../../scrolls-setup/assets/templates/` when that skill is
  installed next to this one. Otherwise the copies embedded in
  `remove.py` are used. Scenario 18 of `test_remove.sh` fails if the two
  drift, so update both together.
- **Never edit what wasn't recognized.** A file that mentions scrolls in
  wording setup didn't write is flagged `review` and left alone, the same
  way `/scrolls-hide` handles leftover references.

## Running tests

After touching anything under `scripts/`:

```
bash tests/test_remove.sh
pwsh tests/test_remove.ps1   # where pwsh is available
```

## Frontmatter validation

```bash
awk '/^---$/{c++; if(c==2){exit}} c==1' ../SKILL.md | \
  yamllint --strict -d "{extends: default, rules: {line-length: disable, document-start: disable}}" -
```

## Versioning

This skill's version moves in lockstep with the other `scrolls-*` skills.
See `../../meta/MAINTAINERS.md`'s Versioning entry.
