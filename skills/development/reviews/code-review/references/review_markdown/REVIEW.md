# Markdown review

What to look for in Markdown (`.md`, `.markdown`): READMEs, guides, changelogs, design
documents, and instruction files read by tools or agents. Beyond `../CROSS_LANGUAGE.md`.
Documentation is reviewed for whether a reader who follows it succeeds, so accuracy comes
first and formatting last. `PATTERNS.md` has the fix for the common items, `TOOLING.md` the
commands, `SECURITY.md` the security scope, and `WISDOM.md` the constraints and traps to keep
in mind for every Markdown review.

## Before you start

- **Who reads it, and where it is rendered.** GitHub, GitLab, a static site generator
  (MkDocs, Docusaurus, Jekyll, Hugo), a package registry (npm, PyPI), a terminal, or a
  program that parses it. Each renders a different dialect: CommonMark, GitHub Flavored
  Markdown (tables, task lists, alerts, footnotes), MDX, or the generator's extensions.
- **Whether the file is also data.** Front matter read by a site generator, a changelog parsed
  by a release tool, a skill or agent instruction file, a file with generated sections between
  markers. Structure that looks cosmetic may be load-bearing: find the consumer.
- **What the project enforces.** `.markdownlint*`, a link checker, a spelling or prose linter
  (Vale, cspell), a style guide, a docs build in CI.
- **What changed in the code.** A documentation change is reviewed against the code it
  describes; a code change is reviewed for the documentation it leaves stale.

## Accuracy

The largest source of real findings. Check claims against the repository, not against how
plausible they read.

- **Commands that don't run as written:** a wrong flag or script name, a path that does not
  exist, a missing prerequisite or step, a different working directory than the reader is in.
  Run them where it is safe to (`TOOLING.md`).
- **Code samples that don't compile or run,** or that use an API the current version no longer
  has. Compare with the source and the tests.
- **Names that drifted:** options, environment variables, file names, function signatures,
  defaults, version numbers, and counts ("supports 7 languages") that no longer match the code.
- **Output shown that the command no longer prints.**
- **Documentation the change made stale.** For a code change, search the docs for the names it
  touched; a README that still describes the old behaviour is a finding against the change.
- **Claims with no basis in the repository:** performance numbers, compatibility statements,
  "tested on" lists. Ask where the claim comes from.
- **Contradictions** between two documents, or between a document and its own example.

## Links and references

- **Broken relative links** after a file was moved or renamed, and links to anchors that no
  longer exist because a heading was reworded.
- **Links that work on one renderer only:** absolute links to a branch that will be renamed or
  deleted, links relying on one host's anchor rules, relative links that break when the file
  is shown on a package registry.
- **Images** that are missing, have no alt text, are linked from a host that may disappear, or
  show an interface that has since changed.
- **Link text that says nothing** ("here", "this link", a bare URL in prose).
- **Reference-style definitions** that are unused or duplicated, and footnotes with no
  matching marker.

## Structure

- **Heading levels that skip** (`#` then `###`), more than one top-level heading, or headings
  used for emphasis. Navigation, generated tables of contents and screen readers rely on the
  outline.
- **Two headings with the same text** in one file: their anchors collide, and the renderer
  renames the second in a host-specific way.
- **A document with no statement of what it is for** and who it is for near the top.
- **Steps that are not in the order they must be done,** prerequisites mentioned after the
  step that needs them, and several actions packed into one step.
- **Long documents with no table of contents or summary** where the host does not generate
  one.
- **Content in the wrong place:** reference material in a tutorial, rationale in a how-to,
  decisions recorded only in a README that will be rewritten.

## Rendering

- **A code fence with no language,** so no highlighting and no way for tools to check it; a
  fence closed with a different number of backticks than opened it; a fenced block containing
  a fence of the same length.
- **Lists that break:** a code block or paragraph inside a list item indented too little, so
  it ends the list and the next item starts a new one; mixed tabs and spaces.
- **Tables** with a different number of cells per row, a missing delimiter row, or an
  unescaped `|` in a cell; wide tables that should be a list.
- **Text swallowed as HTML:** `<name>` placeholders outside code spans are parsed as tags and
  disappear. Put them in backticks or write `&lt;name&gt;`.
- **Unintended formatting:** `*` and `_` in names and expressions (`__init__.py`, `a*b*c`)
  turning into emphasis; a line starting with a number and a full stop or with `#`, `+`, `-` or `>` becoming
  a list, heading or quote.
- **Hard line breaks** written as two trailing spaces, which editors strip and reviewers can't
  see.
- **Raw HTML** that the target renderer strips or escapes, and extension syntax (alerts,
  admonitions, tabs, Mermaid) used where the renderer doesn't support it.

## Clarity

Flag these where they would make a reader fail or misread, not as taste.

- **Undefined terms and abbreviations** on first use; the same thing given two names.
- **Instructions that leave out what to expect:** no way for the reader to tell whether the
  step worked.
- **Placeholders that are not marked as placeholders,** so the reader copies them literally.
- **Vague quantities and times** ("recently", "fast", "soon", "a few") where a number or
  version is known.
- **Platform assumptions** left unstated: shell, operating system, required tools and
  versions.

## Structured and machine-read Markdown

- **Front matter:** invalid YAML, a missing required key, a value of the wrong type, a `name`
  that must match a folder or file name and doesn't.
- **Changelogs:** an entry under the wrong version or section, a missing entry for a
  user-visible change, a format the release tooling can't parse (Keep a Changelog, Conventional
  Commits output).
- **Generated sections:** hand edits between generator markers, which the next run overwrites;
  generated files edited without re-running the generator.
- **Instruction files for tools and agents:** contradictory instructions, steps that refer to
  files or commands that do not exist, and instructions a reader could not carry out with only
  what the file gives them.

## Security

Read `SECURITY.md` for the full scope. The items that most often matter in ordinary review:
real secrets and internal hosts in examples, install commands that pipe a download into a
shell or disable verification, raw HTML and `javascript:` links where the renderer does not
sanitise, and instructions that tell the reader to weaken a security control.

## Usually not worth a finding

- Line length and wrapping style, `*` against `-` for bullets, `_` against `*` for emphasis,
  ATX against Setext headings, where the project has no enforced rule.
- British against American spelling, Oxford commas, sentence against title case, unless the
  project has a style guide.
- Rewording that is no clearer, and personal preference in tone.
- Trailing whitespace and final newlines that a formatter owns.
