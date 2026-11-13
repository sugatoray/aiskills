# scripts

Maintenance scripts for this repository. They are not part of any skill or of the npm package:
not to be confused with each skill's own `scripts/` folder (code the skill runs) or the npm
package's `src/packages/aiskills/src/scripts/`.

## link-skills.sh

Links skills from `skills/` into `.agents/skills/` (read by Codex and other agents) and
`.claude/skills/` (read by Claude Code), as relative symlinks named after each skill:

```text
.claude/skills/scrolls-update -> ../../skills/scrolls/scrolls-update
```

An agent that loads `.claude/skills/scrolls-update` reads the source in `skills/`, so an edit
takes effect without reinstalling, and an installed copy can't drift from the source.

```sh
make link-skills SKILL=skills/scrolls                  # every skill below a folder
make link-skills SKILL=skills/development/repo-related/create-issues-update-pr
make link-skills SKILL=skills/scrolls DRY_RUN=1        # show what would change
make link-skills SKILL=skills/scrolls FORCE=1          # replace an installed copy with the link
make check-skill-links                                 # verify every link
make test-scripts                                      # run scripts/tests/
```

The script can also be run directly: `bash scripts/link-skills.sh [--dry-run] [--force] PATH...`
or `bash scripts/link-skills.sh --check`.

- **What is linked:** every folder at or below `PATH` with a `SKILL.md` whose `name:` equals the
  folder name (agents look skills up by that name). `SKILL.md.deprecated` and the like are not
  skills. Paths are taken from the current folder and must be inside the repository; the links
  always go to the repository root.
- **Existing entries are kept:** an installed copy (a real folder) or a link to somewhere else is
  left alone, with a message, unless `--force` is given. Running again reports `up to date`.
- **`--check`:** every symlink in the two folders must resolve to a folder with a `SKILL.md`
  whose `name:` equals the link's name, so a renamed or moved skill can't silently break a link.
  Installed copies are not checked.
- **Exit codes:** 0 done; 1 a conflict, a mismatched name or a broken link; 2 a usage error.
- **Portability:** bash 3.2 or later (macOS's bash works). On Windows, git checks symlinks out as
  plain files unless symlinks are enabled (Developer Mode and `git config core.symlinks true`).

The links are committed, so every clone (including cloud agent sessions) starts with them. The
skills installer (`npx skills add sugatoray/aiskills`) does not list them twice, and the npm
package does not bundle them.

## test_install_myskills.sh

Shell aliases for trying `npx skills add` on a throwaway branch (moved here from `src/`).
Source it, don't run it: `source scripts/test_install_myskills.sh`, then

- `testbranch.create`: `git checkout -b trash/deleteme`
- `install.myskills`: install this repository's skills for Claude Code, then stash the result
- `testbranch.delete`: stash, return to `master` and delete the test branch
