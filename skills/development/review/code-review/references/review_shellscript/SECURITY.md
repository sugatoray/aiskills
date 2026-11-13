# Shell script security review

The security scope for shell (`sh`, `bash`, `zsh`, `ksh`), including shell embedded in CI
workflows, Dockerfiles, Makefiles and `package.json` scripts. It is read for the security pass
of a full review, and on its own, with `WISDOM.md`, when the review runs with
`-s`/`--security`. Rate findings with `../SEVERITY.md` and report them with
`../REPORT_TEMPLATE.md`.

## Scope

In scope: command injection and every way the shell re-parses data as code, downloaded code,
secrets on command lines and in logs, temporary files and permissions, privilege (`sudo`,
root, setuid), trust in `PATH` and the environment, and destructive commands with computed
arguments.

Establish first:

- **Who runs it, as what.** A developer by hand, CI with deploy credentials, cron as root, an
  installer piped from the network. The same line differs by orders of magnitude in risk.
- **Who controls each input.** In CI the attacker may be anyone who can open a pull request:
  branch names, titles, commit messages and file names are theirs to choose.
- **What the script can reach:** credentials in the environment, the Docker socket, cloud
  roles, production hosts.

## Where untrusted data enters

- Positional parameters, `read`, standard input, environment variables.
- File names (they may contain spaces, newlines, leading `-`, glob characters) and file
  contents, including configuration files that are `source`d.
- Output of other commands, especially network responses (`curl`, `git`, API calls).
- CI context: pull request title and body, branch and tag names, commit messages, author
  names, issue comments, workflow inputs, artefacts from other jobs.
- Anything on a shared file system a lower-privileged user can write, including directories
  on `PATH`.

## Checks

### Command injection and re-parsing

- **Data re-parsed as code** with a value from any source above: `eval`,
  `bash -c "$string"`, `sh -c "… $var …"`, `source`/`.` on a file an attacker can write,
  `ssh host "cmd $var"` (expanded again on the remote side), `xargs` without `-0`,
  `find -exec sh -c "… {} …"` (pass `{}` as an argument: `sh -c 'cmd "$1"' _ {}`), `trap`
  strings, `watch`, `su -c`, and `awk`, `sed` or `perl` programs built by interpolation.
- **Unquoted expansions** of such values: word splitting and globbing turn one value into
  several arguments or a file list. Quote every expansion.
- **A command held in a string** and run with `$cmd`; build it as an array or a function.
- **Option injection:** a value beginning with `-` is read as an option. Use `--` or a `./`
  prefix (`rm -- "$f"`).
- **CI interpolation.** In GitHub Actions, `${{ github.event.* }}` (and other
  attacker-influenced contexts) placed inside a `run:` block is pasted into the script
  before the shell sees it. Pass it through `env:` and use the quoted variable. The same
  applies to template expansion in GitLab CI, Jenkins and Azure Pipelines.
- **Unvalidated input in paths, arithmetic and tests:** `$(( user_value ))` and
  `[[ $x -eq $user_value ]]` evaluate arbitrary expressions, including array subscripts that
  run commands.

### Downloaded code and supply chain

- **`curl … | sh`, `wget -O- … | bash`,** or downloading and executing without verifying a
  checksum or signature, over anything but HTTPS, or from a mutable URL (a branch, `latest`).
- **Package installs without pinning** (`pip install pkg`, `npm install -g pkg`,
  `apt-get install` from an added repository with no key check), and container images
  referenced by a mutable tag.
- **CI actions and reusable workflows referenced by branch or tag** rather than a commit
  hash, in workflows that hold secrets.

### Secrets

- **Secrets on the command line** are visible to every local user through `ps` and end up in
  shell history and CI logs: pass them by environment variable, file or stdin. `set -x`
  prints them too; switch tracing off around them.
- **Secrets in the script or its defaults,** in files it writes with default permissions, in
  exported variables inherited by every child process, or echoed in error messages.
- **Secrets available to steps that run untrusted code:** a pull-request build that
  executes the contributor's scripts with deploy credentials in the environment.

### Files, permissions and privilege

- **Temp files with predictable names** (`/tmp/out.$$`, `/tmp/myscript.tmp`): symlink attacks
  and collisions. Use `mktemp` (and `mktemp -d`), with a restrictive `umask` for sensitive data.
- **Permissions:** `chmod 777`, world-writable directories, secrets written before
  permissions are tightened, files created as root in a user's directory.
- **`sudo` inside the script,** especially with a constructed command; scripts run as root
  that read files or `PATH` entries a non-root user can modify.
- **Trusting `PATH` and the environment** in privileged or cron scripts: set `PATH`
  explicitly; don't `source` files from the working directory.
- **`rm -rf`, `mv`, `chown -R`, `git clean`, `dd`, `mkfs`** with computed arguments: check the
  value, and prefer a dry-run flag for anything destructive.
- **Following symlinks as root:** `chown -R`, `chmod -R`, `cp -r`, `tar` extraction and
  redirection (`> "$file"`) into a directory a less-privileged user controls.
- **Race between check and use:** `[ -f "$f" ] && cat "$f"`, `[ ! -e "$f" ] && > "$f"` on a
  shared directory.
- **Archive extraction** of untrusted archives without restricting paths
  (`tar` with absolute names or `..`), and as root.

## Tools

| Purpose | Command | Notes |
| --- | --- | --- |
| Lint | `shellcheck -x script.sh` | Quoting and re-parsing findings (SC2086, SC2046, SC2068, SC2091, SC2294) are the security-relevant ones. It does not judge what is downloaded or who controls a value. |
| Shell inside GitHub Actions workflows | `actionlint` | Runs `shellcheck` on `run:` blocks and flags untrusted `${{ }}` expressions in scripts. `zizmor .` audits workflows for injection, unpinned actions and excess permissions where installed. |
| Shell inside Dockerfiles | `hadolint Dockerfile` | |
| Secrets | `gitleaks detect --no-git --source .` | |
| Rough net for sinks | `git grep -nE '\beval\b\|(ba)?sh -c\|curl[^\|]*\|\s*(sudo )?(ba)?sh\|wget[^\|]*\|\s*(ba)?sh\|chmod (-R )?777\|/tmp/[A-Za-z0-9_.]*\$\$\|\bsudo\b\|rm -rf' -- '*.sh' '*.bash' '.github/workflows' Dockerfile Makefile` | Read each hit and trace where its values come from. |
| CI interpolation | `git grep -nE '\$\{\{ *(github\.(event\|head_ref)\|inputs)\.' -- '.github/workflows'` | A hit inside `run:` is a candidate; inside `env:` or `with:` is usually the fix. |

## What this review does not establish

It reads the script. It does not run it, so it says nothing about the machine it runs on:
file permissions, what is on `PATH`, who else has access, or how CI secrets are scoped. It
does not review the programs the script calls or the code it downloads.
