# scrolls-update

Updates an existing `docs/.scrolls/` to reflect what happened in the
current session, following each file's own update rule instead of
appending blindly. Also idempotently backfills `SCROLLS.md`/`CLAUDE.md`/
`AGENTS.md` for a project set up before those existed.

The counterpart to `/scrolls-setup` — run this one every session
afterward. For the full flag reference and usage examples, run
`/scrolls-help`.

## Layout

```
scrolls-update/
├── agents/
│   └── openai.yaml
├── meta/
│   └── MAINTAINERS.md
├── scripts/
│   ├── session_diff.ps1
│   └── session_diff.sh
├── tests/
│   ├── test_session_diff.ps1
│   └── test_session_diff.sh
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
select all five `scrolls-*` skills (or just `scrolls-update`) at the prompt:

```
npx skills add sugatoray/aiskills              # project-level
npx skills add sugatoray/aiskills --global      # user-level
```

**Just this skill, global or local:**

```
npx skills add sugatoray/aiskills --skill scrolls-update --global   # global
npx skills add sugatoray/aiskills --skill scrolls-update            # local
```

**Fully unattended, every scrolls-* skill, global or project:**

```
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide --yes            # project
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide --global --yes   # global
```

**Fully unattended, just this skill, global or project:**

```
npx skills add sugatoray/aiskills --skill scrolls-update --yes            # project
npx skills add sugatoray/aiskills --skill scrolls-update --global --yes   # global
```

No `--agent` flag needed in the unattended forms above — they install to
whichever agents the CLI finds already set up on your machine, the same
set the interactive prompt would show pre-checked. Pass `--agent
<name(s)>` (or `'*'` for every supported agent) only to override that
detection.

**From a local clone (repo already checked out):**

```
cd /path/to/aiskills
npx skills add . --skill scrolls-update --yes
```

Swap `sugatoray/aiskills` for `<owner>/<repo>` to install from a fork, or
append `#<branch>` to install from a specific branch instead of the
default one.

License: MIT
