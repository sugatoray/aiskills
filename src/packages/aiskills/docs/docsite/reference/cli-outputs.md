# CLI outputs

What every `aiskills` command prints, in color, as it looks on a terminal. Each command ran in a fresh home folder against the same sample data as the examples in these docs, so the page is the same every time it's rebuilt. For what each option means, see the [CLI reference](cli.md).

<iframe data-page="cli-outputs.html" title="What every aiskills command prints, in color" loading="lazy" style="width:100%;height:900px;border:1px solid #2a3440;border-radius:10px;background:#15191d"></iframe>

[Open the CLI outputs full-size](cli-outputs.html) (full screen; close it with ✕ or `Esc`)

## How to use it

- **Pick a command** from the list on the left (at the top on a phone), or scroll. The commands are grouped: help and setup, skills, install and remove, releases and upgrades, `npx skills` passed through, and errors.
- **Turn Colors off** to see the output as it reads when piped, or with [`--no-color`](cli.md#--no-color). Which parts are colored is described under [Colored output](cli.md#colored-output).
- **Copy a command** with the button next to it, to try it yourself.

## What the sample shows

- The npm registry data and download counts are the docs' samples, as of 2026-11-21, not npm's live data.
- `npx skills` is a stand-in that prints nothing of its own, so for `list`, `install` and `skills` only the lines `aiskills` prints itself appear. With the real `npx skills`, its own output follows them.
- Paths show a global npm install (`/usr/local/lib/node_modules/@sugatoray-ai/aiskills`) and `~` for the home folder.

## Rebuild it

The page is generated. After changing a command's output, rebuild it from `src/packages/aiskills/`:

```bash
npm run cli-outputs          # rebuild docs/docsite/reference/cli-outputs.html
npm run cli-outputs:check    # exit 1 if it is out of date
```

`npm run docs` rebuilds it too. Which commands appear, their groups and notes are set in `docs/cli-outputs/commands.json`.

See also: [CLI reference](cli.md) · [Environment variables](environment.md)
