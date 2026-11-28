# Maintaining the productivity family

Family-wide maintainer notes for the skills under `skills/productivity/`. Not read when answering any
request; each skill's own `SKILL.md` is what's read at invocation time. For a skill's own layout and
versioning, see its `meta/MAINTAINERS.md`:

- [`iui/meta/MAINTAINERS.md`](../iui/meta/MAINTAINERS.md)
- [`meeting-agenda/meta/MAINTAINERS.md`](../meeting-agenda/meta/MAINTAINERS.md)
- [`agent-sessions-insight/meta/MAINTAINERS.md`](../agent-sessions-insight/meta/MAINTAINERS.md)

Working memory for this family (narrative, plans, traps) is in `src/skills/productivity/docs/.scrolls/`;
start from its `STARTER.md`. `src/skills/productivity/meta` links back to this folder.

This `meta/` folder is for maintainers of this repo: `skills/.skillsignore` keeps every group- and
subgroup-level `meta/` out of the npm package. A `meta/` inside a skill folder still ships.

## What's shared

- **License and authorship:** MIT, `metadata.author: sugatoray`, in both `SKILL.md` files.
- **Explicit invocation only:** both skills set `disable-model-invocation: true` in `SKILL.md` and
  `allow_implicit_invocation: false` in `agents/openai.yaml`. Keep that for new skills here unless
  there is a reason not to.
- **Red/Green TDD:** write or change the failing test first, then the code. Both skills keep
  `meta/MAINTAINERS.md` and `meta/SECURITY.md`.
- **Offline output:** both produce one self-contained HTML file (no CDN, fonts or network).

## Claude Code plugin manifest (`.claude-plugin/plugin.json`)

The manifest lives in `skills/productivity/`, not the repo root, like `skills/stata/` and `skills/docs/`.
The root `.claude-plugin/marketplace.json` lists it as `"source": "./productivity"` (resolved against
`metadata.pluginRoot: "./skills"`). The `aiskills` npm package derives the group alias from the
plugin name minus `-skills`: `productivity`.

**Keep it in sync, every time:**

- **Version:** the plugin has its own version. It went from `1.0.0` to `1.1.0` when
  `agent-sessions-insight` joined; each skill keeps its own `metadata.version` (both `1.0.0` today).
  Bump the plugin's minor version when a skill is added, and its patch version for a manifest-only fix.
- **New skill:** add its `./<skill-name>` path to the `"skills"` array in the commit that adds it,
  and a row to `../README.md`.
- **Skill retired:** remove its entry in the commit that renames its `SKILL.md` away (see
  `../../scrolls/meta/MAINTAINERS.md`, "Renaming convention that discards a skill from installing").

**Validate before pushing** (from the repo root): `claude plugin validate skills/productivity --strict` and
`claude plugin validate .claude-plugin/marketplace.json --strict` must both report `Validation passed`.

## Tests

From each skill's folder:

```bash
python3 -m pytest                                  # meeting-agenda (pytest + Playwright)
python3 -m unittest discover -s tests -v           # agent-sessions-insight (Playwright tests skip without it)
```

In cloud sessions, `pip install pytest playwright` first; the browser tests use
`/opt/pw-browsers/chromium`. After changing a skill, run the npm package's tests too
(`cd src/packages/aiskills && npm run docs && npm test`).
