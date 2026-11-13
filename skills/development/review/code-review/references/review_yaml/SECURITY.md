# YAML security review

The security scope for YAML documents and for the code that loads them. It is read for the
security pass of a full review, and on its own, with `WISDOM.md`, when the review runs with
`-s`/`--security`. Rate findings with `../SEVERITY.md` and report them with
`../REPORT_TEMPLATE.md`.

## Scope

In scope: unsafe loading, CI workflow injection and permissions, secrets, and container,
cluster and automation settings expressed in YAML.

Establish first:

- **What reads the file, and with what authority.** A workflow runs commands with a token
  and secrets; a manifest sets what a container may do; a data file is only data.
- **Who can change it, and who can trigger it.** For a workflow: which events start it, and
  whether a fork or an outside contributor can.
- **Whether the document itself is untrusted,** that is, loaded at run time from a request,
  an upload or another system.

## Where untrusted data enters

- YAML uploaded, fetched or received and then loaded by code.
- CI event data: pull-request and issue titles and bodies, branch names, commit messages,
  comment text, author names and emails, artifact contents from another workflow.
- Template variables rendered into YAML or into commands (Helm values, Ansible variables,
  Jinja expressions).
- Remote includes: a workflow, template or chart pulled from another repository or URL.

## Checks

### Loading untrusted YAML

- **Loaders that construct objects:** Python `yaml.load` with `Loader=yaml.Loader` or
  `UnsafeLoader`, and `yaml.unsafe_load`, build arbitrary objects from tags such as
  `!!python/object/apply`: code execution. Use `yaml.safe_load`. `FullLoader` has had
  code-execution flaws in older PyYAML releases; do not rely on it for untrusted input.
- **The same in other languages:** Ruby `YAML.load` before Psych 4 and `YAML.unsafe_load`
  after; SnakeYAML `new Yaml()` before 2.0; any loader configured with custom tags or type
  constructors. Check the library version before rating.
- **Alias expansion:** a small document whose anchors refer to one another expands
  enormously when serialised or walked. Limit input size and, where the library allows,
  alias count.
- **Type surprises as a bypass:** a value the validator reads as a string and the consumer
  as a boolean or number (`WISDOM.md`).
- **Duplicate keys** read differently by a validator and a consumer.

### GitHub Actions and other CI workflows

- **Script injection:** `${{ ... }}` holding event data (`github.event.*.title`, `.body`,
  `github.head_ref`, commit messages, comment text) inside `run:`, or inside an action input
  that is evaluated. The expression is substituted before the shell runs. Pass it through
  `env:`.
- **`pull_request_target` or `workflow_run` that checks out and runs the pull request's
  code.** These triggers run with the base repository's secrets and token, so building,
  installing or testing fork code there hands both to the fork.
- **Token permissions:** no `permissions:` block (the token takes the repository default,
  which may be read-write), or broader scopes than the job uses.
- **Actions and reusable workflows referenced by tag or branch.** Pin third-party ones to a
  full commit SHA.
- **Secrets:** printed, written to an artifact or cache, passed to steps that run untrusted
  code, exposed to every job with `secrets: inherit`, or set at workflow level when one step
  needs them.
- **Untrusted data written to `$GITHUB_ENV`, `$GITHUB_PATH` or `$GITHUB_OUTPUT`,** which
  changes later steps.
- **Self-hosted runners on a repository that accepts outside pull requests.**
- **Download-and-run steps** (`curl ... | sh`) and tools installed without a version or
  checksum.
- **Removed or weakened gates:** a check made non-blocking (`continue-on-error`,
  `allow_failure`, `|| true`), a path or branch filter that now skips it, a required
  approval or environment dropped.
- **Other CI systems** have the same shapes: variables expanded into scripts, protected
  variables reachable from unprotected branches, remote `include:`.

### Containers, clusters and automation

- **Kubernetes workloads:** `privileged: true`, `hostNetwork`, `hostPID`, `hostPath`
  volumes, added capabilities, running as root, `allowPrivilegeEscalation` left on, a
  mounted service-account token the workload does not use.
- **Kubernetes access:** RBAC rules with `*` verbs or resources, a binding to
  `cluster-admin`, a `Secret` manifest committed (base64 is encoding, not encryption), a
  service exposed publicly, a missing network policy where others have one.
- **Images:** `:latest` or no tag, an unexpected registry, no digest where the project pins.
- **Docker Compose:** `privileged`, the Docker socket mounted, `network_mode: host`, a
  database port published on all interfaces, secrets in `environment:`.
- **Ansible:** `shell:` or `command:` built from variables, `no_log` missing on a task that
  handles a secret, `validate_certs: false`, a vault password or key in the repository.
- **Application configuration:** debug mode, authentication or TLS verification switched
  off, a widened CORS or host allow-list, default credentials.

### Secrets

- **Credentials in any YAML file:** tokens, passwords, private keys, connection strings,
  kubeconfig files, cloud keys. Rotate, then remove.
- **Encrypted-looking values** (SOPS, sealed secrets, Ansible Vault): confirm they are
  encrypted and that the key is not beside them.

## Tools

```bash
actionlint                                             # workflow expressions and untrusted input in run:
gitleaks detect --no-git --source . --redact          # or trufflehog filesystem .
git grep -nE '\$\{\{[^}]*(github\.event\.|github\.head_ref|inputs\.)' -- '.github/workflows/*' | head -40
git grep -nE 'pull_request_target|workflow_run|secrets: inherit|permissions:|continue-on-error' -- '.github/workflows/*'
git grep -nE 'uses: [^#]+@(v?[0-9][^ ]*|main|master)\s*$' -- '.github/workflows/*' | head -40    # not pinned to a SHA
git grep -nE 'yaml\.(load|unsafe_load|full_load)\(|Loader=yaml\.(Loader|UnsafeLoader|FullLoader)|YAML\.(load|unsafe_load)\b' | head -40
git grep -nE 'privileged: *true|hostNetwork: *true|hostPID: *true|hostPath:|docker\.sock|cluster-admin|allowPrivilegeEscalation: *true' -- '*.yaml' '*.yml' | head -40
```

If the project has them: `zizmor` for workflows; `kube-linter`, `kubesec`, `checkov` or
`trivy config` for manifests; `ansible-lint`. The `grep` lines are rough nets: a hit is a
line to read, and a clean result proves nothing.

## What this review does not establish

- That a workflow is safe against every event and actor: that needs the repository's
  settings (default token permissions, fork approval rules, branch protection), which are
  not in the files.
- That a cluster is secure: admission policies, network and node configuration are outside
  the manifests.
- That no secret exists in history: only the files in scope were read.
- That third-party actions, images and charts are trustworthy.
