# Development skills

Skills for software-development workflows that aren't specific to any
one project — acting on a repository's own hosted state (issues, pull
requests, releases), reviewing code, and (over time) other repo/process
tasks that cut across projects.

Organized into subgroups by area, each holding one or more skills:

| Subgroup | Purpose |
| --- | --- |
| [`repo-related/`](repo-related/) | Skills that act on a repository's own hosted state — issues, pull requests, releases, and similar. Currently: filing issues for a PR's work and keeping the PR's title/description in sync with them. |
| [`reviews/`](reviews/) | Skills that review work and report on it. Currently: `/code-review`, a thorough code review of a PR, diff, files or repo with a structured report and suggested changes, with per-language checklists, security scope and review wisdom for Python, JavaScript, TypeScript, Rust, shell, PowerShell, SQL, HTML, CSS, Markdown, XML, JSON, YAML and TOML. Options choose the languages (-l), the files (-p, -t, --local, -r, --base) and a security-only review (-s). |

More subgroups will be added here over time (e.g. release management)
as skills for them are written — each gets its own subfolder with its
own `README.md`, following the same pattern as `repo-related/` and
`reviews/`.
