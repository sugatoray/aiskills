"""scripts/build_deck.py: agenda JSON in, ready-to-present deck HTML out."""
import json
import re
import subprocess
import sys

import pytest
from playwright.sync_api import expect

from conftest import HTML, ROOT

SCRIPT = ROOT / "scripts" / "build_deck.py"
BLOCK = re.compile(r'<script type="application/json" id="agenda-data">(.*?)</script>', re.S)

AGENDA = {
    "title": "Q3 Review",
    "items": [
        {"minutes": 15, "title": "Results", "points": ["Revenue", "Churn"]},
        {"minutes": 7.5, "title": "Next quarter"},
    ],
}


def run(*args, stdin=None):
    return subprocess.run([sys.executable, str(SCRIPT), *map(str, args)],
                          input=stdin, capture_output=True, text=True)


def block(html_text):
    blocks = BLOCK.findall(html_text)
    assert len(blocks) == 1
    return blocks[0]


def test_builds_deck_from_json_file(tmp_path):
    src = tmp_path / "agenda.json"
    src.write_text(json.dumps(AGENDA))
    out = tmp_path / "deck.html"
    r = run(src, "-o", out)
    assert r.returncode == 0, r.stderr
    data = json.loads(block(out.read_text()))
    assert data == {"title": "Q3 Review", "items": [
        {"minutes": 15, "title": "Results", "points": ["Revenue", "Churn"]},
        {"minutes": 7.5, "title": "Next quarter", "points": []}]}
    assert "2 items, 22:30 planned" in r.stdout


def test_reads_stdin_and_title_override(tmp_path):
    out = tmp_path / "deck.html"
    r = run("-", "-o", out, "--title", "Weekly sync", stdin=json.dumps(AGENDA["items"]))
    assert r.returncode == 0, r.stderr
    assert json.loads(block(out.read_text()))["title"] == "Weekly sync"


def test_only_the_data_block_changes(tmp_path):
    src = tmp_path / "a.json"
    src.write_text(json.dumps(AGENDA))
    out = tmp_path / "deck.html"
    run(src, "-o", out)
    template = HTML.read_text()
    built = out.read_text()
    assert BLOCK.sub("", built) == BLOCK.sub("", template)


def test_escapes_less_than_so_titles_cannot_break_out(tmp_path):
    src = tmp_path / "a.json"
    src.write_text(json.dumps({"items": [{"minutes": 1, "title": "x </script><script>alert(1)</script>"}]}))
    out = tmp_path / "deck.html"
    assert run(src, "-o", out).returncode == 0
    raw = block(out.read_text())
    assert "<" not in raw
    assert json.loads(raw)["items"][0]["title"] == "x </script><script>alert(1)</script>"


@pytest.mark.parametrize("bad, msg", [
    ({"items": []}, "at least one item"),
    ({"items": [{"minutes": 0, "title": "A"}]}, "item 1: minutes must be greater than 0"),
    ({"items": [{"minutes": 5, "title": "  "}]}, "item 1: title is required"),
    ({"items": [{"minutes": 5, "title": "A"}, {"minutes": "ten", "title": "B"}]}, "item 2: minutes must be a number"),
    ({"items": [{"minutes": 5, "title": "A", "points": "not a list"}]}, "item 1: points must be a list of strings"),
])
def test_rejects_invalid_agendas(tmp_path, bad, msg):
    src = tmp_path / "a.json"
    src.write_text(json.dumps(bad))
    out = tmp_path / "deck.html"
    r = run(src, "-o", out)
    assert r.returncode == 2
    assert msg in r.stderr
    assert not out.exists()


def test_rejects_malformed_json(tmp_path):
    src = tmp_path / "a.json"
    src.write_text("{nope")
    r = run(src, "-o", tmp_path / "d.html")
    assert r.returncode == 2 and "not valid JSON" in r.stderr


def test_check_mode_validates_without_writing(tmp_path):
    src = tmp_path / "a.json"
    src.write_text(json.dumps(AGENDA))
    r = run(src, "--check")
    assert r.returncode == 0 and "2 items, 22:30 planned" in r.stdout


def test_built_deck_renders_the_agenda(tmp_path, browser):
    src = tmp_path / "a.json"
    src.write_text(json.dumps(AGENDA))
    out = tmp_path / "deck.html"
    run(src, "-o", out)
    ctx = browser.new_context()
    try:
        p = ctx.new_page()
        p.goto(out.as_uri())
        expect(p.locator(".slide .title")).to_have_text(["Results", "Next quarter"])
        expect(p.locator("#meeting-text")).to_have_text("Meeting: 0:00 used / 22:30 planned")
        expect(p.locator("#meeting-title")).to_have_text("Q3 Review")
    finally:
        ctx.close()
