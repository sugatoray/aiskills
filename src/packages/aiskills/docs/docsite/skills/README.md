# Bundled skills

Every skill in this version of the package (13 skills in 7 groups), with what it does and how to install it.

Install them all with `aiskills install`, or pick by group (`-G`), by name (`-s`) or by [pattern](../reference/patterns.md). `aiskills groups` shows the same grouping for the version you have installed.

## scrolls-skills

Alias `scrolls`. Install the group with `aiskills install -G scrolls`.

| Skill | Version | What it does |
| --- | --- | --- |
| [`scrolls-help`](scrolls-help.md) | 2.4.0 | Shows a crisp, example-driven reference for the whole scrolls skill family (/scrolls-setup, /scrolls-update, /scrolls-hide, /scrolls-unhide,… |
| [`scrolls-hide`](scrolls-hide.md) | 2.4.0 | Converts an already-set-up docs/scrolls/ working-memory folder from visible (scrolls) to dotfile-hidden (.scrolls), renaming the folder and rewriting the… |
| [`scrolls-remove`](scrolls-remove.md) | 2.4.0 | Removes a docs/.scrolls/ (or docs/scrolls/) project-memory system from a git repository — the exact opposite of /scrolls-setup. |
| [`scrolls-restore`](scrolls-restore.md) | 2.4.0 | Restores a docs/.scrolls/ (or docs/scrolls/) project-memory system from git history — the counterpart to /scrolls-remove. |
| [`scrolls-setup`](scrolls-setup.md) | 2.4.0 | Sets up a minimal docs/.scrolls/ working-memory system for a project — a small set of cross-session memory files (STARTER.md, SPEC.md, HANDOFF.md,… |
| [`scrolls-unhide`](scrolls-unhide.md) | 2.4.0 | Converts an already-set-up docs/.scrolls/ working-memory folder from dotfile-hidden (.scrolls) to visible (scrolls), renaming the folder and rewriting the… |
| [`scrolls-update`](scrolls-update.md) | 2.4.0 | Updates an existing docs/.scrolls/ project-memory system (STARTER.md, SPEC.md, HANDOFF.md, GAP_ANALYSIS.md, GAP_CONTEXT.md, PLAN.md, WISDOM.md, and any… |

## stata-skills

Alias `stata`. Install the group with `aiskills install -G stata`.

| Skill | Version | What it does |
| --- | --- | --- |
| [`stata-recipes`](stata-recipes.md) | 1.3.2 | Turns a plain-language description of a data/statistics task into correct, runnable Stata code — a .do file or command sequence, not pseudocode. |

## repo-related-skills

Alias `repo-related`. Install the group with `aiskills install -G repo-related`.

| Skill | Version | What it does |
| --- | --- | --- |
| [`create-issues-update-pr`](create-issues-update-pr.md) | 1.3.0 | Files GitHub issue(s) for work already done (or about to be done) on a branch/PR, grouping related issues under a parent epic when there's a genuine… |

## docs-skills

Alias `docs`. Install the group with `aiskills install -G docs`.

| Skill | Version | What it does |
| --- | --- | --- |
| [`create-lib-docs`](create-lib-docs.md) | 1.2.0 | Writes top-grade, verified user documentation for a library, CLI or framework as a folder of Markdown pages plus SVG diagrams, structured the way FastAPI,… |

## diagrams-skills

Alias `diagrams`. Install the group with `aiskills install -G diagrams`.

| Skill | Version | What it does |
| --- | --- | --- |
| [`network-flow`](network-flow.md) | 1.0.0 | Create working interactive network and architecture diagrams with moving packets, orthogonal connections, scenario playback, and selectable nodes. |

## personas-skills

Alias `personas`. Install the group with `aiskills install -G personas`.

| Skill | Version | What it does |
| --- | --- | --- |
| [`prodigy`](prodigy.md) | 1.0.0 | Act as the top performer in a given role or field and produce a five-part playbook: (1) how they understand the problem, constraints, stakeholders and… |

## video-related-skills

Alias `video-related`. Install the group with `aiskills install -G video-related`.

| Skill | Version | What it does |
| --- | --- | --- |
| [`dynamic-promo-video`](dynamic-promo-video.md) | 1.4.2 | Build a short narrated promo/intro video (HTML scenes, zoom/tilt, voiceover, music) for a library, app or product. |

This section is generated from the skills' own `SKILL.md` files by `npm run docs:skills`.

See also: [Skill groups](../concepts/skill-groups.md) · [1. Install a group](../tutorial/01-install-a-group.md)
