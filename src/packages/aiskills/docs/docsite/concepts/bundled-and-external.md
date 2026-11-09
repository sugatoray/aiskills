# Bundled and external skills

Bundled skills ship in this package; external skills come from anywhere else, and `aiskills` manages them only when you add `--route` (or use `aix`).

## The difference

| | Bundled | External |
| --- | --- | --- |
| Where it comes from | This package, via `~/.config/sugatoray/aiskills` | The skills.sh registry, GitHub, a URL or a path |
| Installed by | `npx skills add <install folder> --skill <name>` | `npx skills add <owner/repo@skill>` |
| Needs `--route` | No | Yes |
| Shown by `installed` | Yes | Only with `--route` |
| Removed by a full `uninstall` | Yes | Never; name it with `--route` |

## What `--route` changes

**install.** Each `-s` entry that isn't bundled is handed to `npx skills`:

| `-s` entry | What happens |
| --- | --- |
| A bundled name or a pattern | Installed from the install folder, as without `--route`. Patterns only match bundled skills. |
| A bare name that isn't bundled, e.g. `pdf` | `npx skills find pdf`; installed only if exactly one result is named exactly `pdf`, and only after you confirm it (`y` at the prompt, or `-y`). |
| `owner/repo@skill` | `npx skills add owner/repo@skill`, no lookup. |
| `owner/repo`, a URL or a path | `npx skills add <spec>`, which installs the skills found there. |

**uninstall.** Names and patterns also match skills from other sources. `owner/repo@skill` is reduced to `skill`; a bare `owner/repo` is refused because it names no skill. Names that aren't installed are skipped with a warning. A full uninstall still removes only bundled skills.

**installed.** Lists every skill in the scope, with a source column: `bundled`, or the source `npx skills` recorded.

## Why a bare name needs exactly one match

The registry is shared and changes. If two repositories both publish a skill called `pdf`, picking one would be a guess about which code you trust. `aiskills` stops and lists the candidates so you can choose with `owner/repo@skill`. It also ignores results whose `owner/repo@skill` contains anything but letters, digits, `.`, `_` and `-`.

## Why a found skill is confirmed

Even a unique exact match is the registry's choice, not yours: anyone can publish a skill called `pdf`. So `aiskills` shows what the lookup found (`owner/repo@skill`, its install count, and the name you typed) and asks `Install <n> external skill(s) from the registry? [y/N]` before installing anything, bundled skills included. Only `y` or `yes` installs.

- With no terminal to ask in (a script, CI, an agent), it stops instead, unless you pass `-y` (`--yes`).
- `-n` (`--dry-run`) shows the matches and the exact commands without installing.
- An `owner/repo@skill`, URL or path is never asked about: you named the source yourself.

## Trade-offs and limits

- `npx skills remove` removes by name, so `--route uninstall -s pdf` removes `pdf` whichever source it came from.
- External skills aren't copied into the install folder, and `--purge` doesn't remove them.
- Lookups need network access to `skills.sh`.

See also: [4. Add external skills](../tutorial/04-add-external-skills.md) · [`--route`](../reference/cli.md#--route) · [Security model](security.md)
