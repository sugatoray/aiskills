"""Keyboard and dot navigation."""
from playwright.sync_api import expect


def active_num(page):
    return page.locator(".slide.active .num")


def test_next_keys(deck):
    for key, want in [("ArrowRight", "02"), ("Space", "03"), ("PageDown", "04")]:
        deck.keyboard.press(key)
        expect(active_num(deck)).to_have_text(want)


def test_previous_keys(deck):
    deck.keyboard.press("End")
    expect(active_num(deck)).to_have_text("05")
    for key, want in [("ArrowLeft", "04"), ("Shift+Space", "03"), ("PageUp", "02")]:
        deck.keyboard.press(key)
        expect(active_num(deck)).to_have_text(want)


def test_home_and_end(deck):
    deck.keyboard.press("End")
    expect(active_num(deck)).to_have_text("05")
    deck.keyboard.press("Home")
    expect(active_num(deck)).to_have_text("01")


def test_navigation_clamps_at_ends(deck):
    deck.keyboard.press("ArrowLeft")
    expect(active_num(deck)).to_have_text("01")
    deck.keyboard.press("End")
    deck.keyboard.press("ArrowRight")
    expect(active_num(deck)).to_have_text("05")


def test_progress_dots_are_clickable(deck):
    dots = deck.locator("#dots .dot")
    expect(dots).to_have_count(5)
    dots.nth(3).click()
    expect(active_num(deck)).to_have_text("04")
    expect(dots.nth(3)).to_have_attribute("aria-current", "step")


def test_space_after_clicking_a_button_navigates_once(deck):
    deck.locator("#btn-pause").click()
    deck.keyboard.press("Space")
    expect(active_num(deck)).to_have_text("02")


def test_keyboard_hints_in_footer(deck):
    hints = deck.locator("#hints")
    expect(hints).to_be_visible()
    for word in ["P", "R"]:
        expect(hints).to_contain_text(word)
