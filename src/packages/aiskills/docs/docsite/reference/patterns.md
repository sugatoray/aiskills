# Patterns reference

The glob syntax that `-s`, `-G` and `-a` accept (and `AISKILLS_SKILLS`, `AISKILLS_GROUPS`, `AISKILLS_AGENTS`), on install and uninstall; this page is exhaustive.

## Syntax

| Pattern | Matches | Example |
| --- | --- | --- |
| `*` | Any text, including none | `scrolls-*` |
| `?` | Exactly one character | `?????-recipes` |
| `[abc]` | One of the listed characters | `scrolls-[hu]*` → scrolls-help, -hide, -unhide, -update |
| `[a-z]` | One character in the range | `scrolls-[r-u]*` |
| `[!abc]`, `[^abc]` | One character **not** listed | `scrolls-[!hu]*` → scrolls-remove, -restore, -setup |

Any other character matches itself. An entry with none of `*`, `?` or `[` is a plain name.

## Rules

- **Case is ignored**, for patterns and plain names alike.
- **The whole name must match.** `scroll*` matches `scrolls-skills`; `croll` matches nothing.
- **Mix freely.** One comma-separated list can hold names and patterns: `-s 'scrolls-*,prodigy'`.
- **A pattern that matches nothing is an error**, before anything changes. The message lists what is available.
- **Quote patterns** (`'scrolls-*'`), or your shell may expand them into file names.

<!-- verify -->
```bash
aiskills install -s '?????-recipes' -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: stata-recipes
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill stata-recipes --agent claude-code --yes
```

## What each option matches against

| Option | Matched against |
| --- | --- |
| `-s`, `--skill` | **install:** the bundled skills. **uninstall:** the bundled skills plus the skills installed from the install folder; with `--route`, every installed skill. |
| `-G`, `--group` | Group names **and** aliases. `all` and `*` mean every bundled skill. |
| `-a`, `--agent` | The agent ids `npx skills` accepts (`claude-code`, `codex`, `cursor`, …), read from `npx skills` itself. |

## Special cases

### `-s '*'`

Every skill, the same as no `-s`.

### `-a '*'`

Passed to `npx skills` unchanged; it means all agents.

### Plain agent names

Not checked by `aiskills`; `npx skills` checks them. Only patterns are expanded, and the expansion is printed as `[aiskills] agents: ...`.

### Uninstall with a pattern or a group

Only skills that are actually installed are removed. Plain names are always passed on with `-f`.

### `--route` and patterns

Patterns match only bundled (or, on uninstall, installed) skills. The registry can't be searched by pattern: use `aiskills find <query>`.

See also: [CLI reference](cli.md) · [2. Pick skills and agents](../tutorial/02-pick-skills-and-agents.md)
