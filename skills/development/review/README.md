# Review skills

Skills that review work and report on it, without changing it unless asked. The first one,
`/run-code-review`, runs a thorough code review of a pull request, branch, diff, set of files or whole
repository at the bar a senior or staff engineer holds at a large engineering organisation, and
returns a structured report: a verdict, findings ranked by severity with file and line, the
failure each one causes, and a suggested code change wherever a fix is clear.

## Skills

| Skill | Purpose |
| --- | --- |
| [`/run-code-review`](run-code-review/) | Reviews code in Python, JavaScript, TypeScript, Rust, shell scripts, PowerShell, SQL, HTML, CSS, Markdown, XML, JSON, YAML and TOML (other languages get the cross-language review), with a checklist, fix patterns, tool commands, security scope and review wisdom per language. `-l` limits it to chosen languages, `-s` runs a security review alone, and `-p`, `-t`, `--local`, `-r` and `--base` choose the files. XML, JSON, YAML and TOML are checked with tools first. Verifies each finding before reporting it. Suggests changes; applies them only when asked. |

More skills will be added under this folder over time (for example design-document review or
security-focused review), following the same layout as `run-code-review/`.

## This folder

- `.claude-plugin/plugin.json`: the subgroup-level Claude Code plugin manifest, grouping every
  skill in this folder into one `review-skills` plugin listed in the repo-root
  `.claude-plugin/marketplace.json`. See [`meta/MAINTAINERS.md`](meta/MAINTAINERS.md) for its
  keep-in-sync rules; the layout is the same as `../repo-related/`.
- `meta/MAINTAINERS.md`: subgroup-wide maintainer notes. Not read at invocation time.

## Layout

Each skill's directory has:

- `SKILL.md`: the skill's runtime instructions.
- `README.md`: a short, human-facing pointer to the files below; not read at invocation time.
- `references/`: detailed content loaded on demand (for `run-code-review`: severity rules, the report
  template, and one folder per language).
- `scripts/` and `tests/`: deterministic helpers the skill runs, with their regression tests.
- `meta/MAINTAINERS.md`: development notes. Not read at invocation time.
- `CHANGELOG.md`: that skill's own version history.
- `agents/`: agent display metadata.

## Installing

With `npx skills` (works with Claude Code, Codex and other agents); choose `run-code-review`:

```sh
npx skills add sugatoray/aiskills               # project-level
npx skills add sugatoray/aiskills --global      # user-level
```

As a Claude Code plugin:

```
/plugin marketplace add sugatoray/aiskills
/plugin install review-skills@sugatoray
```

With the npm package: `aiskills install --group review`.
