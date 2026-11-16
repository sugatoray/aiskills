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


def seg_fill(page, i):
    """Width (as a % of its own segment) of item i's fill in the meeting bar,
    rounded to a whole percent: the bar repaints every 250 ms, so a reading can
    lag the clock by up to a quarter second (49.99% instead of 50%)."""
    w = page.evaluate(
        "i => document.querySelectorAll('#meeting-bar .seg')[i].querySelector('.seg-fill').style.width", i)
    assert w.endswith("%"), w
    return f"{round(float(w[:-1]))}%"


def test_progress_bar_tooltip_shows_percentage_used(deck):
    tick(deck, 9 * 60)  # 9 of 30 minutes = 30%
    expect(deck.locator("#meeting-bar")).to_have_attribute("title", "30% used")


def test_progress_bar_has_one_segment_per_item_sized_by_plan(deck):
    segs = deck.locator("#meeting-bar .seg")
    expect(segs).to_have_count(5)
    geo = deck.evaluate("""[...document.querySelectorAll('#meeting-bar .seg')]
        .map(s => [parseFloat(s.style.left), parseFloat(s.style.width)])""")
    assert [[round(l, 1), round(w, 1)] for l, w in geo] == [
        [0.0, 33.3], [33.3, 26.7], [60.0, 16.7], [76.7, 10.0], [86.7, 13.3]]


def test_time_on_each_section_fills_that_sections_segment(deck):
    tick(deck, 2 * 60)                     # 2 of 10 min on item 1
    deck.keyboard.press("ArrowRight")
    deck.keyboard.press("ArrowRight")      # skip item 2
    tick(deck, 60)                         # 1 of 5 min on item 3
    assert seg_fill(deck, 0) == "20%"
    assert seg_fill(deck, 1) == "0%"
    assert seg_fill(deck, 2) == "20%"
    deck.keyboard.press("End")
    tick(deck, 2 * 60)                     # 2 of 4 min on item 5
    assert seg_fill(deck, 4) == "50%"
    assert seg_fill(deck, 2) == "20%", "leaving a section freezes its segment"


def test_returning_to_a_section_keeps_adding_to_its_segment(deck):
    tick(deck, 60)                         # 1 min on item 1
    deck.keyboard.press("ArrowRight")
    tick(deck, 4 * 60)                     # 4 of 8 min on item 2
    deck.keyboard.press("ArrowLeft")
    tick(deck, 60)                         # back on item 1: now 2 of 10 min
    assert seg_fill(deck, 0) == "20%"
    assert seg_fill(deck, 1) == "50%"
    expect(deck.locator("#meeting-text")).to_have_text("Meeting: 6:00 used / 30:00 planned")


def test_current_section_segment_is_marked(deck):
    expect(deck.locator("#meeting-bar .seg.current")).to_have_count(1)
    deck.keyboard.press("ArrowRight")
    cur = deck.evaluate("[...document.querySelectorAll('#meeting-bar .seg')].findIndex(s => s.classList.contains('current'))")
    assert cur == 1


def test_section_overtime_caps_its_segment_and_marks_it_over(deck):
    deck.keyboard.press("ArrowRight")      # item 2: 8 min
    tick(deck, 9 * 60)
    assert seg_fill(deck, 1) == "100%"
    expect(deck.locator("#meeting-bar .seg.over")).to_have_count(1)
    assert seg_fill(deck, 2) == "0%", "overtime does not spill into the next segment"


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
