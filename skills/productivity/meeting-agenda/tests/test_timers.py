"""Ring countdown timers."""
from playwright.sync_api import expect

from conftest import tick, store_agenda


def text(page):
    return page.locator("#timer-text")


def offset(page):
    return float(page.locator("#ring-progress").get_attribute("stroke-dashoffset"))


def test_starts_at_item_minutes_and_counts_down(deck):
    expect(text(deck)).to_have_text("10:00")
    before = offset(deck)
    tick(deck, 61)
    expect(text(deck)).to_have_text("8:59")
    assert offset(deck) != before, "ring moves as time passes"


def test_each_slide_uses_its_own_minutes(deck):
    deck.keyboard.press("ArrowRight")
    expect(text(deck)).to_have_text("8:00")
    deck.keyboard.press("End")
    expect(text(deck)).to_have_text("4:00")


def test_half_minute_items(deck):
    store_agenda(deck, [{"minutes": 1.5, "title": "Short", "points": []}])
    expect(text(deck)).to_have_text("1:30")


def test_leaving_a_slide_pauses_it_and_returning_resumes(deck):
    tick(deck, 30)
    expect(text(deck)).to_have_text("9:30")
    deck.keyboard.press("ArrowRight")
    tick(deck, 20)
    expect(text(deck)).to_have_text("7:40")
    deck.keyboard.press("ArrowLeft")
    expect(text(deck)).to_have_text("9:30")
    tick(deck, 10)
    expect(text(deck)).to_have_text("9:20")


def test_p_pauses_and_resumes(deck):
    tick(deck, 5)
    deck.keyboard.press("p")
    expect(deck.locator("#timer.paused")).to_have_count(1)
    tick(deck, 30)
    expect(text(deck)).to_have_text("9:55")
    deck.keyboard.press("Shift+P")
    expect(deck.locator("#timer.paused")).to_have_count(0)
    tick(deck, 5)
    expect(text(deck)).to_have_text("9:50")


def test_space_pauses_and_resumes_like_a_video_player(deck):
    tick(deck, 5)
    deck.keyboard.press("Space")
    expect(deck.locator("#timer.paused")).to_have_count(1)
    tick(deck, 30)
    expect(text(deck)).to_have_text("9:55")
    deck.keyboard.press("Space")
    expect(deck.locator("#timer.paused")).to_have_count(0)
    tick(deck, 5)
    expect(text(deck)).to_have_text("9:50")


def test_hints_show_space_for_pause(deck):
    hint = deck.locator(".hint-keys").inner_text()
    assert "Space navigate" not in hint, hint
    assert hint.index("Space") < hint.index("pause/resume"), hint
    assert "navigate" in hint


def test_r_resets(deck):
    tick(deck, 40)
    deck.keyboard.press("r")
    expect(text(deck)).to_have_text("10:00")
    tick(deck, 3)
    deck.keyboard.press("Shift+R")
    expect(text(deck)).to_have_text("10:00")


def test_on_screen_buttons(deck):
    tick(deck, 5)
    deck.locator("#btn-pause").click()
    expect(deck.locator("#btn-pause")).to_have_text("Resume")
    tick(deck, 10)
    expect(text(deck)).to_have_text("9:55")
    deck.locator("#btn-pause").click()
    expect(deck.locator("#btn-pause")).to_have_text("Pause")
    deck.locator("#btn-reset").click()
    expect(text(deck)).to_have_text("10:00")


def test_amber_in_last_20_percent(deck):
    timer = deck.locator("#timer")
    tick(deck, 7 * 60 + 59)          # 2:01 left of 10:00 -> still normal
    expect(deck.locator("#timer.warn")).to_have_count(0)
    tick(deck, 2)                    # 1:59 left -> amber
    expect(deck.locator("#timer.warn")).to_have_count(1)
    color = deck.evaluate("getComputedStyle(document.getElementById('ring-progress')).stroke")
    assert color.replace(" ", "") in ("rgb(245,158,11)", "rgb(251,191,36)"), color
    assert timer.is_visible()


def test_past_zero_turns_red_pulses_and_counts_up(deck):
    tick(deck, 10 * 60 + 5)
    expect(deck.locator("#timer.over")).to_have_count(1)
    expect(deck.locator("#timer.warn")).to_have_count(0)
    expect(text(deck)).to_have_text("+0:05")
    anim = deck.evaluate("getComputedStyle(document.getElementById('timer')).animationName")
    assert anim != "none"
    tick(deck, 60)
    expect(text(deck)).to_have_text("+1:05")
