# Maintaining scrolls-explainer

For people developing this skill. It isn't read when answering a
`/scrolls-explainer` request; that's `../SKILL.md`.

## Layout

- `../assets/EXAMPLES.md`: worked examples, linked from `SKILL.md` and `README.md`. Follow the writing rule at its top (ASD-STE100, about 80%) when you change it, and keep each example's expected output true to what the skill really prints.
- `../SKILL.md`: the only file read at invocation time.
- `../README.md`: a short, human-facing pointer to the files below. Not
  read at invocation time.
- `../CHANGELOG.md`: this skill's version history. Update it alongside
  `metadata.version` in `SKILL.md`.
- `../assets/scrolls-explainer.html`: the page users get. **Generated**
  by `--build`; never edit it by hand.
- `../assets/explainer-graph.json`: the page's words and shape. Nodes (the
  commands and files), edges (what touches what), one scenario per tab
  with ordered `steps` (`edge`, `title`, `text`, optional `at` = the node
  the callout points at; default is the edge's target), the layouts, and
  `sources`: the SKILL.md fingerprints the text was last reviewed against.
  `eyebrow` holds `{version}`, filled in at build time. Conventions the
  build relies on: a command's node id and scenario id are its name
  without `scrolls-`, and its scenario's `label` is `/scrolls-<name>`.
- `../scripts/explain.py`: the CLI (stdlib-only Python 3.9+): show the
  page in place (the default, `--show`), copy it (`-o`, `-f`, `--open`),
  and `--build`, which calls
  `build_page.build()`.
- `../scripts/build_page.py`: `--build`. Finds the `scrolls-*` skills,
  works out the tabs, version and review state (see its docstring), drops
  the tabs of deactivated skills, renders with the network-flow skill's
  `scripts/render.py`, and runs `page_enhance.enhance()`. Also runnable
  directly, with `--check` (exit 1 if the page is stale).
- `../scripts/page_enhance.py`: what the explainer adds on top of the
  renderer's output: the callout overlay and its ‹ › buttons, keyboard
  shortcuts and the `?` panel, the 5.2 s step pace, and the
  `scrolls-explainer-version` meta tag. Each change is an exact,
  single-occurrence text swap, so a renderer change that moves an anchor
  fails the build loudly.
- `../scripts/explain.sh` and `../scripts/explain.ps1`: thin launchers.
  They find Python and pass `"$@"` / `@args` through unchanged. A flag or
  behavior change goes in the Python files, never in only one launcher.
- `../tests/`: `test_explain.sh` is the full Red/Green suite (copying,
  `--show`, every `--build` outcome on throwaway copies of the skills in
  the repository layout and a flat-install layout, the page's content and
  version stamp, freshness, no git-ignored files, and, when Node.js with
  Playwright is available, `browser/check_page.cjs`). `test_explain.ps1`
  is a parity harness for the PowerShell launcher.
- `../agents/openai.yaml`: OpenAI-agent interface metadata.

## Design decisions worth keeping

- **Ship the page prebuilt.** Showing and copying need only Python; only
  `--build` needs the network-flow skill. Test scenario 11 fails when the
  committed page differs from a fresh build.
- **Derive what can be derived; review what can't.** Tabs, the version and
  deactivation come from the skills. The words are hand-written, so a
  changed `SKILL.md` stops the build instead of silently shipping a page
  that describes the old behavior. The fingerprint leaves out the version
  line, so a lockstep bump alone never asks for a review.
- **Missing ≠ deactivated.** A skill folder that is missing stops the
  build (a partial install would otherwise shrink the page); only the
  family's `SKILL.md.deprecated`/`.deactivated`/`.inactive` rename drops a
  tab.
- **Never overwrite silently.** A different file at a copy's target is a
  refusal (exit 3) unless `-f`; an identical one is "already up to date".
- **The page explains; `/scrolls-help` is the reference.** Callout text
  states what each command does in a sentence or two. Exact flags and
  edge cases stay in `../../scrolls-help/references/HELP.md`.
- **Offline and self-contained.** No external scripts, styles or fonts;
  scenario 10 and the browser check both assert it.
- **No folder named `build/`.** The repository's `.gitignore` ignores it,
  so its files would silently never be committed; scenario 13 fails if
  git ignores any file in this skill.

## When another scrolls command changes

`bash scripts/explain.sh --build` tells you: it stops and names every
skill whose `SKILL.md` changed since the last review. Then:

1. Compare each named skill's `SKILL.md` with its tab in
   `assets/explainer-graph.json` and edit what no longer holds. Keep at
   most 24 nodes; card text must fit at 320 px.
2. `bash scripts/explain.sh --build --reviewed`.
3. `bash tests/test_explain.sh` (it re-runs the browser checks).
4. Look at the page at desktop and phone width. For screenshots:
   `node tests/browser/check_page.cjs assets/scrolls-explainer.html <dir>`.

A family-wide version bump changes the stamp but needs no review: just
`--build` after bumping `metadata.version` everywhere; scenario 11 fails
until you do.

## Running tests

After touching anything in `scripts/` or `assets/`:

```
bash tests/test_explain.sh
pwsh tests/test_explain.ps1   # where pwsh is available
```

The `--build` scenarios (11, 15–25) need this repository's
`skills/diagrams/network-flow`; scenario 12 needs Node.js and Playwright
with Chromium. Each is skipped, and says so, when missing.

## Frontmatter validation

Run `yamllint --strict` against `../SKILL.md`'s frontmatter every time this
skill is updated:

```bash
awk '/^---$/{c++; if(c==2){exit}} c==1' ../SKILL.md | \
  yamllint --strict -d "{extends: default, rules: {line-length: disable, document-start: disable}}" -
```

## Versioning

Bump `metadata.version` in `../SKILL.md` when something visible to a
`/scrolls-explainer` invocation changes (a flag, a default, the page's
content or behavior) — not for test-only changes. Rebuild the page after
any bump, since the version is stamped into it.

This skill's version is locked in step with the other seven `scrolls-*`
skills — see `../../meta/MAINTAINERS.md`'s Versioning entry. Any bump
here means bumping all eight to the same new number in the same commit.
