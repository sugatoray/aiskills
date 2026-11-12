# Changelog

All notable changes to the `scrolls-explainer` skill are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.5.0] - 2026-11-12

### Added

- First release of `/scrolls-explainer`, joining the family at its
  lockstep version `2.5.0`. It shows (or copies) `scrolls-explainer.html`,
  a prebuilt, self-contained, offline page that explains the scrolls
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
- `scripts/explain.py` with thin `explain.sh`/`explain.ps1` launchers.
- No flags, or `--show`: open the bundled `assets/scrolls-explainer.html`
  in place, copying nothing.
- `-o/--output` copies it to a file or folder (`-o .` for
  `./scrolls-explainer.html`; missing folders created), with `-f/--force`
  and `--open`. Refuses to overwrite a different file without `-f`
  (exit 3); an identical file is reported as up to date. `-f` without
  `-o` is a usage error. Also `--version`, `-h`.
- `--build`: regenerate `assets/scrolls-explainer.html` from the
  `scrolls-*` skills as they are now (`scripts/build_page.py`):
  - one tab per skill; a skill switched off with `SKILL.md.deprecated`
    (`.deactivated`, `.inactive`) loses its tab and its blocks;
  - the page is stamped with the family's lockstep version, and the build
    stops (exit 4) if the skills' versions differ;
  - a fingerprint of each `SKILL.md` (version line left out) is kept in
    `assets/explainer-graph.json`: when one changes, the build stops and
    names it until its tab is checked and confirmed with `--reviewed`;
  - a missing skill folder, or a new `scrolls-*` skill with no tab, also
    stops it; `--skills-dir` points it elsewhere;
  - it finds the `network-flow` skill's renderer next to this skill, at
    `../../diagrams/network-flow`, or at `$NETWORK_FLOW_DIR` (exit 5 with
    install instructions if none).
- The page's source is `assets/explainer-graph.json`; the step callouts
  and keyboard support are added by `scripts/page_enhance.py`. (On this
  branch the generator first lived in `meta/build/`, which the
  repository's `.gitignore` ignores, then `meta/generator/`; it moved to
  `scripts/` when `--build` became a user-facing flag.)
- `tests/test_explain.sh` (Red/Green behavior suite, 109 assertions:
  copying, `--show`, every `--build` outcome on throwaway copies of the
  skills in both the repository and a flat-install layout, page content,
  freshness, no git-ignored files, and, where Playwright is available,
  browser checks in `tests/browser/check_page.cjs`) and
  `tests/test_explain.ps1` (parity harness for the PowerShell launcher).
