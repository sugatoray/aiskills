# scrolls-compact

Compacts the history in a docs/.scrolls/ (or docs/scrolls/) project-memory system at a point in time, and saves a git checkpoint of everything it condenses. Condenses the parts of SPEC.md, PLAN.md, HANDOFF.md, GAP_ANALYSIS.md and GAP_CONTEXT.md that git blame shows are older than a compaction base — by default the newer of 7 days ago and the 20th-latest first-parent commit on main/master — while open tickets, open gaps and HANDOFF's open threads always stay word for word. Records ONE commit whose message names the checkpoint (the commit just before the compaction), writes compacted/scrolls_compact_<yyyymmdd>_<githash>.md with one marker section per compacted file, adds a row to COMPACT.md's Compaction History table, lists COMPACT.md in STARTER.md, and tags the checkpoint. --list, --show and --extract read old history back out of git. Use this only when the user runs /scrolls-compact, or explicitly asks to compact, condense, prune or checkpoint the scrolls / project memory history. Supports --before=YYYYMMDD, --base=COMMIT, --keep-days=N, --keep-commits=N, --trunk, --include/--exclude, -p/--path, -t/--reporoot, -l/--local, -r/--recurse, -n/--dry-run, -y/--yes, --no-commit and --no-tag. Refuses to run when the scrolls folder has uncommitted changes, since the checkpoint would not contain them. Works on macOS, Linux, and Windows (bash or PowerShell).

| Property | Value |
| --- | --- |
| Group | `scrolls-skills` (alias `scrolls`) |
| Version | 2.7.0 |
| Starts | When you ask for it: you type `/scrolls-compact` (your agent doesn't start it on its own) |
| Needs | bash (macOS/Linux/WSL) or PowerShell 7+ (pwsh) or PowerShell (older versions: powershell.exe); Python 3.9+ (stdlib only, no dependencies); git |
| License | MIT |
| Source | [skills/scrolls/scrolls-compact](https://github.com/sugatoray/aiskills/tree/master/skills/scrolls/scrolls-compact) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s scrolls-compact -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: scrolls-compact
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill scrolls-compact --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `scrolls-skills` group:

```bash
aiskills install -G scrolls -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s scrolls-compact
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/scrolls-compact/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/openai.yaml`
- `assets/EXAMPLES.md`
- `assets/example-viewer.html`
- `assets/examples/example_001.md`
- `assets/examples/example_002.md`
- `assets/examples/example_003.md`
- `assets/examples/example_004.md`
- `assets/examples/example_005.md`
- `assets/examples/example_006.md`
- `assets/examples/example_007.md`
- `assets/examples/example_008.md`
- `assets/examples/example_009.md`
- `assets/examples/example_010.md`
- `assets/examples/example_011.md`
- `assets/examples/example_012.md`
- `assets/examples/example_013.md`
- `assets/examples/example_014.md`
- `assets/examples/example_015.md`
- `assets/examples/example_016.md`
- `assets/examples/example_017.md`
- `assets/examples/example_018.md`
- `assets/examples/example_019.md`
- `assets/examples/example_020.md`
- `assets/examples/example_021.md`
- `assets/examples/example_022.md`
- `assets/examples/example_023.md`
- `assets/templates/COMPACT.md`
- `meta/DESIGN.md`
- `meta/MAINTAINERS.md`
- `scripts/build_example_viewer.py`
- `scripts/compact.ps1`
- `scripts/compact.py`
- `scripts/compact.sh`
- `tests/browser/check_example_viewer.cjs`
- `tests/check_example_viewer.py`
- `tests/check_examples.py`
- `tests/test_compact.ps1`
- `tests/test_compact.sh`
- `tests/test_example_viewer.sh`
- `tests/test_examples.sh`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-compact/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/scrolls/scrolls-compact/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
