"""Gear opens Settings with two tabs: Contents (the agenda editor) and Theme."""
import json
import re

import pytest
from playwright.sync_api import expect

from conftest import STORAGE_KEY, store_agenda

THEMES = ["aurora", "observatory", "abyss", "editorial", "signal", "clarity", "clarity-dark", "indigo", "midnight", "ocean", "daylight", "contrast"]
NAMES = ["Aurora", "Observatory", "Abyss", "Editorial", "Signal", "Clarity", "Clarity Dark", "Indigo", "Midnight", "Ocean", "Daylight", "High contrast"]


def open_settings(page):
    page.locator("#btn-edit").click()
    expect(page.locator("#editor")).to_be_visible()


def theme_tab(page):
    open_settings(page)
    page.locator("#tab-theme").click()
    expect(page.locator("#panel-theme")).to_be_visible()


def current_theme(page):
    return page.evaluate("document.documentElement.dataset.theme")


def test_settings_has_contents_then_theme_tabs(deck):
    open_settings(deck)
    expect(deck.locator("#settings-tabs [role=tab]")).to_have_text(["Contents", "Theme"])
    expect(deck.locator("#tab-contents")).to_have_attribute("aria-selected", "true")
    expect(deck.locator("#panel-contents")).to_be_visible()
    expect(deck.locator("#panel-theme")).to_be_hidden()
    expect(deck.locator("#ed-heading")).to_have_text("Settings")


def test_tabs_switch_by_click_and_arrow_keys(deck):
    open_settings(deck)
    deck.locator("#tab-theme").click()
    expect(deck.locator("#tab-theme")).to_have_attribute("aria-selected", "true")
    expect(deck.locator("#panel-contents")).to_be_hidden()
    deck.locator("#tab-theme").press("ArrowLeft")
    expect(deck.locator("#tab-contents")).to_have_attribute("aria-selected", "true")
    expect(deck.locator("#tab-contents")).to_be_focused()
    deck.locator("#tab-contents").press("ArrowRight")
    expect(deck.locator("#panel-theme")).to_be_visible()


def test_theme_tab_lists_the_themes_and_marks_the_current_one(deck):
    assert current_theme(deck) == "aurora"
    theme_tab(deck)
    cards = deck.locator("#panel-theme .theme-card")
    expect(cards).to_have_count(len(THEMES))
    expect(cards.locator(".theme-name")).to_have_text(NAMES)
    assert [c.get_attribute("data-theme") for c in cards.all()] == THEMES
    expect(cards.nth(0)).to_have_attribute("aria-checked", "true")
    for c in cards.all()[1:]:
        expect(c).to_have_attribute("aria-checked", "false")


def test_picking_a_theme_previews_live(deck):
    before = deck.evaluate("getComputedStyle(document.body).backgroundImage")
    theme_tab(deck)
    deck.locator('.theme-card[data-theme="ocean"]').click()
    assert current_theme(deck) == "ocean"
    expect(deck.locator('.theme-card[data-theme="ocean"]')).to_have_attribute("aria-checked", "true")
    assert deck.evaluate("getComputedStyle(document.body).backgroundImage") != before


def test_cancel_and_escape_revert_the_preview(deck):
    theme_tab(deck)
    deck.locator('.theme-card[data-theme="daylight"]').click()
    deck.locator("#ed-cancel").click()
    assert current_theme(deck) == "aurora"
    theme_tab(deck)
    deck.locator('.theme-card[data-theme="midnight"]').click()
    deck.keyboard.press("Escape")
    expect(deck.locator("#editor")).to_be_hidden()
    assert current_theme(deck) == "aurora"


def test_apply_keeps_the_theme_across_reloads(deck):
    theme_tab(deck)
    deck.locator('.theme-card[data-theme="contrast"]').click()
    deck.locator("#ed-apply").click()
    expect(deck.locator("#editor")).to_be_hidden()
    assert current_theme(deck) == "contrast"
    assert json.loads(deck.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))["theme"] == "contrast"
    deck.reload()
    assert current_theme(deck) == "contrast"


def test_apply_from_theme_tab_with_invalid_contents_shows_the_errors(deck):
    open_settings(deck)
    deck.locator("#editor .row").nth(0).locator(".f-title").fill("")
    deck.locator("#tab-theme").click()
    deck.locator("#ed-apply").click()
    expect(deck.locator("#editor")).to_be_visible()
    expect(deck.locator("#tab-contents")).to_have_attribute("aria-selected", "true")
    expect(deck.locator("#editor .row.invalid")).to_have_count(1)


def test_save_html_carries_the_theme(deck, browser, tmp_path):
    theme_tab(deck)
    deck.locator('.theme-card[data-theme="ocean"]').click()
    with deck.expect_download() as dl:
        deck.locator("#ed-save").click()
    out = tmp_path / "saved.html"
    dl.value.save_as(out)
    block = re.search(r'id="agenda-data">(.*?)</script>', out.read_text(), re.S).group(1)
    assert json.loads(block)["theme"] == "ocean"
    ctx = browser.new_context()
    try:
        p = ctx.new_page()
        p.goto(out.as_uri())
        assert p.evaluate("document.documentElement.dataset.theme") == "ocean"
    finally:
        ctx.close()


def test_reset_to_file_defaults_restores_the_default_theme(deck):
    theme_tab(deck)
    deck.locator('.theme-card[data-theme="midnight"]').click()
    deck.locator("#ed-apply").click()
    open_settings(deck)
    deck.once("dialog", lambda d: d.accept())
    deck.locator("#ed-reset").click()
    assert current_theme(deck) == "aurora"


def test_unknown_theme_falls_back_to_default(deck):
    deck.evaluate(f"""localStorage.setItem('{STORAGE_KEY}', JSON.stringify(
        {{title: 'x', theme: 'neon-nope', items: [{{minutes: 1, title: 'A', points: []}}]}}))""")
    deck.reload()
    expect(deck.locator(".slide")).to_have_count(1)
    assert current_theme(deck) == "aurora"


def _lum(rgb):
    def ch(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def _ratio(a, b):
    la, lb = sorted([_lum(a), _lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


def _rgb(css):
    return [int(float(v)) for v in re.findall(r"[\d.]+", css)[:3]]


@pytest.mark.parametrize("theme", THEMES)
def test_every_theme_keeps_text_readable(deck, theme):
    deck.evaluate(f"document.documentElement.dataset.theme = '{theme}'")
    bg = _rgb(deck.evaluate("getComputedStyle(document.body).backgroundColor"))
    title = _rgb(deck.evaluate("getComputedStyle(document.querySelector('.slide.active .title')).color"))
    muted = _rgb(deck.evaluate("getComputedStyle(document.getElementById('timer-sub')).color"))
    eyebrow = _rgb(deck.evaluate("getComputedStyle(document.querySelector('.slide.active .eyebrow')).color"))
    eb_bg = deck.evaluate("getComputedStyle(document.querySelector('.slide.active .eyebrow')).backgroundColor")
    eb_bg = _rgb(eb_bg) if eb_bg not in ("rgba(0, 0, 0, 0)", "transparent") and not eb_bg.startswith("rgba") else bg
    assert _ratio(title, bg) >= 7, (theme, title, bg)      # WCAG AAA for the main text
    assert _ratio(muted, bg) >= 4.5, (theme, muted, bg)    # AA for small text
    assert _ratio(eyebrow, eb_bg) >= 4.5, (theme, eyebrow, eb_bg)   # a solid label is read against itself


@pytest.mark.parametrize("theme", THEMES)
def test_warning_colours_stay_the_same_in_every_theme(deck, theme):
    from conftest import tick
    deck.evaluate(f"document.documentElement.dataset.theme = '{theme}'")
    tick(deck, 10 * 60 + 5)
    stroke = deck.evaluate("getComputedStyle(document.getElementById('ring-progress')).stroke")
    assert stroke.replace(" ", "") == "rgb(239,68,68)", (theme, stroke)


@pytest.mark.parametrize("preview", ["aurora", "editorial", "signal", "clarity", "clarity-dark", "indigo", "daylight", "contrast"])
def test_theme_cards_are_readable_whatever_theme_is_previewed(deck, preview):
    """Each card is a mini preview in its own theme, so its text must read
    against its own background, not the dialog's."""
    theme_tab(deck)
    deck.locator(f'.theme-card[data-theme="{preview}"]').click()
    cards = deck.evaluate("""[...document.querySelectorAll('.theme-card')].map(c => ({
        id: c.dataset.theme,
        bg: getComputedStyle(c).backgroundColor,
        name: getComputedStyle(c.querySelector('.theme-name')).color,
        desc: getComputedStyle(c.querySelector('.theme-desc')).color}))""")
    for c in cards:
        bg = _rgb(c["bg"])
        assert "rgba(0, 0, 0, 0)" != c["bg"], c
        assert _ratio(_rgb(c["name"]), bg) >= 7, c
        assert _ratio(_rgb(c["desc"]), bg) >= 4.5, c


def test_selected_card_is_marked_beyond_colour(deck):
    theme_tab(deck)
    mark = deck.evaluate("getComputedStyle(document.querySelector('.theme-card[aria-checked=\"true\"]'), '::after').content")
    assert "✓" in mark
    none = deck.evaluate("getComputedStyle(document.querySelector('.theme-card[aria-checked=\"false\"]'), '::after').content")
    assert none in ("none", "normal")
