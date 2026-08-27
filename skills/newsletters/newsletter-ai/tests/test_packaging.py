"""uv/pyproject.toml packaging checks for this skill's Python tooling.

Guards the dev workflow described in meta/MAINTAINERS.md: dependencies and
the pytest dev-group must be declared in pyproject.toml (the uv-managed,
RECOMMENDED source of truth), and builder/requirements.txt (the documented
pip fallback for when uv isn't available) must stay in sync with it rather
than drifting into a second, contradictory source of truth.
"""
import pathlib
import tomllib

ROOT = pathlib.Path(__file__).resolve().parents[1]
PYPROJECT = ROOT / "pyproject.toml"
REQUIREMENTS_TXT = ROOT / "builder" / "requirements.txt"


def _load():
    with PYPROJECT.open("rb") as f:
        return tomllib.load(f)


def _dep_name(spec: str) -> str:
    return spec.split(">=")[0].split("==")[0].strip().lower()


def test_pyproject_toml_exists():
    assert PYPROJECT.is_file(), "expected a uv-managed pyproject.toml at the skill root"


def test_declares_runtime_dependencies():
    data = _load()
    deps = data["project"]["dependencies"]
    names = {_dep_name(dep) for dep in deps}
    assert "pyyaml" in names
    assert "jinja2" in names


def test_declares_pytest_as_a_dev_dependency():
    data = _load()
    dev_deps = data["dependency-groups"]["dev"]
    names = {_dep_name(dep) for dep in dev_deps}
    assert "pytest" in names


def test_requires_python_is_declared():
    data = _load()
    assert data["project"]["requires-python"]


def test_requirements_txt_fallback_exists():
    """Kept as the documented pip fallback for when uv isn't available
    (README.md / meta/MAINTAINERS.md); uv remains the RECOMMENDED path."""
    assert REQUIREMENTS_TXT.is_file()


def test_requirements_txt_matches_pyproject_runtime_dependencies():
    """The pip fallback must declare exactly the same runtime packages as
    pyproject.toml (the uv-managed source of truth) so the two installation
    paths can't silently drift apart."""
    pyproject_names = {_dep_name(dep) for dep in _load()["project"]["dependencies"]}
    lines = [
        line.strip()
        for line in REQUIREMENTS_TXT.read_text().splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]
    requirements_names = {_dep_name(line) for line in lines}
    assert requirements_names == pyproject_names
