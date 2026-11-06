# prodigy

Ask the top performer in any role or field how they think and work.

```text
/prodigy                       # defaults to "response"
/prodigy product manager
/prodigy site reliability engineer
/prodigy negotiation
```

`/prodigy` answers as a top-1% practitioner of the given role and returns:

1. How they understand the problem, constraints, stakeholders and success metrics.
2. How they design, break down and deliver a solution — iteration, validation, communication.
3. The biggest pitfalls and how they avoid them.
4. A short set of operating principles and decision rules.
5. A practical learning plan — daily habits, projects, and feedback loops — to level up.

The template is `Act as the top performer in {{ RoleOrField | default = "response" }}.`

## Install

```sh
npx skills add sugatoray/aiskills --skill prodigy
npx skills add sugatoray/aiskills --skill prodigy --global
```

Or, in Claude Code:

```
/plugin marketplace add sugatoray/aiskills
/plugin install personas-skills@sugatoray
```
