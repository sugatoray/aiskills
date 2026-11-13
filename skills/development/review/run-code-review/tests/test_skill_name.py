"""The skill is /run-code-review everywhere it is named, so it never collides with a built-in /code-review.

Run: python3 -m pytest skills/development/review/run-code-review/tests
"""

import json
import re
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]
SUBGROUP = SKILL.parent
REPO = SUBGROUP.parents[2]
NAME = "run-code-review"
# `/code-review` as a command (not part of /run-code-review, a path or a longer word).
OLD_COMMAND = re.compile(r"(?<![\w/-])/code-review(?![\w-])")


def _frontmatter(text):
    return text.split("---", 2)[1]


def test_the_folder_and_the_skill_have_the_new_name():
    assert SKILL.name == NAME
    front = _frontmatter((SKILL / "SKILL.md").read_text(encoding="utf-8"))
    assert re.search(rf"^name: {NAME}$", front, re.M)
    assert re.search(rf"^  name: {NAME}$", front, re.M)
    assert re.search(rf'^  source_url: ".*/skills/development/review/{NAME}"$', front, re.M)


def test_the_plugin_and_the_marketplace_point_at_it():
    plugin = json.loads((SUBGROUP / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))
    assert plugin["skills"] == [f"./{NAME}"]
    market = json.loads((REPO / ".claude-plugin" / "marketplace.json").read_text(encoding="utf-8"))
    entry = next(p for p in market["plugins"] if p["name"] == plugin["name"])
    for description in (plugin["description"], entry["description"]):
        assert f"/{NAME}" in description and not OLD_COMMAND.search(description)


def test_the_agent_metadata_uses_the_new_name():
    for path in (SKILL / "agents").glob("*.yaml"):
        assert 'display_name: "Run-Code-Review"' in path.read_text(encoding="utf-8"), path.name


def test_no_file_in_the_skill_or_subgroup_still_invokes_code_review():
    for path in sorted(SUBGROUP.rglob("*")):
        if not path.is_file() or path.suffix not in (".md", ".json", ".yaml", ".py", ".html"):
            continue
        if path.resolve() == Path(__file__).resolve() or "__pycache__" in path.parts:
            continue
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            # Allowed: the changelog's note on the rename, which names the old command and the built-in.
            if OLD_COMMAND.search(line) and not re.search(r"renamed from|built-in", line, re.I):
                raise AssertionError(f"{path.relative_to(REPO)}:{number}: {line.strip()}")
