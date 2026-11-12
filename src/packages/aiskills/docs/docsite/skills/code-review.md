# code-review

Runs a thorough, evidence-based code review of a pull request, branch, diff, set of files or whole repository, at the bar a senior or staff engineer holds at a large engineering organisation, and returns a structured report: a verdict, findings ranked by severity (blocker, major, minor, nit) with file and line, the failure each one causes, and a concrete suggested code change wherever a fix is clear. Covers Python, JavaScript, TypeScript, Rust, shell scripts (sh, bash, zsh), PowerShell and SQL, each with its own checklist, before/after fix patterns and tool commands under references/review_<language>/; files in other languages get the cross-language review only. Use this whenever the user asks to review code, review a PR or merge request, do a code review, audit or critique code, check a change before merging, look for bugs, security problems or bad practices in code, or invokes /code-review, even when they don't name a language. It reviews and suggests; it changes files or posts review comments only when asked.

| Property | Value |
| --- | --- |
| Group | `reviews-skills` (alias `reviews`) |
| Version | 1.0.0 |
| Starts | When you type `/code-review`, or your agent uses it when a task fits its description |
| Needs | Read access to the code under review. git for diff-based scope. python3 (standard library only) for scripts/detect_languages.py. The linters, type checkers and test runners named in each TOOLING.md are used when the project already has them; none is required. |
| License | MIT |
| Source | [skills/development/reviews/code-review](https://github.com/sugatoray/aiskills/tree/master/skills/development/reviews/code-review) |

## Install

For one agent (leave out `-a` for every agent `npx skills` finds):

<!-- verify -->
```bash
aiskills install -s code-review -a claude-code
```

```text
[aiskills] skills saved to ~/.config/sugatoray/aiskills/skills (flat layout)
[aiskills] bundled: code-review
[aiskills] running: npx -y skills@1.7.6 add ~/.config/sugatoray/aiskills --global --skill code-review --agent claude-code --yes
[aiskills] adding this install to the skills.sh count in the background (turn off: --no-stats)
```

Or the whole `reviews-skills` group:

```bash
aiskills install -G reviews -a claude-code
```

Into the current project instead: add `-p`. To remove it:

```bash
aiskills uninstall -s code-review
```

## What's inside

The files that ship with the skill, in `~/.config/sugatoray/aiskills/skills/code-review/`:

- `CHANGELOG.md`
- `README.md`
- `SKILL.md`
- `agents/claude-code.yaml`
- `agents/openai.yaml`
- `meta/MAINTAINERS.md`
- `references/CROSS_LANGUAGE.md`
- `references/REPORT_TEMPLATE.md`
- `references/SEVERITY.md`
- `references/review_javascript/PATTERNS.md`
- `references/review_javascript/REVIEW.md`
- `references/review_javascript/TOOLING.md`
- `references/review_powershell-script/PATTERNS.md`
- `references/review_powershell-script/REVIEW.md`
- `references/review_powershell-script/TOOLING.md`
- `references/review_python/PATTERNS.md`
- `references/review_python/REVIEW.md`
- `references/review_python/TOOLING.md`
- `references/review_rust/PATTERNS.md`
- `references/review_rust/REVIEW.md`
- `references/review_rust/TOOLING.md`
- `references/review_shellscript/PATTERNS.md`
- `references/review_shellscript/REVIEW.md`
- `references/review_shellscript/TOOLING.md`
- `references/review_sql/PATTERNS.md`
- `references/review_sql/REVIEW.md`
- `references/review_sql/TOOLING.md`
- `references/review_typescript/PATTERNS.md`
- `references/review_typescript/REVIEW.md`
- `references/review_typescript/TOOLING.md`
- `scripts/detect_languages.py`
- `tests/test_detect_languages.py`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/development/reviews/code-review/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/development/reviews/code-review/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
