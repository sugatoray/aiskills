# Maintainers' notes

## Ground rules

- **Stdlib only, read-only, offline.** `scripts/collect.py` imports nothing outside the standard library, never writes under an agent's folder, and opens SQLite with `mode=ro`. `test_collector_never_writes_into_agent_folders` enforces the write rule.
- **Red/green TDD.** Add or change a test first, watch it fail, then change the code. Add a fixture of the agent's real log shape (redacted) to the test, not a hand-invented one, whenever you have one.
- **Degrade, don't crash.** A corrupt line, an empty folder or an unknown schema must yield fewer sessions, never a traceback.
- **Don't ship TDD logs inside the skill.** The tests are the proof; put the red/green story in the PR description.

## Skill layout

- `SKILL.md`: the agent workflow (check → collect → read → build report → verify → deliver).
- `scripts/collect.py`: parsers, `discover()`, `summarize()` and the CLI. Exit 0 ok, 1 no sessions, 2 bad agent name.
- `scripts/build_report.py`: validates the collector's JSON and the insights JSON, then writes `{summary, sessions, insights, meta}` into the template's `<script type="application/json" id="report-data">` block with every `<` escaped. Nothing else in the template changes. Exit 0 ok, 2 invalid input.
- `assets/agent-sessions-insight.html`: the report template. One file, no network. All text is set with `textContent` (a test forbids `innerHTML` and friends). Its data block holds demo data from the collector's own `summarize()` run on made-up sessions, so the template is also the demo.
- `scripts/make_demo.py`: regenerates that demo deterministically (fixed seed and date). Run `python3 scripts/make_demo.py` after changing the data shape, `summarize()`, the insights format or the demo itself; `--check` exits 1 if the shipped demo is stale. `tests/test_make_demo.py` fails until you do.
- `tests/test_collect.py`: `unittest` tests with fixtures built in temp dirs. Run `python3 -m unittest discover -s tests -v` from the skill directory.
- `tests/test_make_demo.py` (stdlib): the shipped demo equals a fresh build, the demo is valid and consistent, and `--check` catches a stale template.
- `tests/test_build_report.py` (stdlib) and `tests/test_report_page.py` (Playwright; skipped without it): the build script, escaping, validation, and the page in a real browser (every tab renders, no console errors or network requests, hash routing and arrow keys, XSS, dark mode, phone width). Cloud sessions: `pip install playwright`; the tests use `/opt/pw-browsers/chromium` or `CHROMIUM_PATH`.
- `agents/openai.yaml`: Codex metadata (explicit invocation only).

## Collector design

Each agent has `parse_<agent>(root)` returning normalized `Session` objects (`agent`, `id`, `project`, `start`, `end`, `prompts`, `first_prompt`, `tools`, `cmds`, `docs`, `test_runs`). `AGENTS` maps an agent name to `(folder under home, parser)`. `discover(home, agents, extra)` runs the chosen parsers; `extra` overrides a known agent's folder or adds an unknown agent through `parse_generic`. `summarize()` filters to the window and aggregates. Prompt snippets are capped at 160 characters.

## Adding an agent

1. Write a failing test: a fixture log in a temp dir, and the `Session` fields you expect from `parse_<agent>`. Run it and watch it fail.
2. Add `parse_<agent>(root)` until it passes. Use the helpers (`read_jsonl`, `touch`, `note_tool`, `note_prompt`).
3. Add edge-case tests (corrupt line, empty folder, missing timestamps) and make them pass.
4. Register it in `AGENTS`, add a `Discover` test, and add the agent to the folder table in `SKILL.md` and `README.md`.

## Unverified areas

OpenCode SQLite column names are inferred, the Copilot CLI and Devin CLI schemas are undocumented (the Devin adapter follows the layouts reported by other usage tools: `sessions/<id>/log.jsonl` lines of `kind: "node"`, and the `sessions`/`message_nodes` tables of `sessions.db`), and Hermes has no documented format. No adapter has been checked against every real-world log version. Prefer a redacted real sample over guessing when fixing any of these.
