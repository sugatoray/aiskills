# Repo-related skills

Skills that act on a repository's own hosted state — issues, pull
requests, releases, and similar — rather than on its code. The first one,
`/create-issues-update-pr`, files GitHub issue(s) for work already done
(or about to be done) on a branch, grouping related issues under a
parent epic via GitHub's native parent/child relationship when the work
genuinely splits into distinct pieces, then rewrites that pull request's
title (kept short) and description so the description lists every issue
in the exact format `- Closes #{{issue-number}} -- {{issue-title}}`,
indented to match parent-child nesting. The `Closes` keyword is
deliberate on every line, including a parent epic's — GitHub auto-closes
any issue referenced this way when the PR merges into the repo's default
branch.

## Skills

| Skill | Purpose |
| --- | --- |
| [`/create-issues-update-pr`](create-issues-update-pr/) | Files GitHub issue(s) for a PR's work — one flat issue, or a parent epic plus children — then rewrites the PR's title and description to list them, correctly nested. |

More skills will be added under this folder over time (e.g. PR review
triage, stale-issue cleanup, release-notes drafting) following the same
layout as `create-issues-update-pr/`.

## Layout

Every skill's directory has:

- `SKILL.md` — the skill's runtime instructions.
- `README.md` — a minimal, human-facing pointer to the files below;
  not read at invocation time.
- `agents/openai.yaml`, `agents/claude-code.yaml` — per-agent-harness
  interface metadata for the multi-agent `npx skills add --agent <name>`
  packaging, same shape and purpose as the `scrolls-*` skills'
  `agents/openai.yaml` files.
- `meta/MAINTAINERS.md` — development notes: layout and versioning.
- `CHANGELOG.md` — that skill's own version history.
- `.claude-plugin/plugin.json` — Claude Code plugin manifest, present
  because `SKILL.md` sits directly at the skill's root with no `skills/`
  subfolder (Claude Code's single-skill plugin layout), letting it load
  directly via `claude --plugin-dir <path>`.

`meta/` is development-only — for documenting design decisions, not part
of using the skills. `SKILL.md` may point to it by name, but only to say
it's not part of carrying out a request — it's never read as instructions
while a skill is actually running.

This directory (`skills/development/repo-related/`) has its own
`.claude-plugin/plugin.json` and `meta/MAINTAINERS.md` too — a
family-level Claude Code plugin manifest grouping every skill here into
one installable `repo-related-skills` plugin (listed in the repo-root
`.claude-plugin/marketplace.json`), and family-wide maintainer notes
(the plugin manifest's design, its keep-in-sync rules, and why this
family sits two levels under `skills/` instead of one) — neither of
which belongs in any single skill's own docs.
