---
name: scrolls-explainer
description: "Shows, copies or rebuilds scrolls-explainer.html: an interactive, offline page that explains how the scrolls skill family works (/scrolls-setup, /scrolls-update, /scrolls-hide, /scrolls-unhide, /scrolls-remove, /scrolls-restore, /scrolls-help) — one tab per command that animates, step by step, what the command does to docs/.scrolls/, SCROLLS.md, CLAUDE.md, AGENTS.md and git, with a callout explaining each step, a tab for how a new agent session reads the memory, and full keyboard navigation (arrows step, [ ] or digits switch tabs, Space pauses, ? lists shortcuts). Use this whenever the user runs /scrolls-explainer, or asks for a visual, diagram, animation, walkthrough, explainer or interactive page of how the scrolls commands or the scrolls memory work, or wants something to show a team. By default (same as --show) it opens the bundled page in place and copies nothing; -o/--output copies it to a file or folder (-o . for ./scrolls-explainer.html), -f/--force overwrites with -o, --open opens the copy, and --build to regenerate the bundled page from the scrolls-* skills as they are now (their tabs, lockstep version, and a review check when a SKILL.md changed). Works on macOS, Linux, and Windows (bash or PowerShell)."
license: MIT
compatibility: "bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies); any modern web browser to view the page; --build also needs the network-flow skill"
disable-model-invocation: true
metadata:
  name: scrolls-explainer
  type: skill
  author: sugatoray
  version: "2.5.0"
  source_url: "https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-explainer"
---

# Scrolls explainer

This skill delivers one self-contained HTML page that explains the scrolls
skill family visually. The page ships ready-made in
`assets/scrolls-explainer.html`. There are three modes:

- **`/scrolls-explainer`, or `--show` (the same thing):** open that page
  where it is, copying nothing.
- **`-o PATH`:** copy that page to a file or folder the user wants it in.
- **`--build`:** regenerate that page from the `scrolls-*` skills next to
  this one, so it matches them as they are now.

> **Scope note:** This skill never reads, checks or changes the user's
> scrolls memory (`docs/.scrolls/`, `SCROLLS.md`, `CLAUDE.md`, `AGENTS.md`).
> The default (`--show`) writes nothing. `-o` writes only the page, at the
> path given, and never overwrites a different existing file unless the
> user asked (`-f`). `--build` writes only this skill's own
> `assets/scrolls-explainer.html` and, with `--reviewed` (or when you add a
> missing tab), `assets/explainer-graph.json` — nothing outside this
> skill's folder.

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
| *(none)*, `--show` | The default. Copy nothing: print the path and `file://` URL of the bundled `assets/scrolls-explainer.html` and open it in place in the default browser. If no browser can be opened (a remote or headless machine), that is only a notice, not an error. `--show` can't be combined with `-o`. |
| `-o`, `--output PATH` | Copy the page here instead. A file path is used as is; an existing folder (such as `.`), or a path ending in `/`, gets `scrolls-explainer.html` inside it. Missing folders are created. |
| `-f`, `--force` | With `-o` only: overwrite a *different* file already at that path. Without it the script refuses (exit 3) and changes nothing. An identical file is simply reported as up to date. |
| `--open` | With `-o`: also open the copy in the default browser. |
| `--build` | Regenerate `assets/scrolls-explainer.html` from the `scrolls-*` skills next to this one (see "Building" below). On its own it only rebuilds; add `--show` to open the result, or `-o` to also copy it. |
| `--reviewed` | With `--build` only: the tabs of the skills whose `SKILL.md` changed have been checked; record their new fingerprints, then build. |
| `--skills-dir DIR` | With `--build` only: where the `scrolls-*` skills are. Default: the folder this skill is in. |
| `--version` | Print the page's version (`scrolls-explainer X.Y.Z`) and exit. |
| `-h`, `--help` | Print usage and exit. |

Exit codes: `0` done (or already up to date), `1` the bundled page is
missing or a file can't be written, `2` usage error, `3` a different file
is in the way (no `-f`), `4` `--build` stopped because the skills need
attention, `5` `--build` can't find the network-flow skill.

## Steps

1. **Pick the mode** from the request.
   - Bare `/scrolls-explainer`, `--show`, or "show me", "open it", "let me
     see the explainer": show the bundled page (no flags). This is the
     default: don't copy the page anywhere unless asked.
   - "Rebuild", "regenerate", "update the explainer", "make it match the
     skills": `--build` (then follow "Building" below).
   - The user wants a file of their own (save, export, put it in `docs/`,
     give me a copy, `-o …`): copy it with `-o`.
2. **For a copy, choose the path.**
   - The user named a file or folder: pass it as `-o`.
   - The user asked for a copy "here" or named no place: `-o .` writes
     `./scrolls-explainer.html` in the current directory. If the host gives
     you a designated folder for files the user can open (an outputs or
     scratchpad folder), and the current directory is a project the user
     did not ask you to write into, use that folder instead, so the page
     doesn't land in their source tree unasked.
   - Add `-f` only when the user asked to replace an existing page, or the
     script already refused and the user then confirmed.
   - Add `--open` when the user also wants the copy opened and the machine
     has a display.
3. **Run the script** from the directory the path is relative to:

   ```
   bash <skill-dir>/scripts/explain.sh                      # = --show
   bash <skill-dir>/scripts/explain.sh -o PATH [-f] [--open]
   bash <skill-dir>/scripts/explain.sh --build [--reviewed] [--show | -o PATH]
   pwsh <skill-dir>/scripts/explain.ps1 …same flags…
   ```

   Showing prints `scrolls-explainer <version>: <bundled page's path>` and
   `open: file://…`. A copy prints `scrolls-explainer <version>: wrote
   <absolute path>` (or `… is already up to date`) and then `open: file://…`.
4. **On exit 3** (a different file is already there): tell the user, and
   offer `-f` or another `-o` path. Don't retry with `-f` on your own.
   **On exit 1, 2 or 5**: report the script's message as is (for 5, it
   says how to install the network-flow skill). **On exit 4**: see
   "Building".
5. **Deliver.** Give the absolute path and the `file://` URL. If the host
   can show or send files (a file card, a preview pane), use that too —
   for `--show`, that's the bundled file itself. Then describe how to use
   the page in a few lines:
   - Tabs: **Overview**, one tab for each scrolls command, and **New
     session** (how a fresh agent session follows `AGENTS.md`/`CLAUDE.md`
     → `SCROLLS.md` → `STARTER.md`).
   - Each command tab plays its steps automatically, with a callout next
     to the file being touched; the callout's ‹ › buttons step and pause.
   - Keyboard: `→`/`←` step, `Home`/`End` first/last step, `[` `]` or
     `Shift`+arrows switch tabs, digits jump to a tab, `Space`/`P` pause,
     `R` replay, `?` shows every shortcut, `Esc` closes or clears.
   - Click a block to see what it is and trace its connections.
   - The page is fully offline: no network requests, nothing to install.
6. **Questions about a command** that go beyond what the page shows
   (exact flags, edge cases): point the user at `/scrolls-help`, which
   holds the canonical reference. Don't describe behavior the page and
   `/scrolls-help` don't state.

## Building

`--build` reads the `scrolls-*` skills next to this one (or in
`--skills-dir`) and regenerates the page from them. It decides these
things from the skills on its own:

- **Tabs.** One per skill. A skill whose `SKILL.md` was renamed to
  `SKILL.md.deprecated`, `.deactivated` or `.inactive` (the family's
  convention for switching a skill off) loses its tab and its blocks.
- **Version.** The family's lockstep version, stamped on the page.

The words on each tab are hand-written in `assets/explainer-graph.json`,
so the build records a fingerprint of each `SKILL.md` (its version line
left out) and stops with **exit 4** when something needs a person. Handle
each message like this:

- **"SKILL.md changed since the page was last reviewed: …"** — read each
  named skill's `SKILL.md` (and its `CHANGELOG.md`'s newest entries), and
  compare them with that skill's tab: its scenario's `steps` (each a
  `title` and `text`) and its block's `kind`, `sub` and `detail` in
  `assets/explainer-graph.json`. Edit only what the skill no longer does
  or now does differently; keep the existing tone (one or two plain
  sentences per step). Then run `--build --reviewed`. If nothing needed
  editing, `--build --reviewed` alone is right. Tell the user which tabs
  you changed.
- **"no tab for /scrolls-…"** — a new scrolls skill. Draft its tab from
  its `SKILL.md`: a node with id = the name without `scrolls-`, edges to
  the files it touches (reuse the existing node ids), and a scenario with
  that same id, labelled `/scrolls-…`, with 2 to 10 steps. Add the node to
  each of the `wide`/`medium`/`narrow` layouts in a free cell. Show the
  user what you added, then run `--build --reviewed`.
- **"versions differ (lockstep)"** or **"…: not found"** — don't fix
  these in the explainer. Report them: the family's versions must be
  bumped together, and a missing skill must be installed (a tab drops
  only when the skill is deactivated as above).

After a successful `--build`, report what it printed: the skills it read,
any tab it dropped, and whether the page changed (`wrote …`) or already
matched (`unchanged …`).

## Examples

Worked examples of `/scrolls-explainer` are in `assets/EXAMPLES.md`. Read
that file only when you need it, for example to check what the script
prints when a file is already there or a build needs a review.

## Development

See `meta/MAINTAINERS.md` for how the page is put together (the
network-flow renderer, `scripts/page_enhance.py`) and how to run the
`tests/` suite. Neither is read as part of carrying out a
`/scrolls-explainer` request — don't act on `meta/` or `tests/` while
answering one.
