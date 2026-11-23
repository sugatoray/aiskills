# Maintaining the development family

Family-wide maintainer notes for `skills/development/`. Not read when answering any request.
Unlike the other families, `development/` holds **subgroups**, not skills, and each subgroup is
its own installable plugin with its own maintainer notes:

- [`repo-related/meta/MAINTAINERS.md`](../repo-related/meta/MAINTAINERS.md): plugin
  `repo-related-skills` (`create-issues-update-pr`).
- [`review/meta/MAINTAINERS.md`](../review/meta/MAINTAINERS.md): plugin `review-skills`
  (`run-code-review`).

Working memory for each subgroup is in `src/skills/development/<subgroup>/docs/.scrolls/` (`review/`
and `repo-related/`), with `src/skills/development/<subgroup>/meta` linking to that subgroup's `meta/`, and
`src/skills/development/meta` linking to this folder.

This `meta/` folder is for maintainers of this repo: `skills/.skillsignore` keeps every group- and
subgroup-level `meta/` out of the npm package. A `meta/` inside a skill folder still ships.

## Layout rules

- **No plugin at this level.** There is no `skills/development/.claude-plugin/`. The root
  `.claude-plugin/marketplace.json` lists each subgroup on its own (`"source":
  "./development/repo-related"`, `"./development/review"`), and the `aiskills` npm package takes
  each subgroup's alias from its plugin name (`repo-related`, `review`).
- **New subgroup:** create `skills/development/<subgroup>/` with its own `README.md`,
  `.claude-plugin/plugin.json` (`"<subgroup>-skills"`) and `meta/MAINTAINERS.md`, add a
  marketplace entry, and add a row to `../README.md`'s subgroup table.
- **New skill:** goes in the subgroup it belongs to; follow that subgroup's `meta/MAINTAINERS.md`.
- **License and authorship:** MIT, `metadata.author: sugatoray`, in every `SKILL.md`.
