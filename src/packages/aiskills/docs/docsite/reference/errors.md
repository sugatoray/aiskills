# Errors and exit codes reference

Every error and warning `aiskills` prints, with its cause and fix, and what each exit code means; this page is exhaustive.

Errors and warnings go to stderr and start with `[aiskills]`. Parts in `<angle brackets>` vary.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success. `uninstall` also exits `0` when there was nothing to remove. |
| `1` | `aiskills` stopped with one of the errors below, or `installed` couldn't read `npx skills list`. No skill was installed or removed. |
| any other | The exit code of the `npx skills` command it ran, passed through. |

<!-- verify -->
```bash
aiskills install --purge
```

```text
[aiskills] option --purge is not valid here
```

## Options and commands

### Option not valid here

```text
[aiskills] option <option> is not valid here
```

**Cause:** the option exists, but not for this command, e.g. `--purge` on `install`. **Fix:** see which options each command takes in the [CLI reference](cli.md#options).

### Unknown option

```text
[aiskills] unknown option: <option>
```

**Cause:** a typo, or an option of `npx skills` given directly. **Fix:** check `aiskills --help`; pass `npx skills` options after `--`.

### Option needs a value

```text
[aiskills] <option> needs a value
```

**Cause:** `-a`, `-s` or `-G` is the last argument. **Fix:** add the value: `-s scrolls-setup`.

### Unknown command

```text
unknown command: <name>
```

**Cause:** not one of the [commands](cli.md#commands). The help follows on stderr. **Fix:** check the spelling; `aiskills help` lists them.

## Choosing skills, groups and agents

### Not provided by this package

```text
[aiskills] not provided by this package: <names>
  available: <bundled skills>
  add --route to look them up with 'npx skills' instead
```

**Cause:** `install -s` names a skill that isn't bundled. **Fix:** check the spelling against `available`, or add `--route` (or use `aix`) for an external skill. On `uninstall` the last line reads `use --route to also match skills installed from other sources, or -f/--force`.

### No skill matches

```text
[aiskills] no skill matches: <patterns>
  available: <skills>
```

**Cause:** an `-s` pattern matched no skill. **Fix:** adjust the pattern; patterns match the whole name, ignoring case.

### No group matches

```text
[aiskills] no group matches: <names>
  available: <group (alias), …>, all
  see 'aiskills groups'
```

**Cause:** a `-G` name, alias or pattern matched no group. **Fix:** pick one from `available`.

### The selected groups contain no skills

```text
[aiskills] the selected group(s) contain no skills
```

**Cause:** the `-G` groups exist but have no bundled skills. **Fix:** choose other groups; `aiskills groups` shows each group's skills.

### No marketplace.json

```text
[aiskills] no .claude-plugin/marketplace.json in <install folder>; run 'aiskills sync' first
```

**Cause:** `-G` was used but the install folder has no `marketplace.json`, e.g. it was synced by an older version. **Fix:** `aiskills sync`.

### No agent matches

```text
[aiskills] no agent matches: <patterns>
  valid agents: <agents>
```

**Cause:** an `-a` pattern matched none of the agents `npx skills` supports. **Fix:** adjust the pattern, or use names from `valid agents`.

### Could not read the agent list

```text
[aiskills] could not read the agent list from 'npx skills'
```

**Cause:** an `-a` pattern needs the agent list, and `npx skills` didn't print it (no network for the first download, or a `skills` version that words it differently). **Fix:** pass plain agent names instead of a pattern, or go back to the pinned `skills` version.

## Uninstall

### Purge only with a full uninstall

```text
[aiskills] --purge only applies to a full uninstall (drop -s/-G)
```

**Cause:** `--purge` with `-s` or `-G`. **Fix:** remove the skills first, then run `aiskills uninstall --purge` on its own.

### Names a source, not a skill

```text
[aiskills] '<entry>' names a source, not a skill; use -s <skill> or <owner/repo@skill>
```

**Cause:** `--route uninstall -s owner/repo`: a repository isn't a skill name. **Fix:** name the skill, `-s pdf` or `-s owner/repo@pdf`.

### Not installed, skipping

```text
[aiskills] not installed (<scope>), skipping: <names>
```

**Warning.** **Cause:** with `--route`, these names aren't installed in this scope. **Fix:** none needed; check `-g`/`-p` if you expected them.

### Could not read `npx skills list` (uninstall)

```text
[aiskills] could not read 'npx skills list'; falling back to the skills found in <install folder>
```

**Warning.** **Cause:** `npx skills list --json` failed during a full uninstall, so `aiskills` removes every skill name in its folder instead. **Fix:** usually none; check network access if it repeats.

### Could not read `npx skills list` (installed)

```text
[aiskills] could not read 'npx skills list'
```

**Cause:** `installed` couldn't run or parse `npx skills list --json`; exit code `1`. **Fix:** run `aiskills skills list -g` to see the underlying error.

## External skills (`--route`)

### Matches several skills

```text
[aiskills] '<name>' matches several skills; pick one with -s <owner/repo@skill>:
    <owner/repo@name>  (<installs>)
    …
```

**Cause:** more than one registry result has exactly this name. `aiskills` never picks. **Fix:** choose one and pass it as `-s owner/repo@name`.

### No skill named exactly

```text
[aiskills] no skill named exactly '<name>'; closest results:
    <owner/repo@skill>  (<installs>)
```

**Cause:** the registry has similar skills but none with this exact name. **Fix:** use one of the listed names, or `aiskills find <query>` to search.

### No skill found

```text
[aiskills] no skill named '<name>' found by 'npx skills find'
```

**Cause:** the registry returned nothing (or there's no network access to `skills.sh`). **Fix:** check the name and network, or give the source as `owner/repo@skill`.

### Unsafe registry results ignored

```text
[aiskills] ignored <n> registry result(s) with unsafe characters: "<spec>", …
```

**Warning.** **Cause:** results whose `owner/repo@skill` has characters other than letters, digits, `.`, `_` and `-` are never used. **Fix:** none needed. If the skill you want was among them, check its source and pass it yourself.

### Not confirmed (no terminal)

```text
[aiskills] found in the skills registry (not bundled; third-party code your agents may run):
    <owner/repo@skill>  (<n> installs)  for '<name>'
[aiskills] not installing external skills without confirmation: <owner/repo@skill>, …
  re-run with -y/--yes to install them, or pin each one with -s owner/repo@skill
```

**Cause:** `--route` (or `aix`) found a skill by looking up a bare name, and there is no terminal to ask in (a script, CI, an agent). Nothing was installed, not even bundled skills. **Fix:** check the listed source, then re-run with [`-y`](cli.md#-y---yes), or pin it: `-s <owner/repo@skill>`.

### Not confirmed

```text
Install <n> external skill(s) from the registry? [y/N] n
[aiskills] nothing installed: not confirmed
```

**Cause:** you answered anything but `y` or `yes` (Enter means no). Nothing was installed. **Fix:** none needed. To install, run again and answer `y`, or pin the skill as `owner/repo@skill`.

## Files and folders

### Not an aiskills folder

```text
[aiskills] <folder> is not an aiskills folder (it has other files but no aiskills.json), so it won't be replaced or deleted.
  Point AISKILLS_HOME at a new or empty folder instead.
```

**Cause:** the install folder (usually from `AISKILLS_HOME`) already holds files that `aiskills` didn't write. **Fix:** point `AISKILLS_HOME` at a new or empty folder, or unset it.

### Unknown layout

```text
[aiskills] unknown layout '<value>' (use flat or nested)
```

**Cause:** `AISKILLS_LAYOUT`, or the `layout` in `aiskills.json`, isn't `flat` or `nested`. **Fix:** set `AISKILLS_LAYOUT=flat` or `nested`, or run `aiskills sync --flat`.

### No vendored skills folder

```text
[aiskills] no vendored skills folder at <package>/skills
```

**Cause:** the package has no `skills/`, which happens when running from a git checkout of the repo. **Fix:** install the published package, or run `npm run vendor` in the checkout.

### Nested layout unavailable

```text
[aiskills] this package has no .aiskills/layout.json, so --nested can't rebuild the nested layout
```

**Cause:** the package was built without `layout.json`. **Fix:** use `--flat`, or reinstall the published package.

## Running `npx skills`

### Bad `AISKILLS_SKILLS_VERSION`

```text
[aiskills] AISKILLS_SKILLS_VERSION must be an exact version (e.g. 1.7.6), "latest" or "next"; got '<value>'
```

**Cause:** ranges, tags other than `latest`/`next`, and other text are refused. **Fix:** use an exact version, or unset it for the pinned one.

### Shell characters on Windows

```text
[aiskills] refusing to pass shell characters to cmd.exe: <arguments>
```

**Cause:** on Windows, an argument contains one of `& | < > ^ % ! " ( )`, which `cmd.exe` would interpret. **Fix:** remove those characters; skill names and specs never need them.

## Packaging errors (maintainers)

These come from `npm pack` / `npm run vendor`, when the package is built from the repo.

### Repo not found

```text
no ancestor of <folder> contains skills/ and .claude-plugin/marketplace.json
```

**Fix:** build from inside the repo, where `skills/` and `.claude-plugin/marketplace.json` are above the package folder.

### `skills/` not found

```text
<repo>/skills not found
```

**Fix:** the repo's `skills/` folder is missing; restore it.

### SKILL.md ignored

```text
.skillsignore ignores <group>/<skill>/SKILL.md; to drop a skill, ignore the folder (<group>/<skill>/) instead
```

**Fix:** ignore the skill's folder, not only its `SKILL.md`. See [`.skillsignore`](skillsignore.md).

### Skill directly in `skills/`

```text
<repo>/skills/SKILL.md: a skill can't sit directly in skills/
```

**Fix:** move the skill into its own folder.

### Skill inside a skill

```text
skills inside other skills aren't supported: <folders>
```

**Fix:** move the inner skill out to its own folder.

### Unsafe skill name

```text
skills/<folder>: skill name '<name>' can't be used as a folder name
```

**Fix:** use only letters, digits, `.`, `_` and `-` in the `name:`.

### Duplicate skill name

```text
two skills are both named '<name>': skills/<folder> and skills/<folder>
```

**Fix:** give one of them another `name:`.

## Docs build errors (maintainers)

These come from `npm run docs:html`, which builds `docs/docsite/index.html`.

### Page not in the landing page

```text
pages not linked from a section of README.md: <pages>
```

**Fix:** add each page to a `### Section` list in `docs/docsite/README.md` (`- [Title](path.md): summary`). The tabs are built from those lists.

### Usage

```text
usage: build-docs-html.mjs <docs-dir> --out <file.html> [--ref <branch>]
```

**Fix:** pass the docs folder and `--out`, or use `npm run docs:html`.

## Banner build errors (maintainers)

These come from `npm run banner`, `banner:check` and `banner:png` (`src/scripts/docs/create-banner.mjs`), and from `npm run docs:html`, which copies the banner onto the docs landing page.

### Config value not quoted

```text
config line <n>: values must be double-quoted strings: <text>
```

**Fix:** in `docs/banner/config.yaml`, write every value as `key: "value"`, and list items as `  - "item"`.

### Config line not understood

```text
config line <n>: expected 'key: "value"' or a '  - "item"' line
config line <n>: a list item without a key above it
```

**Fix:** use only `key: "value"`, `key:` followed by `  - "item"` lines, blank lines and `#` comments.

### Unknown `--set` key

```text
--set: unknown key: <key>
```

**Fix:** use a key that exists in `config.yaml`.

### Install style or count

```text
install_style must be "box" or "chips", not "<value>"
install_style "<style>" has room for 1 to <max> install commands, not <n>
```

**Fix:** `box` takes up to 3 commands and `chips` up to 2.

### Unknown theme

```text
unknown theme: <name> (use one of teal, paper, phosphor, …, lightsout)
```

**Fix:** set `theme` in `docs/banner/config.yaml` (or `--set theme=…`) to one of the themes in `src/scripts/docs/themes.mjs`. The default is `lightsout`.

### Demo group or skill

```text
demo_group "<name>" isn't a bundled group (<aliases>)
route_skill "<name>" is bundled, so 'aix i -s <name>' wouldn't look it up
```

**Fix:** `demo_group` must be a bundled group; `route_skill` must be a skill the package does *not* bundle, or the terminal demo would show something `aiskills` doesn't do.

### Template placeholder without a value

```text
template placeholder {{ <name> }} has no value
```

**Fix:** a placeholder was added to `src/scripts/docs/templates/banner-template.html` without a value in `render()`; add one.

### PNG needs Playwright

```text
--png needs Playwright (npm install -g playwright, then npx playwright install chromium)
--scale must be 1, 2 or 4
```

**Fix:** install Playwright and Chromium, and use scale 1, 2 or 4.

### Page out of date

```text
<path>/aiskills-banner.html is out of date: run npm run banner
```

**Fix:** run `npm run banner` (and `npm run banner:png` for the README image), then `npm run docs:html`.

### Banner page missing (docs build)

```text
banner page not found: <path> (run npm run banner, or pass --no-banner)
<path>: no banner:html:start ... banner:html:end markers
```

**Fix:** build the banner page first, or build the docs with `--no-banner`. Keep the `banner:html` and `banner:css` marker comments in the template.

See also: [Use aiskills from an AI agent or a script](../guides/use-from-an-agent.md) · [FAQ and troubleshooting](../faq.md)
