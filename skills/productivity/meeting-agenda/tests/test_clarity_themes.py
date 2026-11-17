"""Clarity and Clarity Dark: Apple's design principles (clarity, deference,
depth). Content on a quiet background, sentence-case labels, no texture or
glow, and the timer on a raised card like a widget."""
import pytest
from playwright.sync_api import expect

CLARITY = ["clarity", "clarity-dark"]


def use(page, theme):
    page.evaluate(f"document.documentElement.dataset.theme = '{theme}'")


def css(page, sel, prop, pseudo=None):
    p = f", '{pseudo}'" if pseudo else ""
    return page.evaluate(f"getComputedStyle(document.querySelector('{sel}'){p}).{prop}")


def test_clarity_pair_sits_after_signal_and_before_the_classics(deck):
    deck.locator("#btn-edit").click()
    deck.locator("#tab-theme").click()
    ids = [c.get_attribute("data-theme") for c in deck.locator(".theme-card").all()]
    assert ids[ids.index("signal") + 1: ids.index("indigo")] == CLARITY
    expect(deck.locator('.theme-card[data-theme="clarity"] .theme-name')).to_have_text("Clarity")
    expect(deck.locator('.theme-card[data-theme="clarity-dark"] .theme-name')).to_have_text("Clarity Dark")


@pytest.mark.parametrize("theme,bg,card", [
    ("clarity", "rgb(245, 245, 247)", "rgb(255, 255, 255)"),
    ("clarity-dark", "rgb(0, 0, 0)", "rgb(28, 28, 30)")])
def test_quiet_background_and_a_raised_timer_card(deck, theme, bg, card):
    use(deck, theme)
    assert css(deck, "body", "backgroundColor") == bg
    assert css(deck, "#timer-wrap", "backgroundColor") == card
    assert float(css(deck, "#timer-wrap", "borderTopLeftRadius").rstrip("px")) >= 24
    assert css(deck, "#timer-wrap", "boxShadow") != "none"


@pytest.mark.parametrize("theme", CLARITY)
def test_the_card_hugs_the_timer(deck, theme):
    use(deck, theme)
    card = deck.evaluate("document.getElementById('timer-wrap').getBoundingClientRect().height")
    stage = deck.evaluate("document.querySelector('main').getBoundingClientRect().height")
    assert card < 0.85 * stage, (card, stage)


@pytest.mark.parametrize("theme", CLARITY)
def test_labels_are_sentence_case(deck, theme):
    use(deck, theme)
    assert css(deck, "#meeting-title", "textTransform") == "none"
    assert css(deck, ".slide.active .eyebrow", "textTransform") == "none"


@pytest.mark.parametrize("theme", CLARITY)
def test_no_texture_or_glow(deck, theme):
    use(deck, theme)
    assert css(deck, "body", "display", "::after") == "none"
    assert css(deck, "#timer svg", "filter") == "none"
    assert css(deck, "body", "animationName", "::before") == "none"


@pytest.mark.parametrize("theme,blue", [("clarity", "rgb(0, 113, 227)"), ("clarity-dark", "rgb(10, 132, 255)")])
def test_pause_is_the_filled_primary_button(deck, theme, blue):
    use(deck, theme)
    assert css(deck, "#btn-pause", "backgroundColor") == blue
    assert css(deck, "#btn-pause", "color") == "rgb(255, 255, 255)"
    assert css(deck, "#btn-reset", "backgroundColor") != blue


@pytest.mark.parametrize("theme", CLARITY)
def test_rounded_timer_digits_where_available(deck, theme):
    use(deck, theme)
    assert "ui-rounded" in css(deck, "#timer-text", "fontFamily")
