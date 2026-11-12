---
name: scrolls-explainer
description: "Writes scrolls-explainer.html: an interactive, offline page that explains how the scrolls skill family works (/scrolls-setup, /scrolls-update, /scrolls-hide, /scrolls-unhide, /scrolls-remove, /scrolls-restore, /scrolls-help) — one tab per command that animates, step by step, what the command does to docs/.scrolls/, SCROLLS.md, CLAUDE.md, AGENTS.md and git, with a callout explaining each step, a tab for how a new agent session reads the memory, and full keyboard navigation (arrows step, [ ] or 0-8 switch tabs, Space pauses, ? lists shortcuts). Use this whenever the user runs /scrolls-explainer, or asks for a visual, diagram, animation, walkthrough, explainer or interactive page of how the scrolls commands or the scrolls memory work, or wants something to show a team. Writes ./scrolls-explainer.html by default; supports -o/--output for another file or folder, -f/--force to overwrite, and --open to open it in a browser. Works on macOS, Linux, and Windows (bash or PowerShell)."
license: MIT
compatibility: "bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies); any modern web browser to view the page"
disable-model-invocation: true
metadata:
  name: scrolls-explainer
  type: skill
  author: sugatoray
  version: "2.5.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-explainer"
---

# Scrolls explainer

This skill writes one file: a prebuilt, self-contained HTML page that
explains the scrolls skill family visually. It does not read, check or
change the user's scrolls, and it does not build the page: the page ships
ready-made in `assets/scrolls-explainer.html`, and the bundled script only
copies it to where the user wants it.

> **Scope note:** The only file this skill writes is the page, at the path
> resolved below. It never edits `docs/.scrolls/`, `SCROLLS.md`,
> `CLAUDE.md`, `AGENTS.md` or anything else in the user's project, and it
> never overwrites a different existing file unless the user asked for
> that (`-f`). Rebuilding the page from source is a maintainer task (see
> `meta/MAINTAINERS.md`), never part of answering a request.

## Cross-platform

The script ships in two forms that behave identically: `explain.sh`
(bash — macOS, Linux, or Windows with Git Bash/WSL) and `explain.ps1`
(PowerShell 7+ — Windows, or macOS/Linux with `pwsh` installed). Both are
thin launchers for `explain.py` (stdlib-only Python 3.9+), resolving
`python3` and then `python`. Pick the launcher by what's actually
available: try `bash --version`; if that succeeds, use `.sh`; otherwise use
`.ps1` via `pwsh` (preferred) or, only if `pwsh` isn't available, the
built-in Windows PowerShell `powershell.exe`.

## Options

| Flag | Meaning |
| --- | --- |
| `-o`, `--output PATH` | Write the page here. A file path is used as is; an existing folder, or a path ending in `/`, gets `scrolls-explainer.html` inside it. Missing folders are created. Default: `./scrolls-explainer.html` in the current directory. |
| `-f`, `--force` | Overwrite a *different* file already at that path. Without it the script refuses (exit 3) and changes nothing. An identical file is simply reported as up to date. |
| `--open` | Also open the page in the default browser. If no browser can be opened (a remote or headless machine), that is only a notice, not an error. |
| `--version` | Print the page's version (`scrolls-explainer X.Y.Z`) and exit. |
| `-h`, `--help` | Print usage and exit. |

## Steps

1. **Choose the output path.**
   - The user named a file or folder: pass it as `-o`.
   - The user named none: the default is `./scrolls-explainer.html` in the
     current directory. If the host gives you a designated folder for files
     the user can open (an outputs or scratchpad folder), and the current
     directory is a project the user did not ask you to write into, pass
     that folder as `-o` instead, so the page doesn't land in their source
     tree unasked.
   - Add `-f` only when the user asked to replace an existing page, or the
     script already refused and the user then confirmed.
   - Add `--open` when the user asks to open or see it and the machine has
     a display; skip it in a headless or remote environment.
2. **Run the script** from the directory the path is relative to:

   ```
   bash <skill-dir>/scripts/explain.sh [-o PATH] [-f] [--open]
   pwsh <skill-dir>/scripts/explain.ps1 [-o PATH] [-f] [--open]
   ```

   It prints `scrolls-explainer <version>: wrote <absolute path>` (or
   `… is already up to date`) and then `open: file://…`.
3. **On exit 3** (a different file is already there): tell the user, and
   offer `-f` or another `-o` path. Don't retry with `-f` on your own.
   **On exit 1 or 2**: report the script's message as is.
4. **Deliver the file.** Give the absolute path and the `file://` URL. If
   the host can show or send files (a file card, a preview pane), use that
   too. Then describe how to use the page in a few lines:
   - Tabs: **Overview**, one tab for each of `/scrolls-setup`,
     `/scrolls-update`, `/scrolls-hide`, `/scrolls-unhide`,
     `/scrolls-remove`, `/scrolls-restore`, `/scrolls-help`, and **New
     session** (how a fresh agent session follows `AGENTS.md`/`CLAUDE.md`
     → `SCROLLS.md` → `STARTER.md`).
   - Each command tab plays its steps automatically, with a callout next
     to the file being touched; the callout's ‹ › buttons step and pause.
   - Keyboard: `→`/`←` step, `Home`/`End` first/last step, `[` `]` or
     `Shift`+arrows switch tabs, `0`–`8` jump to a tab, `Space`/`P`
     pause, `R` replay, `?` shows every shortcut, `Esc` closes or clears.
   - Click a block to see what it is and trace its connections.
   - The page is fully offline: no network requests, nothing to install.
5. **Questions about a command** that go beyond what the page shows
   (exact flags, edge cases): point the user at `/scrolls-help`, which
   holds the canonical reference. Don't describe behavior the page and
   `/scrolls-help` don't state.

## Examples

Worked examples of `/scrolls-explainer` are in `assets/EXAMPLES.md`. Read
that file only when you need it, for example to check what the script
prints when a file is already there.

## Development

See `meta/MAINTAINERS.md` for how the page is built from
`meta/generator/graph.json` with the network-flow renderer, how to rebuild it
after a scrolls command changes, and how to run the `tests/` suite.
Neither is read as part of carrying out a `/scrolls-explainer` request —
don't act on `meta/` or `tests/` while answering one.
