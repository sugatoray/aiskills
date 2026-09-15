# Maintaining arxiv-paper-builder

For people developing this skill — not read as part of carrying out a
user's paper-assembly request (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the only file read at invocation time: the workflow,
  the reference-file table, and the scripts table.
- `../README.md` — minimal, human-facing pointer to the files below;
  not read at invocation time.
- `../CHANGELOG.md` — this skill's version history; update it alongside
  `metadata.version` in `SKILL.md`.
- `../references/template-guide.md` — the `arxiv-style` template's
  macros and the honesty note about there being no public FAIR house
  class to copy.
- `../references/section-mapping.md` — inferring section order and
  title/author/abstract info.
- `../references/markdown-to-latex.md` — the conversion rules and
  citation-normalization guidance.
- `../references/figure-handling.md` — PNG/PDF/SVG/HTML handling.
- `../references/build-and-troubleshoot.md` — the build procedure and
  log-pattern table.
- `../assets/template/` — the vendored template:
  - `arxiv.sty` — unmodified vendored copy of
    [`kourgeorge/arxiv-style`](https://github.com/kourgeorge/arxiv-style)'s
    style file (MIT).
  - `License.txt` — the upstream MIT license text plus an attribution
    note for the vendored file. Keep this file if `arxiv.sty` is ever
    updated from upstream; don't drop attribution.
  - `main.tex` — a skeleton preamble + section scaffold, adapted from
    upstream's `template.tex` with one bug fixed (see below) and the
    ORCID-logo boilerplate removed (it required a binary asset this
    skill doesn't need to vendor).
  - `references.bib` — a one-entry starter so a scratch build has
    something to resolve `\citep` against.
- `../scripts/convert_svg.sh`, `../scripts/render_html.py`,
  `../scripts/build.sh` — executable helpers (`chmod +x` already
  applied); keep them executable if they're ever rewritten.
- `../.claude-plugin/plugin.json` — the Claude Code plugin manifest.
  Not read during a normal skill invocation; only Claude Code's plugin
  loader reads it, when this directory is loaded as a plugin.
- `../agents/claude-code.yaml`, `../agents/openai.yaml` — per-agent-
  harness interface metadata, same shape as `stata-recipes`'s
  equivalents. Claude Code's plugin loader only reads `.md` files from
  `agents/` as custom-agent definitions, so these `.yaml` files are
  silently ignored by it — no conflict with the plugin's own `agents/`
  convention.

## The vendored `arxiv.sty` bug fix

Upstream's `template.tex` has `\usepackage{hyperlink}` in its preamble —
a typo for `\usepackage{hyperref}` (there's no package named
`hyperlink`). `assets/template/main.tex` has this corrected. If
`arxiv.sty` or the template is ever re-vendored from upstream, re-apply
this fix rather than reintroducing the typo — see
`../references/template-guide.md`'s "Common preamble mistakes" section,
which documents this for the skill's own runtime use too.

## Updating the vendored template

`arxiv.sty` is vendored (not fetched at runtime) so this skill works in
a sandboxed environment with no internet access, and so its behavior
doesn't silently change if upstream changes. If upstream
(`kourgeorge/arxiv-style`) publishes a meaningful update, re-vendor
deliberately: diff the new `arxiv.sty` against this one, re-apply the
`hyperlink`→`hyperref` fix to `main.tex` if needed, and bump this
skill's own version — don't silently swap the file in a commit that
looks like it's about something else.

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter (and add a
matching `../CHANGELOG.md` entry, same commit) whenever something a
live paper-assembly request would actually see changes: a new/reworded
workflow step, a changed conversion rule, a new script, or a re-vendored
template. Keep `../.claude-plugin/plugin.json`'s `version` field, and
`../../.claude-plugin/plugin.json`'s (the family-level manifest, see
`../../meta/MAINTAINERS.md`) `version` field, equal to `SKILL.md`'s
`metadata.version` — bump all three in the same commit.

This is currently the only skill under `skills/latex/`, so its version
moves independently — see `../../meta/MAINTAINERS.md` for what changes
if a second `latex-*` skill is ever added.
