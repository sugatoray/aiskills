# JSON tooling

JSON is tool-first: run these before reading. Follow `SKILL.md` step 4: prefer what the
project already has, don't install into it, and treat output as leads to confirm. Record in
the report which tool and version ran, and what could not be checked.

## Order of preference

1. **The project's own check:** an npm script, a pre-commit hook, a CI step, the tool that
   reads the file (`tsc`, `npm`, `eslint`, a typed config loader).
2. **A standard tool that is already installed** (`jq`, `prettier`, `check-jsonschema`).
3. **The fallback:** `scripts/check_formats.py` in this skill, which uses Python's `json`
   module and needs nothing installed.

## Find what the project uses

```bash
git ls-files | grep -iE '(schema|\.schema)\.json$|/schemas?/' | head -20            # schemas
git grep -nE '"\$schema"' -- '*.json' | head -20                                    # files that name one
ls .prettierrc* prettier.config.* .editorconfig biome.json .pre-commit-config.yaml 2>/dev/null
git grep -nE 'prettier|biome|jsonlint|check-jsonschema|ajv' -- package.json .pre-commit-config.yaml .github 2>/dev/null | head
```

## Checks

| Purpose | Command | Notes |
| --- | --- | --- |
| Syntax, duplicate keys, `NaN`, with nothing installed | `python3 scripts/check_formats.py -l json -p <path> -r` | Reports `ok`, `error` or `unchecked` per file, and which tools are on `PATH`. Files that allow comments (`.jsonc`, `.json5`, `tsconfig*.json`, `.vscode/*.json`) are `unchecked` when they are not strict JSON. |
| Syntax | `jq empty file.json` | Exit status 0 when it parses. `jq` is lenient: see below. |
| Syntax | `python3 -m json.tool file.json > /dev/null` | Stricter than `jq` about a byte-order mark and a second document; accepts `NaN` and duplicate keys. |
| Formatting | `npx prettier --check "**/*.json"` | Only if the project uses Prettier. Exit status 1 is a style difference, 2 a file it could not parse. |
| Schema | `check-jsonschema --schemafile schema.json file.json` | `--builtin-schema vendor.github-workflows`, `vendor.renovate`, `vendor.dependabot` and others ship with it. A remote `--schemafile` or `$ref` is fetched over the network. |
| The schema itself | `check-jsonschema --check-metaschema schema.json` | Validates the schema against its draft. |
| What a manifest resolves to | `npm pkg get scripts`, `npm ls --all`, `npx tsc --showConfig` | The effective value after inheritance (`extends`) and defaults. |
| What changed, structurally | `diff <(jq -S . old.json) <(jq -S . new.json)` | `-S` sorts keys, so reordering does not show as a change. |
| Tests | the project's suite for the code that reads the file | A fixture that still parses is weak evidence; look for assertions on the values read. |

## Reading the output

- **`jq` accepting a file does not make it valid JSON.** `jq` 1.6 accepts a byte-order mark,
  several documents one after another, duplicate keys (the last wins) and `NaN` (read as
  `null`), and rounds integers above 2^53. Use it to query, and a strict parser to judge.
- **Prettier is a formatter.** Its JSON parser accepts comments and trailing commas, so a
  file that passes `--check` can still fail `JSON.parse`.
- **Python's `json` accepts `NaN`, `Infinity` and duplicate keys.** `check_formats.py` turns
  all three into errors; `json.tool` on its own does not.
- **`unchecked` is not `ok`.** Say in the report which files nothing parsed, and why.
- **Schema validation needs the right schema and draft.** A file that names no schema, or
  whose schema allows additional properties, can pass with a misspelled key in it.

## Reproducing a finding

What a duplicate key, a large integer and a float become in the consumer's language:

```bash
printf '{"id": 9007199254740993, "retries": 1, "retries": 5}\n' > /tmp/sample.json
node -e 'console.log(JSON.parse(require("fs").readFileSync("/tmp/sample.json", "utf8")))'
python3 -c 'import json; print(json.load(open("/tmp/sample.json")))'
```

Node prints `id: 9007199254740992` and Python `9007199254740993`; both keep `retries: 5`
without a warning. Run the sample through the parser the code under review uses before rating.
