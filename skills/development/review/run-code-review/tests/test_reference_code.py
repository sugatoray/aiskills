"""Every code block in the language references parses, so a suggested fix can be applied as is.

A block may be invalid only if its first line says so (a "Before" example that shows an error).
Checked here: python, json, toml (Python 3.11+), yaml (with PyYAML), bash/sh (with bash).

Run: python3 -m pytest skills/development/review/run-code-review/tests
"""

import ast
import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

REFERENCES = Path(__file__).resolve().parents[1] / "references"
BLOCK = re.compile(r"^```(\w+)\n(.*?)^```", re.S | re.M)
MARKED_INVALID = re.compile(r"\berror\b", re.I)
CHECKED = {"python", "json", "toml", "yaml", "bash", "sh"}


def _blocks():
    for path in sorted(REFERENCES.glob("review_*/*.md")):
        text = path.read_text(encoding="utf-8")
        for match in BLOCK.finditer(text):
            if match.group(1) not in CHECKED:
                continue
            line = text.count("\n", 0, match.start()) + 1
            yield pytest.param(match.group(1), match.group(2), id=f"{path.parent.name}/{path.name}:{line}")


def _parse(lang, code):
    if lang == "python":
        ast.parse(code)
    elif lang == "json":
        json.loads(code)
    elif lang == "toml":
        tomllib = pytest.importorskip("tomllib")
        tomllib.loads(code)
    elif lang == "yaml":
        yaml = pytest.importorskip("yaml")
        list(yaml.safe_load_all(code))
    elif lang in ("bash", "sh"):
        if not shutil.which("bash"):
            pytest.skip("bash not installed")
        result = subprocess.run(["bash", "-n"], input=code, capture_output=True, text=True)
        if result.returncode:
            raise SyntaxError(result.stderr.strip())


@pytest.mark.parametrize("lang, code", list(_blocks()))
def test_every_reference_code_block_parses(lang, code):
    first = code.splitlines()[0] if code.strip() else ""
    if MARKED_INVALID.search(first):
        return  # a deliberate "Before" example of an error
    _parse(lang, code)
