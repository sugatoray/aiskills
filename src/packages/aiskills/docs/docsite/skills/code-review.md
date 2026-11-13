# code-review

Runs a thorough, evidence-based code review of a pull request, branch, diff, set of files or whole repository, at the bar a senior or staff engineer holds at a large engineering organisation, and returns a structured report: a verdict, findings ranked by severity (blocker, major, minor, nit) with file and line, the failure each one causes, and a concrete suggested code change wherever a fix is clear. Covers Python, JavaScript, TypeScript, Rust, shell scripts (sh, bash, zsh), PowerShell, SQL, HTML, CSS, Markdown, XML, JSON, YAML and TOML, each with its own checklist, fix patterns, tool commands, security scope and review wisdom under references/review_<language>/; XML, JSON, YAML and TOML are checked with tools first; files in other languages get the cross-language review only. Options: -l/--lang limits the review to chosen languages, -s/--security runs a security review alone, and -p, -t, --local, -r and --base choose which files are reviewed. Use this whenever the user asks to review code, review a PR or merge request, do a code review or security review, audit or critique code, check a change before merging, look for bugs, security problems or bad practices in code, or invokes /code-review, even when they don't name a language. It reviews and suggests; it changes files or posts review comments only when asked.

| Property | Value |
| --- | --- |
| Group | `review-skills` (alias `review`) |
| Version | 1.1.0 |
| Starts | When you type `/code-review`, or your agent uses it when a task fits its description |
| Needs | Read access to the code under review. git for diff-based scope (2.30 or later for --base). python3 (standard library only) for scripts/detect_languages.py and scripts/check_formats.py. The linters, type checkers and test runners named in each TOOLING.md are used when the project already has them; none is required. |
| License | MIT |
| Source | [skills/development/review/code-review](https://github.com/sugatoray/aiskills/tree/master/skills/development/review/code-review) |

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

Or the whole `review-skills` group:

```bash
aiskills install -G review -a claude-code
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
- `assets/EXAMPLE.md`
- `meta/MAINTAINERS.md`
- `references/CROSS_LANGUAGE.md`
- `references/REPORT_TEMPLATE.md`
- `references/SEVERITY.md`
- `references/review_css/PATTERNS.md`
- `references/review_css/REVIEW.md`
- `references/review_css/SECURITY.md`
- `references/review_css/TOOLING.md`
- `references/review_css/WISDOM.md`
- `references/review_html/PATTERNS.md`
- `references/review_html/REVIEW.md`
- `references/review_html/SECURITY.md`
- `references/review_html/TOOLING.md`
- `references/review_html/WISDOM.md`
- `references/review_javascript/PATTERNS.md`
- `references/review_javascript/REVIEW.md`
- `references/review_javascript/SECURITY.md`
- `references/review_javascript/TOOLING.md`
- `references/review_javascript/WISDOM.md`
- `references/review_json/PATTERNS.md`
- `references/review_json/REVIEW.md`
- `references/review_json/SECURITY.md`
- `references/review_json/TOOLING.md`
- `references/review_json/WISDOM.md`
- `references/review_markdown/PATTERNS.md`
- `references/review_markdown/REVIEW.md`
- `references/review_markdown/SECURITY.md`
- `references/review_markdown/TOOLING.md`
- `references/review_markdown/WISDOM.md`
- `references/review_powershell-script/PATTERNS.md`
- `references/review_powershell-script/REVIEW.md`
- `references/review_powershell-script/SECURITY.md`
- `references/review_powershell-script/TOOLING.md`
- `references/review_powershell-script/WISDOM.md`
- `references/review_python/PATTERNS.md`
- `references/review_python/REVIEW.md`
- `references/review_python/SECURITY.md`
- `references/review_python/TOOLING.md`
- `references/review_python/WISDOM.md`
- `references/review_rust/PATTERNS.md`
- `references/review_rust/REVIEW.md`
- `references/review_rust/SECURITY.md`
- `references/review_rust/TOOLING.md`
- `references/review_rust/WISDOM.md`
- `references/review_shellscript/PATTERNS.md`
- `references/review_shellscript/REVIEW.md`
- `references/review_shellscript/SECURITY.md`
- `references/review_shellscript/TOOLING.md`
- `references/review_shellscript/WISDOM.md`
- `references/review_sql/PATTERNS.md`
- `references/review_sql/REVIEW.md`
- `references/review_sql/SECURITY.md`
- `references/review_sql/TOOLING.md`
- `references/review_sql/WISDOM.md`
- `references/review_toml/PATTERNS.md`
- `references/review_toml/REVIEW.md`
- `references/review_toml/SECURITY.md`
- `references/review_toml/TOOLING.md`
- `references/review_toml/WISDOM.md`
- `references/review_typescript/PATTERNS.md`
- `references/review_typescript/REVIEW.md`
- `references/review_typescript/SECURITY.md`
- `references/review_typescript/TOOLING.md`
- `references/review_typescript/WISDOM.md`
- `references/review_xml/PATTERNS.md`
- `references/review_xml/REVIEW.md`
- `references/review_xml/SECURITY.md`
- `references/review_xml/TOOLING.md`
- `references/review_xml/WISDOM.md`
- `references/review_yaml/PATTERNS.md`
- `references/review_yaml/REVIEW.md`
- `references/review_yaml/SECURITY.md`
- `references/review_yaml/TOOLING.md`
- `references/review_yaml/WISDOM.md`
- `scripts/check_formats.py`
- `scripts/detect_languages.py`
- `tests/test_check_formats.py`
- `tests/test_detect_languages.py`
- `tests/test_reference_code.py`

See also: [All skills](README.md) · [README](https://github.com/sugatoray/aiskills/blob/master/skills/development/review/code-review/README.md) · [CHANGELOG](https://github.com/sugatoray/aiskills/blob/master/skills/development/review/code-review/CHANGELOG.md) · [Skill groups](../concepts/skill-groups.md)
