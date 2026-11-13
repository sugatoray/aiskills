# TOML tooling

TOML is tool-first: run these before reading. Follow `SKILL.md` step 4: prefer what the
project already has, don't install into it, and treat output as leads to confirm. Record in
the report which tool and version ran, and what could not be checked.

## Order of preference

1. **The tool that reads the file** (`cargo`, `uv`, `poetry`, `ruff`). It knows the schema;
   a general linter does not.
2. **The project's own formatter or linter configuration** (`taplo.toml`, `.taplo.toml`, a
   pre-commit hook).
3. **A standard tool that is already installed** (`taplo`).
4. **The fallback:** `scripts/check_formats.py` in this skill, which uses Python's `tomllib`.
   That module exists from Python 3.11; on an older Python each file is reported as
   `unchecked`. Say so in the report.

## Find what the project uses

```bash
git ls-files | grep -E '(^|/)(Cargo|pyproject|taplo|\.taplo|ruff|rustfmt|clippy|netlify|fly|wrangler)\.toml$|(^|/)\.cargo/config\.toml$'
ls taplo.toml .taplo.toml .pre-commit-config.yaml 2>/dev/null
git grep -nE 'taplo|validate-pyproject|check-jsonschema' -- .pre-commit-config.yaml .github Makefile 2>/dev/null | head
```

## Checks

| Purpose | Command | Notes |
| --- | --- | --- |
| Syntax, with nothing installed | `python3 scripts/check_formats.py -l toml -p <path> -r` | Needs Python 3.11 or later for `tomllib`; otherwise `unchecked`. Also lists which tools are on `PATH`. |
| Syntax, one file | `python3 -c 'import sys, tomllib; tomllib.load(open(sys.argv[1], "rb"))' file.toml` | Python 3.11 or later. Prints nothing when the file parses. |
| Syntax and schema | `taplo lint file.toml` | `--no-schema` keeps it to syntax. With a schema configured (`taplo.toml`, a `#:schema` line, `--schema <url>`) it may fetch the schema over the network. |
| Formatting | `taplo fmt --check file.toml` | Exit status 1 when a file would change. Only meaningful if the project formats with `taplo`. |
| Cargo manifest | `cargo metadata --no-deps --offline --format-version 1 > /dev/null` | Parses the manifest and reports wrong types and duplicate keys, not unknown keys. `cargo tree --offline` shows what the dependencies resolve to. |
| Cargo lock in step | `cargo metadata --locked --offline --format-version 1 > /dev/null` | Fails if `Cargo.lock` would need to change. |
| Python project | `uv lock --check`, `poetry check --lock`, `validate-pyproject pyproject.toml` | Whichever the project uses. Do not run `pip install .` to check a manifest: it runs the build backend. |
| Schema | `check-jsonschema --schemafile schema.json file.toml` | Reads TOML as well as JSON and YAML. A remote schema is fetched over the network. |
| What a file parses to | `python3 -c 'import sys, tomllib, pprint; pprint.pp(tomllib.load(open(sys.argv[1], "rb")))' file.toml` | Shows which table each key landed in, and each value's type. |
| Tests and build | the project's build and suite | For a manifest change, a clean build with the lock file is the real check. |

## Reading the output

- **A general linter does not know the schema.** `taplo lint --no-schema` passing means the
  file is TOML, not that Cargo or the build backend accepts it.
- **An unknown key is usually a warning, not an error.** Read the tool's warnings: a Cargo
  build prints `unused manifest key` and carries on, and `cargo metadata` does not mention it.
- **`taplo fmt --check` on a project that does not use `taplo` reports every file.** That is
  not a finding.
- **Parsers differ on the TOML version.** TOML 1.0 forbids a line break or a trailing comma
  inside an inline table; a newer parser may accept both, and the reading tool may not.
- **`unchecked` is not `ok`.** Say which files nothing parsed, and why.

## Reproducing a finding

Which table a key landed in, and what type a value has:

```bash
printf '[server]\nport = 8080\nname = "app"\nversion = 1.10\n' > /tmp/sample.toml
python3 -c 'import tomllib; print(tomllib.load(open("/tmp/sample.toml", "rb")))'
```

This prints `{'server': {'port': 8080, 'name': 'app', 'version': 1.1}}`: `name` is inside
`server`, not at the top level, and `version` is a float. Run the sample through the tool
the file is written for before rating.
