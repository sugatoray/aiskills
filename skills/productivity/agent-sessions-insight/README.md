# agent-sessions-insight

Shows how you use your coding agents. It reads the session logs already on your machine (Claude Code, Codex CLI, Pi, OpenCode, GitHub Copilot CLI, Devin CLI, or any agent that writes JSONL), counts them, and the agent turns the numbers into one tabbed, offline HTML report: how often you use agents, for what kinds of work, with which tools and habits, and where the friction is.

It is read-only and offline. It never changes an agent's data folder and sends nothing anywhere.

## Install

```bash
npx skills add sugatoray/aiskills --skill agent-sessions-insight
```

Or, in Claude Code, run `/plugin marketplace add sugatoray/aiskills`, then `/plugin install productivity-skills@sugatoray`.

## Ask for a report

```text
/agent-sessions-insight --days 90
```

| Agent | Invoke as |
| --- | --- |
| Claude Code, OpenCode | `/agent-sessions-insight` |
| Codex CLI | `$agent-sessions-insight` |
| Pi | `/skill:agent-sessions-insight` |
| Copilot CLI, Devin CLI and others | Ask for "agent-sessions-insight" by name |

Options: `--days N` (default 180), `--agents claude-code,codex,pi,opencode,copilot-cli,devin`, `--extra NAME=PATH` (repeatable; read another agent's JSONL folder, e.g. `--extra hermes=~/.hermes/sessions`), and `--output` (the HTML path).

You get `agent-sessions-insight.html`, `agent-sessions-insight-data.json` (the counted numbers) and `agent-sessions-insight-insights.json` (the agent's reading) in the working directory.

To see what a report looks like first, open [`assets/agent-sessions-insight.html`](assets/agent-sessions-insight.html) in a browser: the template ships with made-up demo data. Or ask for `/agent-sessions-insight --demo`.

To collect the numbers yourself, without an agent:

```bash
python3 scripts/collect.py --days 180 --out agent-sessions-insight-data.json
python3 scripts/build_report.py --data agent-sessions-insight-data.json   # numbers only, no reading
```

`build_report.py` fills the bundled template with the numbers and, with `--insights FILE`, the agent's reading. The page is one offline file with eight tabs: Overview, Frequency, Kinds of work, Habits, Friction, Agents, Exact numbers and Data.

## What it reads

| Agent | Folder (under your home) |
| --- | --- |
| Claude Code | `.claude/projects/` |
| Codex CLI | `.codex/sessions/` |
| Pi | `.pi/agent/sessions/` |
| OpenCode | `.local/share/opencode/` (JSON storage and SQLite, opened read-only) |
| GitHub Copilot CLI | `.copilot/session-state/` |
| Devin CLI | `.local/share/devin/cli/` (`sessions/<id>/log.jsonl`, or the older `sessions.db`, opened read-only) |
| Anything else | The folder you pass with `--extra` |

Prompts are kept only as snippets of at most 160 characters. Nothing leaves your machine, and the skill doesn't publish the report unless you ask.

## Limits

- The OpenCode SQLite column names are inferred, and the Copilot CLI event schema is undocumented (the parser is tolerant, so prompt and tool counts may be zero). The Devin CLI log format is undocumented too; the adapter follows the layout other tools have observed, so its tool counts may be zero. Hermes has no documented format, so it uses the generic parser. Open an issue with a redacted sample if your logs don't parse.
- Session length is first to last event, so a session left open reads long.
- Agents may delete old logs, so a long window can undercount early months.
- "Kinds of work" and "friction" are the agent's reading of project names and first prompts. The Exact numbers tab holds the counted figures.

## Tests

```bash
python3 -m unittest discover -s tests -v   # stdlib only; the browser tests skip without Playwright
python3 -m pytest                          # same tests, if pytest is installed
pip install playwright                     # to run the browser tests too
```

See [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md) to add an agent and [`meta/SECURITY.md`](meta/SECURITY.md) for the privacy model.
