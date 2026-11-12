# scrolls-restore

Restores a scrolls project-memory system from git history, as the
counterpart to `/scrolls-remove`. By default it finds the newest removal
checkpoint and brings back exactly what was removed. It can also take any
commit, and `--onto` mounts the memory on another branch. Only the memory
comes back (the scrolls folders and pointer stubs); the rest of the
repository keeps its current state.

Run it with `/scrolls-restore`. For the full flag reference and usage
examples, run `/scrolls-help`.

## Layout

```
scrolls-restore/
├── agents/
│   └── openai.yaml
├── assets/
│   └── EXAMPLES.md
├── meta/
│   └── MAINTAINERS.md
├── scripts/
│   ├── restore.ps1
│   ├── restore.py
│   └── restore.sh
├── tests/
│   ├── test_restore.ps1
│   └── test_restore.sh
├── CHANGELOG.md
├── README.md
└── SKILL.md
```

- **Runtime instructions**: [`SKILL.md`](SKILL.md)
- **Examples**: [`assets/EXAMPLES.md`](assets/EXAMPLES.md): premise, usage, caveats and expected output for each common scenario
- **Development notes**: [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md)
- **Version history**: [`CHANGELOG.md`](CHANGELOG.md)
- **Skill family**: [`../README.md`](../README.md)

## Installing

Install with the [`skills` CLI](https://skills.sh/) (`npx skills ...`, no
separate install step). Every form below is entirely command-line and
follows the same pattern as the other `scrolls-*` skills' READMEs.

**Pick skills interactively, global or local** — omit `--skill`/`--yes`
and the CLI prompts you to choose the agent and which skills to install;
select all eight `scrolls-*` skills (or just `scrolls-restore`) at the prompt:

```
npx skills add sugatoray/aiskills              # project-level
npx skills add sugatoray/aiskills --global      # user-level
```

**Just this skill, global or local:**

```
npx skills add sugatoray/aiskills --skill scrolls-restore --global   # global
npx skills add sugatoray/aiskills --skill scrolls-restore            # local
```

**Fully unattended, every scrolls-* skill, global or project:**

```
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide scrolls-remove scrolls-restore scrolls-explainer --yes            # project
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide scrolls-remove scrolls-restore scrolls-explainer --global --yes   # global
```

**Fully unattended, just this skill, global or project:**

```
npx skills add sugatoray/aiskills --skill scrolls-restore --yes            # project
npx skills add sugatoray/aiskills --skill scrolls-restore --global --yes   # global
```

No `--agent` flag needed in the unattended forms above — they install to
whichever agents the CLI finds already set up on your machine, the same
set the interactive prompt would show pre-checked. Pass `--agent
<name(s)>` (or `'*'` for every supported agent) only to override that
detection.

**From a local clone (repo already checked out):**

```
cd /path/to/aiskills
npx skills add . --skill scrolls-restore --yes
```

Swap `sugatoray/aiskills` for `<owner>/<repo>` to install from a fork, or
append `#<branch>` to install from a specific branch instead of the
default one.

License: MIT
