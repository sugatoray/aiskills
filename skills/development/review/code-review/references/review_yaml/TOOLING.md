# YAML tooling

YAML is tool-first: run these before reading. Follow `SKILL.md` step 4: prefer what the
project already has, don't install into it, and treat output as leads to confirm. Record in
the report which tool and version ran, and what could not be checked.

## Order of preference

1. **The tool that reads the file,** in its validate or dry-run mode (below). It knows the
   schema and the YAML version; a general linter does not.
2. **The project's own linter configuration** (`.yamllint`, Prettier, a pre-commit hook).
3. **A standard tool that is already installed** (`yamllint`, `actionlint`,
   `check-jsonschema`).
4. **The fallback:** `scripts/check_formats.py` in this skill. Python's standard library has
   no YAML parser, so it checks syntax only when PyYAML happens to be importable, and
   otherwise reports each file as `unchecked`. Say so in the report.

## Find what the project uses

```bash
ls .yamllint .yamllint.yaml .yamllint.yml .prettierrc* .pre-commit-config.yaml .ansible-lint 2>/dev/null
ls .github/workflows .gitlab-ci.yml docker-compose*.y*ml compose*.y*ml Chart.yaml kustomization.yaml openapi*.y*ml mkdocs.yml 2>/dev/null
git grep -nE 'yamllint|actionlint|kubeconform|kubeval|ansible-lint|check-jsonschema|spectral' -- .pre-commit-config.yaml .github Makefile package.json 2>/dev/null | head
git grep -nE 'yaml\.(load|unsafe_load|full_load)\(|Loader=|YAML\.load|load_file|Yaml\(\)|new Yaml' | head -40   # where code loads YAML
```

## Checks

| Purpose | Command | Notes |
| --- | --- | --- |
| Syntax, with nothing installed | `python3 scripts/check_formats.py -l yaml -p <path> -r` | Uses PyYAML's event parser if importable (nothing is constructed), else `unchecked`. Also lists which tools are on `PATH`. |
| Syntax, duplicate keys, truthy values, style | `yamllint -f parsable <path>` | Uses the project's `.yamllint` if present. With none, `-d relaxed` drops most style rules and keeps syntax and duplicate keys. Exit status 1 on an error; `-s` makes warnings fail too. |
| Formatting | `npx prettier --check "**/*.{yaml,yml}"` | Only if the project uses Prettier. Exit status 1 is a style difference, 2 a file it could not parse. |
| GitHub workflows | `actionlint` (in the repository), or `actionlint .github/workflows/ci.yml` | Checks expressions, contexts, `needs`, runner labels, and flags untrusted input in `run:` scripts. Runs `shellcheck` on those scripts when it is installed. |
| Schema | `check-jsonschema --schemafile schema.json file.yaml` | Built-in schemas: `--builtin-schema vendor.github-workflows`, `vendor.gitlab-ci`, `vendor.compose-spec`, `vendor.dependabot`, `vendor.renovate` and others. A remote schema is fetched over the network. |
| Docker Compose | `docker compose -f compose.yaml config --quiet` | Validates and resolves variables and `extends`. Without `--quiet` it prints the effective file, including values from `.env`. |
| Kubernetes | `kubectl apply --dry-run=client -f file.yaml`, `kubeconform -strict file.yaml` | `--dry-run=server` validates against the cluster and needs access to it. |
| Helm and Kustomize | `helm lint chart/`, `helm template chart/ \| kubeconform -strict`, `kubectl kustomize dir/` | Lint what is rendered, not the template. |
| Ansible | `ansible-lint`, `ansible-playbook --syntax-check playbook.yml` | |
| GitLab CI | the pipeline editor's validator, or the CI Lint API | Needs the GitLab instance: `include:` is resolved there. |
| OpenAPI | `npx @stoplight/spectral-cli lint openapi.yaml` | Only if the project has a ruleset. |
| What a file parses to | `python3 -c 'import sys, yaml, json; print(json.dumps(yaml.safe_load(open(sys.argv[1])), indent=2, default=str))' file.yaml` | Shows the types a YAML 1.1 parser assigns. Use the consumer's own parser when it differs. |

## Reading the output

- **A general linter does not know the schema.** `yamllint` passing means the file is YAML,
  not that Kubernetes or the CI system accepts it.
- **`yamllint`'s `truthy` warning on `on:` in a GitHub workflow is expected:** the key is
  `on` by design. A project usually configures `truthy: {check-keys: false}`.
- **`yamllint`'s default configuration is strict about style** (`document-start`,
  `line-length`). Without a project configuration, report its errors and treat its style
  warnings as noise.
- **`actionlint` reports the injection it can see:** an untrusted context used directly in
  `run:`. It does not judge permissions, triggers or action pinning (`SECURITY.md`).
- **A dry run validates structure, not intent.** A manifest that applies can still name the
  wrong image or namespace.
- **`unchecked` is not `ok`.** Say which files nothing parsed, and why.

## Reproducing a finding

How one document is read by a YAML 1.1 parser:

```bash
printf 'country: no\nversion: 3.10\nmode: 010\nstart: 12:30\nreleased: 2024-01-01\n' > /tmp/sample.yaml
python3 -c 'import yaml; print(yaml.safe_load(open("/tmp/sample.yaml")))'
```

PyYAML prints `{'country': False, 'version': 3.1, 'mode': 8, 'start': 750, 'released':
datetime.date(2024, 1, 1)}`. The JavaScript `yaml` package reads `country` as `"no"`, `mode`
as `10` and `start` as `"12:30"`. Run the sample through the parser the code under review
uses before rating.
