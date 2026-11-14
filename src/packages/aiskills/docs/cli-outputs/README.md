# aiskills CLI outputs

A maintainer tool that builds the **CLI outputs** page: every `aiskills` command and what it prints, in color, on one self-contained HTML page. The docs show it under **Reference → [CLI outputs](../docsite/reference/cli-outputs.md)**. Nothing here ships in the npm package.

## Files

| File | What it is |
| --- | --- |
| [`commands.json`](commands.json) | Which commands appear, in which groups, with a note for each. Edit this to add or change a command. |
| [`../../src/scripts/docs/templates/cli-outputs-template.html`](../../src/scripts/docs/templates/cli-outputs-template.html) | The page design, with `{{VERSION}}`, `{{SKILLS_CLI}}`, `{{TODAY}}` and `{{DATA}}` placeholders. Edit this to change layout, styles or behaviour. |
| [`../../src/scripts/docs/create-cli-outputs.mjs`](../../src/scripts/docs/create-cli-outputs.mjs) | The builder: runs each command, captures its colored output and fills the template. No dependencies. |
| [`../docsite/reference/cli-outputs.html`](../docsite/reference/cli-outputs.html) | The generated page (committed). **Don't edit by hand**: run `npm run cli-outputs`. |

## Commands

Run these from `src/packages/aiskills/`.

| Command | What it does |
| --- | --- |
| `npm run cli-outputs` | Rebuild the page. It's left untouched when only the machine-specific values differ (below). |
| `npm run cli-outputs:check` | Write nothing; exit 1 if the page is out of date. |
| `npm run docs` | Rebuild the banner, the Skills pages, `llms.txt`, this page, then `index.html`. |

The `cli-outputs.test.mjs` tests fail while the page is stale, as `docs.test.mjs` does for the docs examples.

## How it stays the same on every run

Each command runs in the sandbox the docs examples use (`src/test/helpers.mjs`):

- a copy of the package laid out like `npm install -g`, and a fresh home folder;
- stand-in `npx` and `npm` scripts: `npm view` answers with the sample registry data, and `npx skills` prints nothing of its own (`find` prints the entry's `find` lines);
- sample download counts, and `AISKILLS_TODAY` (the `today` value) for the commands marked `"today": true`;
- `FORCE_COLOR=1`, so the output is colored as on a terminal.

Sandbox paths are shown as a real install would have them: `/usr/local/lib/node_modules/@sugatoray-ai/aiskills` and `~`. Commands run in order in the same sandbox, so `info` after `sync` shows the saved skills.

Two values differ between machines and runs: the Node.js version and platform (`info`), and the time the skills were saved (`saved by`). They're masked when pages are compared, so the check passes on any machine.

## `commands.json`

```json
{
  "today": "2026-11-21",
  "groups": [
    { "id": "help", "label": "Help and setup", "items": [
      { "args": ["info"], "note": "This setup at a glance." }
    ] }
  ]
}
```

| Item field | Meaning |
| --- | --- |
| `args` | The command line after `aiskills`. |
| `note` | One sentence shown under the command. |
| `list` | Skill names `npx skills list` reports as installed from the install root (for `installed`, `uninstall`, `info --full`). |
| `find` | The lines `npx skills find` prints. |
| `today` | `true`: run with `AISKILLS_TODAY` set to the top-level `today` (release ages in `rel`). |
| `api` | `true`: give the command the sample download counts API (`rel --downloads`). |

The tests check that every command in `aiskills --help` appears at least once, and that every command exits `0` except the error examples.
