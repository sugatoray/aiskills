"""/run-code-review runs only when invoked by name, like the scrolls skills.

The model never starts a review on its own: SKILL.md sets disable-model-invocation, and every
agents/*.yaml sets allow_implicit_invocation to false to match.

Run: python3 -m pytest skills/development/review/run-code-review/tests
"""

import re
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]


def _frontmatter(text):
    return text.split("---", 2)[1]


def test_skill_md_disables_model_invocation():
    front = _frontmatter((SKILL / "SKILL.md").read_text(encoding="utf-8"))
    assert re.search(r"^disable-model-invocation: true$", front, re.M)


def test_agent_metadata_disallows_implicit_invocation():
    paths = sorted((SKILL / "agents").glob("*.yaml"))
    assert [p.name for p in paths] == ["claude-code.yaml", "openai.yaml"]
    for path in paths:
        text = path.read_text(encoding="utf-8")
        assert re.search(r"^  allow_implicit_invocation: false$", text, re.M), path.name
        assert "allow_implicit_invocation: true" not in text, path.name
