# Markdown fix patterns

Before/after pairs for the findings that come up most. Use them to shape a suggested change,
adapted to the project's style guide and the renderer the file is shown on. The examples are
fenced with four backticks so the Markdown inside them can contain fences of its own.

## Commands the reader can run as written

````markdown
<!-- Before: prompt characters break copy and paste; the directory and prerequisite are unstated -->
Install it:

    $ npm install
    $ npm run build
````

````markdown
<!-- After -->
Requires Node.js 20 or later. From the repository root:

```bash
npm install
npm run build
```

The build writes `dist/index.js`.
````

## Mark placeholders, and keep them out of the HTML parser

````markdown
<!-- Before: <token> is parsed as an HTML tag and vanishes; the reader can't tell what to replace -->
Run deploy --token <token> --env prod
````

````markdown
<!-- After -->
Run the following, replacing `<token>` with your API token:

```bash
deploy --token "<token>" --env prod
```
````

## A language on every fence

````markdown
<!-- Before: no highlighting, and linters and doc-testers skip it -->
```
SELECT id FROM users WHERE active;
```
````

````markdown
<!-- After -->
```sql
SELECT id FROM users WHERE active;
```
````

Use `text` for output and plain text, `console` for a session that shows prompts and output
together.

## Headings that form an outline

````markdown
<!-- Before: levels chosen for size; the page title appears twice -->
# Widget
### Install
# Usage
##### Options
````

````markdown
<!-- After: one top-level heading, levels that nest -->
# Widget
## Install
## Usage
### Options
````

## Links that survive a move

````markdown
<!-- Before: pinned to a branch name and a host; breaks on forks and after a rename -->
See [the guide](https://github.com/acme/widget/blob/master/docs/guide.md) or click
[here](https://github.com/acme/widget/blob/master/docs/api.md#options).
````

````markdown
<!-- After: relative paths, and link text that says where the link goes -->
See the [installation guide](docs/guide.md) and the [options reference](docs/api.md#options).
````

Keep absolute URLs where the file is also shown away from the repository, for example a
README published to a package registry.

## Content inside a list item

````markdown
<!-- Before: the unindented block ends the list: the code is not part of step 1, and step 2
     starts a second list -->
1. Create the config file:

```bash
cp config.example.toml config.toml
```

2. Start the server.
````

````markdown
<!-- After: indent the block to the item's text -->
1. Create the config file:

   ```bash
   cp config.example.toml config.toml
   ```

2. Start the server.
````

## Tables that render

````markdown
<!-- Before: no delimiter row, and the | in the cell splits it -->
| Flag | Meaning |
| -a|-b | Either form |
````

````markdown
<!-- After -->
| Flag | Meaning |
| --- | --- |
| `-a` \| `-b` | Either form |
````

## Names that are not emphasis

````markdown
<!-- Before: renders as a bold "init" and "2", an italic "3", then "4": the markers vanish -->
Edit __init__.py so that the result is 2*3*4.
````

````markdown
<!-- After -->
Edit `__init__.py` so that the result is `2*3*4`.
````

An underscore inside a word (`snake_case_name`) is left alone by CommonMark and GitHub; an
asterisk inside a word is not. Code spans are right for names either way.

## Alt text on images

````markdown
<!-- Before -->
![](docs/img/screenshot-3.png)
````

````markdown
<!-- After: say what the image shows that the text doesn't -->
![The settings page with the "Rotate key" button highlighted](docs/img/settings-rotate-key.png)
````

## Examples without real credentials or hosts

````markdown
<!-- Before: a live-looking key and an internal host name in a public file -->
```bash
curl -H "Authorization: Bearer sk_live_51Hx…" https://billing-internal.corp.acme.net/v1/charges
```
````

````markdown
<!-- After: an obvious placeholder and a reserved example domain -->
```bash
curl -H "Authorization: Bearer $ACME_API_KEY" https://api.example.com/v1/charges
```
````

If the key in the "before" was ever real, removing it from the file is not enough: it must be
revoked. See `SECURITY.md`.

## Install instructions that can be verified

````markdown
<!-- Before: runs whatever the server returns, as root -->
```bash
curl -s https://example.com/install.sh | sudo bash
```
````

````markdown
<!-- After: a pinned version, a checksum, and a script the reader can inspect -->
```bash
curl -fsSLO https://example.com/releases/v1.4.2/install.sh
echo "<sha256 from the release page>  install.sh" | sha256sum --check
bash install.sh
```
````

## A changelog entry the release tooling can read

````markdown
<!-- Before -->
## 1.4.0
- fixed stuff
- Added thing
````

````markdown
<!-- After (Keep a Changelog) -->
## [1.4.0] - 2025-03-02

### Added

- `--dry-run` flag for `widget sync`.

### Fixed

- `widget sync` no longer exits 0 when the remote rejects the upload.
````

## State what success looks like

````markdown
<!-- Before -->
Start the server.
````

````markdown
<!-- After -->
Start the server:

```bash
npm start
```

It prints `Listening on http://localhost:3000`. Open that address; you should see the sign-in
page.
````
