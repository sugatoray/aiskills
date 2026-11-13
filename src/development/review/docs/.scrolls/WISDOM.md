# WISDOM.md — Constraints, Traps, Ditches, and Wisdom

Hard-won lessons for this project. Read this LAST, right before editing code, so it's freshest in mind.

## Constraints — respect and conform to them
Things you must respect or conform to (external requirements, API contracts, platform limits).

- The skill never installs anything into the reviewed project, and its two scripts are standard-library Python only. PyYAML is used when it is already importable and is never required.
- Every `references/review_<language>/` folder has exactly five files: `REVIEW.md`, `PATTERNS.md`, `TOOLING.md`, `SECURITY.md`, `WISDOM.md`. A test fails if a language the detector knows lacks its folder or a file.
- Each language's `WISDOM.md` has exactly four `##` sections: Constraints, Traps, Ditches, Wisdom. `SECURITY.md` and `WISDOM.md` are the only language files read under `-s`.
- `-l` is `--lang`. `--local` has no short form, unlike in `scrolls-setup`. `-p`, `-t` and `--local` exclude each other.
- The plugin is named after its folder (`review/` → `review-skills`, alias `review`), like every plugin in `marketplace.json`; the npm alias is derived from the plugin name. Rename folder and plugin together.
- Folder names follow the names the user gave: `review_powershell-script` and `review_shellscript`, not `review_powershell` or `review_shell`.
- One version in two files: `run-code-review/SKILL.md`'s `metadata.version` and `skills/development/review/.claude-plugin/plugin.json`. The plugin's `description` must be identical in `plugin.json` and the root `marketplace.json`.
- XML is tool-first **and** keeps its full review. That was the user's explicit choice; don't cut `review_xml/` down to the short form the other three tool-first formats use.
- `src/development/review/` holds memory and symlinks only. Never copy skill content into `src/`; edit it at `skills/development/review/`.

## Traps — avoid them always
Specific bugs that have bitten this project before — avoid repeating them.

- Python's `json.loads` accepts duplicate keys (last one wins) and `NaN`/`Infinity`, so a plain `json.loads` passes files other parsers reject or read differently. `check_formats.py` uses `object_pairs_hook` and `parse_constant` to catch both; keep them.
- `git diff --name-only` and `git ls-files --others` name files from the repository's top level or the current folder depending on the command, so a `--base` run from a subfolder printed paths that could not be opened there and missed untracked files elsewhere. `_repo_top()` and `_from_here()` in `detect_languages.py` fix this; test any new git-backed scope from a subfolder.
- `json`'s error positions change between Python versions: 3.13 reports a trailing comma at the comma's own line ("Illegal trailing comma"), 3.12 and earlier at the closing brace. A test asserting a line number must use an error every version places the same way (a missing comma does), and the suite should be run on the newest Python, not only the ones it was written on.
- In YAML, a plain scalar can't contain `: `. `- run: echo "Title: $X"` is invalid even though the colon is inside quotes, because the scalar starts with `echo`; use `run: |`. `tests/test_reference_code.py` now catches this in every reference block.
- `git add -A` after running `mypy` or `ruff` inside the skill folder stages `.mypy_cache/` and `.ruff_cache/`, and the package's docs generator lists staged files, so the package tests fail on "files that ship with the skill". Delete the caches and `git rm --cached` them before `npm run docs`.
- The package tutorials paste real CLI output: renaming a skill changes the alphabetical "available:" lists, and changing a plugin's description moves where `aiskills groups` cuts it off. Re-run the commands (`npm run vendor`, then the CLI, then `npm run clean`) and paste.
- The detector tests compare whole result dictionaries. Adding a field to the JSON output (as `tool_first` was) breaks them all at once; update the expected values in the same change.
- New skill files must be staged (`git add`, by path) before `npm run docs` in `src/packages/aiskills`: the generator lists tracked files, and the package tests fail on the stale count otherwise.
- Don't use `EOF` as the delimiter of a shell heredoc that writes one of the reference files: several patterns contain a line that is exactly `EOF`.
- `npx skills@1.7.6` needs Node 22.20 or later, while the package tests were run on Node 20. A failing `npx skills add` on Node 20 is the CLI's requirement, not a broken skill.

## Ditches — bad patterns or decisions to avoid
Bad patterns or decisions to never take, and why they were rejected.

- Naming a skill after a host's built-in command (`/code-review` in Claude Code). An installed project skill and the built-in shadow each other; the skill was renamed `/run-code-review` before release.

- Having the model read XML, JSON, YAML or TOML line by line for syntax, formatting or schema validity. A parser decides those exactly and for almost nothing; the user chose tool-first for that reason.
- Letting a missing parser or tool count as a pass. Report `unchecked` and name what would check it.
- Passing off a hand-written sample as a captured run. `assets/EXAMPLE.md` states which output was pasted from real runs and which was written by hand; keep that line true when the file changes.
- Dropping files from a review silently. Vendored, generated, lock, `filtered` and `unsupported` files are all listed, so the report never looks more complete than it was.
- Repeating a checklist in two places. `REVIEW.md` points to `SECURITY.md`, and TypeScript loads JavaScript's files instead of copying them.

## Wisdom — best practices and Red/Green TDD
Best practices worth reusing.

- Always use Red/Green TDD while developing or fixing code.
- Check every claim about a language's behaviour by running it, and record what came from documentation instead. The list of what was run, and on which versions, is in `run-code-review/meta/MAINTAINERS.md`.
- Every code block in a `PATTERNS.md` must at least parse: "after" blocks are handed to users as fixes.
- When the user's wording implies scope the skill lacks (their `--lang` list named four unsupported languages), say so and add it, instead of accepting a flag value that does nothing.
- Before a cost-saving redesign of work already drafted (the tool-first question arrived with a full XML review written), lay out the options and wait for the answer.
- Read `run-code-review/meta/MAINTAINERS.md` ("Adding a language", "Design notes") before changing the skill; it holds the procedure and the reasons, and this file does not repeat them.
