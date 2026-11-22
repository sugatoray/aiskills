# Maintaining the newsletters family

Family-wide maintainer notes for the skills under `skills/newsletters/`. Not read when answering any
request; each skill's own `SKILL.md` is what's read at invocation time. For a skill's own layout and
versioning, see its `meta/MAINTAINERS.md`:

- [`newsletter-ai/meta/MAINTAINERS.md`](../newsletter-ai/meta/MAINTAINERS.md)

This file covers one skill today. Unlike the other families, `newsletters` has no plugin manifest and
no README, and is not listed in the root `.claude-plugin/marketplace.json`. Don't invent shared conventions
before a second skill exists.

This `meta/` folder is for maintainers of this repo: `skills/.skillsignore` keeps every group- and
subgroup-level `meta/` out of the npm package. A `meta/` inside a skill folder still ships.

## Where it ships

- **`npx skills`:** yes. `npx skills add sugatoray/aiskills --skill newsletter-ai` installs it.
- **npm package:** no. `../.skillsignore` leaves `newsletter-ai/` out of `@sugatoray-ai/aiskills`
  (and so out of `aiskills install`). `../../.skillsignore` keeps this `meta/` folder out too, so
  nothing of the family ships. Its syntax is in
  `src/packages/aiskills/docs/docsite/reference/skillsignore.md`.
- **Claude Code plugin:** no. To add one, create `.claude-plugin/plugin.json` here
  (`"name": "newsletters-skills"`), add a `"source": "./newsletters"` entry to the root
  `marketplace.json`, and follow `../../docs/meta/MAINTAINERS.md` for keeping it in sync.

## Tests

`newsletter-ai` has its own pytest suite; see `../newsletter-ai/meta/MAINTAINERS.md` for how to run it.
