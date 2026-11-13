# JSON security review

The security scope for JSON documents and for the code that parses or builds them. It is read
for the security pass of a full review, and on its own, with `WISDOM.md`, when the review
runs with `-s`/`--security`. Rate findings with `../SEVERITY.md` and report them with
`../REPORT_TEMPLATE.md`.

## Scope

In scope: secrets in documents, configuration that grants access or runs code, dependency
sources in manifests, and how parsing code handles untrusted JSON.

Establish first:

- **What reads the document, and with what authority.** A manifest read by a package manager
  runs scripts; a policy document grants access; a data file is only data.
- **Who can change it.** A file in the repository, or one fetched or uploaded at run time.
- **Whether it is published.** JSON shipped to a browser or inside a package is public.

## Where untrusted data enters

- Request and response bodies, webhooks, message queues, uploaded files.
- JSON read from a URL, a cache, a database column or local storage.
- Values interpolated into a JSON string, or JSON placed inside HTML or a shell command.

## Checks

### Secrets and sensitive data

- **Credentials in a document:** API keys, tokens, passwords, private keys, connection
  strings, service-account files, `.npmrc`-style auth in config. Rotate, then remove.
- **Secrets in files that are published:** anything bundled for a browser, a `package.json`
  that goes to a registry, source maps, exported dashboards and notebooks.
- **Personal or production data** in fixtures, snapshots and recorded HTTP responses.

### Manifests that run code or choose what is installed

- **`package.json` lifecycle scripts** (`preinstall`, `install`, `postinstall`, `prepare`)
  run on install with the installer's privileges. A new or changed one is code under review.
- **Dependency sources:** a git URL without a commit, an HTTP tarball, a `file:` path, a
  registry override, a new `overrides` or `resolutions` entry, a scope pointed at another
  registry.
- **Unbounded ranges** (`*`, `latest`, `>=`) and a manifest changed without its lock file.
- **A name that could resolve publicly:** an internal package name with no scope or registry
  pin.
- **`composer.json`, `deno.json`, `.vscode/tasks.json`, devcontainer files:** each can name
  commands that run on install or on opening the project.

### Configuration that grants access

- **Policy documents** (cloud IAM, bucket policies, CORS rules): a `*` action, resource or
  principal, a missing condition, public read or write.
- **Security switches turned off:** TLS verification, authentication, CSRF protection, a
  linter's security rules, `strict` flags in `tsconfig.json`.
- **Debug and development settings** in a file used in production.
- **Widened allow-lists:** origins, hosts, redirect URLs, file types.

### Code that parses or builds JSON

- **Keys named `__proto__`, `constructor` or `prototype`** reaching a recursive merge or a
  path setter: prototype pollution (see `../review_javascript/SECURITY.md`). `JSON.parse`
  itself only creates an own property; `Object.assign` from the result replaces the
  prototype of its target.
- **JSON built by string concatenation or a template:** a quote in the value adds keys. Use
  a serialiser.
- **JSON placed inside HTML:** `JSON.stringify` does not escape `</script>`. Escape `<` or
  use the framework's JSON-in-page helper (`../review_html/SECURITY.md`).
- **Parsed input used without validation:** type confusion (an array or object where a
  string is expected), mass assignment of every key onto a model, a missing bound on length.
- **Unbounded input:** no size limit on the body, deep nesting (Python's `json` raises
  `RecursionError`), huge numbers and strings.
- **Duplicate keys read differently by two components,** for example a gateway that
  validates the first and a service that uses the last.
- **Deserialisers that build typed objects from the document** (polymorphic type hints such
  as `@type` or `$type`): object injection. Check the library's setting.

## Tools

```bash
gitleaks detect --no-git --source . --redact          # or trufflehog filesystem .
git grep -nIE '"(password|passwd|secret|token|api[_-]?key|private[_-]?key|client[_-]?secret)"\s*:' -- '*.json' | head -40
git grep -nE '"(pre|post)?install"|"prepare"' -- '*package.json'
npm audit --omit=dev                                    # needs the lock file and the registry
```

The `grep` lines are rough nets: a hit is a line to read, and a clean result proves nothing.

## What this review does not establish

- That no secret exists in history: only the files in scope were read.
- That dependencies are free of known vulnerabilities or malicious code.
- That a policy is correct for the system it governs: that needs the system's threat model.
- That every consumer parses the document the same way.
