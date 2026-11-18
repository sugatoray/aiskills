"""The deck adapts to any number of items and any times."""
from playwright.sync_api import expect

from conftest import store_agenda


def no_horizontal_scroll(page):
    return page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")


def test_many_items_long_text(deck):
    items = [{"minutes": 0.5 + i, "title": f"Item {i + 1}: " + "a fairly long agenda title " * 3,
              "points": [f"Point {j} " + "with some extra words " * 4 for j in range(8)]}
             for i in range(24)]
    store_agenda(deck, items)
    expect(deck.locator(".slide")).to_have_count(24)
    expect(deck.locator("#dots .dot")).to_have_count(24)
    expect(deck.locator("#meeting-bar .tick")).to_have_count(23)
    expect(deck.locator(".slide .num").nth(23)).to_have_text("24")
    assert no_horizontal_scroll(deck)
    # the active slide's content stays within the viewport height
    bottom = deck.evaluate(
        "document.querySelector('.slide.active').getBoundingClientRect().bottom")
    footer_top = deck.evaluate("document.querySelector('footer').getBoundingClientRect().top")
    assert bottom <= footer_top + 1


def test_long_meeting_formats_minutes_past_an_hour(deck):
    store_agenda(deck, [{"minutes": 90, "title": "Offsite", "points": []}])
    expect(deck.locator("#timer-text")).to_have_text("90:00")
    expect(deck.locator("#meeting-text")).to_have_text("Meeting: 0:00 used / 90:00 planned")


def test_phone_width(browser):
    from conftest import URL
    ctx = browser.new_context(viewport={"width": 390, "height": 844})
    try:
        p = ctx.new_page()
        p.goto(URL)
        expect(p.locator(".slide.active")).to_be_visible()
        assert no_horizontal_scroll(p)
    finally:
        ctx.close()
