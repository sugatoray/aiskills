# HTML security review

The security scope for HTML and for templates and components that produce it. It is read for
the security pass of a full review, and on its own, with `WISDOM.md`, when the review runs
with `-s`/`--security`. Rate findings with `../SEVERITY.md` and report them with
`../REPORT_TEMPLATE.md`.

## Scope

In scope: cross-site scripting through markup and templates, inline script and the Content
Security Policy, third-party resources, framing and embedded content, links and navigation,
forms, and information left in the page.

Establish first:

- **What produces the page.** A static file has no injection unless script on it builds
  markup. A template or component does wherever a value is interpolated.
- **What escapes output, and where that is switched off.** Find the engine's autoescape
  setting and every escape hatch on the changed path.
- **Who controls each interpolated value,** including values stored by another user.
- **Whether there is a Content Security Policy,** where it is set, and what it allows.

## Where untrusted data enters

- Template variables filled from requests, databases, other users' content, file names,
  third-party APIs and translations.
- URL parts read by script on the page: query string, fragment, `document.referrer`.
- Attributes that take URLs: `href`, `src`, `action`, `formaction`, `srcset`, `data`,
  `poster`, and `<meta http-equiv="refresh">`.
- Rich text and HTML fragments accepted from users or from a content system.
- Content of framed pages and of anything loaded from another origin.

## Checks

### Injection into markup

- **Escaping switched off for a value that is not trusted:** `|safe` and `Markup` (Jinja),
  `{{{ }}}` (Handlebars, Mustache), `<%- %>` (EJS), `html_safe` and `raw` (Rails),
  `@Html.Raw` (Razor), `v-html` (Vue), `dangerouslySetInnerHTML` (React), `{@html}` (Svelte),
  `[innerHTML]` with `bypassSecurityTrust…` (Angular), or autoescape disabled for the file.
- **Escaping for the wrong context.** HTML escaping protects text between tags and quoted
  attribute values. It does not protect:
  - an **unquoted attribute** (`<input value={{ v }}>`): a space ends the value;
  - a **URL attribute:** `javascript:` and `data:` URLs contain nothing to escape. Allow only
    expected schemes, checked on the server;
  - a **`<script>` block:** escape for JavaScript and prevent `</script>`; better, pass data
    in a `data-` attribute or a JSON script block and read it from there;
  - an **event-handler attribute** (`onclick="go('{{ v }}')"`): the value is decoded as HTML
    and then run as script;
  - a **`<style>` block or `style` attribute.**
- **User-supplied HTML** rendered without a sanitiser that uses an allow-list (DOMPurify, a
  server-side equivalent), or sanitised and then modified.
- **Tag and attribute names, or whole attributes, built from input.**

### Inline script and Content Security Policy

- **Inline event handlers (`onclick=…`), inline `<script>` and `javascript:` URLs.** They
  force the policy to allow `'unsafe-inline'`, which removes most of its protection against
  injected script. Move handlers to script files, or use nonces or hashes.
- **A policy weakened by the change:** `'unsafe-inline'`, `'unsafe-eval'`, `*`, `data:` or
  a broad host added to `script-src`; a policy set only in a `<meta>` tag where a header is
  possible (`frame-ancestors` and reporting are ignored there).
- **`<base href>`** set from input or to another origin: it redirects every relative URL,
  including script sources.

### Third-party resources

- **Scripts and stylesheets from another origin without `integrity`** and `crossorigin`, or
  from a URL with no pinned version.
- **New third-party tags** (analytics, widgets, chat): each runs with full access to the
  page and its data. Ask whether it is needed on pages that show sensitive data.
- **Resources loaded over `http://`** from an HTTPS page (mixed content).

### Framing and embedded content

- **`<iframe>` of content you don't control without `sandbox`,** or with
  `allow-scripts allow-same-origin` together for same-origin content, or with broad `allow`
  permissions (camera, microphone, geolocation).
- **Pages that can be framed by anyone** and carry state-changing controls (clickjacking):
  look for `frame-ancestors` or `X-Frame-Options` where headers are set.
- **`<object>`, `<embed>` and SVG** loaded from user uploads: SVG can contain script.
- **`postMessage` between frames** with no origin check on either side.

### Links, navigation and forms

- **`target="_blank"` to an untrusted site without `rel="noopener"`.** Current browsers
  imply it; older ones let the new page navigate the opener.
- **Redirect targets and link destinations taken from input** with no allow-list.
- **Forms:** a state-changing form with `method="get"`, with no CSRF token where the
  framework expects one, posting to `http://`, or with `action` or `formaction` built from
  input; password fields with `autocomplete` that defeats password managers; sensitive values
  in hidden fields that the server then trusts.
- **File inputs** whose `accept` attribute is the only restriction on type.

### Information left in the page

- **Comments, hidden elements and `data-` attributes** carrying internal host names,
  credentials, tokens, debug output, or other users' data.
- **Secrets and keys embedded for script to read.** Everything in the page is public.

## Tools

| Purpose | Command | Notes |
| --- | --- | --- |
| Escaping switched off | `git grep -nE '\|\s*safe\b\|\{\{\{\|<%-\|html_safe\|\braw\(\|@Html\.Raw\|v-html\|dangerouslySetInnerHTML\|\{@html\|bypassSecurityTrust\|autoescape'` | Read each hit and trace the value to its source. |
| Inline script and `javascript:` URLs | `git grep -nE '\son[a-z]+\s*=\|javascript:' -- '*.html' '*.htm'` | |
| Third-party resources without SRI | `git grep -nE '<(script\|link)[^>]+(src\|href)="https?://' -- '*.html' '*.htm' \| grep -v integrity` | |
| Frames without a sandbox | `git grep -n '<iframe' \| grep -v sandbox` | |
| Where the policy and headers are set | `git grep -nE 'Content-Security-Policy\|frame-ancestors\|X-Frame-Options\|http-equiv'` | Then `curl -sI` against a local instance to see what is sent. |
| Policy evaluation | paste the policy into a CSP evaluator, or read it against the list above | Don't send unpublished internal URLs to a public service. |
| Lint | `npx html-validate "src/**/*.html"` | Catches little that is security-relevant; it does report inline handlers and missing `rel` if the project enables those rules. |

## What this review does not establish

It reads markup and templates. It does not test a running site, so it cannot confirm which
headers a proxy adds, what the deployed policy is, or that an injection is exploitable in a
given browser. It does not review the scripts the page loads: use the JavaScript scope for
those. Recommend a dynamic scan or a penetration test where the change warrants it.
