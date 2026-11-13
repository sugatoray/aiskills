# YAML fix patterns

Before/after pairs for the findings that come up most. Use them to shape a suggested change,
adapted to what reads the file.

## Quote what must stay a string

```yaml
# Before: a YAML 1.1 parser reads False, 3.1, 8 and 750
country: no
python: 3.10
mode: 010
start: 12:30
```

```yaml
# After
country: "no"
python: "3.10"
mode: "010"
start: "12:30"
```

## Load without constructing objects

```python
# Before: builds arbitrary Python objects from tags in the document
config = yaml.load(text, Loader=yaml.Loader)
```

```python
# After
config = yaml.safe_load(text)
```

## Untrusted input in a workflow script

```yaml
# Before: the title is pasted into the script before the shell runs it
- run: echo "Title: ${{ github.event.pull_request.title }}"
```

```yaml
# After: the shell receives it as data
- run: echo "Title: $TITLE"
  env:
    TITLE: ${{ github.event.pull_request.title }}
```

## Least privilege and pinned actions in a workflow

```yaml
# Before
on: pull_request
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: some-org/some-action@main
```

```yaml
# After
on: pull_request
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - uses: some-org/some-action@<full-commit-sha>  # v1.2.3
```

A tag or branch can be moved to different code; a full commit SHA cannot. Take the SHA from
the action's repository, and keep the version in a comment for readers and update tools.

## A merge key replaces nested mappings

```yaml
# Before: prod gets env {LOG: warn} only; DB_HOST is gone
base: &base
  env: {DB_HOST: db, LOG: info}
prod:
  <<: *base
  env: {LOG: warn}
```

```yaml
# After: merge at the level that changes
base_env: &base_env {DB_HOST: db, LOG: info}
prod:
  env:
    <<: *base_env
    LOG: warn
```

## Secrets by reference

```yaml
# Before
env:
  API_TOKEN: ghp_exampleexampleexample
```

```yaml
# After (GitHub Actions; other systems have their own secret reference)
env:
  API_TOKEN: ${{ secrets.API_TOKEN }}
```

A secret that reached a commit is compromised: rotate it, then remove it.

## A container that does not need root

```yaml
# Before
containers:
  - name: app
    image: registry.example.com/app:latest
    securityContext:
      privileged: true
```

```yaml
# After
containers:
  - name: app
    image: registry.example.com/app:1.4.2
    securityContext:
      runAsNonRoot: true
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities: {drop: ["ALL"]}
    resources:
      requests: {cpu: 100m, memory: 128Mi}
      limits: {memory: 256Mi}
```

Confirm the image runs as a non-root user and writes only to mounted volumes before
suggesting this; otherwise the change breaks the workload.

## The block scalar the reader needs

```yaml
# Before: > folds the lines into one, so the script is a single command line
script: >
  set -e
  make build
```

```yaml
# After: | keeps the line breaks
script: |
  set -e
  make build
```
