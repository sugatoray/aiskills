"""uv/pyproject.toml packaging checks for this skill's Python tooling.

Guards the dev workflow described in meta/MAINTAINERS.md: dependencies and
the pytest dev-group must be declared in pyproject.toml (the uv-managed
source of truth), not just implied by a bare requirements.txt.
"""
import pathlib
import tomllib

ROOT = pathlib.Path(__file__).resolve().parents[1]
PYPROJECT = ROOT / "pyproject.toml"


def _load():
    with PYPROJECT.open("rb") as f:
        return tomllib.load(f)


def test_pyproject_toml_exists():
    assert PYPROJECT.is_file(), "expected a uv-managed pyproject.toml at the skill root"


def test_declares_runtime_dependencies():
    data = _load()
    deps = data["project"]["dependencies"]
    names = {dep.split(">=")[0].split("==")[0].strip().lower() for dep in deps}
    assert "pyyaml" in names
    assert "jinja2" in names


def test_declares_pytest_as_a_dev_dependency():
    data = _load()
    dev_deps = data["dependency-groups"]["dev"]
    names = {dep.split(">=")[0].split("==")[0].strip().lower() for dep in dev_deps}
    assert "pytest" in names


def test_requires_python_is_declared():
    data = _load()
    assert data["project"]["requires-python"]


def test_requirements_txt_no_longer_needed():
    """Superseded by pyproject.toml; a stray requirements.txt would drift out
    of sync with it, so it shouldn't exist alongside the uv-managed file."""
    assert not (ROOT / "builder" / "requirements.txt").exists()
