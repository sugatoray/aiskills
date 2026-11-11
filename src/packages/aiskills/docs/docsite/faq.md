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

Install a newer package with `npm install -g @sugatoray-ai/aiskills@latest`, then run `aiskills install` again: it saves the new skills and registers them. If you had picked particular skills or agents, run that `aiskills install ...` command instead.

### Does it install Claude Code plugins?

No. It reads the repo's `.claude-plugin/marketplace.json` only to group the skills. Everything is installed as skills through `npx skills`.

### Can I edit the saved skills?

Don't: every sync replaces `~/.config/sugatoray/aiskills/skills/`. Copy a skill elsewhere to change it, or contribute the change to [the repo](https://github.com/sugatoray/aiskills).

### Does aiskills send any data?

`aiskills` sends nothing itself. After `aiskills install`, it runs `npx skills add sugatoray/aiskills` once more in a temp folder, in the background, so the install is counted on skills.sh (off with `--no-stats` or `AISKILLS_STATS=0`); see [The skills.sh install count](concepts/install-count.md). The `skills` CLI sends anonymous usage data to `skills.sh` unless `DISABLE_TELEMETRY` or `DO_NOT_TRACK` is set, and either one also turns the count off. See [Security model](concepts/security.md#telemetry).

### `aiskills` fails with "No matching version found for skills@… with a date before …"

Your npm has a release-age rule (`min-release-age` or `before` in `.npmrc`), and the `skills` CLI version `aiskills` runs is newer than it allows. `aiskills` prints the options after npm's error: wait, run once with `npm_config_min_release_age=0 aiskills <command>`, or set `AISKILLS_SKILLS_VERSION='(…, 1.7.6]'` so npm can fall back to an older version. See [When npm's release-age rule blocks the pinned version](guides/choose-the-skills-cli-version.md#when-npms-release-age-rule-blocks-the-pinned-version).

### Why don't my installs show up on skills.sh?

The count needs github.com and api.github.com: without them it's skipped silently. It's also off with `--no-stats` (check `"stats"` in `~/.config/sugatoray/aiskills/aiskills.json`), `AISKILLS_STATS=0`, `DO_NOT_TRACK`, `DISABLE_TELEMETRY` or `CI`. `AISKILLS_STATS_FOREGROUND=1 aiskills install` shows what happens.

### How do I change how these docs look?

In the single-page HTML version of these docs (`index.html`), click the gear at the top right and pick one of 11 themes; the moon/sun button next to it switches light and dark. Your choice is remembered in your browser. The default is Lights Out.

### Is there a JavaScript API?

No. Only the commands are public; the files under `src/scripts/core/` can change in any release.

### What is a skill group?

Groups come from the plugin entries in the repo's `marketplace.json`; every bundled skill is in one. See [Skill groups](concepts/skill-groups.md).

### Why isn't `newsletter-ai` in the package?

The repo's `skills/newsletters/.skillsignore` leaves it out on purpose, so `aiskills` doesn't install it. It is still in the repo, so you can install it straight from there:

```bash
npx skills add sugatoray/aiskills --skill newsletter-ai --global
```

or through `aix`, naming the source (pinned, so it isn't asked about): `aix install -s sugatoray/aiskills@newsletter-ai`.

### Nothing was installed by `npm install -g`

- **Symptom:** `aiskills installed` shows nothing after the npm install.
- **Cause:** that's expected. `npm install` only adds the `aiskills` command; the package has no install step, so it never changes your agents by itself.
- **Fix:** run `aiskills install`. It prints each step, and any error.

### `skills: not found` when run through `npx @sugatoray-ai/aiskills`

- **Cause:** an npm setting reached the nested `npx`. `aiskills` removes npm's own variables before running `npx`, so this means a new one got through.
- **Fix:** install the package with `npm install -g` and run `aiskills install`, and please [report it](https://github.com/sugatoray/aiskills/issues).

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
