# Changelog

All notable changes to the `create-lib-docs` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] - 2026-11-01

### Added

- Published in [`sugatoray/aiskills`](https://github.com/sugatoray/aiskills) under `skills/docs/`,
  installable with `npx skills add sugatoray/aiskills` or as part of the `docs-skills` Claude Code
  plugin (the family manifest at `skills/docs/.claude-plugin/plugin.json`; the skill has no manifest
  of its own).
- `agents/claude-code.yaml` / `agents/openai.yaml` (display name and implicit-invocation policy),
  matching the other skills here.
- `metadata.source_url` in `SKILL.md`'s frontmatter.

No change to the skill's instructions, references or scripts.

## [1.0.1] - 2026-11-01

### Fixed

- `check_docs.py` no longer reports a link to a folder without a `README.md` as broken (GitHub lists
  the folder's files). Found while writing callai's docs; covered by a new test.

## [1.0.0] - 2026-11-01

### Added

- `SKILL.md`: a seven-step workflow.
  1. Learn the library from primary sources.
  2. Plan the information architecture.
  3. Write the pages.
  4. Draw the diagrams.
  5. Generate the agent indexes.
  6. Verify everything.
  7. Report.
- `references/patterns.md`: what to borrow from FastAPI, Pydantic, DuckDB and Effect, taken from their
  documentation sources (mkdocs navigation, site sidebar, page sources).
- `references/templates.md`: page skeletons for the landing page, tutorial step, guide, concept,
  reference and error entry.
- `scripts/check_docs.py` checks the docs:
  - links and GitHub-style anchors resolve;
  - images exist and have alt text;
  - every code fence has a language;
  - every page is reachable from the landing page;
  - `llms.txt` lists every page.
- `scripts/build_llms_txt.py` generates `llms.txt` and `llms-full.txt` from the landing page's sections.
- `tests/test_scripts.py`: regression tests for both scripts.
