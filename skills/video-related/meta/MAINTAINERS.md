# Maintaining the video-related family

Family-wide maintainer notes for the skills under `skills/video-related/`. Not read when answering any
request; each skill's own `SKILL.md` is what's read at invocation time. For a skill's own layout and
versioning, see its `meta/MAINTAINERS.md`:

- [`dynamic-promo-video/meta/MAINTAINERS.md`](../dynamic-promo-video/meta/MAINTAINERS.md)

This file covers one skill today. It exists because the plugin manifest below is a family-level
artifact, the same arrangement as `../../stata/meta/MAINTAINERS.md`. Don't invent shared conventions
before a second skill exists.

Working memory for this family (narrative, plans, traps) is in `src/skills/video-related/docs/.scrolls/`;
start from its `STARTER.md`.

This `meta/` folder is for maintainers of this repo: `skills/.skillsignore` keeps every group- and
subgroup-level `meta/` out of the npm package. A `meta/` inside a skill folder still ships.

## Claude Code plugin manifest (`.claude-plugin/plugin.json`)

The manifest lives in `skills/video-related/`, not the repo root, like `skills/stata/` and `skills/docs/`.
The root `.claude-plugin/marketplace.json` lists it as `"source": "./video-related"` (resolved against
`metadata.pluginRoot: "./skills"`). The `aiskills` npm package derives the group alias from the
plugin name minus `-skills`: `video-related`.

**Keep it in sync, every time:**

- **Version:** today `plugin.json` says `1.0.0` while `dynamic-promo-video/SKILL.md` says `1.6.2`:
  the plugin was not bumped with the skill's releases. Decide whether the plugin should follow the
  skill (as in `../../stata/` and `../../docs/`) before the next release, and record the rule here.
- **New skill:** add its `./<skill-name>` path to the `"skills"` array in the commit that adds it,
  and a row to `../README.md`.
- **Skill retired:** remove its entry in the commit that renames its `SKILL.md` away (see
  `../../scrolls/meta/MAINTAINERS.md`, "Renaming convention that discards a skill from installing").

**Validate before pushing** (from the repo root): `claude plugin validate skills/video-related --strict` and
`claude plugin validate .claude-plugin/marketplace.json --strict` must both report `Validation passed`.

## Tests

From the repo root:

```bash
python3 -m unittest discover -s skills/video-related/dynamic-promo-video/tests -p 'test_*.py'
node --check skills/video-related/dynamic-promo-video/scripts/render.js
```

Tests skip when ffmpeg, numpy, Node or Playwright is missing, and never call the TTS service.
