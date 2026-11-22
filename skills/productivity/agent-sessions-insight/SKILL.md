---
name: agent-sessions-insight
description: "Analyze how often and for what kinds of work the user uses their coding agents (Claude Code, Codex CLI, Pi, OpenCode, GitHub Copilot CLI, Devin CLI, Grok CLI, or any other agent that writes JSONL session logs), from the session logs on their own machine, and present it as one tabbed, offline HTML report: sessions, active days, prompts, session length, busiest months/weekdays/hours, projects, tools, slash commands, test runs, doc-file edits, and a per-agent split. Use when the user invokes /agent-sessions-insight (or $agent-sessions-insight, /skill:agent-sessions-insight), or asks how they use Claude Code, Codex, Pi, OpenCode, Copilot CLI, Devin or Grok, how often, what they use it for, or for a usage review of their coding agents. Read-only and offline: it never changes the agents' data and sends nothing anywhere."
license: MIT
compatibility: "Python 3.9+ (stdlib only) to read the logs; any modern browser to view the report; optional pytest to run the bundled tests. Works from any agent that can run a shell command and write a file: Claude Code, Codex CLI, GitHub Copilot CLI, Pi, OpenCode, Devin CLI, Grok CLI, Hermes"
disable-model-invocation: true
metadata:
  name: agent-sessions-insight
  type: skill
  author: sugatoray
  version: "1.0.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/productivity/agent-sessions-insight"
---

# Agent sessions insight

Turn the session logs a coding agent already keeps into a report about how the user
works with it. The numbers come from `scripts/collect.py`; you add the reading of them.
Never count by hand and never estimate a number you can compute.

Leave `README.md`, `CHANGELOG.md`, `meta/` and `scripts/make_demo.py` (it rebuilds the bundled demo) for maintainers. Read
`meta/MAINTAINERS.md` only when changing the collector or adding an agent.

## Rules

1. **Read-only.** Never write into, move or delete anything under an agent's data folder (`~/.claude`, `~/.codex`, `~/.pi`, `~/.local/share/opencode`, `~/.copilot`, `~/.local/share/devin`, `~/.grok`, …). The collector only reads. Write the outputs to the current working directory.
2. **Offline.** Make no network calls. The report is one self-contained HTML file with inline CSS and JS: no CDN, no web fonts, no `fetch`.
3. **Private by default.** Session logs hold prompts, file paths and project names. Don't publish, upload or share the report, and don't paste prompt text into chat beyond the short snippets the collector keeps (160 characters), unless the user asks. If an artifact or sharing tool exists, tell the user the report is local and offer it; don't publish unasked.
4. **Exact vs judged.** Counts the collector returns are exact. Anything you infer (what kind of work a project is, a habit, a friction point) is your reading: label it as judgement and base it on the visible evidence (project names, first prompts, tools, slash commands).
5. **Say what's missing.** If an agent has no logs or the logs are thin, say so. Don't fill the gap with guesses.

## Invocation

`/agent-sessions-insight [options]`. Use the form your agent supports: `/agent-sessions-insight` (Claude Code, Pi, OpenCode), `$agent-sessions-insight` (Codex CLI), `/skill:agent-sessions-insight` (Pi), or just ask for it by name.

| Option | Default | Contract |
| --- | --- | --- |
| `--days N` | `180` | Look-back window. Sessions that started earlier are ignored. |
| `--agents a,b` | All known agents that have logs | Limit to: `claude-code`, `codex`, `pi`, `opencode`, `copilot-cli`, `devin`, `grok`. |
| `--extra NAME=PATH` | None | Override where a known agent keeps its logs, or read another agent's JSONL folder with the generic parser (e.g. `--extra hermes=~/.hermes/sessions`). Repeatable. |
| `--output` | `agent-sessions-insight.html` in the working directory | Path of the HTML report. |
| `--demo` | Off | Skip collecting; write the bundled demo report (made-up data) with `build_report.py --demo`, so the user can see what they'll get. |

If the user names an agent that isn't known, use `--extra NAME=PATH` and ask where its logs live.

## 1. Check the environment

- Python 3.9+ must be available (`python3 --version`). If it isn't, say so and stop; don't hand-parse logs.
- Run the script from this skill's directory (the folder that contains `scripts/`).
- If the agent runs in a sandbox that can't see the user's home folder (a cloud session, a container), the logs aren't reachable. Say so, and give the user the command from step 2 to run locally, then ask them to attach the JSON it writes.

## 2. Collect

```bash
python3 scripts/collect.py --days 180 --out agent-sessions-insight-data.json
```

Add `--agents codex,pi` or `--extra NAME=PATH` as needed. `--home DIR` changes the base folder (default: the user's home).

| Exit code | Meaning | What to do |
| --- | --- | --- |
| `0` | Wrote the JSON and printed the summary | Continue |
| `1` | No sessions in the window | Say where it looked; offer a larger `--days` or an `--extra` path |
| `2` | Unknown agent name | Fix the name, or pass it with `--extra` |

Where each agent's logs are read from (relative to `--home`):

| Agent | Folder | Format |
| --- | --- | --- |
| Claude Code (`claude-code`) | `.claude/projects/<project>/<session>.jsonl` | JSONL |
| Codex CLI (`codex`) | `.codex/sessions/…/rollout-*.jsonl` | JSONL |
| Pi (`pi`) | `.pi/agent/sessions/…/*.jsonl` | JSONL |
| OpenCode (`opencode`) | `.local/share/opencode/storage/…` or its SQLite database | JSON files / SQLite (read-only) |
| GitHub Copilot CLI (`copilot-cli`) | `.copilot/session-state/<id>/events.jsonl` | JSONL; schema undocumented, tolerant parser |
| Devin CLI (`devin`) | `.local/share/devin/cli/sessions/<id>/log.jsonl` (+ `meta.json`), or the older `sessions.db` | JSONL / SQLite (read-only) |
| Grok CLI (`grok`) | `.grok/sessions/<encoded cwd>/<id>/updates.jsonl` (+ `summary.json`), or `chat_history.jsonl` | JSONL; subagent sessions skipped |
| Any other (`--extra NAME=PATH`) | The folder you give | Generic JSONL parser |

The JSON has two keys. `summary`: `window_days`, `sessions`, `active_days`, `prompts`, `first`, `last`, `median_minutes`, `longest_minutes`, `median_gap_days`, `longest_gap_days`, `per_agent`, `per_month`, `per_weekday`, `per_hour`, `projects`, `tools`, `commands`, `doc_edits`, `test_runs`. `sessions`: one row per session with `agent`, a shortened `id`, `project`, `start`, `minutes`, `prompts`, `first_prompt` (at most 160 characters), `top_tools` and `commands`.

## 3. Read the data

Before writing anything, work out these from the JSON and keep each as a sentence you can defend:

- **How often:** sessions, active days out of the window, median and longest gap between active days, busiest month, weekday and hour. Say whether use is daily, in bursts or occasional.
- **How long:** median and longest session in minutes, and prompts per session.
- **What for:** group projects and first prompts into a handful of kinds of work (for example building a tool, fixing a bug, docs and planning, research, refactoring, setup). Say which project names and first prompts led you to each group. This is judgement.
- **How:** the top tools, the slash commands, how many test runs there were relative to sessions, and edits to doc files (`CLAUDE.md`, `AGENTS.md`, `HANDOFF.md`, `MEMORY.md`, `SPEC.md`, `README.md`, `CHANGELOG.md`). Test runs next to heavy editing suggest a test-first habit; say it as a suggestion, not a fact.
- **Friction:** long sessions, long gaps, sessions with many prompts and few tool calls, repeated first prompts. Mark each as a possible friction point, not a conclusion.
- **Agents:** when more than one agent has sessions, compare how the user splits work between them.

## 4. Build the report

Don't write the HTML yourself. Put your reading from step 3 in a small JSON file, then let the build script fill the bundled template (`assets/agent-sessions-insight.html`) with it and the collector's numbers.

Write `agent-sessions-insight-insights.json` in the working directory. Every key is optional; leave one out rather than guess:

```json
{
  "overview": ["Three to five plain sentences: how often, what for, the habit or friction that stands out."],
  "kinds": [{"name": "Building features", "sessions": 30, "projects": ["taskq-cli"],
             "examples": ["Add a --json flag to the status command"], "evidence": "project names, first prompts"}],
  "habits": [{"title": "Tests next to edits", "detail": "126 test runs in 64 sessions.",
              "evidence": "pytest in Bash calls across billing-api and taskq-cli"}],
  "friction": [{"title": "Very long sessions.", "detail": "The longest ran 188 minutes.",
                "evidence": "taskq-cli, 22 Sep"}],
  "threads": [{"thread": "taskq-cli: sync on large repos", "next": "Profile it before changing the walker.",
               "when": "last seen 18 Nov"}],
  "agents": ["Only when more than one agent has sessions: how the work is split."],
  "caveat": "Which agents' logs were read, which weren't found, the window, and any format caveat below."
}
```

- `sessions` in `kinds` is your estimate; the counted figures stay in the summary.
- Give every habit and friction point an `evidence`: where it shows (projects, dates, a tab or chart). A habit can also be a plain sentence, but evidence makes it checkable.
- `threads` is work that looks unfinished: a session whose last prompts were mid-task, or a first prompt that keeps coming back. Say what the next step looks like. Leave it out if nothing stands out.
- `caveat` is shown at the top of the page as "What this is based on". Always write it: which agents' logs were read, which weren't found, the window, and any caveat from "Data caveats" below that applies.
- Copy prompt snippets only from `first_prompt`, never from anywhere else in the logs.

```bash
python3 scripts/build_report.py --data agent-sessions-insight-data.json \
  --insights agent-sessions-insight-insights.json --output agent-sessions-insight.html
```

| Exit code | Meaning | What to do |
| --- | --- | --- |
| `0` | Wrote the report | Continue |
| `2` | The data or insights JSON is invalid | Read the error (it names the key), fix the insights file, run again. Don't edit the collector's JSON by hand |

The page has eight tabs: Overview, Frequency (months stacked by agent), Kinds of work, Habits (numbered cards with evidence), Friction (with the open threads), Agents (shown only when more than one agent has sessions), Exact numbers, and Data (a filterable table of sessions). Counted figures are marked **exact** and your sentences **judgement**. It works offline, follows the system's light or dark setting with a button to override it, and fits a phone. To show the user what the report looks like before collecting anything, run `python3 scripts/build_report.py --demo --output agent-sessions-insight-demo.html`; it copies the template, which holds made-up demo data, byte for byte.

## 5. Verify

- Every number in your insights matches `summary` (spot-check at least five).
- If a browser tool is available, open the file and check each tab renders, with no console errors and no network requests.
- Don't edit the built HTML. To change it, change the insights file and build again.

## 6. Deliver

Give the user:

1. The HTML file (send or link it; don't paste its source), the data JSON and the insights JSON.
2. Four or five sentences: how often they use their agents, for what, and the one or two habits or friction points that stand out. Mark which statements are exact and which are your reading.
3. What's missing: agents with no logs, formats that were only partly read (see below), and the window used.

## Data caveats (say these when they apply)

- **OpenCode SQLite:** column names are inferred. A database whose tables differ is skipped, not guessed at; its JSON storage, if present, is still read.
- **Copilot CLI:** the event schema isn't documented. Dates, session counts and lengths should be reliable; prompt and tool counts may be zero.
- **Devin CLI:** the log format isn't documented; the adapter follows the layout other tools have observed (per-session `log.jsonl` in newer versions, `sessions.db` in older ones). Sessions, dates and prompts should be reliable; tool counts are read from assistant `tool_calls` and may be zero if your version records them elsewhere.
- **Grok CLI:** the log format isn't documented; the adapter follows the layout other tools have observed (one folder per session under `~/.grok/sessions/`, with `summary.json` and `updates.jsonl`). Subagent sessions are skipped, like Claude Code's sidechains. A session with only `chat_history.jsonl` has no per-message times, so its length is `created_at` to `updated_at`. If `GROK_HOME` moves the folder, pass `--extra grok=$GROK_HOME/sessions`.
- **Generic parser (Hermes and others):** reads timestamps, user messages and tool calls where they are recognisable. Treat its prompt and tool counts as approximate.
- **Session length** is first to last event in the log, so a session left open overnight reads as long.
- **Local time:** days, weekdays and hours use the machine's local timezone.
- **Retention:** an agent may delete old logs, so a long window can undercount early months.

## Extending to another agent (red/green)

To support an agent whose format the collector doesn't read yet, follow `meta/MAINTAINERS.md`: write a failing test with a fixture of the agent's log first, then the `parse_<agent>` function, then register it in `AGENTS`. For a one-off, try `--extra NAME=PATH` first; the generic parser may already be enough.
