# scrolls (pointer)

This is not where the `scrolls` skill artifacts live. They live under
`skills/scrolls/` at the repository root — read that directory (and its
own `README.md`) for the actual skills, scripts, tests, and docs.

Everything under `skills/scrolls/` is built and changed using Red/Green
TDD: write or update a failing test in the relevant skill's `tests/`
first, confirm it fails for the right reason, then make it pass.

## Access Scrolls Agentic Memory

See @SCROLLS.md.

## Installing

Install the `scrolls` skills with the [`skills` CLI](https://skills.sh/)
(`npx skills ...`, no install step of its own needed). Every form below
is entirely command-line — no interactive prompts, safe to run
unattended — and was run and verified against this repository before
being written down here.

**Local (project-level), Claude Code only:**

```
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide --agent claude-code --yes
```

Installs into `./.claude/skills/` and writes `./skills-lock.json`,
relative to whatever directory you run it from.

**Global (user-level), Claude Code only** — same command, add
`-g`/`--global`:

```
npx skills add sugatoray/aiskills --skill scrolls-help scrolls-setup scrolls-update scrolls-hide scrolls-unhide --agent claude-code --global --yes
```

Installs into `~/.claude/skills/` instead, independent of the current
directory.

**Every skill, every agent the CLI supports, in one shot** — `--all` is
shorthand for `--skill '*' --agent '*' -y`, so no other flags are
needed:

```
npx skills add sugatoray/aiskills --all            # project-level
npx skills add sugatoray/aiskills --all --global    # user-level
```

A handful of agents don't support global-scope installs (e.g. Eve,
PromptScript, as of this writing) — the `--all --global` form reports
and skips just those, and still succeeds for every other agent.

Swap `sugatoray/aiskills` for `<owner>/<repo>` to install from a fork, or
append `#<branch>` (e.g. `sugatoray/aiskills#some-branch`) to install
from a specific branch instead of the default one — both verified.
