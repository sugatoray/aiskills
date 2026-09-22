# Mapping input markdown to a paper's section structure

## Canonical section order

Abstract, Introduction, Related Work, Method/Approach, Experiments
(setup), Results, Discussion/Limitations, Conclusion, Acknowledgments,
References, Appendix. This is the order `assets/template/main.tex`
ships with — not every paper needs every section, and the rule is to
**keep whatever the source docs actually contain, in this relative
order**, not to manufacture empty sections to fill out the list. A
short technical note with only an Introduction, Method, and Results is
complete as three sections; don't add a placeholder "Related Work"
nobody wrote.

## Inferring structure from the input files

1. **Numeric-prefixed filenames** (`01-intro.md`, `02-related-work.md`,
   `03-method.md`, ...) — use the numeric order directly; it's an
   explicit authoring decision, don't second-guess it against the
   canonical order above.
2. **Semantically-named files** (`introduction.md`, `related-work.md`,
   `methods.md`/`method.md`/`approach.md`, `experiments.md`,
   `results.md`, `discussion.md`, `conclusion.md`, `abstract.md`) — map
   by name to the matching canonical section, then order by the
   canonical list above regardless of filesystem/alphabetical order.
3. **A single large markdown file** — use its own heading structure:
   H1s become candidate section boundaries (or the paper title, if it's
   the very first heading and nothing else looks like a title), H2s
   become `\subsection`, deeper headings nest accordingly. If one H1 is
   literally "Abstract" or "TL;DR", extract its content into the
   `abstract` environment instead of leaving it as a numbered section.
4. **Mixed** (a few dedicated files plus one catch-all "notes.md") —
   place the catch-all content wherever its own heading text matches a
   canonical section by name; if nothing matches, ask the user where it
   belongs rather than guessing at an appendix dump.

## Title, authors, abstract when not in a dedicated file

Look for a YAML frontmatter block (`---\ntitle: ...\nauthors: ...\n---`)
at the top of the earliest doc, or a small dedicated file (`title.md`,
`metadata.md`, `frontmatter.md`). If none of those exist and the
information genuinely isn't inferable from the content (author names,
affiliations, a corresponding-author email — these are almost never
guessable from technical prose), ask the user directly rather than
inventing placeholder names; a real paper's byline is not something to
fabricate. The title itself is a partial exception: if every input doc
is clearly about one specific system/method/result and there's an
obvious working title implied by the content (e.g. the H1 of the first
doc already reads like a title), propose that as a draft and let the
user confirm or correct it, instead of stopping to ask before doing
anything else.

## Appendix content

Anything explicitly marked as supplementary (a doc named
`appendix.md`/`supplementary.md`, or an H1 literally titled that) goes
after `\appendix` in `main.tex`, not folded into the main section flow.
Long derivations, additional result tables, or extended qualitative
examples that would otherwise crowd out the main narrative are also
reasonable candidates to move to the appendix — mention the move to the
user rather than silently relocating content they may have intended to
keep prominent.
