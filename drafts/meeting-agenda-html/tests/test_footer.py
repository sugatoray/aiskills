"""Meeting totals text and the meeting progress bar."""
import re

from playwright.sync_api import expect

from conftest import tick, store_agenda


def test_meeting_text_sums_across_slides(deck):
    mt = deck.locator("#meeting-text")
    expect(mt).to_have_text("Meeting: 0:00 used / 30:00 planned")
    tick(deck, 65)
    deck.keyboard.press("ArrowRight")
    tick(deck, 30)
    expect(mt).to_have_text("Meeting: 1:35 used / 30:00 planned")


def test_progress_bar_has_tick_at_each_item_boundary(deck):
    ticks = deck.locator("#meeting-bar .tick")
    expect(ticks).to_have_count(4)
    lefts = [float(re.sub(r"[^0-9.]", "", t.get_attribute("style").split("left:")[1]))
             for t in ticks.all()]
    # boundaries at 10, 18, 23, 26 of 30 minutes
    assert [round(v, 1) for v in lefts] == [33.3, 60.0, 76.7, 86.7]


def test_progress_bar_fill_and_tooltip(deck):
    tick(deck, 9 * 60)  # 9 of 30 minutes = 30%
    bar = deck.locator("#meeting-bar")
    expect(bar).to_have_attribute("title", "30% used")
    width = deck.evaluate("document.querySelector('#meeting-bar .fill').style.width")
    assert width == "30%"


def test_progress_bar_amber_then_red(deck):
    store_agenda(deck, [{"minutes": 5, "title": "A", "points": []},
                        {"minutes": 5, "title": "B", "points": []}])
    bar = deck.locator("#meeting-bar")
    tick(deck, 7 * 60 + 59)                     # 7:59 of 10:00 is below 80%
    expect(deck.locator("#meeting-bar.warn")).to_have_count(0)
    tick(deck, 2)                               # 8:01 of 10:00 is past 80%
    expect(deck.locator("#meeting-bar.warn")).to_have_count(1)
    tick(deck, 2 * 60)                          # 10:01 of 10:00 is over
    expect(deck.locator("#meeting-bar.over")).to_have_count(1)
    expect(deck.locator("#meeting-bar.warn")).to_have_count(0)
    expect(bar).to_have_attribute("title", "100% used")
    tick(deck, 60)
    expect(bar).to_have_attribute("title", "110% used")
