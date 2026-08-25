"""Red/Green tests for the report.html template + build_report.py renderer.

These assert the invariants the user explicitly asked for:
  - light AND dark theme tokens are present
  - every internal `#anchor` link resolves to a real id (no broken links)
  - every item source becomes a numbered reference, and every citation
    link a section renders points at that section's own References
    accordion (never a different tab, never a dangling id)
  - a References accordion exists once per standard section that has
    at least one source, and matches that section's deduped source list
  - print CSS forces every tab panel and accordion panel fully visible
    (the truncation bug class from the first pass of this work)

Run: pytest newsletters/newsletter-ai/tests -q
"""
import pathlib
import re
import sys

import pytest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
FIXTURES = pathlib.Path(__file__).parent / "fixtures"
sys.path.insert(0, str(SCRIPTS))

import build_report  # noqa: E402
import report_data  # noqa: E402


@pytest.fixture(scope="module")
def ctx():
    data = report_data.load_yaml(FIXTURES / "sample.yaml")
    return report_data.build_context(data)


@pytest.fixture(scope="module")
def html(ctx):
    return build_report.render_html(ctx)


# --------------------------------------------------------------- structure

def test_render_produces_one_nav_item_per_section(html, ctx):
    nav_ids = re.findall(r'data-tab="([a-z0-9-]+)"', html)
    assert nav_ids == [s["id"] for s in ctx["sections"]]


def test_render_produces_one_tab_panel_per_section(html, ctx):
    panel_ids = re.findall(r'<section class="tab-panel[^"]*" id="([a-z0-9-]+)"', html)
    assert panel_ids == [s["id"] for s in ctx["sections"]]


def test_home_cards_link_to_real_section_ids(html, ctx):
    targets = re.findall(r'data-goto="([a-z0-9-]+)"', html)
    ids = {s["id"] for s in ctx["sections"]}
    assert targets, "expected at least one home card"
    assert set(targets) <= ids


# ---------------------------------------------------------- link integrity

def _strip_scripts(html: str) -> str:
    # JS string literals like '<use href="#' + expr + '"/>' are not markup
    # hrefs — only check real <a href="#..."> anchors in the document body.
    return re.sub(r"<script\b.*?</script>", "", html, flags=re.S)


def test_no_broken_internal_anchor_links(html):
    markup = _strip_scripts(html)
    ids = set(re.findall(r'\bid="([^"]+)"', markup))
    hrefs = re.findall(r'<a\b[^>]*\bhref="#([^"]+)"', markup)
    assert hrefs, "expected at least one internal anchor link (citations)"
    missing = sorted(set(h for h in hrefs if h not in ids))
    assert missing == [], f"broken internal links, no matching id for: {missing}"


def test_citation_links_point_into_their_own_sections_references(html):
    # every #ref-{section}-{n} href must live inside a <section id="{section}">
    for m in re.finditer(r'<section class="tab-panel[^"]*" id="([a-z0-9-]+)">(.*?)</section>', html, re.S):
        sid, body = m.group(1), m.group(2)
        for href in re.findall(r'href="#(ref-[a-z0-9-]+-\d+)"', body):
            assert href.startswith(f"ref-{sid}-"), (
                f"citation in section {sid!r} points outside its own section: #{href}"
            )


def test_every_source_produces_a_reference_and_a_citation_link(html, ctx):
    part1 = next(s for s in ctx["sections"] if s["id"] == "part1")
    # 2 unique urls across part1's two items (one shared)
    assert [r["url"] for r in part1["references"]] == ["https://example.com/a", "https://example.org/b"]
    assert "id=\"ref-part1-1\"" in html
    assert "id=\"ref-part1-2\"" in html
    assert 'href="#ref-part1-1"' in html
    assert 'href="#ref-part1-2"' in html
    # the external URLs themselves appear as real hrefs, target=_blank
    assert 'href="https://example.com/a"' in html
    assert 'href="https://example.org/b"' in html


def test_external_reference_links_open_in_new_tab_with_noopener(html):
    for m in re.finditer(r'<a href="https://example\.[^"]+"([^>]*)>', html):
        attrs = m.group(1)
        assert 'target="_blank"' in attrs
        assert "noopener" in attrs


# ------------------------------------------------------- References accordion

def test_references_accordion_present_once_per_sourced_section(html):
    # only part1's items carry sources in the fixture; part2's items have none
    assert html.count('class="accordion refs-accordion"') == 1


def test_references_accordion_lists_exactly_the_deduped_sources(html, ctx):
    part1 = next(s for s in ctx["sections"] if s["id"] == "part1")
    block_match = re.search(
        r'<section class="tab-panel[^"]*" id="part1">(.*?)</section>', html, re.S
    )
    block = block_match.group(1)
    ref_block_match = re.search(r'<div class="accordion refs-accordion"[^>]*>(.*?)</div>\s*</div>\s*</div>', block, re.S)
    assert ref_block_match, "expected a accordion refs-accordion block inside part1"
    ref_block = ref_block_match.group(1)
    for ref in part1["references"]:
        assert f'id="ref-part1-{ref["n"]}"' in ref_block
        assert ref["url"] in ref_block


def test_section_with_no_sources_has_no_references_accordion(html):
    # every item in the fixture's part2 section has no `sources` at all
    part2_match = re.search(r'<section class="tab-panel[^"]*" id="part2">(.*?)</section>', html, re.S)
    assert "accordion refs-accordion" not in part2_match.group(1)


# -------------------------------------------------------------------- theming

def test_light_and_dark_theme_tokens_present(html):
    assert re.search(r":root\s*{[^}]*--bg", html)
    assert "prefers-color-scheme: dark" in html
    assert 'data-theme="dark"' in html
    assert 'data-theme="light"' in html


def test_theme_toggle_control_present(html):
    assert 'id="themeBtn"' in html


# ------------------------------------------------------------------ print CSS

def test_print_media_forces_all_tab_panels_and_accordions_visible(html):
    assert "@media print" in html
    print_block = html.split("@media print", 1)[1]
    compact = re.sub(r"\s+", "", print_block)
    assert ".tab-panel{display:block!important" in compact
    assert ".accordion-panel{display:block!important" in compact


def test_print_cover_and_toc_blocks_present(html):
    assert re.search(r'class="[^"]*\bprint-cover\b[^"]*"', html)
    assert re.search(r'class="[^"]*\bprint-toc\b[^"]*"', html)


# -------------------------------------------------------------- content shapes

def test_table_item_renders_all_rows(html):
    assert "Test Model A" in html
    assert "Test Model B" in html


def test_stats_item_renders_all_stats(html):
    assert "Fixture raise" in html
    assert "Fixture growth" in html


def test_kv_item_renders(html):
    assert "Watch this" in html


def test_body_only_item_renders_without_sources_footer(html):
    assert "No material development this week." in html


# ------------------------------------------------------------------- rendering errors

def test_render_html_raises_validation_error_for_invalid_data():
    with pytest.raises(report_data.ValidationError):
        build_report.render_html({})
