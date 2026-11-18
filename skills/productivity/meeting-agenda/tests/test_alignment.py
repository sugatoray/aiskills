"""The "Agenda item N of M" line sits at the same height on every slide."""
import pytest
from playwright.sync_api import expect

from conftest import URL, store_agenda

SETTLE = """document.getAnimations().forEach(a => {
  const t = a.effect && a.effect.getComputedTiming();
  if (t && t.iterations === Infinity) a.pause(); else a.finish();
})"""

MIXED = [
    {"minutes": 5, "title": "Short", "points": []},
    {"minutes": 5, "title": "A much longer title that will wrap onto a second line on most screens, surely",
     "points": ["One"]},
    {"minutes": 5, "title": "Many points", "points": [f"Point number {i}" for i in range(6)]},
    {"minutes": 5, "title": "Two", "points": ["a", "b"]},
]


def geometry(page):
    page.evaluate(SETTLE)
    return page.evaluate("""() => {
        const s = document.querySelector('.slide.active');
        const r = el => el ? el.getBoundingClientRect() : null;
        const e = r(s.querySelector('.eyebrow')), n = r(s.querySelector('.num')),
              t = r(s.querySelector('.title')), p = r(s.querySelector('.points'));
        return {eyebrow: e.top, num: n.top - e.top, title: t.top - n.top,
                points: p ? p.top - t.bottom : null};
    }""")


def walk(page, n):
    out = []
    for i in range(n):
        out.append(geometry(page))
        page.keyboard.press("ArrowRight") if i < n - 1 else None
    return out


def assert_same_line(geos):
    tops = [g["eyebrow"] for g in geos]
    assert max(tops) - min(tops) <= 0.5, tops


def test_demo_deck_eyebrow_does_not_move(deck):
    assert_same_line(walk(deck, 5))


def test_mixed_content_eyebrow_does_not_move(deck):
    store_agenda(deck, MIXED)
    assert_same_line(walk(deck, len(MIXED)))


def test_spacing_below_the_eyebrow_is_unchanged(deck):
    store_agenda(deck, MIXED)
    geos = walk(deck, len(MIXED))
    assert len({round(g["num"], 1) for g in geos}) == 1, geos        # eyebrow → number
    assert len({round(g["title"], 1) for g in geos}) == 1, geos      # number → title
    gaps = {round(g["points"], 1) for g in geos if g["points"] is not None}
    assert len(gaps) == 1, geos                                      # title → sub-points


def test_the_tallest_slide_is_still_centred(deck):
    store_agenda(deck, MIXED)
    deck.keyboard.press("End")
    deck.keyboard.press("ArrowLeft")     # "Many points", the tallest
    deck.evaluate(SETTLE)
    space = deck.evaluate("""() => {
        const d = document.getElementById('deck').getBoundingClientRect();
        const s = document.querySelector('.slide.active').getBoundingClientRect();
        return [s.top - d.top, d.bottom - s.bottom];
    }""")
    assert abs(space[0] - space[1]) <= 2, space


def test_switching_slides_does_not_slide_content_vertically(deck):
    deck.evaluate(SETTLE)
    settled = deck.evaluate("document.querySelector('.slide.active .eyebrow').getBoundingClientRect().top")
    deck.keyboard.press("ArrowRight")
    # freeze the entrance animation at its first frame
    deck.evaluate("document.getAnimations().forEach(a => { a.pause(); a.currentTime = 0; })")
    first = deck.evaluate("document.querySelector('.slide.active .eyebrow').getBoundingClientRect().top")
    assert abs(first - settled) <= 0.5, (settled, first)


def test_only_the_active_slide_is_visible(deck):
    expect(deck.locator(".slide").nth(1)).to_be_hidden()
    expect(deck.locator(".slide.active")).to_be_visible()
    deck.keyboard.press("ArrowRight")
    expect(deck.locator(".slide").nth(0)).to_be_hidden()


@pytest.fixture
def phone(browser):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    p = ctx.new_page()
    p.clock.install()
    p.goto(URL)
    yield p
    ctx.close()


def test_phone_eyebrow_does_not_move(phone):
    assert_same_line(walk(phone, 5))
