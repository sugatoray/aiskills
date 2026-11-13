# YAML review

What to look for in YAML (`.yaml`, `.yml`), beyond `../CROSS_LANGUAGE.md`. YAML is a
**tool-first** format: run the checks in `TOOLING.md` before reading, and let them decide
syntax, formatting and schema validity. Read for what no tool judges. `PATTERNS.md` has the
fix for the common items, `SECURITY.md` the security scope, and `WISDOM.md` the constraints
and traps to keep in mind for every YAML review.

## Before you start

- **What reads the file.** A CI system (GitHub Actions, GitLab CI), an orchestrator
  (Kubernetes, Docker Compose, Helm), a configuration tool (Ansible), an API description
  (OpenAPI), or the project's own loader. The reader decides the schema, the YAML version
  and which mistakes matter.
- **Which YAML version and library.** YAML 1.1 parsers (PyYAML, and so Ansible) and YAML 1.2
  parsers (the JavaScript `yaml` and `js-yaml` packages) read the same text as different
  values (`WISDOM.md`).
- **Whether it is YAML yet.** A Helm chart, a Jinja or Go template, or an Ansible file with
  `{{ }}` is a template: lint what it renders to.
- **What validates it.** A JSON Schema, the tool's own `validate` or dry-run command, or
  nothing.

## What the tools decide

Do not spend reading time on these; report what the tool said (`TOOLING.md`):

- Syntax: indentation, tabs, an unquoted `:` or `#`, an unclosed quote or bracket.
- Duplicate keys.
- Formatting, line length, document markers, where the project has a linter configuration.
- Conformance to a schema, and expression syntax in GitHub workflows (`actionlint`).

## What to read for

- **A value read as another type.** `no`, `off` and `on` as booleans, `3.10` as the number
  `3.1`, `010` as 8, `12:30` as a number, a date turned into a date object, an empty value
  as null. Quote version numbers, country codes, times and anything that must stay a string.
- **A wrong value.** An image tag, a replica count, a timeout, a resource limit, a branch
  filter, a cron expression, an environment name. Check each against what consumes it.
- **Indentation that moves a key.** A key one level out belongs to a different mapping and
  is still valid YAML; the reader ignores it or applies it to the wrong thing.
- **A key the reader does not know.** A typo in an optional key is dropped silently unless
  a schema or strict mode rejects it.
- **Anchors and merge keys.** What `<<: *base` brings in, what the local keys override, and
  that merging is shallow: a nested mapping is replaced, not combined.
- **Multi-document files** (`---`) read by a loader that takes only the first document, or
  that fails on a second.
- **Block scalars.** `|` keeps newlines, `>` folds them into spaces; `-` and `+` change the
  trailing newline. A script or certificate in the wrong style is a different string.
- **Pipelines and deployments as code:** a job that no longer runs, a condition that is
  always true, a removed check, an unpinned image or action, a missing timeout, a changed
  trigger. Review these as behaviour changes.
- **Environment drift:** a value changed in one environment's file and not its siblings.

## Security

See `SECURITY.md`: unsafe loading, workflow injection and permissions, secrets, container
and cluster settings.

## Maintainability

- **Comments are available:** a surprising value should say why.
- **Anchors that hide more than they save.** A reader should not need to resolve three
  aliases to learn what one job does.
- **Long inline scripts** belong in a script file that a linter and a test can reach.
- **One source of truth** for values repeated across files.

## Usually not worth a finding

- Indentation width, quoting style, `---` markers and line length, when a linter owns them
  or the project has none.
- Key order, unless the reader depends on it.
- Generated YAML (lock files, rendered manifests), beyond checking it matches its source.
