# How to choose the `skills` CLI version

Use this when you need a different release of the `skills` CLI than the one `aiskills` pins, or when npm's release-age rule (`min-release-age`, `before`) refuses the pinned one.

Every `npx` call that `aiskills` makes runs one tested version of the `skills` CLI, `skills@1.7.6`, so a new release (or a compromised one) is never picked up without testing. `AISKILLS_SKILLS_LIB_VERSION` (the `skills` CLI library's version, not the bundled skills') overrides it with a version, a tag, an npm range or an interval. Its old name, `AISKILLS_SKILLS_VERSION`, still works but is deprecated, and is removed in 1.0.0.

## Steps

1. Set the version for one command:

   <!-- verify -->
   ```bash
   AISKILLS_SKILLS_LIB_VERSION=latest aiskills skills --version
   ```

   ```text
   [aiskills] using skills@latest from AISKILLS_SKILLS_LIB_VERSION, not the tested 1.7.6
   [aiskills] running: npx -y skills@latest --version
   ```

2. Or give a range, and npm picks the newest version in it that its own rules allow. Interval notation is turned into an npm range:

   <!-- verify -->
   ```bash
   AISKILLS_SKILLS_LIB_VERSION='[1.7.4, 1.8.0)' aiskills skills --version
   ```

   ```text
   [aiskills] using skills@>=1.7.4 <1.8.0 from AISKILLS_SKILLS_LIB_VERSION, not the tested 1.7.6
   [aiskills] running: npx -y 'skills@>=1.7.4 <1.8.0' --version
   ```

3. Or set it for every command, in your shell profile:

   ```bash
   export AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]'
   ```

## Variations

| Form | Example | npm gets | Means |
| --- | --- | --- | --- |
| Exact version (the default) | `1.7.6`, `1.8.0-beta.1` | the same | Exactly this release |
| Tag | `latest`, `next` | the same | Whatever the tag points at now |
| npm range | `~1.7.4`, `^1.7.0`, `1.7.x`, `>=1.7.4 <1.8.0`, `1.7.4 - 1.7.6`, `~1.7.4 \|\| 2.x` | the same | The newest version in the range |
| `[x, ...)` | `[1.7.4, ...)`, `[1.7.4, ?)`, `[1.7.4, *)` | `>=1.7.4` | x or newer |
| `(x, ...)` | `(1.7.4, ...)` | `>1.7.4` | Newer than x |
| `[x, y)` | `[1.7.4, 1.8.0)` | `>=1.7.4 <1.8.0` | From x, up to but not including y |
| `(x, y]`, `[x, y]` | `(1.7.0, 1.7.6]` | `>1.7.0 <=1.7.6` | `[`/`]` include the bound, `(`/`)` exclude it |
| `(..., x]` | `(..., 1.7.6]`, `(?, 1.7.6]`, `(*, 1.7.6]` | `<=1.7.6` | x or older |
| `(..., x)` | `(..., 1.7.6)` | `<1.7.6` | Older than x |

An open end is exactly one of `...` (three plain dots), `?` or `*`, and takes `(` or `)`. They can't be combined: `?*` or `*...` is refused. A typographic `…`, as autocorrect makes it from three dots, is read as `...`. All three are plain ASCII, so they type the same in every shell and Windows console. Quote the value in your shell: brackets, `?`, `*`, `<`, `>` and `|` mean something to it.

Anything else is refused before `npx` runs, so a typo can't turn into a different package or a shell command:

<!-- verify -->
```bash
AISKILLS_SKILLS_LIB_VERSION='1.7 && calc' aiskills find pdf
```

```text
[aiskills] AISKILLS_SKILLS_LIB_VERSION must be a version (e.g. 1.7.6), "latest", "next", an npm range (e.g. ~1.7.4) or an interval (e.g. [1.7.4, 1.8.0)); got '1.7 && calc'
```

An interval that no version fits, such as `[1.8.0, 1.7.0)`, is refused too, and so are tabs, line breaks and non-ASCII spaces between the parts of a range: only plain spaces separate them, because a range is passed to `npx` (and on Windows to `cmd.exe`) as typed. Spaces or a line break at the very start or end are dropped.

Whenever `AISKILLS_SKILLS_LIB_VERSION` overrides the pinned version, `aiskills` says so once per command, even for commands that don't print the `npx` command (`ls`, `find`):

<!-- verify -->
```bash
AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]' aiskills skills --version
```

```text
[aiskills] using skills@<=1.7.6 from AISKILLS_SKILLS_LIB_VERSION, not the tested 1.7.6
[aiskills] running: npx -y 'skills@<=1.7.6' --version
```

So a version set by a shell profile, a project's `.envrc` or a CI variable can't replace the tested one without a trace.

On Windows, set it the way your shell quotes:

```powershell
$env:AISKILLS_SKILLS_LIB_VERSION = '(..., 1.7.6]'   # PowerShell
```

```bat
set "AISKILLS_SKILLS_LIB_VERSION=(..., 1.7.6]"      & rem Command Prompt: no single quotes, they'd become part of the value
```

Git Bash and WSL work like macOS and Linux. `npx` then runs through `cmd.exe`: a range's package argument (`skills@<=1.7.6`) is passed in double quotes, where `cmd.exe` reads `<`, `>`, `|` and `^` as plain text; every other argument still may not contain them.

## When npm's release-age rule blocks the pinned version

With `min-release-age=7` (or `before=<date>`) in your `.npmrc`, npm refuses a version published more recently than that. If the pinned `skills` CLI is that new, every command that runs `npx` fails, and `aiskills` adds what to do after npm's own error:

```text
[aiskills] npm's release-age rule (min-release-age or before) blocked skills@1.7.6: npm only installs versions published before 11/2/2026, 9:53:24 AM, and this one is newer.
[aiskills]   - wait until it is old enough ('npm view skills time' shows when each version came out), or
[aiskills]   - relax the rule for one run: npm_config_min_release_age=0 aiskills <command>, or
[aiskills]   - allow an older, untested skills CLI: AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]' (npm picks the newest it may)
```

- **Wait.** The pinned version qualifies once it's old enough.
- **Relax the rule for one run:** `npm_config_min_release_age=0 aiskills installed`. `aiskills` passes `npm_config_min_release_age`, `npm_config_min_release_age_exclude` and `npm_config_before` on to `npx`.
- **Allow an older version:** `AISKILLS_SKILLS_LIB_VERSION='(..., 1.7.6]'` lets npm fall back to the newest version your rule allows.

`min-release-age-exclude[]=skills` in `.npmrc` doesn't help here: `npm install` honours it, but `npx` (npm 11.21 and 12.2 tested) ignores it.

## Troubleshooting

- **`-a` patterns or `--route` stop working on another version**: `aiskills` reads two pieces of `npx skills` text output (the "Valid agents:" list and `find` results). If a release changes them, go back to the pinned version and report it.

> [!WARNING]
> `latest`, ranges and intervals give up the protection of the pinned, tested version: npm may pick a release nobody has tested with `aiskills`. Use them to try a release or to get past an age rule, not as a permanent setting.

See also: [`AISKILLS_SKILLS_LIB_VERSION`](../reference/environment.md#aiskills_skills_lib_version) · [Security model](../concepts/security.md)
