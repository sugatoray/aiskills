# agent-sessions-insight

Analyze how often and for what kinds of work the user uses their coding agents (Claude Code, Codex CLI, Pi, OpenCode, GitHub Copilot CLI, Devin CLI, Grok CLI, or any other agent that writes JSONL session logs), from the session logs on their own machine, and present it as one tabbed, offline HTML report: sessions, active days, prompts, session length, busiest months/weekdays/hours, projects, tools, slash commands, test runs, doc-file edits, and a per-agent split. Use when the user invokes /agent-sessions-insight (or $agent-sessions-insight, /skill:agent-sessions-insight), or asks how they use Claude Code, Codex, Pi, OpenCode, Copilot CLI, Devin or Grok, how often, what they use it for, or for a usage review of their coding agents. Read-only and offline: it never changes the agents' data and sends nothing anywhere.

| Property | Value |
| --- | --- |
| Group | `productivity-skills` (alias `productivity`) |
| Version | 1.0.0 |
| Starts | When you ask for it: you type `/agent-sessions-insight` (your agent doesn't start it on its own) |
| Needs | Python 3.9+ (stdlib only) to read the logs; any modern browser to view the report; optional pytest to run the bundled tests. Works from any agent that can run a shell command and write a file: Claude Code, Codex CLI, GitHub Copilot CLI, Pi, OpenCode, Devin CLI, Grok CLI, Hermes |
| License | MIT |
| Source | [skills/productivity/agent-sessions-insight](https://github.com/sugatoray/aiskills/tree/master/skills/productivity/agent-sessions-insight) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s agent-sessions-insight -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: agent-sessions-insight
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill agent-sessions-insight --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `productivity-skills` group:

```bash
aiskills install -G productivity -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s agent-sessions-insight
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/agent-sessions-insight/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/agent-sessions-insight.html`
- `meta/MAINTAINERS.md`
- `meta/SECURITY.md`
- `pytest.ini`
- `scripts/build_report.py`
- `scripts/collect.py`
- `scripts/make_demo.py`
- `tests/test_build_report.py`
- `tests/test_collect.py`
- `tests/test_make_demo.py`
- `tests/test_report_page.py`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/productivity/agent-sessions-insight/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/productivity/agent-sessions-insight/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
