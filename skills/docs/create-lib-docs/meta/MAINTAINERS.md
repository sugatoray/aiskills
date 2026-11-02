# Maintaining create-lib-docs

For people developing this skill. None of this is read when answering a `/create-lib-docs`
request; that's `../SKILL.md`.

## Layout

- `../SKILL.md` is the only file read at invocation time. It tells the model to read
  `../references/patterns.md` and `../references/templates.md` before planning.
- `../scripts/` hold the two deterministic jobs a model does unreliably by eye:
  - checking hundreds of links and anchors;
  - regenerating `llms.txt` and `llms-full.txt` byte-for-byte from the landing page.

  Both use only the standard library, and both are pure functions plus a `main()`, so they can be
  tested without the network.
- `../CHANGELOG.md`: update it together with `metadata.version` in `SKILL.md`, and keep
  the family manifest (`../../.claude-plugin/plugin.json`) equal to it. Two files, one version (see
  [`../../meta/MAINTAINERS.md`](../../meta/MAINTAINERS.md)).
- Origin: written in [`sugatoray/devx`](https://github.com/sugatoray/devx) (`skills/docs/create-lib-docs/`,
  1.0.x). This copy is the published one; port fixes in either direction.

## Tests

```bash
python3 -m pytest skills/docs/create-lib-docs/tests
```

## Design notes

- **Why Diátaxis-shaped sections instead of one long README:** the four reference projects separate
  tutorial, how-to, explanation and reference, and arrive there independently.
  - FastAPI: Tutorial, Advanced, Reference.
  - Pydantic: Concepts, API, Error Messages.
  - DuckDB: Guides, SQL and Clients reference.
  - Effect: Getting Started, then topic sections, then Additional resources.

  Mixing them makes every page worse for every reader.
- **Why GitHub alerts instead of mkdocs admonitions:** the output is plain Markdown that must render
  on GitHub, and in an agent's context, without a site generator.
- **Why SVG diagrams are hand-written:** they diff, review and render everywhere, and stay editable
  as text. Every diagram also needs a text equivalent, because agents can't see images.
- **Why the anchor check follows GitHub's slug rules:** most of these docs are read on GitHub, where
  `### \`--resume SESSION_ID\`` becomes `#--resume-session_id`.
