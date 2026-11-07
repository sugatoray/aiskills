# FAQ and troubleshooting

Answers to the questions people ask most, and fixes for the problems they hit.

## Questions

### Which agents are supported?

Every agent the `skills` CLI supports: Claude Code, Codex, Cursor, Qoder and many more. `aiskills` reads the list from `npx skills`, so a newer `skills` version brings new agents with no change here. Pass agent ids to `-a` (`claude-code`, `codex`, `cursor`, …).

### Where are the skills on my machine?

The saved copy is in `~/.config/sugatoray/aiskills/skills/` (`aiskills path` prints the folder). `npx skills` installs them into each agent's own folder, such as `~/.claude/skills/`, or the project's folders with `-p`.

### What's the difference between `aiskills`, `ais` and `aix`?

`ais` is `aiskills`. `aix` is `aiskills --route`, which also manages skills that aren't bundled. See [Bundled and external skills](concepts/bundled-and-external.md).

### How do I update the skills?

Install a newer package: `npm install -g @sugatoray-ai/aiskills@latest`. The install step saves the new skills and registers them again. If you had picked particular skills or agents, run that `aiskills install ...` command again.

### Does it install Claude Code plugins?

No. It reads the repo's `.claude-plugin/marketplace.json` only to group the skills. Everything is installed as skills through `npx skills`.

### Can I edit the saved skills?

Don't: every sync replaces `~/.config/sugatoray/aiskills/skills/`. Copy a skill elsewhere to change it, or contribute the change to [the repo](https://github.com/sugatoray/aiskills).

### Does aiskills send any data?

No. The `skills` CLI it runs sends anonymous usage data to `skills.sh` unless `DISABLE_TELEMETRY` or `DO_NOT_TRACK` is set. See [Security model](concepts/security.md#telemetry).

### How do I change how these docs look?

In the single-page HTML version of these docs (`index.html`), click the gear at the top right and pick one of 11 themes; the moon/sun button next to it switches light and dark. Your choice is remembered in your browser. The default is Lights Out.

### Is there a JavaScript API?

No. Only the commands are public; the files under `src/scripts/` can change in any release.

### What is a skill group, and why is `newsletter-ai` "ungrouped"?

Groups come from the plugin entries in the repo's `marketplace.json`. `newsletter-ai` isn't in any entry, so install it by name or with `-G all`. See [Skill groups](concepts/skill-groups.md).

## Troubleshooting

### Nothing was installed by `npm install -g`

- **Symptom:** `aiskills installed` shows nothing after the npm install.
- **Cause:** the install step hides its output and never fails. It may have been skipped (`--ignore-scripts`, pnpm, bun, `CI` set) or `npx skills add` may have failed (offline, proxy).
- **Fix:** run `aiskills install`. It prints what goes wrong.

### `skills: not found` during the npm install

- **Cause:** an npm setting reached the nested `npx`. `aiskills` removes npm's own variables before running `npx`, so this means a new one got through.
- **Fix:** run `aiskills install` after the npm install, and please [report it](https://github.com/sugatoray/aiskills/issues).

### A pattern does nothing, or matches files

- **Cause:** the shell expanded an unquoted pattern, such as `-s scrolls-*`, into file names.
- **Fix:** quote it: `-s 'scrolls-*'`.

### A skill's `.gitignore` is missing in the package

- **Cause:** npm drops files named `.gitignore`. The package stores them as `_gitignore`.
- **Fix:** none needed: every sync renames them back in `~/.config/sugatoray/aiskills/skills/`.

### `--route` can't find a skill I know exists

- **Cause:** the name isn't an exact match, several skills share it, or there's no network access to `skills.sh`.
- **Fix:** run `aiskills find <name>` and pass the exact `owner/repo@skill`. See [Errors](reference/errors.md#external-skills---route).

### `... is not an aiskills folder ...`

- **Cause:** `AISKILLS_HOME` points at a folder with other files in it, which `aiskills` refuses to replace or delete.
- **Fix:** point it at a new or empty folder. See [Errors](reference/errors.md#not-an-aiskills-folder).

### `aiskills` is gone, but the skills are still installed

- **Cause:** npm ran no step on `npm uninstall -g`.
- **Fix:** `npx @sugatoray-ai/aiskills uninstall --purge`. See [Remove everything](guides/remove-everything.md).

See also: [Errors and exit codes](reference/errors.md) · [Docs home](README.md)
