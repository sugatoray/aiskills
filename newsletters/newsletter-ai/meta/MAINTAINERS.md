# Maintaining newsletter-ai

For people developing this skill — not read as part of producing a
`/newsletter-ai` edition (that's `../SKILL.md`).

## Layout

- `../SKILL.md` — the only file read at invocation time. Frontmatter
  (`name`, `description`, `metadata.version`) plus the steps for using
  `assets/PROMPT.md` to produce one edition.
- `../CHANGELOG.md` — this skill's version history; update it alongside
  `metadata.version` in `SKILL.md`.
- `assets/PROMPT.md` — the editorial brief itself: role, audience,
  research window, sourcing rules, the 15-part structure, editorial
  rules, and writing style. This is the single source of truth for what
  the newsletter contains — `SKILL.md` only points at it and never
  duplicates its content.

## Updating `assets/PROMPT.md`

Edit it directly when the editorial brief needs to change — new or
reordered parts, different sourcing rules, a different audience, a
different tone. Since `SKILL.md` doesn't restate the brief's content,
there's nothing else to keep in sync besides the step numbering in
`SKILL.md` if a part is added, removed, or reordered.

## Versioning

Bump `metadata.version` in `../SKILL.md`'s frontmatter when something
that changes the produced newsletter changes: a part added, removed, or
reordered in `assets/PROMPT.md`, a changed sourcing or editorial rule, a
changed audience. Not for pure typo fixes or file moves with no content
change.
