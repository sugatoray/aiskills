# create-issues-update-pr

Files GitHub issue(s) for work already done (or about to be done) on a branch/PR, grouping related issues under a parent epic when there's a genuine hierarchy — using GitHub's native parent/child issue relationship, not just labels — and then updates that pull request's title (kept short) and description so the description lists every issue in the exact format '- Closes #{{issue-number}} -- {{issue-title}}', indented to match parent-child nesting. Use this whenever the user asks to file issue(s) for a PR, 'add gh issues for this', 'track this as issues', link a PR to tracking issues, or update a PR's title/description to list the issues covering its changes — including when they invoke /create-issues-update-pr directly. Also trigger when a PR description is stale or generic relative to its actual current commits and the user wants it brought up to date alongside issue creation.

| Property | Value |
| --- | --- |
| Group | `repo-related-skills` (alias `repo-related`) |
| Version | 1.3.0 |
| Starts | When you type `/create-issues-update-pr`, or your agent uses it when a task fits its description |
| Needs | GitHub MCP server tools with write access to the target repository: issue_write, sub_issue_write, list_issue_types, search_issues/list_issues, pull_request_read, update_pull_request. Works against any GitHub repository the current session has push/write access to, not just this one. |
| License | MIT |
| Source | [skills/development/repo-related/create-issues-update-pr](https://github.com/sugatoray/aiskills/tree/master/skills/development/repo-related/create-issues-update-pr) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s create-issues-update-pr -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: create-issues-update-pr
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill create-issues-update-pr --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `repo-related-skills` group:

```bash
aiskills install -G repo-related -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s create-issues-update-pr
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/create-issues-update-pr/`:

- `.claude-plugin/plugin.json`
- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/claude-code.yaml`
- `agents/openai.yaml`
- `meta/MAINTAINERS.md`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/development/repo-related/create-issues-update-pr/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/development/repo-related/create-issues-update-pr/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
