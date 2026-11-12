# scrolls-explainer

Writes `scrolls-explainer.html`: an interactive, offline page that shows
how the scrolls skill family works. Each command gets a tab that animates
what it does, step by step, with a callout explaining each step. You can
drive it all from the keyboard.

Run it with `/scrolls-explainer`.

## Layout

```
scrolls-explainer/
├── agents/
│   └── openai.yaml
├── assets/
│   ├── EXAMPLES.md
│   └── scrolls-explainer.html
├── meta/
│   ├── generator/
│   │   ├── build.py
│   │   ├── enhance.py
│   │   └── graph.json
│   └── MAINTAINERS.md
├── scripts/
│   ├── explain.ps1
│   ├── explain.py
│   └── explain.sh
├── tests/
│   ├── browser/
│   │   └── check_page.cjs
│   ├── test_explain.ps1
│   └── test_explain.sh
├── CHANGELOG.md
├── README.md
└── SKILL.md
```

- **Runtime instructions**: [`SKILL.md`](SKILL.md)
- **Examples**: [`assets/EXAMPLES.md`](assets/EXAMPLES.md): premise, usage, caveats and expected output for each common scenario
- **The page**: [`assets/scrolls-explainer.html`](assets/scrolls-explainer.html) (prebuilt; open it in any browser)
- **Development notes**: [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md)
- **Version history**: [`CHANGELOG.md`](CHANGELOG.md)
- **Skill family**: [`../README.md`](../README.md)

## Installing

Install with the [`skills` CLI](https://skills.sh/) (`npx skills ...`, no
separate install step).

**Pick skills interactively, global or local** — omit `--skill`/`--yes`
and the CLI prompts you to choose the agent and which skills to install;
select all eight `scrolls-*` skills (or just `scrolls-explainer`) at the
prompt:

```
npx skills add sugatoray/aiskills              # project-level
npx skills add sugatoray/aiskills --global      # user-level
```

**Just this skill, global or local:**

```
npx skills add sugatoray/aiskills --skill scrolls-explainer --global   # global
npx skills add sugatoray/aiskills --skill scrolls-explainer            # local
```

**Fully unattended, every scrolls-* skill, global or project:**

```
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide scrolls-remove scrolls-restore scrolls-explainer --yes            # project
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide scrolls-remove scrolls-restore scrolls-explainer --global --yes   # global
```

**Fully unattended, just this skill, global or project:**

```
npx skills add sugatoray/aiskills --skill scrolls-explainer --yes            # project
npx skills add sugatoray/aiskills --skill scrolls-explainer --global --yes   # global
```

No `--agent` flag needed in the unattended forms above — they install to
whichever agents the CLI finds already set up on your machine. Pass
`--agent <name(s)>` (or `'*'` for every supported agent) only to override
that detection.

**From a local clone (repo already checked out):**

```
cd /path/to/aiskills
npx skills add . --skill scrolls-explainer --yes
```

Swap `sugatoray/aiskills` for `<owner>/<repo>` to install from a fork, or
append `#<branch>` to install from a specific branch instead of the
default one.

License: MIT
