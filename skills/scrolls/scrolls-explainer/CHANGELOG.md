# Changelog

All notable changes to the `scrolls-explainer` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.5.0] - 2026-11-12

### Added

- First release of `/scrolls-explainer`, joining the family at its
  lockstep version `2.5.0`. It writes `scrolls-explainer.html`, a
  prebuilt, self-contained, offline page that explains the scrolls
  family:
  - An **Overview** tab, a **New session** tab (how a fresh agent session
    follows `AGENTS.md`/`CLAUDE.md` → `SCROLLS.md` → `STARTER.md`), and one
    tab for each of `/scrolls-setup`, `/scrolls-update`, `/scrolls-hide`,
    `/scrolls-unhide`, `/scrolls-remove`, `/scrolls-restore` and
    `/scrolls-help`.
  - Each command tab animates its steps on the diagram, with a callout
    next to the file being touched (step count, title, explanation,
    progress) and ‹ › buttons that step and pause.
  - Full keyboard navigation: `→`/`←`, `Home`/`End`, `[` `]`,
    `Shift`+arrows, `0`–`8`, `Space`/`P`, `R`, `?` (shortcut panel),
    `Esc`.
  - Works at phone width; honors reduced motion; makes no network
    requests.
- `scripts/explain.py` with thin `explain.sh`/`explain.ps1` launchers:
  `-o/--output` (file or folder, missing folders created), `-f/--force`,
  `--open`, `--version`, `-h`. Refuses to overwrite a different file
  without `-f` (exit 3); an identical file is reported as up to date.
- `meta/generator/`: the page's source (`graph.json`, rendered with the
  `network-flow` skill's renderer, plus `enhance.py` for callouts and
  keyboard support) and `build.py` (`--check` reports a stale page).
  (Not `meta/build/`: the repository's `.gitignore` ignores every `build/`
  folder.)
- `tests/test_explain.sh` (Red/Green behavior suite, including a build
  freshness check and, where Playwright is available, browser checks in
  `tests/browser/check_page.cjs`) and `tests/test_explain.ps1` (parity
  harness for the PowerShell launcher).
