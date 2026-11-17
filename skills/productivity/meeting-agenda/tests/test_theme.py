"""The classic Indigo theme, matching the reference screenshot (indigo/violet with cyan
accents). Aurora is now the default, so these tests switch to Indigo first."""
import pytest
from playwright.sync_api import expect

from conftest import tick, store_agenda


@pytest.fixture
def deck(deck):
    deck.evaluate("document.documentElement.dataset.theme = 'indigo'")
    return deck


def test_indigo_violet_background(deck):
    bg = deck.evaluate("getComputedStyle(document.body).backgroundImage")
    assert "radial-gradient" in bg and "linear-gradient" in bg
    assert "rgb(42, 35, 134)" in bg, bg   # indigo base, brighter than the old navy


def test_eyebrow_names_position_and_length(deck):
    expect(deck.locator(".slide .eyebrow")).to_have_text([
        "Agenda item 1 of 5 · 10 min", "Agenda item 2 of 5 · 8 min", "Agenda item 3 of 5 · 5 min",
        "Agenda item 4 of 5 · 3 min", "Agenda item 5 of 5 · 4 min"])
    tt = deck.evaluate("getComputedStyle(document.querySelector('.slide.active .eyebrow')).textTransform")
    assert tt == "uppercase"


def test_eyebrow_half_minutes(deck):
    store_agenda(deck, [{"minutes": 7.5, "title": "A", "points": []}])
    expect(deck.locator(".slide .eyebrow")).to_have_text("Agenda item 1 of 1 · 7.5 min")


def test_timer_caption_shows_allotted_time(deck):
    expect(deck.locator("#timer-sub")).to_have_text("of 10:00 allotted")
    deck.keyboard.press("p")
    expect(deck.locator("#timer-sub")).to_have_text("paused · of 10:00 allotted")
    deck.keyboard.press("p")
    tick(deck, 10 * 60 + 3)
    expect(deck.locator("#timer-sub")).to_have_text("over 10:00 allotted")


def test_ring_uses_violet_to_cyan_gradient(deck):
    stroke = deck.evaluate("getComputedStyle(document.getElementById('ring-progress')).stroke")
    assert "url(" in stroke and "ring-grad" in stroke, stroke
    stops = deck.evaluate("[...document.querySelectorAll('#ring-grad stop')].map(s => s.getAttribute('stop-color'))")
    assert stops == ["#22d3ee", "#6d4cff"]


def test_buttons_are_pills_with_icons(deck):
    for sel in ["#btn-pause", "#btn-reset"]:
        radius = deck.evaluate(f"parseFloat(getComputedStyle(document.querySelector('{sel}')).borderTopLeftRadius)")
        assert radius >= 14, (sel, radius)
        icon = deck.evaluate(f"getComputedStyle(document.querySelector('{sel}'), '::before').content")
        assert icon not in ("none", "normal", '""'), (sel, icon)
    expect(deck.locator("#btn-pause")).to_have_text("Pause")


def test_progress_dots_are_dashes_that_fill_per_item(deck):
    dot = deck.locator("#dots .dot").first
    box = dot.bounding_box()
    assert box["width"] >= 2 * box["height"], box
    tick(deck, 5 * 60)                       # half of item 1
    deck.keyboard.press("End")
    tick(deck, 60)                           # a quarter of item 5
    fills = deck.evaluate("[...document.querySelectorAll('#dots .dot-fill')].map(f => Math.round(parseFloat(f.style.width)))")
    assert fills == [50, 0, 0, 0, 25]


def test_meeting_bar_comes_before_the_text(deck):
    before = deck.evaluate("""document.getElementById('meeting-bar')
        .compareDocumentPosition(document.getElementById('meeting-text')) & Node.DOCUMENT_POSITION_FOLLOWING""")
    assert before
    fill = deck.evaluate("getComputedStyle(document.querySelector('#meeting-bar .seg-fill')).backgroundImage")
    assert "linear-gradient" in fill


def test_hints_read_like_the_reference(deck):
    expect(deck.locator("#hints")).to_contain_text("navigate")
    expect(deck.locator("#hints")).to_contain_text("pause/resume")
    expect(deck.locator("#hints")).to_contain_text("reset timer")


def test_plain_footer_and_gear(deck):
    footer_bg = deck.evaluate("getComputedStyle(document.querySelector('footer')).backgroundColor")
    assert footer_bg in ("rgba(0, 0, 0, 0)", "transparent")
    gear_bg = deck.evaluate("getComputedStyle(document.getElementById('btn-edit')).backgroundColor")
    assert gear_bg in ("rgba(0, 0, 0, 0)", "transparent")
