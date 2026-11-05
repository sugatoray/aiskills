# scrolls-remove

Removes a scrolls project-memory system from a git repository, and is
the opposite of `/scrolls-setup`. It deletes `docs/.scrolls/` (or
`docs/scrolls/`) and `SCROLLS.md`, strips the scrolls pointers out of
`CLAUDE.md` and `AGENTS.md` (deleting them only if nothing else is left),
and records it all as one `maint(memory): scrolls-removed` commit that
names the commit before it, so the removal can always be undone.

Run it with `/scrolls-remove`. For the full flag reference and usage
examples, run `/scrolls-help`.

## Layout

```
scrolls-remove/
├── agents/
│   └── openai.yaml
├── meta/
│   └── MAINTAINERS.md
├── scripts/
│   ├── remove.ps1
│   ├── remove.py
│   └── remove.sh
├── tests/
│   ├── test_remove.ps1
│   └── test_remove.sh
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
separate install step). Every form below is entirely command-line and
follows the same pattern as the other `scrolls-*` skills' READMEs.

**Pick skills interactively, global or local** — omit `--skill`/`--yes`
and the CLI prompts you to choose the agent and which skills to install;
select all seven `scrolls-*` skills (or just `scrolls-remove`) at the prompt:

```
npx skills add sugatoray/aiskills              # project-level
npx skills add sugatoray/aiskills --global      # user-level
```

**Just this skill, global or local:**

```
npx skills add sugatoray/aiskills --skill scrolls-remove --global   # global
npx skills add sugatoray/aiskills --skill scrolls-remove            # local
```

**Fully unattended, every scrolls-* skill, global or project:**

```
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide scrolls-remove scrolls-restore --yes            # project
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide scrolls-remove scrolls-restore --global --yes   # global
```

**Fully unattended, just this skill, global or project:**

```
npx skills add sugatoray/aiskills --skill scrolls-remove --yes            # project
npx skills add sugatoray/aiskills --skill scrolls-remove --global --yes   # global
```

No `--agent` flag needed in the unattended forms above — they install to
whichever agents the CLI finds already set up on your machine, the same
set the interactive prompt would show pre-checked. Pass `--agent
<name(s)>` (or `'*'` for every supported agent) only to override that
detection.

**From a local clone (repo already checked out):**

```
cd /path/to/aiskills
npx skills add . --skill scrolls-remove --yes
```

Swap `sugatoray/aiskills` for `<owner>/<repo>` to install from a fork, or
append `#<branch>` to install from a specific branch instead of the
default one.

License: MIT
