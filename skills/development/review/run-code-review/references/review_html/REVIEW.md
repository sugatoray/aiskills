# HTML review

What to look for in HTML (`.html`, `.htm`, and markup inside templates and components), beyond
`../CROSS_LANGUAGE.md`. Browsers repair broken HTML silently, so the page "works" while it is
inaccessible, insecure or slow. `PATTERNS.md` has the fix for the common items, `TOOLING.md` the
commands, `SECURITY.md` the security scope, and `WISDOM.md` the constraints and traps to keep in
mind for every HTML review.

## Before you start

- **What produces the HTML.** A static file, a server template (Jinja, ERB, Razor), or a
  component (JSX, Vue, Svelte). In a template, find what escapes interpolated values and where
  escaping is switched off.
- **Where it runs.** Which browsers (`browserslist`, the project's support statement), an email
  client, or a webview. Don't suggest elements or attributes the target lacks.
- **What the project enforces.** An HTML validator or linter config, an accessibility standard
  (commonly WCAG 2.1 or 2.2 level AA), a Content Security Policy.

## Structure and validity

- **No `<!doctype html>`:** the page renders in quirks mode, with a different box model.
- **No `<meta charset="utf-8">` in the first 1024 bytes,** or no `lang` on `<html>`: wrong
  characters, and screen readers pronounce the text in the wrong language.
- **No viewport meta tag** on a page meant for phones.
- **Duplicate `id` values:** labels, `aria-*` references, fragment links and `getElementById`
  silently use the first.
- **Invalid nesting** (a `<div>` inside `<p>`, interactive elements inside `<a>` or `<button>`,
  `<li>` outside a list): the parser moves or closes elements, and the DOM differs from the
  source.
- **Unclosed or mis-nested tags** that the parser recovers from differently than the author
  intended.
- **Missing or empty `<title>`.**

## Semantics and accessibility

- **`<div>` or `<span>` with a click handler** where a `<button>` or `<a href>` belongs: not
  focusable, no keyboard activation, no role for assistive technology.
- **Links used as buttons and buttons used as links.** Navigation is `<a href>`; an action is
  `<button type="button">`.
- **Images without `alt`.** Informative images need a description; decorative ones need
  `alt=""` so they are skipped. `alt` that repeats the adjacent text, or says "image of".
- **Form controls without a label:** no `<label for>`, no wrapping `<label>`, no `aria-label`.
  A `placeholder` is not a label.
- **Heading levels that skip or are chosen for size** (`<h1>` then `<h4>`); more than one
  `<h1>` used as a page title; no landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`).
- **ARIA that contradicts or duplicates native semantics** (`role="button"` on a `<button>`,
  `aria-hidden="true"` on a focusable element, `aria-label` on a `<div>` with no role). No ARIA
  is better than wrong ARIA.
- **Focus:** positive `tabindex` values, `outline: none` with no replacement, a modal that
  doesn't trap or restore focus.
- **Tables** used for layout, or data tables without `<th>` and `scope`.
- **Colour as the only signal,** and text that fails the contrast ratio (4.5:1 for body text
  at level AA).
- **Media** that autoplays with sound, or has no captions.

## Forms

- **`<button>` inside a form with no `type`:** it defaults to `submit`.
- **Wrong or missing `type`, `autocomplete`, `inputmode`** on inputs (`type="email"`,
  `autocomplete="current-password"`): worse keyboards on phones, broken password managers.
- **Client-side validation as the only validation.** `required`, `pattern` and `maxlength` are
  hints; the server must check again.
- **State-changing forms using `method="get"`,** which puts the data in the URL, history and
  logs.
- **Error messages** not associated with their field (`aria-describedby`) or not announced.

## Security

Read `SECURITY.md` for the full scope. The items that most often matter in ordinary review:
unescaped interpolation in templates, inline event handlers and `javascript:` URLs,
`target="_blank"` to untrusted sites, third-party scripts without `integrity`, and iframes
without `sandbox`.

## Performance

- **Images** without `width` and `height` (layout shift), without `loading="lazy"` below the
  fold, or served far larger than displayed with no `srcset`.
- **Render-blocking scripts in `<head>`** without `defer` or `async`; large inline scripts and
  styles repeated on every page.
- **Many third-party tags,** each a connection and a script; missing `preconnect` for the
  critical ones.
- **Fonts** without `font-display`, or preloaded without `crossorigin`.
- **Very large DOMs** (thousands of nodes rendered at once) where pagination or virtualisation
  fits.

## Maintainability

- Inline `style` attributes and inline scripts where the project uses stylesheets and modules.
- Presentational markup (`<br>` for spacing, `<b>` for headings, empty elements as spacers).
- Copy-pasted blocks that should be a template partial or component.
- Commented-out markup, and comments that reach production with internal notes in them.
- Hard-coded text in a project that has localisation.

## Usually not worth a finding

- Attribute order, quote style, self-closing slashes on void elements, indentation.
- `<b>`/`<i>` against `<strong>`/`<em>` where no emphasis semantics are at stake.
- Optional closing tags (`</li>`, `</p>`) omitted consistently in hand-written HTML.
- `type="text/javascript"` or `type="text/css"` left on tags.
