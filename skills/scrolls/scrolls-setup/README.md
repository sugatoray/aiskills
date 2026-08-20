# scrolls-setup

Sets up `docs/.scrolls/` for a project that doesn't have it yet: `STARTER.md`,
`SPEC.md`, `HANDOFF.md`, `GAP_ANALYSIS.md`, `GAP_CONTEXT.md`, `PLAN.md`,
`WISDOM.md`, plus `SCROLLS.md`, a short `CLAUDE.md` pointer to it, and a
matching `AGENTS.md` pointer to `CLAUDE.md`.

Run it with `/scrolls-setup`. For the full flag reference and usage
examples, run `/scrolls-help`.

## Layout

```
scrolls-setup/
├── agents/
│   └── openai.yaml
├── assets/
│   └── templates/
│       ├── AGENTS_MD_BLOCK.md
│       ├── CLAUDE_MD_BLOCK.md
│       ├── GAP_ANALYSIS.md
│       ├── GAP_CONTEXT.md
│       ├── HANDOFF.md
│       ├── PLAN.md
│       ├── SCROLLS_MD_BLOCK.md
│       ├── SPEC.md
│       ├── STARTER.md
│       └── WISDOM.md
├── meta/
│   └── MAINTAINERS.md
├── CHANGELOG.md
├── README.md
└── SKILL.md
```

- **Runtime instructions**: [`SKILL.md`](SKILL.md)
- **Development notes**: [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md)
- **Version history**: [`CHANGELOG.md`](CHANGELOG.md)
- **Skill family**: [`../README.md`](../README.md)

## Installing

Install with the [`skills` CLI](https://skills.sh/) (`npx skills ...`, no
separate install step). Every form below is entirely command-line and was
run and verified against this repository before being written down here.

**Pick skills interactively, global or local** — omit `--skill`/`--yes`
and the CLI prompts you to choose the agent and which skills to install;
select all five `scrolls-*` skills (or just `scrolls-setup`) at the prompt:

```
npx skills add sugatoray/aiskills              # project-level
npx skills add sugatoray/aiskills --global      # user-level
```

**Just this skill, global or local:**

```
npx skills add sugatoray/aiskills --skill scrolls-setup --global   # global
npx skills add sugatoray/aiskills --skill scrolls-setup            # local
```

**Fully unattended, every scrolls-* skill, global or project:**

```
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide --yes            # project
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide --global --yes   # global
```

**Fully unattended, just this skill, global or project:**

```
npx skills add sugatoray/aiskills --skill scrolls-setup --yes            # project
npx skills add sugatoray/aiskills --skill scrolls-setup --global --yes   # global
```

No `--agent` flag needed in the unattended forms above — they install to
whichever agents the CLI finds already set up on your machine, the same
set the interactive prompt would show pre-checked. Pass `--agent
<name(s)>` (or `'*'` for every supported agent) only to override that
detection.

**From a local clone (repo already checked out):**

```
cd /path/to/aiskills
npx skills add . --skill scrolls-setup --yes
```

Swap `sugatoray/aiskills` for `<owner>/<repo>` to install from a fork, or
append `#<branch>` to install from a specific branch instead of the
default one.

License: MIT
