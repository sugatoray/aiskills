"""Five art-directed themes (Aurora, Observatory, Abyss, Editorial, Signal) sit
in front of the five classic ones. Aurora is the default. Each new theme has its
own type, texture, numeral and dial; the classic themes keep their look."""
import pytest
from playwright.sync_api import expect

from conftest import URL, tick

NEW = ["aurora", "observatory", "abyss", "editorial", "signal"]
CLASSIC = ["indigo", "midnight", "ocean", "daylight", "contrast"]


def use(page, theme):
    page.evaluate(f"document.documentElement.dataset.theme = '{theme}'")


def css(page, sel, prop, pseudo=None):
    p = f", '{pseudo}'" if pseudo else ""
    return page.evaluate(f"getComputedStyle(document.querySelector('{sel}'){p}).{prop}")


def test_aurora_is_the_default(deck):
    assert deck.evaluate("document.documentElement.dataset.theme") == "aurora"


def test_new_themes_come_first_then_the_classics(deck):
    deck.locator("#btn-edit").click()
    deck.locator("#tab-theme").click()
    ids = [c.get_attribute("data-theme") for c in deck.locator(".theme-card").all()]
    assert ids == NEW + CLASSIC
    expect(deck.locator(".theme-card .theme-name")).to_have_text(
        ["Aurora", "Observatory", "Abyss", "Editorial", "Signal",
         "Indigo", "Midnight", "Ocean", "Daylight", "High contrast"])
    expect(deck.locator('.theme-card[data-theme="aurora"] .theme-desc')).to_contain_text("The default")
    expect(deck.locator('.theme-card[data-theme="indigo"] .theme-desc')).not_to_contain_text("The default")


def test_cards_are_drawn_from_their_own_theme(deck):
    """No hard-coded swatch colours: each card's preview uses its theme's tokens."""
    deck.locator("#btn-edit").click()
    deck.locator("#tab-theme").click()
    cards = deck.evaluate("""[...document.querySelectorAll('.theme-card')].map(c => {
        const cs = getComputedStyle(c), sw = c.querySelector('.theme-swatch');
        return {id: c.dataset.theme,
                inline: [sw, ...sw.children].some(e => e.getAttribute('style')),
                num: getComputedStyle(sw.querySelector('s')).color,
                want: cs.getPropertyValue('--num-1').trim()};
    })""")
    for c in cards:
        assert not c["inline"], c
    probe = deck.evaluate("""(() => { const d = document.createElement('i'); document.body.appendChild(d);
        const out = {}; for (const c of document.querySelectorAll('.theme-card')) {
          d.style.color = getComputedStyle(c).getPropertyValue('--num-1'); out[c.dataset.theme] = getComputedStyle(d).color; }
        d.remove(); return out; })()""")
    for c in cards:
        if c["id"] != "observatory":            # Observatory's numeral is an outline
            assert c["num"] == probe[c["id"]], c


@pytest.mark.parametrize("theme,font", [
    ("aurora", "Inter Display"), ("abyss", "Inter Display"), ("signal", "Inter Display"),
    ("editorial", "Charter"), ("observatory", "Inter Display")])
def test_each_new_theme_sets_its_own_title_type(deck, theme, font):
    use(deck, theme)
    assert font in css(deck, ".slide.active .title", "fontFamily")


def test_observatory_uses_a_mono_timer_and_an_outlined_numeral(deck):
    use(deck, "observatory")
    assert "mono" in css(deck, "#timer-text", "fontFamily").lower()
    assert float(css(deck, ".slide.active .num", "webkitTextStrokeWidth").rstrip("px")) > 0


def test_editorial_numeral_is_italic(deck):
    use(deck, "editorial")
    assert css(deck, ".slide.active .num", "fontStyle") == "italic"


@pytest.mark.parametrize("theme", ["observatory", "editorial"])
def test_dial_ticks_only_where_the_theme_asks(deck, theme):
    use(deck, theme)
    assert "conic-gradient" in css(deck, "#timer", "backgroundImage", "::before")
    use(deck, "aurora")
    assert css(deck, "#timer", "content", "::before") in ("none", "normal")


def test_aurora_and_abyss_drift_and_respect_reduced_motion(deck):
    assert css(deck, "body", "animationName", "::before") == "aurora"
    use(deck, "abyss")
    assert css(deck, "body", "animationName", "::before") == "shafts"
    deck.emulate_media(reduced_motion="reduce")
    assert css(deck, "body", "animationName", "::before") == "none"


def test_signal_has_no_texture_glow_or_blur(deck):
    use(deck, "signal")
    assert css(deck, "body", "display", "::after") == "none"
    assert css(deck, "#timer svg", "filter") == "none"
    assert css(deck, "footer", "backdropFilter") == "none"
    assert css(deck, ".slide.active .eyebrow", "backgroundColor") == "rgb(255, 214, 10)"


@pytest.mark.parametrize("theme", CLASSIC)
def test_classic_themes_keep_their_look(deck, theme):
    use(deck, theme)
    assert css(deck, ".slide.active .num", "fontWeight") == "900"
    assert css(deck, "#ring-progress", "strokeWidth") == "14px"
    assert css(deck, "footer", "backgroundColor") in ("rgba(0, 0, 0, 0)", "transparent")
    assert css(deck, "body", "content", "::after") in ("none", "normal")
    assert css(deck, "#timer", "content", "::before") in ("none", "normal")


@pytest.mark.parametrize("theme", NEW)
def test_new_themes_fit_on_a_phone(browser, theme):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page = ctx.new_page()
    page.goto(URL)
    use(page, theme)
    page.evaluate("document.getAnimations().forEach(a => a.finish ? (a.effect.getComputedTiming().iterations === Infinity ? a.pause() : a.finish()) : 0)")
    over = page.evaluate("""() => { const s = document.querySelector('.slide.active');
        return [...s.children].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => e.className); }""")
    assert over == [], (theme, over)
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    num_h = page.evaluate("document.querySelector('.slide.active .num').getBoundingClientRect().height")
    assert num_h < 0.15 * 844, (theme, num_h)
    ctx.close()
