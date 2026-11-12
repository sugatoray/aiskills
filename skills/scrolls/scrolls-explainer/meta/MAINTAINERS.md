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
  by `generator/build.py`; never edit it by hand.
- `../scripts/explain.py`: **all** of the runtime logic (stdlib-only
  Python 3.9+): resolve the output path, refuse to overwrite a different
  file without `-f`, copy the page, optionally open it.
- `../scripts/explain.sh` and `../scripts/explain.ps1`: thin launchers.
  They find Python and pass `"$@"` / `@args` through unchanged. A flag or
  behavior change goes in `explain.py`, never in only one launcher.
- `generator/graph.json`: the page's content. Nodes (the commands and files),
  edges (what touches what), and one scenario per tab, each with ordered
  `steps` (`edge`, `title`, `text`, optional `at` = the node the callout
  points at; default is the edge's target). `eyebrow` holds `{version}`,
  filled in at build time.
- `generator/enhance.py`: what the explainer adds on top of the network-flow
  renderer's output: the callout overlay and its ‹ › buttons, keyboard
  shortcuts and the `?` panel, the 5.2 s step pace, and the
  `scrolls-explainer-version` meta tag. Each change is an exact,
  single-occurrence text swap, so a renderer change that moves an anchor
  fails the build loudly.
- `generator/build.py`: renders `graph.json` with
  `skills/diagrams/network-flow/scripts/render.py` (or
  `$NETWORK_FLOW_DIR`), runs `enhance()`, stamps `metadata.version` from
  `../SKILL.md`, and writes the page. `--check` only compares.
- `../tests/`: `test_explain.sh` is the full Red/Green suite (script
  behavior, the page's content and version stamp, build freshness, and,
  when Node.js with Playwright is available, `browser/check_page.cjs`).
  `test_explain.ps1` is a parity harness for the PowerShell launcher.
- `../agents/openai.yaml`: OpenAI-agent interface metadata.

## Design decisions worth keeping

- **Ship the page prebuilt.** Users only need Python to copy a file; they
  never need the network-flow skill, Node.js or a browser engine. The
  build is a maintainer step, and `test_explain.sh` scenario 11 fails when
  the bundled page is stale.
- **Never overwrite silently.** A different file at the target path is a
  refusal (exit 3) unless `-f`; an identical one is "already up to date"
  (exit 0), so re-running is harmless.
- **The page explains; `/scrolls-help` is the reference.** Callout text
  states what each command does in a sentence or two. Exact flags and
  edge cases stay in `../../scrolls-help/references/HELP.md`.
- **Offline and self-contained.** No external scripts, styles or fonts;
  scenario 10 and the browser check both assert it.

## When another scrolls command changes

The page describes the other seven skills, so keep it true to them:

1. Edit `generator/graph.json` (a step's `title`/`text`, a new step, a new
   edge or node). Keep at most 24 nodes; card text must fit at 320 px.
2. Rebuild: `python3 meta/generator/build.py`.
3. Run `bash tests/test_explain.sh` (it re-runs the browser checks).
4. Look at the page at desktop and phone width. For screenshots:
   `node tests/browser/check_page.cjs assets/scrolls-explainer.html <dir>`.

A family-wide version bump changes the stamp, so rebuild after bumping
`metadata.version` too; scenario 11 fails until you do.

## Running tests

After touching anything in `scripts/`, `assets/` or `meta/generator/`:

```
bash tests/test_explain.sh
pwsh tests/test_explain.ps1   # where pwsh is available
```

Scenario 11 needs this repository's `skills/diagrams/network-flow` (or
`NETWORK_FLOW_DIR`); scenario 12 needs Node.js and Playwright with
Chromium. Each is skipped, and says so, when missing.

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
