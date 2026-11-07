# Why aiskills

`aiskills` gives you Sugato Ray's skills as one versioned npm package, and lets you install them by group or pattern instead of one by one.

The [`skills`](https://www.npmjs.com/package/skills) CLI (`npx skills`) already installs agent skills from GitHub, URLs and local folders into Claude Code, Codex, Cursor and many other agents. `aiskills` doesn't replace it. It sits on top of it and adds what `npx skills` doesn't know about this collection of skills.

## What it adds

| You want to | With `npx skills` alone | With `aiskills` |
| --- | --- | --- |
| Get all the skills | `npx skills add sugatoray/aiskills --global` (latest `master`) | `npm install -g @sugatoray-ai/aiskills` (a released, versioned set) |
| Install a related set | List each skill with `--skill` | `-G scrolls` (groups come from the repo's `marketplace.json`) |
| Pick by pattern | Not supported | `-s 'scrolls-*'`, `-a 'claude*'` |
| Remove only these skills | Name each one; same-named skills from other sources go too | `aiskills uninstall` removes exactly what it installed |
| Work offline after install | Needs GitHub for each add | Skills are already on disk in `~/.config/sugatoray/aiskills` |
| Install other people's skills too | Yes | Yes, with `--route` or `aix` |

## When you don't need it

- You want only one or two skills and don't mind naming them: `npx skills add sugatoray/aiskills --skill <name> --global` is enough.
- You want skills that track the repo's `master` branch, not releases.
- You install skills only per project from `node_modules`: then you need the package, but not the `aiskills` command. See [Use the package with `npx skills experimental_sync`](../guides/use-experimental-sync.md).

## What it doesn't do

- It doesn't copy skills into agent folders itself. `npx skills` does that, and keeps its own record of what is installed.
- It doesn't install Claude Code plugins. It reads the repo's `.claude-plugin/marketplace.json` only to group the skills.
- It doesn't update skills by itself. Install a newer package version (`npm install -g @sugatoray-ai/aiskills@latest`) to get newer skills.

See also: [How aiskills works](../concepts/how-it-works.md) · [Installation](installation.md)
