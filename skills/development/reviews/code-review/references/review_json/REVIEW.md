# JSON review

What to look for in JSON (`.json`, `.jsonc`, `.json5`), beyond `../CROSS_LANGUAGE.md`. JSON is
a **tool-first** format: run the checks in `TOOLING.md` before reading, and let them decide
syntax, formatting and schema validity. Read for what no tool judges. `PATTERNS.md` has the
fix for the common items, `SECURITY.md` the security scope, and `WISDOM.md` the constraints
and traps to keep in mind for every JSON review.

## Before you start

- **What reads the file.** A package manager, a compiler, an editor, a cloud service, or the
  project's own code. The reader decides the dialect (strict JSON, or comments and trailing
  commas allowed), the schema, and which mistakes matter.
- **Whether a person or a tool writes it.** A lock file, a snapshot, a generated manifest or
  an exported dashboard is reviewed at its source, not line by line.
- **What validates it.** A JSON Schema, a `$schema` key, a typed loader, or nothing. If
  nothing, the consuming code is the only specification.

## What the tools decide

Do not spend reading time on these; report what the tool said (`TOOLING.md`):

- Syntax: trailing commas, comments, single quotes, unquoted keys, `NaN`, a byte-order mark.
- Duplicate keys.
- Formatting and key order, where the project has a formatter.
- Conformance to a schema, where one exists.

## What to read for

- **A wrong value.** A timeout in the wrong unit, a port or URL for another environment, a
  path that does not exist, a feature flag flipped, a limit raised or removed. Check each
  changed value against the code that reads it.
- **A wrong type that still parses.** `"8080"` for `8080`, `"false"` for `false`, `null`
  for a missing key, `0` for "unset". The reader may coerce, default or crash; find out which.
- **A key the reader does not know.** A typo in an optional key is ignored silently and the
  default applies. Compare with the schema or the reading code.
- **A removed or renamed key** that another reader, an older release or a deployed client
  still expects. An exchanged JSON shape is an API (`../CROSS_LANGUAGE.md`).
- **Numbers that will not survive.** Integers above 2^53 (identifiers, timestamps in
  nanoseconds), money as a binary float, a precision the reader will round. Use strings.
- **Dates, enums and units carried as bare strings or numbers** with nothing saying which
  format, zone or unit applies.
- **Configuration that changes behaviour.** In `package.json`: `scripts`, dependency ranges
  and sources, `engines`, `exports`, `type`, `files`, `overrides`. In `tsconfig.json`: a
  `strict` flag turned off, `skipLibCheck`, a widened `include`. In infrastructure and policy
  documents: a wildcard, a public principal, a disabled check. Review these as code.
- **A manifest changed without its lock file,** or the reverse.
- **Data that belongs elsewhere:** a large fixture, a binary blob in base64, a generated file
  committed beside its source.

## Security

See `SECURITY.md`: secrets, install scripts and dependency sources, permissive policies, and
how the code that parses the document treats keys such as `__proto__`.

## Maintainability

- **No comments are possible in strict JSON,** so a surprising value needs its reason in the
  commit, in adjacent documentation or in a schema `description`.
- **One source of truth.** The same value copied into several JSON files drifts.
- **A schema for a file that people edit by hand** gives editors completion and CI a check.

## Usually not worth a finding

- Indentation, key order and trailing newline, when a formatter owns them or the project has
  none.
- Lock files and generated JSON, beyond checking that they match their source.
- A schema's absence for a small file with one reader.
