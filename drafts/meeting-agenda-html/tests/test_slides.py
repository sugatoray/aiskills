"""Slides, the embedded agenda block, and self-containment."""
import json
import re

from playwright.sync_api import expect

from conftest import HTML, URL

DEMO_TITLES = [
    "Priorities for 2026 & 2027",
    "Identify trainings for 2027",
    "Resourcing & budget",
    "Risks & blockers",
    "Decisions, owners & next steps",
]


def test_file_has_no_external_dependencies():
    src = HTML.read_text(encoding="utf-8")
    assert not re.search(r"<link\b", src, re.I), "no <link> tags"
    assert not re.search(r"""\s(src|href)\s*=\s*["']?(https?:)?//""", src, re.I), "no remote src/href"
    assert not re.search(r"@import|url\(\s*['\"]?https?:", src, re.I), "no remote CSS"
    assert not re.search(r"\bfetch\(|XMLHttpRequest|WebSocket|EventSource", src), "no network APIs"


def test_no_network_requests_on_load(page):
    seen = []
    page.on("request", lambda r: seen.append(r.url))
    page.goto(URL)
    assert [u for u in seen if not u.startswith("file:")] == []


def test_embedded_agenda_block_is_the_30_minute_demo():
    src = HTML.read_text(encoding="utf-8")
    m = re.search(r'<script type="application/json" id="agenda-data">(.*?)</script>', src, re.S)
    assert m, "agenda-data block present"
    data = json.loads(m.group(1))
    items = data["items"]
    assert [i["minutes"] for i in items] == [10, 8, 5, 3, 4]
    assert sum(i["minutes"] for i in items) == 30
    assert [i["title"] for i in items] == DEMO_TITLES


def test_one_slide_per_item_with_numbers_titles_points(deck):
    slides = deck.locator(".slide")
    expect(slides).to_have_count(5)
    expect(deck.locator(".slide .num")).to_have_text(["01", "02", "03", "04", "05"])
    expect(deck.locator(".slide .title")).to_have_text(DEMO_TITLES)
    expect(slides.nth(0).locator(".points li")).to_have_text(
        ["What are the priorities for 2026?", "What are the priorities for 2027?"]
    )


def test_item_without_points_renders_no_list(deck):
    from conftest import store_agenda
    store_agenda(deck, [{"minutes": 2, "title": "Solo", "points": []}])
    expect(deck.locator(".slide")).to_have_count(1)
    expect(deck.locator(".slide .points li")).to_have_count(0)


def test_first_slide_active_on_load(deck):
    expect(deck.locator(".slide.active")).to_have_count(1)
    expect(deck.locator(".slide.active .num")).to_have_text("01")


def test_gradient_theme(deck):
    bg = deck.evaluate("getComputedStyle(document.body).backgroundImage")
    assert "gradient" in bg


def test_user_text_is_not_parsed_as_html(deck):
    from conftest import store_agenda
    store_agenda(deck, [{"minutes": 1, "title": "<img src=x onerror=\"window.pwned=1\">",
                         "points": ["<b>bold?</b>"]}])
    expect(deck.locator(".slide .title")).to_have_text("<img src=x onerror=\"window.pwned=1\">")
    expect(deck.locator(".slide img")).to_have_count(0)
    expect(deck.locator(".slide .points b")).to_have_count(0)
    assert deck.evaluate("window.pwned") is None


def test_corrupt_storage_falls_back_to_file_defaults(deck):
    deck.evaluate("localStorage.setItem('meetingAgenda', '{not json')")
    deck.reload()
    expect(deck.locator(".slide")).to_have_count(5)
