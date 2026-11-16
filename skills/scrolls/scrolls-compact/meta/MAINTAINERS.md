# Maintaining scrolls-compact

For people developing this skill. It isn't read when answering a
`/scrolls-compact` request; that's `../SKILL.md`.

## Layout

- `../SKILL.md`: the only file read at invocation time.
- `../README.md`: a short, human-facing pointer. Not read at invocation time.
- `../CHANGELOG.md`: this skill's version history. Update it alongside
  `metadata.version` in `SKILL.md`.
- `../assets/EXAMPLES.md` (the index) and `../assets/examples/example_NNN.md`
  (one example each): every flag, refusal and exit code as an example
  with a **Premise**, **Caveats**, the prompt and its real output, in the
  marker format of the image-styles skills' `EXAMPLES.md`
  (`example:start fixture=…`, `setup-block`, `prompt-block`,
  `prompt-output`). Follow the writing rule at its top (ASD-STE100, about
  80%) for the prose. The index stays small (at most 150 lines, no example
  bodies) so an agent reads it, then only the example it needs; each file
  stays under the Read tool's 2,000-line default. To add an example, add
  `examples/example_NNN.md` (title, link back to `../EXAMPLES.md`,
  `Starts from:` line) and its table row; the test fails until the table
  and the files match one to one. `tests/test_examples.sh` replays each example
  in a demo repository with a pinned clock and fails on any difference.
  When you add or change an example, leave its output as a placeholder,
  watch the test fail, run `python3 tests/check_examples.py --print`,
  **read** the actual output, and paste it only if it shows what the
  example claims. A behavior change in `compact.py` shows up here as
  failures to review, never as outputs to regenerate blindly.
- `../assets/example-viewer.html`: the index and every example on one page,
  one tab each, rendered or as Markdown; links between the files open the
  matching tab. Built by `../scripts/build_example_viewer.py` (maintenance
  only; the skill never runs it). Never edit the page by hand: after any
  change to `EXAMPLES.md` or an example, run
  `python3 scripts/build_example_viewer.py`. `tests/test_example_viewer.sh`
  fails if the page is stale, then checks it in a browser (online, and
  offline with the plain-text fallback) when Node.js and Playwright exist.
  Each example's **Premise** and **Caveats** are grouped in one tinted
  box labelled "Note" when the page renders; the Markdown files are not
  changed. Its theme is Lights Out, the banner's and the docsite's: the builder holds
  a copy of its values from `src/packages/aiskills/src/scripts/docs/themes.mjs`,
  with the docsite's CSS variable names. In this repository the test fails
  if the copy and `themes.mjs` differ, so change them together.
- `../assets/templates/COMPACT.md`: the `COMPACT.md` written on the first
  compaction (`{{SCROLLS_PATH}}` is substituted). `compact.py` embeds a
  copy as `COMPACT_TEMPLATE_FALLBACK`; scenario 12 of `test_compact.sh`
  fails if the two drift, so change both together.
- `../scripts/compact.py`: **all** of the logic, stdlib-only Python 3.9+.
- `../scripts/compact.sh` and `../scripts/compact.ps1`: thin launchers.
  They find Python and pass `"$@"` / `@args` through unchanged. A flag or
  behavior change goes in `compact.py`, never in only one launcher.
- `../tests/`: `test_compact.sh` is the full Red/Green behavior suite.
  `test_examples.sh` (with `check_examples.py`) checks `assets/EXAMPLES.md` and `assets/examples/`.
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
bash tests/test_examples.sh   # assets/EXAMPLES.md + examples/, replayed
bash tests/test_example_viewer.sh   # assets/example-viewer.html, fresh and working
pwsh tests/test_compact.ps1   # where pwsh is available
```

## Frontmatter validation

```bash
awk '/^---$/{c++; if(c==2){exit}} c==1' ../SKILL.md | \
  yamllint --strict -d "{extends: default, rules: {line-length: disable, document-start: disable}}" -
```
