# Python security review

The security scope for Python code. It is read for the security pass of a full review, and on
its own, with `WISDOM.md`, when the review runs with `-s`/`--security`. Rate findings with
`../SEVERITY.md` and report them with `../REPORT_TEMPLATE.md`.

## Scope

In scope: code execution, injection, unsafe deserialisation, file and archive handling,
cryptography and randomness, secrets, transport security, authentication and authorisation
logic visible in the code, resource exhaustion, and the dependencies the change adds.

Establish first:

- **What the code is.** A network service, a CLI run by its own user, a library, a notebook, a
  job in CI. The same line is a blocker in a request handler and harmless in a developer script.
- **Who controls each input.** A finding needs a value an attacker can influence reaching a
  sink. Name the attacker and the path.
- **What it runs as,** and what that identity can reach: database, cloud credentials, the
  file system, other services.

## Where untrusted data enters

- HTTP: query string, path parameters, headers, cookies, body, uploaded files and their names
  (`request.args`, `request.form`, `request.json`, `request.files`, FastAPI and Django
  equivalents).
- `sys.argv`, `os.environ`, standard input, configuration files a lower-privileged user can
  write.
- Files, archives, images and documents received from outside; file names inside archives.
- Messages from queues, webhooks, and responses from other services, including internal ones.
- Rows read from a database that an earlier request wrote (stored injection).
- Model output and tool results in applications built on language models.

## Checks

### Code execution and injection

- **`eval`, `exec`, `compile`, `__import__` or `importlib.import_module` on input.** For
  literals use `ast.literal_eval`; otherwise parse the input.
- **`pickle`, `marshal`, `shelve`, `joblib.load`, `torch.load` (without `weights_only=True`),
  `numpy.load(allow_pickle=True)` on data from outside the trust boundary:** arbitrary code
  execution. Use JSON or a schema-validated format.
- **`yaml.load` without `Loader=yaml.SafeLoader`** (use `yaml.safe_load`).
- **Shell injection.** `subprocess.*(…, shell=True)`, `os.system`, `os.popen` with any
  interpolated value. Pass an argument list without `shell=True`; if a shell is unavoidable,
  `shlex.quote` every interpolated piece.
- **SQL built with f-strings, `%` or `.format`.** Use the driver's placeholders; identifiers
  that can't be bound come from an allow-list.
- **Template rendering with autoescape off,** or `Markup`/`mark_safe`/`|safe` on user input.
- **Server-side template injection:** `jinja2.Template(user_text)`,
  `render_template_string(user_text)` or `Environment.from_string(user_text)`. A template is
  code; user input belongs in the context, never in the template source.
- **`str.format` or `format_map` with a user-controlled format string:** `"{0.__class__}"`
  style fields read attributes of the arguments. Only the values may come from input.
- **Option injection:** an argument list is used, but a user value beginning with `-` is read
  by the program as an option. Put `--` before it where the program supports that, or validate.
- **`assert` used to enforce a security check.** Assertions are removed under `python -O`.
- **Regular expressions with nested quantifiers run on untrusted input** (`(a+)+$`): the `re`
  module has no timeout, so one request can hold a worker.

### Files, paths and archives

- **Path traversal.** `os.path.join(base, user_value)` discards `base` when `user_value` is
  absolute, and `..` walks out. Resolve, then check containment
  (`resolved.is_relative_to(base)`, 3.9+).
- **Archive extraction.** `tarfile.extractall()` on an untrusted archive can write outside the
  target; pass `filter="data"` (3.12, and backported to earlier security releases). Check member
  names for `zipfile` too on old versions, and cap total extracted size.
- **`tempfile.mktemp`** (race between naming and opening). Use `mkstemp` or
  `NamedTemporaryFile`.
- **XML from untrusted sources** parsed with the standard library; use `defusedxml`.
- **Permissions:** secrets written with the default mode, `os.chmod(path, 0o777)`,
  directories created world-writable.
- **Uploads:** stored under the client's file name, served back from the application's
  origin, or trusted by extension or `Content-Type`.

### Cryptography, randomness and secrets

- **`random` for tokens, passwords, reset links or session IDs.** Use `secrets`.
- **Hashing.** MD5/SHA-1 for security; a fast hash for passwords. Use `hashlib.scrypt`,
  `argon2-cffi` or `bcrypt`; compare secrets with `hmac.compare_digest`.
- **TLS switched off:** `verify=False`, `ssl._create_unverified_context`,
  `check_hostname = False`.
- **Secrets** in source, defaults, test fixtures, logs, exception messages or `repr` output.

### Network and web

- **Requests to a user-supplied URL** with no allow-list (SSRF), and redirects followed blindly.
- **Web frameworks:** `DEBUG = True` or a hard-coded `SECRET_KEY`; raw queries; a missing
  permission check on a view; CSRF exemption; mass assignment from request data into a model.
- **Open redirects:** `redirect(request.args["next"])` without checking the target is local.
- **Missing limits:** no request size limit, no pagination cap, no timeout on outbound calls
  (`requests` has none by default), decompression of unbounded input.
- **Authorisation:** an object fetched by an id from the request with no check that it belongs
  to the caller; a check in the UI layer only; a new endpoint missing the decorator or
  dependency its neighbours have.

### Dependencies

- A new package: check the name against the one intended (typosquatting), its maintenance,
  and what it runs at install time.
- `--extra-index-url` with private package names (dependency confusion), unpinned
  requirements, installs from a URL or branch, and lock files out of step with the manifest.

## Tools

| Purpose | Command | Notes |
| --- | --- | --- |
| Security lint | `bandit -q -r <package>` or `ruff check --select S <paths>` | Leads, not findings. Many hits are noise (`assert` in tests, every `subprocess` call). |
| Known-vulnerable dependencies | `pip-audit` | Against the lock file or the environment. Report what the change adds or what is reachable. |
| Secrets | `gitleaks detect --no-git --source .`, `detect-secrets scan` | Check history too if a secret was added and removed (`gitleaks detect`). |
| Pattern search | `semgrep scan --config <the project's rules>` | Only with rules the project has, or ones available offline. |
| Rough net for sinks | `git grep -nE 'eval\(\|exec\(\|pickle\.\|yaml\.load\(\|shell=True\|os\.system\|verify=False\|mktemp\(\|render_template_string' -- '*.py'` | Read each hit; most need the data flow traced by hand. |

## What this review does not establish

It reads code. It does not test a running system, so it says nothing about deployed
configuration, network exposure, or secrets management outside the repository. It does not
replace a penetration test, a threat-modelling exercise, or a cryptographic review of a
custom protocol: recommend those where the change warrants them.
