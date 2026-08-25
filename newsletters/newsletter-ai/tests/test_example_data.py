"""Regression tests against the real sample edition
(assets/example/sample-report.yaml) — the data actually shipped to users,
as opposed to the minimal synthetic fixtures used elsewhere. Guards
against the schema and the real content drifting apart.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
EXAMPLE = ROOT / "assets" / "example" / "sample-report.yaml"
sys.path.insert(0, str(SCRIPTS))

import build_report  # noqa: E402
import report_data  # noqa: E402


def test_example_yaml_is_valid():
    data = report_data.load_yaml(EXAMPLE)
    assert report_data.validate(data) == []


def test_example_yaml_has_all_fifteen_parts_plus_home():
    data = report_data.load_yaml(EXAMPLE)
    ids = [s["id"] for s in data["sections"]]
    assert ids == ["home"] + [f"part{n}" for n in range(1, 16)]


def test_example_renders_without_error():
    data = report_data.load_yaml(EXAMPLE)
    html = build_report.render_html(data)
    assert "<html" in html.lower()


def test_example_has_no_broken_internal_links():
    data = report_data.load_yaml(EXAMPLE)
    html = build_report.render_html(data)
    markup = re.sub(r"<script\b.*?</script>", "", html, flags=re.S)
    ids = set(re.findall(r'\bid="([^"]+)"', markup))
    hrefs = re.findall(r'<a\b[^>]*\bhref="#([^"]+)"', markup)
    missing = sorted(set(h for h in hrefs if h not in ids))
    assert missing == [], f"broken internal links in the real sample data: {missing}"


def test_example_external_sources_are_https():
    data = report_data.load_yaml(EXAMPLE)
    for sec in data["sections"]:
        for item in sec.get("items", []):
            for src in item.get("sources") or []:
                assert src["url"].startswith("https://"), src["url"]


def test_example_home_cards_cover_every_standard_section():
    data = report_data.load_yaml(EXAMPLE)
    home = next(s for s in data["sections"] if s["id"] == "home")
    card_targets = {c["target"] for c in home["cards"]}
    standard_ids = {s["id"] for s in data["sections"] if s.get("kind") == "standard"}
    assert card_targets == standard_ids


def test_example_builds_to_a_file(tmp_path):
    out = tmp_path / "out.html"
    build_report.build(EXAMPLE, out)
    assert out.exists()
    assert out.stat().st_size > 10_000
