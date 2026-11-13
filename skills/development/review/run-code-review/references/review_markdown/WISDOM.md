# Markdown review wisdom

Read this before forming findings on Markdown, in a full review and in a security-only one.
**Constraints** are limits the review must stay within. **Traps** are things in the language
that mislead a reader. **Ditches** are the ways a review of this language goes off the road.
**Wisdom** is the judgement that keeps it on.

## Constraints

- **The renderer defines the language.** CommonMark, GitHub Flavored Markdown, MkDocs,
  Docusaurus, Pandoc and Jupyter differ on tables, footnotes, admonitions, heading
  anchors, line breaks and raw HTML. Find the renderer before judging syntax.
- **The code is the source of truth.** A statement in documentation is checked against the
  repository, not against how well it reads.
- **The project's style and lint configuration are the standard.** Don't impose another
  heading style, line length or list marker.
- **Generated sections are not edited by hand.** Review the generator or its source, and
  check that the output was regenerated.
- **Never run a documented command to see whether it works** unless it is known to be safe
  and you were told to. Check it against the code, the tool's help, or a sandbox.
- **Headings, anchors and file paths are an interface.** Renaming one breaks links from
  other files, other sites and search results that the diff does not show.
- **The author's voice is theirs.** Report what is wrong, unclear or missing; don't rewrite
  prose that is merely different from how you would put it.

## Traps

- **Indentation decides structure.** Content under a list item must be indented to the
  item's text, or it leaves the list and the numbering restarts. Four spaces outside a list
  make a code block.
- **A single line break is a space.** A hard break needs two trailing spaces (invisible,
  and stripped by many editors) or a backslash, and some renderers treat every newline as a
  break.
- **Ordered-list numbers in the source are mostly ignored;** only the first sets the start.
- **A list or a table directly after a paragraph, with no blank line,** is a list in some
  renderers and paragraph text in others.
- **`*` and `_` are emphasis, `<word>` is an HTML tag and is dropped, `|` splits a table
  cell,** and a line starting with `#`, `>`, `-`, `+` or a number and a full stop is
  structure. Literal uses need backticks or a backslash.
- **Heading anchors are generated differently per renderer,** and duplicate headings get
  suffixes that change when a heading is added above them.
- **Relative links resolve from the file's location on a forge and from the page's URL on a
  built site.** The same link can work in one and break in the other.
- **Markdown inside a block-level HTML element is not parsed** unless separated by blank
  lines, and not at all in some renderers.
- **A fenced block is closed by a fence at least as long as the one that opened it;** code
  that contains three backticks needs a longer fence.
- **The language tag on a fence controls highlighting, and in some toolchains execution or
  testing.**
- **Front matter must be the first thing in the file,** and it is YAML: an unquoted colon,
  `no`, or a leading zero changes the value.
- **Autolinking differs:** a bare URL is a link on GitHub and plain text in strict
  CommonMark.
- **Smart quotes and long dashes introduced by an editor break commands** when they are
  copied.
- **Images without alternative text, and "click here" links,** carry no meaning for a
  screen reader.

## Ditches

- **Copy-editing instead of reviewing.** Style and wording nits bury the wrong command.
- **Trusting that it reads well.** Fluent documentation that describes last year's flags
  is worse than none.
- **Reviewing the source and never rendering it,** so the broken table, the swallowed list
  and the dropped `<placeholder>` go unseen.
- **Checking only the lines that changed** when the code change made other sections stale.
- **Not following the steps.** An instruction with a missing prerequisite, a wrong order or
  an undefined variable is found only by walking through it as a new reader.
- **Treating documentation as harmless.** People paste its commands into terminals, and
  agents follow its instructions.
- **Arguing line length and wrapping** where the project has no rule.
- **Flagging every external link as a risk,** or checking none.
- **Asking for more documentation everywhere.** Ask for what a reader needs at that point,
  and say who the reader is.

## Wisdom

- **Review the claim, then the command, then the prose.** Wrong beats unclear beats
  inelegant.
- **Read it as the person it is for,** who has less context than the author and will do
  exactly what it says.
- **Every command should be copy-pasteable and say what it does and where to run it.**
  Mark placeholders so they cannot be run by accident.
- **Show the expected result,** so a reader can tell success from failure.
- **Put the most used thing first:** what it is, how to install it, the shortest working
  example.
- **Documentation changes in the same change as the code.** A behaviour change with no
  documentation change is a question to ask.
- **One source for each fact.** Duplicated instructions drift; link instead.
- **Dates, versions and "currently" age.** Prefer statements that stay true, or that a
  check will catch when they stop being true.
- **Render before rating.** A finding about structure should quote what the renderer
  produced.
- **Say what you did not check:** commands not run, links not followed, the renderer not
  used.
