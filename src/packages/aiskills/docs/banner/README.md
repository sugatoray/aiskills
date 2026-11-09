# aiskills banner

A maintainer tool that builds the aiskills banner: a single, self-contained HTML page (1280 × 640) that you can edit in the browser and export as PNG, the way [sugatoray/callai](https://github.com/sugatoray/callai/tree/master/src/tools/banner) builds its banner. `npm run banner:png` also renders `banner_2x.png` (2560 × 1280), the image at the top of the package README. Nothing here ships in the npm package.

## Files

| File | What it is |
| --- | --- |
| [`../../src/scripts/docs/templates/banner-template.html`](../../src/scripts/docs/templates/banner-template.html) | The page design, with `{{ name }}` placeholders. Edit this to change layout, styles or behaviour. |
| [`config.yaml`](config.yaml) | Every value that goes into the banner. Edit this to change text, badges or the terminal demo. |
| [`../../src/scripts/docs/create-banner.mjs`](../../src/scripts/docs/create-banner.mjs) | The builder: fills the template from the config, `package.json` and the bundled skills. No dependencies (PNG export needs Playwright). |
| [`aiskills-banner.html`](aiskills-banner.html) | The generated page (committed). **Don't edit by hand**: run `npm run banner`. |
| [`banner_2x.png`](banner_2x.png) | The 2× PNG (committed), made by `npm run banner:png`. The package README shows it. |

## Commands

Run these from `src/packages/aiskills/`.

| Command | What it does |
| --- | --- |
| `npm run banner` | Rebuild `aiskills-banner.html` from the template and `config.yaml`. |
| `npm run banner:check` | Write nothing; exit 1 if `aiskills-banner.html` is out of date. |
| `npm run banner:png` | Rebuild the page and render `banner_2x.png` with headless Chromium. Run this whenever the banner changes. |
| `npm run docs` | Rebuild the banner page, then the docs (the docs landing page shows the banner). |

Options, after `--` (e.g. `npm run banner -- --set tagline="Hello"`):

| Option | Meaning |
| --- | --- |
| `--package-version V` | Show this version instead of the one in `package.json`. |
| `--set KEY=VALUE` | Override a `config.yaml` value; lists (`groups`, `install_commands`) are comma-separated. Repeatable. |
| `--out PATH` | The page to write or check. |
| `--png [PATH]` | Also render a PNG (default `banner_2x.png`). |
| `--scale 1\|2\|4`, `--background as-is\|white\|black\|transparent`, `--ink auto\|light\|dark` | The PNG's size, background and text colour. |
| `--set theme=<id>` | Render in another theme (see [Themes](#themes)). |

## What's "auto"

| Value | From |
| --- | --- |
| `package_name`, `package_version`, `license`, `repo_url` | `package.json` |
| `node_requires` | `engines.node` in `package.json` |
| `skills_count`, `groups_count`, `groups` | The skills the package really ships, and the repo's `marketplace.json` |
| `skills_cli_version` | `SKILLS_CLI_VERSION` in `src/scripts/core/installer.mjs` |

The terminal demo's output lines are made from the bundled skills too (the `scrolls` group's real `bundled:` line, the pinned `skills` version), so the banner never shows output `aiskills` doesn't print. It opens with `ais sync` (save only) and its `skills saved to …` line, then `ais groups`, `ais i` and `aix i`. In `install_commands`, a trailing `# comment` is shown dimmed, in the terminal's comment colour. `route_skill` must be a skill the package doesn't bundle.

## Editing in the browser

Open `aiskills-banner.html` and click **Edit**; every outlined piece of text becomes editable. In the groups row, press Enter inside a pill to add one, or empty a pill to remove it. **Save** keeps your edits in this browser, **Save HTML** downloads a copy with them built in, and **Reset** restores the original. Edits made this way don't change `config.yaml`: put lasting changes there.

**Background** and **Ink** preview the banner on a dark, white, black or transparent background. Ink that can't be read on a background is disabled (light text on white, dark text on dark). A transparent PNG can end up on any page, so **Export all 15** exports it twice: `-light-ink` for dark pages and `-dark-ink` for light ones. `?export` shows only the banner, for scripted screenshots.

## Themes

The banner uses the same 11 themes as the docs page (`src/scripts/docs/themes.mjs`). `theme` in `config.yaml` sets the one the page opens in and that `banner_2x.png` is rendered in (default `lightsout`). The **⚙ Theme** menu in the toolbar previews the others and remembers your pick in this browser; `?export&skin=<id>` picks one for scripted exports. Each theme also has dark-ink accents, so white and transparent-for-light-pages exports stay readable.

`banner_2x.png` records its theme and the SHA-256 of the page it was rendered from in its PNG metadata, so the tests catch a PNG that wasn't re-rendered after a change.

## Where it's used

- **Package README:** `banner_2x.png`, by an absolute `raw.githubusercontent.com` URL on `master`, so it also shows on npmjs.com. The image appears there once this folder is on `master`.
- **Docs landing page (`docs/docsite/index.html`):** the banner itself, copied by `src/scripts/docs/build-docs-html.mjs` from between the `banner:html` and `banner:css` markers, without the editing features. The Markdown landing page has no banner.
- **Fonts and export:** the page loads Google Fonts, and its PNG export loads `html-to-image` from jsDelivr, so both need network access.
