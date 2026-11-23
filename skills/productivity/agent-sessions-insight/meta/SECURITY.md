# Security and privacy model

## What this is

A skill with two stdlib-only Python scripts and one HTML template. `collect.py` reads local session logs and writes one JSON file; `build_report.py` writes that JSON (and the agent's reading) into a copy of the template. Neither makes network calls.

## Trust boundaries

| Input | Source | Trusted? |
| --- | --- | --- |
| Agent session logs | Files written by the user's own agents | Data only. Parsed as JSON; never executed. Corrupt lines are skipped. |
| Prompt text inside logs | The user, or content an agent fetched | Data only. Shown with `textContent`, and capped at 160 characters in the output. |
| `--extra NAME=PATH` | The user | A folder to read. Nothing is written there. |

## Protections

1. **Read-only.** The collector never writes under an agent's folder, and OpenCode's SQLite database is opened read-only (`mode=ro`). Tested in `test_collector_never_writes_into_agent_folders`.
2. **No network.** The scripts have no networking imports, and the template loads nothing: no external scripts, styles, fonts or `fetch` (a test checks this, and the browser tests fail on any network request).
3. **Minimal prompt retention.** Only the first prompt of each session is kept, as a single line of at most 160 characters. Tested in `test_first_prompt_is_truncated_and_single_line`.
4. **No unasked sharing.** The skill tells the agent not to publish or upload the report. The JSON and HTML contain project names, paths and prompt snippets, so treat them as private.
5. **Safe embedding.** `build_report.py` escapes every `<` in the embedded JSON as `\u003c`, and the template sets all text with `textContent` (a test forbids `innerHTML`, `outerHTML`, `insertAdjacentHTML` and `document.write`). A browser test feeds HTML and a closing script tag through every text field and checks nothing runs.
6. **Graceful failure.** Unknown SQLite schemas and corrupt files are skipped, not guessed at.

6. **Browser storage holds one preference only.** The page's theme button remembers Auto, Light or Dark in `localStorage`; nothing else is stored, and the page works the same if storage is blocked.

## Reporting an issue

Open an issue on https://github.com/sugatoray/aiskills. Don't attach real session logs; redact paths and prompts first.
