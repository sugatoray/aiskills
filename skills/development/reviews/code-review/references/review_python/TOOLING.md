# Python tooling

Commands to run during a review, and how to read them. Follow `SKILL.md` step 4: run what the
project already has, don't install into it, and treat output as leads to confirm.

## Find what the project uses

```bash
grep -nE '^\[tool\.|requires-python|^\[project' pyproject.toml   # configured tools, minimum version
ls .pre-commit-config.yaml tox.ini noxfile.py Makefile setup.cfg 2>/dev/null
grep -rnE 'ruff|mypy|pyright|pytest|flake8|pylint|bandit' .github/workflows 2>/dev/null
```

Use the project's runner so the right environment and versions are used: `uv run <cmd>`,
`poetry run <cmd>`, `hatch run <cmd>`, `tox -e <env>`, `nox -s <session>`, or the virtualenv's
`python -m <cmd>`.

## Checks

| Purpose | Command | Notes |
| --- | --- | --- |
| Syntax, on any machine | `python3 -m compileall -q <paths>` | No install needed. Fails on syntax errors only. |
| Lint | `ruff check <paths>` | Honours `[tool.ruff]`. Add `--select B,S,ASYNC,PERF,UP,SIM` to see bugbear, security, async, performance, upgrade and simplify rules the project hasn't enabled; report those as your own findings, not as lint failures. |
| Format | `ruff format --check <paths>` or `black --check <paths>` | Only mention if the project formats and the change doesn't. |
| Types | `mypy <paths>` or `pyright <paths>` | Use whichever is configured. New errors in changed files matter; a long list of old ones is pre-existing. |
| Tests | `pytest -q <test paths>` | Run the tests for the changed code first, then the suite if it is quick. `-x` stops at the first failure; `-k <expr>` selects. |
| Coverage of the change | `pytest --cov=<package> --cov-report=term-missing <tests>` | Needs `pytest-cov`. Read the "Missing" lines for the changed files; a percentage alone says little. |
| Security lint | `bandit -q -r <package>` | Many low-severity hits (`assert` in tests, `subprocess`) are noise; confirm each. |
| Known-vulnerable dependencies | `pip-audit` | Run against the lock file or the environment. Report only what the change adds or what is reachable. |
| Dead code | `vulture <package>` | Leads only; dynamic use produces false positives. |

For changed files only:

```bash
git diff --name-only --diff-filter=ACMR --merge-base origin/main -- '*.py' | xargs -r ruff check
```

## Reading the output

- **A rule disabled in the change** (`# noqa`, `# type: ignore`, an entry added to an ignore
  list) is itself something to review: is there a code and a reason?
- **Type errors:** `Any`-related silences hide real bugs; an error "in unrelated code" after a
  signature change usually is related.
- **A test that passes with the change reverted** doesn't test the change. To check, stash the
  source change and run the new test: it should fail.

## Reproducing a finding

A short script is the strongest evidence. Keep it out of the repository:

```bash
python3 - <<'EOF_PY'
from decimal import Decimal
print(0.1 + 0.2 == 0.3, Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))
EOF_PY
```

`python3 -X dev -W error script.py` turns on development-mode checks (unclosed files, un-awaited
coroutines, deprecations as errors), which surfaces resource and async mistakes quickly.
