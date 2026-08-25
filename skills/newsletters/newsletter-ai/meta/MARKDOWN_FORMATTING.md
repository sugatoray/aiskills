# Markdown Formatting Rules

These two spacing rules apply to every `.md` file in this skill
(`SKILL.md`, `README.md`, `CHANGELOG.md`, `assets/PROMPT.md`,
`meta/MAINTAINERS.md`, `meta/FEATURES.md`, this file, and any future
addition). They keep the raw source readable and render identically
across every markdown viewer, including ones that don't apply
CommonMark's more lenient "tight" spacing rules.

## Rule 1 — blank line around every header

Every header line (`#`, `##`, `###`, ... `######`) must have one blank
line immediately above it and one blank line immediately below it —
unless the header is the very first line of the file (nothing to put a
blank line above) or the very last line of the file (nothing below).

Wrong:

````
Some paragraph text.
## Next Section
More text right after the header.
````

Right:

````
Some paragraph text.

## Next Section

More text right after the header.
````

## Rule 2 — blank line around every fenced code block

Every fenced code block (three or more backticks, ` ``` `, or the
tilde equivalent `~~~`) must have one blank line immediately before its
opening fence and one blank line immediately after its closing fence —
unless the fence is the first or last line of the file.

Wrong:

`````
Run it like this:
```bash
some-command --flag
```
Then check the output.
`````

Right:

`````
Run it like this:

```bash
some-command --flag
```

Then check the output.
`````

## Checking and fixing

There's no linter dependency wired into this skill's test suite for
this — it's cheap enough to check by eye on a diff, and any violation
is a purely mechanical one-blank-line fix. When in doubt, re-read the
two rules above and the wrong/right examples.

## Scope

This file's rules apply only to markdown files inside
`skills/newsletters/newsletter-ai/`. They are not a repository-wide
convention — don't apply them to other skills' markdown files as a side
effect of an unrelated change.
