# Maintaining scrolls-compact

For people developing this skill. It isn't read when answering a
`/scrolls-compact` request; that's `../SKILL.md`.

## Layout

- `../SKILL.md`: the only file read at invocation time.
- `../README.md`: a short, human-facing pointer. Not read at invocation time.
- `../CHANGELOG.md`: this skill's version history. Update it alongside
  `metadata.version` in `SKILL.md`.
- `../assets/EXAMPLES.md`: worked examples. Follow the writing rule at
  its top (ASD-STE100, about 80%), and keep expected output true to what
  the script really prints.
- `../assets/templates/COMPACT.md`: the `COMPACT.md` written on the first
  compaction (`{{SCROLLS_PATH}}` is substituted). `compact.py` embeds a
  copy as `COMPACT_TEMPLATE_FALLBACK`; scenario 12 of `test_compact.sh`
  fails if the two drift, so change both together.
- `../scripts/compact.py`: **all** of the logic, stdlib-only Python 3.9+.
- `../scripts/compact.sh` and `../scripts/compact.ps1`: thin launchers.
  They find Python and pass `"$@"` / `@args` through unchanged. A flag or
  behavior change goes in `compact.py`, never in only one launcher.
- `../tests/`: `test_compact.sh` is the full Red/Green behavior suite.
  `test_compact.ps1` is a parity harness for the PowerShell launcher.
- `../agents/openai.yaml`: OpenAI-agent interface metadata.
- `DESIGN.md`: the design and the decisions behind it.

## Design decisions worth keeping

- **Contracts.** Treat any change to these as breaking: the commit
  subject `maint(memory): scrolls-compacted`, the `- checkpoint: #<sha>`
  line, the `Scrolls-*` trailers, the report file name
  `scrolls_compact_<yyyymmdd>_<githash>.md`, the marker comment
  `<!-- scrolls-compact: checkpoint=… -->`, the `COMPACT.md` table
  columns, and the report's `Checkpoint:`, `Folder at checkpoint:` and
  `Blob at checkpoint:` lines. `--list`/`--show`/`--extract` parse them.
- **Files in the tree are the index; trailers are secondary.** A squash
  merge can flatten the message, so traversal reads `COMPACT.md` and the
  reports, and finds the compaction commit by the commit that added the
  report (`git log --diff-filter=A`).
- **Blame decides age; the agent decides wording.** The script never
  summarizes. It only proves the agent's edits stayed inside the `old`
  units (line presence for `live`/`new` units and frame text, one marker
  per changed file, GAP_CONTEXT entry count).
- **Refuse rather than lose data.** A dirty, untracked or ignored file in
  the scrolls folder blocks the plan, because the checkpoint wouldn't
  hold it. HEAD moving between plan and finalize blocks the finalize.
- **`SCROLLS_COMPACT_NOW`** pins "now" for tests and also dates the
  compaction commit, so date-rule tests are deterministic.

## Running tests

After touching anything under `scripts/` or `assets/templates/`:

```
bash tests/test_compact.sh
pwsh tests/test_compact.ps1   # where pwsh is available
```

## Frontmatter validation

```bash
awk '/^---$/{c++; if(c==2){exit}} c==1' ../SKILL.md | \
  yamllint --strict -d "{extends: default, rules: {line-length: disable, document-start: disable}}" -
```
