# scrolls-help

Crisp, example-driven reference for the whole scrolls skill family —
what each command does, their shared flags, and common usage examples.
Supports `-e`/`--online` to serve it as a styled local page instead of
chat text.

Run it with `/scrolls-help`.

## Layout

```
scrolls-help/
├── agents/
│   └── openai.yaml
├── meta/
│   ├── MAINTAINERS.md
│   └── SECURITY.md
├── references/
│   └── HELP.md
├── scripts/
│   ├── open_help.ps1
│   ├── open_help.sh
│   └── serve_help.py
├── tests/
│   ├── test_open_help.ps1
│   └── test_open_help.sh
├── CHANGELOG.md
├── README.md
└── SKILL.md
```

- **Runtime instructions**: [`SKILL.md`](SKILL.md)
- **Reference content**: [`references/HELP.md`](references/HELP.md)
- **Development notes**: [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md)
- **Security posture**: [`meta/SECURITY.md`](meta/SECURITY.md)
- **Version history**: [`CHANGELOG.md`](CHANGELOG.md)
- **Skill family**: [`../README.md`](../README.md)

## Installing

Install with the [`skills` CLI](https://skills.sh/) (`npx skills ...`, no
separate install step). Every form below is entirely command-line and was
run and verified against this repository before being written down here.

**Pick skills interactively, global or local** — omit `--skill`/`--yes`
and the CLI prompts you to choose the agent and which skills to install;
select all five `scrolls-*` skills (or just `scrolls-help`) at the prompt:

```
npx skills add sugatoray/aiskills              # project-level
npx skills add sugatoray/aiskills --global      # user-level
```

**Just this skill, global or local:**

```
npx skills add sugatoray/aiskills --skill scrolls-help --global   # global
npx skills add sugatoray/aiskills --skill scrolls-help            # local
```

**Fully unattended, every scrolls-* skill, global or project:**

```
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide --yes            # project
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide --global --yes   # global
```

**Fully unattended, just this skill, global or project:**

```
npx skills add sugatoray/aiskills --skill scrolls-help --yes            # project
npx skills add sugatoray/aiskills --skill scrolls-help --global --yes   # global
```

No `--agent` flag needed in the unattended forms above — they install to
whichever agents the CLI finds already set up on your machine, the same
set the interactive prompt would show pre-checked. Pass `--agent
<name(s)>` (or `'*'` for every supported agent) only to override that
detection.

**From a local clone (repo already checked out):**

```
cd /path/to/aiskills
npx skills add . --skill scrolls-help --yes
```

Swap `sugatoray/aiskills` for `<owner>/<repo>` to install from a fork, or
append `#<branch>` to install from a specific branch instead of the
default one.

License: MIT
