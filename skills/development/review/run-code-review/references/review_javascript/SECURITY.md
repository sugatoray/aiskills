# JavaScript security review

The security scope for JavaScript in Node.js and the browser. It is read for the security pass
of a full review, and on its own, with `WISDOM.md`, when the review runs with
`-s`/`--security`. TypeScript reviews read this file too. Rate findings with `../SEVERITY.md`
and report them with `../REPORT_TEMPLATE.md`.

## Scope

In scope: code execution and injection, cross-site scripting, prototype pollution, file and
path handling, cryptography and randomness, secrets, authentication, session and
authorisation logic visible in the code, browser security controls, resource exhaustion, and
the dependencies the change adds.

Establish first:

- **Where the code runs.** Server (Node, Deno, Bun, an edge runtime), browser, or both
  (server-side rendering, shared modules). Browser code is public and under the user's
  control: nothing in it is a secret, and no check in it is a control.
- **Who controls each input,** and which sink it reaches. Name the attacker and the path.
- **What the framework already does.** React, Vue and Angular escape text by default; an ORM
  binds parameters. The finding is where that protection is bypassed.

## Where untrusted data enters

- Server: `req.query`, `req.params`, `req.body`, `req.headers`, `req.cookies`, uploaded files
  and their names, WebSocket messages, webhook payloads, queue messages, responses from other
  services, `process.argv` and `process.env` where a lower-privileged party sets them.
- Browser: `location` (`href`, `search`, `hash`), `document.referrer`, `document.cookie`,
  `window.name`, `postMessage` events, `localStorage`/`sessionStorage`, URL parameters handed to
  a router, and any API response that contains another user's content.
- Data read back from a database that an earlier request wrote (stored injection).
- Model output and tool results in applications built on language models.

## Checks

### Code execution and injection

- **`eval`, `new Function`, `setTimeout`/`setInterval` with a string, `vm` used as a sandbox.**
- **Command injection.** `child_process.exec`/`execSync` with interpolated input. Use
  `execFile`/`spawn` with an argument array and no `shell: true`.
- **SQL and NoSQL injection.** Template strings in queries; request bodies passed straight into
  MongoDB filters (`{ "$gt": "" }` as a password). Use placeholders; coerce or validate types.
- **ReDoS.** A regular expression with nested quantifiers (`(a+)+`, `(.*)*`) run on user input,
  or a `RegExp` built from user input unescaped.
- **Server-side template injection:** user input compiled as a template (`ejs.render(input)`,
  `Handlebars.compile(input)`, `pug.render(input)`), rather than passed as data.
- **Dynamic `require()` or `import()`** with a path built from input.
- **Deserialisation that executes:** `node-serialize`, `serialize-javascript` output passed to
  `eval`, YAML loaded with a schema that allows custom types.

### Cross-site scripting and the DOM

- **XSS.** Untrusted data into `innerHTML`, `outerHTML`, `insertAdjacentHTML`,
  `document.write`, React's `dangerouslySetInnerHTML`, Vue's `v-html`, or a `href`/`src` that
  may be `javascript:`. Use `textContent`, framework escaping, or a sanitiser (DOMPurify).
- **Prototype pollution.** Recursive merge, `Object.assign` or path-based `set` over parsed
  user JSON without rejecting `__proto__`, `constructor` and `prototype`.
- **Escaping in the wrong context.** HTML escaping does not protect a value placed inside a
  `<script>` block, an event-handler attribute, a URL, or CSS. JSON embedded in a page needs
  `<` escaped (`\u003c`) so `</script>` cannot end the block.
- **Sanitising, then changing the string** (concatenating, decoding, or re-parsing it) undoes
  the sanitiser. Sanitise last, immediately before the sink.
- **DOM clobbering and trusting the DOM:** reading configuration from `window.someId` or a
  form's named element that injected markup can define.

### Files and paths

- **Path traversal.** `path.join(base, userValue)` then reading or serving the result. Resolve
  it and check it is still inside `base`.
- **Archive extraction** that writes entries by their stored path ("zip slip"), and uploads
  stored under the client's file name or served from the application's origin.

### Cryptography, tokens and secrets

- **`Math.random()` for tokens, IDs or passwords.** Use `crypto.randomUUID()`,
  `crypto.randomBytes()` or `crypto.getRandomValues()`.
- **Secret comparison with `===`.** Use `crypto.timingSafeEqual` on equal-length buffers.
- **JWT:** `decode` used where `verify` is needed; algorithm not pinned; no expiry check.
- **Secrets shipped to the browser:** keys in client bundles, in `NEXT_PUBLIC_`/`VITE_`
  variables, or in source maps.
- **Weak or misused primitives:** MD5 or SHA-1 for security, a fast hash for passwords (use
  `scrypt`, `argon2` or `bcrypt`), `createCipher` (deprecated, no IV), a fixed or reused IV,
  ECB mode, unauthenticated encryption.
- **TLS verification off:** `rejectUnauthorized: false`, `NODE_TLS_REJECT_UNAUTHORIZED=0`.
- **Secrets** in source, defaults, test fixtures, logs, error responses, or URLs.

### Web application controls

- **Web:** permissive CORS (`*` with credentials, origin reflected), cookies without
  `HttpOnly`/`Secure`/`SameSite`, missing CSRF protection on cookie-authenticated writes, open
  redirects, `postMessage` handlers that don't check `event.origin`, `target="_blank"` without
  `rel="noopener"` on old browsers.
- **Request size and rate:** body parser with no limit, unbounded pagination, uploads to memory.
- **Authorisation:** an object fetched by an id from the request with no check that it
  belongs to the caller; a check in the client only; a new route missing the middleware its
  neighbours have; middleware registered after the route it should protect.
- **Server-side request forgery:** `fetch`, `axios` or `http.get` to a URL from input with no
  allow-list; redirects followed to internal addresses; cloud metadata endpoints reachable.
- **Mass assignment:** `Model.create(req.body)` or `Object.assign(user, req.body)` letting a
  caller set `role`, `isAdmin` or an owner id.
- **Error handling that leaks:** stack traces, SQL or internal paths returned to clients.

### Dependencies and supply chain

- **Dependencies.** Lock file committed and in step with `package.json`; `npm ci` in CI; a new
  package checked for typosquatting, install scripts and maintenance.
- **Scripts loaded from a third-party origin** without Subresource Integrity, and build steps
  that fetch and run code from a mutable URL.

## Tools

| Purpose | Command | Notes |
| --- | --- | --- |
| Known-vulnerable dependencies | `npm audit --omit=dev` (`pnpm audit --prod`, `yarn npm audit`) | Report what the change adds, or what is reachable from production code. |
| Security lint | `npx eslint .` with the project's config | Rules from `eslint-plugin-security` and `eslint-plugin-no-unsanitized` apply only if the project has them. Leads, not findings. |
| Secrets | `gitleaks detect --no-git --source .` | Also search built bundles and source maps for keys. |
| Pattern search | `semgrep scan --config <the project's rules>` | Only with rules the project has, or ones available offline. |
| Rough net for sinks | `git grep -nE 'eval\(\|new Function\|innerHTML\|outerHTML\|insertAdjacentHTML\|document\.write\|dangerouslySetInnerHTML\|v-html\|child_process\|execSync\|rejectUnauthorized\|Math\.random' -- '*.js' '*.jsx' '*.mjs' '*.cjs' '*.ts' '*.tsx' '*.vue'` | Read each hit and trace the value back to its source. |
| Install scripts of a new dependency | `npm view <package> scripts` | `preinstall`, `install` and `postinstall` run on every install. |

## What this review does not establish

It reads code. It does not test a running application, so it says nothing about response
headers set by a proxy, the deployed Content Security Policy, cookie flags added by
infrastructure, or rate limiting at the edge. It does not replace a penetration test or a
dynamic scan: recommend those where the change warrants them.
