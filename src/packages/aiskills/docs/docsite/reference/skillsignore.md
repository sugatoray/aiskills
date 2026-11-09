# `.skillsignore` reference

The rule syntax of `.skillsignore` files, which leave files, folders or whole skills out of the package when it is built; this page is exhaustive.

A `.skillsignore` can sit in the repo's `skills/` folder or any folder below it. Its rules apply to that folder and below. It is read only when the package is built (`npm pack`), so it matters to maintainers, not to users. The repo uses one: `skills/newsletters/.skillsignore` holds `newsletter-ai/`, which leaves that skill out of the package (it stays installable from the repo with `npx skills add`).

## Syntax

The syntax is a subset of `.gitignore`:

| Line | Meaning |
| --- | --- |
| blank, or starting with `#` | Skipped. A `#` later in a line is part of the pattern. |
| `\#name`, `\!name` | A literal leading `#` or `!`. |
| `name` | A file or folder with that name, at any depth. |
| `/name`, `a/name` | A leading or middle `/` anchors the pattern to the `.skillsignore`'s folder. |
| `name/` | Folders only. |
| `*`, `?`, `[abc]`, `[!abc]` | Within one path segment. |
| `**` | Across segments: `**/x`, `x/**`, `a/**/b`. |
| `!pattern` | Re-include something an earlier rule excluded. |

## Rules

- **The last matching rule wins.** Rules in a deeper `.skillsignore` come after the outer ones.
- **An ignored folder is never entered**, so a file inside it can't be re-included (as in git).
- **`.skillsignore` files never ship.**
- **Ignoring only a `SKILL.md` is refused.** Ignore the skill's folder to drop the skill.
- **What was left out** is listed under `ignored` in [`.aiskills/layout.json`](files.md#aiskillslayoutjson).

## Example

```gitignore
# every tests/ folder, at any depth
**/tests/
# a "/" in the middle anchors to this folder, so use **/ for any depth
**/meta/MAINTAINERS.md
# all .log files except keep.log
*.log
!keep.log
# ignoring a skill's folder drops the whole skill
scrolls/wip-skill/
```

See also: [Leave files out of the package](../guides/leave-files-out.md) · [Errors](errors.md#packaging-errors-maintainers)
