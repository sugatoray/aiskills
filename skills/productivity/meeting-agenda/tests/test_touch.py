"""Phones and tablets: swipe, tap zones, long-press, and on-screen prev/next."""
import pytest
from playwright.sync_api import expect

from conftest import URL, tick


@pytest.fixture
def phone(browser):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    p = ctx.new_page()
    p.clock.install()
    p.goto(URL)
    yield p
    ctx.close()


def active(page):
    return page.locator(".slide.active .num")


def gesture(page, x0, y0, x1, y1, hold_ms=0, kind="touch"):
    """Synthesize a pointer gesture (down, optional hold, a few moves, up)."""
    page.evaluate("""([x0, y0, kind]) => {
        const t = document.elementFromPoint(x0, y0);
        t.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, cancelable: true,
            pointerId: 7, pointerType: kind, isPrimary: true, clientX: x0, clientY: y0}));
    }""", [x0, y0, kind])
    if hold_ms:
        page.clock.run_for(hold_ms)
    page.evaluate("""([x0, y0, x1, y1, kind]) => {
        const t = document.elementFromPoint(x0, y0);
        for (let i = 1; i <= 4; i++) {
            const x = x0 + (x1 - x0) * i / 4, y = y0 + (y1 - y0) * i / 4;
            t.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, pointerId: 7,
                pointerType: kind, isPrimary: true, clientX: x, clientY: y}));
        }
        t.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, pointerId: 7,
            pointerType: kind, isPrimary: true, clientX: x1, clientY: y1}));
    }""", [x0, y0, x1, y1, kind])


def slide_point(page, fx, fy=0.4):
    """A point on the active slide's text area, fx/fy as fractions of the viewport."""
    vp = page.viewport_size
    return vp["width"] * fx, vp["height"] * fy


def test_swipe_left_goes_forward_and_right_goes_back(phone):
    x, y = slide_point(phone, 0.7)
    gesture(phone, x, y, x - 120, y + 10)
    expect(active(phone)).to_have_text("02")
    gesture(phone, x - 120, y, x, y)
    expect(active(phone)).to_have_text("01")


def test_short_or_vertical_swipes_do_nothing(phone):
    x, y = slide_point(phone, 0.6)
    gesture(phone, x, y, x - 30, y)            # under the 50 px threshold
    gesture(phone, x, y, x - 70, y + 140)      # mostly vertical: a scroll, not a swipe
    expect(active(phone)).to_have_text("01")


def test_tap_right_side_forward_left_side_back(phone):
    x, y = slide_point(phone, 0.8)
    phone.touchscreen.tap(x, y)
    expect(active(phone)).to_have_text("02")
    phone.touchscreen.tap(*slide_point(phone, 0.6))
    expect(active(phone)).to_have_text("03")
    phone.touchscreen.tap(*slide_point(phone, 0.1))      # left 30%
    expect(active(phone)).to_have_text("02")


def test_long_press_toggles_pause_without_navigating(phone):
    x, y = slide_point(phone, 0.8)
    gesture(phone, x, y, x, y, hold_ms=600)
    expect(phone.locator("#timer.paused")).to_have_count(1)
    expect(phone.locator("#toast")).to_have_text("Paused")
    expect(active(phone)).to_have_text("01")
    gesture(phone, x, y, x, y, hold_ms=600)
    expect(phone.locator("#timer.paused")).to_have_count(0)
    expect(phone.locator("#toast")).to_have_text("Resumed")
    expect(active(phone)).to_have_text("01")


def test_tapping_controls_does_not_navigate(phone):
    box = phone.locator("#btn-pause").bounding_box()
    phone.touchscreen.tap(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    expect(phone.locator("#timer.paused")).to_have_count(1)
    expect(active(phone)).to_have_text("01")


def test_prev_next_buttons_on_touch_screens(phone):
    nxt, prv = phone.locator("#btn-next"), phone.locator("#btn-prev")
    expect(nxt).to_be_visible()
    expect(prv).to_be_visible()
    for b in (nxt, prv, phone.locator("#btn-pause"), phone.locator("#btn-reset")):
        assert b.bounding_box()["height"] >= 44
    nxt.tap()
    nxt.tap()
    expect(active(phone)).to_have_text("03")
    prv.tap()
    expect(active(phone)).to_have_text("02")


def test_prev_next_buttons_hidden_on_desktop(deck):
    expect(deck.locator("#btn-next")).to_be_hidden()
    expect(deck.locator("#btn-prev")).to_be_hidden()


def test_hints_match_the_device(phone, deck):
    expect(phone.locator(".hint-touch")).to_be_visible()
    expect(phone.locator(".hint-touch")).to_contain_text("Swipe or tap")
    expect(phone.locator(".hint-touch")).to_contain_text("Hold to pause")
    expect(phone.locator(".hint-keys")).to_be_hidden()
    expect(deck.locator(".hint-keys")).to_be_visible()
    expect(deck.locator(".hint-touch")).to_be_hidden()


def test_gestures_ignored_while_editing(phone):
    phone.locator("#btn-edit").tap()
    expect(phone.locator("#editor")).to_be_visible()
    gesture(phone, 300, 400, 150, 400)
    phone.locator("#ed-cancel").tap()
    expect(active(phone)).to_have_text("01")


def test_mouse_clicks_on_the_slide_do_not_navigate(deck):
    deck.mouse.click(700, 300)
    gesture(deck, 700, 300, 500, 300, kind="mouse")
    expect(deck.locator(".slide.active .num")).to_have_text("01")


def test_timer_keeps_running_through_gestures(phone):
    x, y = slide_point(phone, 0.7)
    tick(phone, 30)
    gesture(phone, x, y, x - 120, y)
    gesture(phone, x - 120, y, x, y)
    expect(phone.locator("#timer-text")).to_have_text("9:30")


def test_phone_slide_content_fits_without_clipping(phone):
    for _ in range(5):
        fit = phone.evaluate("""() => {
            const s = document.querySelector('.slide.active');
            const r = s.getBoundingClientRect();
            const kids = [...s.children].map(k => k.getBoundingClientRect());
            return {top: Math.min(...kids.map(k => k.top)) >= r.top - 1,
                    bottom: Math.max(...kids.map(k => k.bottom)) <= r.bottom + 1,
                    scroll: s.scrollHeight <= s.clientHeight + 1};
        }""")
        assert fit == {"top": True, "bottom": True, "scroll": True}, (phone.locator(".slide.active .num").text_content(), fit)
        phone.locator("#btn-next").tap()


def test_phone_timer_caption_stays_inside_the_ring(phone):
    inside = phone.evaluate("""() => {
        const ring = document.getElementById('timer').getBoundingClientRect();
        const cap = document.getElementById('timer-sub').getBoundingClientRect();
        const r = ring.width / 2 - 14, cx = ring.left + ring.width / 2, cy = ring.top + ring.height / 2;
        const corners = [[cap.left, cap.top], [cap.right, cap.top], [cap.left, cap.bottom], [cap.right, cap.bottom]];
        return corners.every(([x, y]) => Math.hypot(x - cx, y - cy) <= r);
    }""")
    assert inside
