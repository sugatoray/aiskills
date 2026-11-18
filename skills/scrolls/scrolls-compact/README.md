# scrolls-compact

Compacts the history in a scrolls project-memory system at a point in
time. It condenses the old parts of `SPEC.md`, `PLAN.md`, `HANDOFF.md`,
`GAP_ANALYSIS.md` and `GAP_CONTEXT.md` (found with `git blame`), keeps
open tickets, gaps and threads word for word, and records it all as one
`maint(memory): scrolls-compacted` commit that names the **checkpoint**:
the commit just before, where the full older text stays. Each compaction
adds a report under `compacted/` and a row to `COMPACT.md`, and
`--list`/`--show`/`--extract` read the old text back out of git.

Run it with `/scrolls-compact`. For the full flag reference and usage
examples, run `/scrolls-help`.

## Layout

```
scrolls-compact/
├── agents/
│   └── openai.yaml
├── assets/
│   ├── EXAMPLES.md               the index: one table row per example
│   ├── example-viewer.html       the index and every example, one tab each (built)
│   ├── examples/
│   │   └── example_001.md … example_023.md
│   └── templates/
│       └── COMPACT.md
├── meta/
│   ├── DESIGN.md
│   └── MAINTAINERS.md
├── scripts/
│   ├── build_example_viewer.py   builds assets/example-viewer.html (maintenance only)
│   ├── compact.ps1
│   ├── compact.py
│   └── compact.sh
├── tests/
│   ├── browser/
│   │   └── check_example_viewer.cjs
│   ├── check_example_viewer.py
│   ├── check_examples.py
│   ├── test_compact.ps1
│   ├── test_compact.sh
│   ├── test_example_viewer.sh
│   └── test_examples.sh
├── CHANGELOG.md
├── README.md
└── SKILL.md
```

- **Runtime instructions**: [`SKILL.md`](SKILL.md)
- **Examples**: [`assets/EXAMPLES.md`](assets/EXAMPLES.md), the index, and one file per example in [`assets/examples/`](assets/examples/): 23 examples, each with a premise, caveats, the prompt and its real output, covering every flag, refusal and exit code; checked by `tests/test_examples.sh`. [`assets/example-viewer.html`](assets/example-viewer.html) shows the index and every example on one page, one tab each, rendered or as Markdown
- **Design**: [`meta/DESIGN.md`](meta/DESIGN.md): why it works the way it does
- **Development notes**: [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md)
- **Version history**: [`CHANGELOG.md`](CHANGELOG.md)
- **Skill family**: [`../README.md`](../README.md)

## Installing

Install with the [`skills` CLI](https://skills.sh/) (`npx skills ...`, no
separate install step). Every form below is entirely command-line and
follows the same pattern as the other `scrolls-*` skills' READMEs.

**Pick skills interactively, global or local** — omit `--skill`/`--yes`
and the CLI prompts you to choose the agent and which skills to install;
select all nine `scrolls-*` skills (or just `scrolls-compact`) at the prompt:

```
npx skills add sugatoray/aiskills              # project-level
npx skills add sugatoray/aiskills --global      # user-level
```

**Just this skill, global or local:**

```
npx skills add sugatoray/aiskills --skill scrolls-compact --global   # global
npx skills add sugatoray/aiskills --skill scrolls-compact            # local
```

**Fully unattended, every scrolls-* skill, global or project:**

```
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide scrolls-remove scrolls-restore scrolls-compact scrolls-explainer --yes            # project
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide scrolls-remove scrolls-restore scrolls-compact scrolls-explainer --global --yes   # global
```

**Fully unattended, just this skill, global or project:**

```
npx skills add sugatoray/aiskills --skill scrolls-compact --yes            # project
npx skills add sugatoray/aiskills --skill scrolls-compact --global --yes   # global
```

No `--agent` flag needed in the unattended forms above — they install to
whichever agents the CLI finds already set up on your machine, the same
set the interactive prompt would show pre-checked. Pass `--agent
<name(s)>` (or `'*'` for every supported agent) only to override that
detection.

**From a local clone (repo already checked out):**

```
cd /path/to/aiskills
npx skills add . --skill scrolls-compact --yes
```

Swap `sugatoray/aiskills` for `<owner>/<repo>` to install from a fork, or
append `#<branch>` to install from a specific branch instead of the
default one.

License: MIT
