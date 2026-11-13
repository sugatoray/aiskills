# TOML review

What to look for in TOML (`.toml`), beyond `../CROSS_LANGUAGE.md`. TOML is a **tool-first**
format: run the checks in `TOOLING.md` before reading, and let them decide syntax, formatting
and schema validity. Read for what no tool judges. `PATTERNS.md` has the fix for the common
items, `SECURITY.md` the security scope, and `WISDOM.md` the constraints and traps to keep in
mind for every TOML review.

## Before you start

- **What reads the file.** Cargo (`Cargo.toml`, `.cargo/config.toml`), Python packaging and
  tools (`pyproject.toml`), a linter or formatter (`ruff.toml`, `rustfmt.toml`,
  `taplo.toml`), a platform (`netlify.toml`, `fly.toml`, `wrangler.toml`), or the project's
  own loader. The reader decides the schema and which mistakes matter.
- **Whether a tool writes it.** `Cargo.lock`, `uv.lock` and `poetry.lock` are reviewed at
  the manifest that produced them.
- **What validates it.** The reading tool's own check, a JSON Schema used by `taplo`, a
  typed loader, or nothing.

## What the tools decide

Do not spend reading time on these; report what the tool said (`TOOLING.md`):

- Syntax: a key or table defined twice, an unquoted string, a bad escape, a number with a
  leading zero, an inline table spread over lines.
- Formatting and key order, where the project has a formatter.
- Conformance to a schema, and the reading tool's own type checks.

## What to read for

- **A key under the wrong table.** Everything after a `[table]` header belongs to that table
  until the next header. A top-level key added at the end of the file is a key of the last
  table, still valid TOML, and ignored or misread.
- **A wrong value.** A version, an edition or language level, a feature list, a path, a
  timeout, a lint rule switched off, an optimisation or debug setting.
- **A wrong type that still parses.** `1.10` is the float `1.1`, not a version; `"8080"` is
  not `8080`; an unquoted date is a date, not a string.
- **A key the reader does not know.** Many tools ignore an unknown key, some with a warning
  that nobody reads. Compare with the tool's documentation or schema.
- **Dependency changes:** a new dependency, a widened or wildcard version, a source moved to
  git, a path or another index, a feature turned on, a `[patch]` or override. Review these
  as code, and check the lock file changed with them.
- **Build and tool configuration as behaviour:** release profile settings (`panic`,
  `overflow-checks`, `debug`, `lto`), enabled features, test and lint selections, ignored
  rules and excluded paths. A rule added to an ignore list is a check removed.
- **Scope of a change.** `[workspace]` settings, `[tool.*]` tables shared by several tools,
  and inherited keys affect more than the file suggests.
- **Environment drift:** a value changed in one environment's table and not its siblings.

## Security

See `SECURITY.md`: dependency sources, code that runs at build time, registries and tokens,
secrets, and settings that switch protections off.

## Maintainability

- **Comments are available:** a pinned version, an ignored rule or a surprising value
  should say why.
- **Tables in a stable order,** with related keys together; inline tables kept short.
- **One source of truth** for a version or setting repeated across manifests (workspace
  inheritance, a shared config).

## Usually not worth a finding

- Alignment, key order, quoting style and blank lines, when a formatter owns them or the
  project has none.
- Lock files, beyond checking that they match their manifest.
- Dotted keys against tables, where both say the same thing.
