# HTML tooling

Commands to run during a review, and how to read them. Follow `SKILL.md` step 4: run what the
project already has, don't install into it, and treat output as leads to confirm.

Static checks see the file as written. A template or component only becomes HTML once it is
rendered, and accessibility and performance tools need a rendered page: build or serve the
project locally and point them at that. Never run a scanner against a production site or one
you were not told to test.

## Find what the project uses

```bash
ls .htmlvalidate.json .htmlhintrc .pa11yci .pa11yci.json lighthouserc.* .lighthouserc.* .browserslistrc 2>/dev/null
git grep -nE '"(html-validate|htmlhint|pa11y|pa11y-ci|@axe-core/[a-z-]+|axe-core|lighthouse|@lhci/cli|linkinator)"' -- '*package.json'
git grep -nE 'Content-Security-Policy|http-equiv' | head -20                      # is there a CSP, and where is it set
git grep -nE '\|\s*safe\b|\{\{\{|<%-|html_safe|\braw\(|@Html\.Raw|v-html|dangerouslySetInnerHTML|\{@html' | head -40   # escaping switched off
git grep -nE '\son[a-z]+\s*=|javascript:' -- '*.html' '*.htm' | head -40          # inline handlers and javascript: URLs
git grep -nE '<(script|link)[^>]+(src|href)="https?://' -- '*.html' '*.htm' | grep -v integrity | head -40   # third-party resources without SRI
git grep -n 'target="_blank"' -- '*.html' '*.htm' | grep -v noopener | head -40
```

The `git grep` lines are rough nets; confirm each hit by reading it.

## Checks

| Purpose | Command | Notes |
| --- | --- | --- |
| Validity and common mistakes | `npx html-validate "src/**/*.html"` | Offline. Honours `.htmlvalidate.json`. Reports invalid nesting, duplicate ids, missing `alt`, unlabelled controls, missing button `type`. |
| Lint | `npx htmlhint "src/**/*.html"` | Honours `.htmlhintrc`. Lighter than `html-validate`. |
| Specification conformance | `vnu --errors-only path/` or `java -jar vnu.jar path/` | The Nu Html Checker, the engine behind the W3C validator. Run it locally rather than posting unpublished pages to the public service. |
| Accessibility, automated | `npx pa11y http://localhost:8080/page`, `npx @axe-core/cli http://localhost:8080/page` | Needs the page served and a headless browser. See "Reading the output". |
| Performance, accessibility and best-practice audit | `npx lighthouse http://localhost:8080/page --output=json --output-path=report.json --chrome-flags=--headless` | Scores vary between runs; use the individual audits, not the score. |
| Broken links | `npx linkinator http://localhost:8080 --recurse` | External links can fail for reasons unrelated to the change. |
| Subresource Integrity hash | `openssl dgst -sha384 -binary lib.min.js \| openssl base64 -A` | Prefix the result with `sha384-`. Hash the exact bytes the URL serves. |
| Rendered output of a template | the project's own build or dev server, then `curl -s http://localhost:8080/page` | Review what the browser receives, not only the template. |
| Response headers | `curl -sI http://localhost:8080/page` | `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, and `frame-ancestors` or `X-Frame-Options`. |

## Reading the output

- **Validators report against the specification.** An error for an obsolete attribute is real
  but usually minor; an error for a stray end tag or a misnested element can mean the DOM is not
  what the author wrote. Open the page and compare the parsed DOM with the source before
  rating it.
- **Automated accessibility checks find a minority of accessibility problems.** They catch
  missing names, bad contrast and invalid ARIA. They cannot tell whether `alt` text is accurate,
  whether focus order makes sense, or whether a widget works by keyboard. A clean run is not
  evidence of an accessible page: say what was checked by tool and what by hand.
- **A validator given a template** reports the template syntax as errors. Render first.
- **A missing security header in a local dev server** may be added by a proxy or CDN in
  production. Find where headers are set before reporting.

## Checking by hand

- **Keyboard:** Tab through the changed page. Every interactive element is reachable, the
  order follows the layout, focus is visible, and Enter and Space activate buttons. Escape
  closes dialogs and focus returns to the trigger.
- **Zoom and reflow:** 200% zoom and a 320-pixel-wide viewport without horizontal scrolling
  or clipped text.
- **Parsed DOM:** in the browser's developer tools, compare the Elements panel with the
  source where nesting is in doubt.
- **Accessibility tree:** the developer tools' accessibility pane shows the role and name each
  element exposes.

## Reproducing a finding

For a parsing finding, a minimal file and the DOM the browser builds from it:

```html
<!doctype html>
<meta charset="utf-8">
<title>Nesting</title>
<p>Before <div>inside</div> after</p>
<script>
  console.log(document.body.innerHTML);
  // <p>Before </p><div>inside</div> after<p></p>
</script>
```

For an injection finding, show the value, the template line, and the rendered output with the
value unescaped. Use a harmless marker (`<i>marker</i>`), not a working exploit.
