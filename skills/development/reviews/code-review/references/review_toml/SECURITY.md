# TOML security review

The security scope for TOML documents, chiefly build and package manifests and tool
configuration. It is read for the security pass of a full review, and on its own, with
`WISDOM.md`, when the review runs with `-s`/`--security`. Rate findings with
`../SEVERITY.md` and report them with `../REPORT_TEMPLATE.md`.

## Scope

In scope: where dependencies come from, code that runs at build or install time, registries
and their credentials, secrets, and settings that switch protections off.

Establish first:

- **What reads the file, and with what authority.** A manifest decides which code is
  downloaded and run on developers' machines and in CI; a tool configuration decides which
  checks run; an application configuration decides run-time behaviour.
- **Who can change it,** and whether a change reaches CI before review (a pull request from
  a fork still runs the manifest's build steps if CI builds it).
- **Whether it is published** with a package.

## Where untrusted data enters

- Dependencies: every crate, wheel, sdist and plugin a manifest names, and theirs.
- Sources outside the default registry: git URLs, paths, alternative indexes.
- TOML loaded at run time from a user, an upload or another system.

## Checks

### Dependency sources

- **A git dependency without a commit** (`branch`, `tag`, or nothing): the code can change
  without the manifest changing. Require `rev` or a commit in the URL.
- **A path, URL or alternative-registry source** added or changed, and `[patch]`,
  `[replace]`, `[tool.uv.sources]` or `[tool.poetry.source]` entries, which redirect a name
  to other code.
- **An extra index beside the default one.** A private package name that also exists, or
  could be registered, on the public index can resolve to the public one. Check how the
  tool chooses between indexes and whether the name is pinned to its index.
- **Unbounded or wildcard versions** (`"*"`, no specifier, `>=` alone), and a manifest
  changed without its lock file.
- **A new dependency:** who publishes it, whether the name is a near-miss of a known one,
  what it runs at build time.

### Code that runs at build or install time

- **Python `[build-system]`:** `requires` and `build-backend` name code that runs when the
  project is built or installed from source. An unpinned or unfamiliar backend, or an
  in-tree backend (`backend-path`), is code under review.
- **Cargo build scripts and procedural macros:** `build = "build.rs"`, `[build-dependencies]`
  and proc-macro crates run on the build machine with the user's privileges.
- **`.cargo/config.toml`:** `[alias]`, `[target.*] runner`, `[build] rustc-wrapper`,
  `rustflags` and `[env]` change what `cargo` runs. A change here is a change to the build.
- **Task and script tables** (`[tool.poe.tasks]`, `[tool.hatch.envs.*.scripts]`,
  `[project.scripts]`, platform build commands in `netlify.toml` and similar): commands that
  run on someone's machine or in CI.

### Secrets and credentials

- **Tokens, passwords and keys in any TOML file,** including registry tokens in
  `.cargo/config.toml` or an index URL with credentials in it
  (`https://user:token@host/simple`). Rotate, then remove.
- **Secrets in platform files** (`wrangler.toml` `[vars]`, `fly.toml` `[env]`,
  `netlify.toml`): these tables are for non-secret values.
- **Files that are published:** a `pyproject.toml` or `Cargo.toml` goes into the package.

### Protections switched off

- **Lint and security rules ignored or excluded:** a rule added to `ignore`, a path added
  to `exclude`, a security linter's table removed, `unsafe_code` lint relaxed.
- **Build hardening:** `overflow-checks = false` set explicitly, `debug-assertions`
  disabled in a profile that tests rely on, `panic = "abort"` where unwinding cleans up.
- **Application settings:** debug mode, TLS verification, authentication, allowed hosts and
  origins, default credentials.
- **Feature flags that enable unsafe or insecure code paths** (`default-features`, a
  crate's `insecure-*` or `danger-*` features).

### Loading untrusted TOML

- TOML has no tags, anchors or references, so parsing it constructs only plain values. The
  risks are the usual ones for parsed input: size limits, type confusion, and using values
  as paths, commands or URLs without validation.

## Tools

```bash
gitleaks detect --no-git --source . --redact          # or trufflehog filesystem .
git grep -nE '(git|path|url|registry|index|branch|rev) *=' -- '*.toml' | head -40      # non-default sources
git grep -nE '^\[(patch|replace|tool\.uv\.sources|build-system)|extra-index-url|index-url|backend-path' -- '*.toml'
git grep -nIE '(password|passwd|secret|token|api[_-]?key) *=' -- '*.toml' | head -40
cargo audit                                            # known advisories; needs Cargo.lock and the advisory database
cargo deny check                                       # if the project has deny.toml
pip-audit                                              # known advisories for the Python environment
```

The `grep` lines are rough nets: a hit is a line to read, and a clean result proves nothing.

## What this review does not establish

- That dependencies are free of known vulnerabilities or malicious code: that needs an
  audit tool with a current database, and review of the dependencies themselves.
- That the lock file matches the manifest, unless the check in `TOOLING.md` ran.
- That no secret exists in history: only the files in scope were read.
- How a private index and the public one are prioritised: that is tool and environment
  configuration, often outside the repository.
