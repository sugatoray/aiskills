"""Settings → Contents has two views of one draft: Quick View (list) and Detailed View (split)."""
import json

import pytest
from playwright.sync_api import expect

from conftest import STORAGE_KEY, URL


def open_contents(page):
    page.locator("#btn-edit").click()
    expect(page.locator("#panel-contents")).to_be_visible()


def detailed(page):
    open_contents(page)
    page.locator("#vtab-detailed").click()
    expect(page.locator("#view-detailed")).to_be_visible()


def total(page):
    return page.locator("#ed-total")


# ---------- shared ----------

def test_contents_has_quick_and_detailed_view_tabs(deck):
    open_contents(deck)
    expect(deck.locator("#panel-contents [role=tab]")).to_have_text(["Quick View", "Detailed View"])
    expect(deck.locator("#vtab-quick")).to_have_attribute("aria-selected", "true")
    expect(deck.locator("#view-quick")).to_be_visible()
    expect(deck.locator("#view-detailed")).to_be_hidden()


def test_view_tabs_switch_with_arrow_keys(deck):
    open_contents(deck)
    deck.locator("#vtab-quick").focus()
    deck.keyboard.press("ArrowRight")
    expect(deck.locator("#vtab-detailed")).to_be_focused()
    expect(deck.locator("#view-detailed")).to_be_visible()
    deck.keyboard.press("ArrowLeft")
    expect(deck.locator("#view-quick")).to_be_visible()


def test_running_total_updates_live(deck):
    open_contents(deck)
    expect(total(deck)).to_have_text("5 items · 30 min planned")
    deck.locator("#editor .row").nth(0).locator(".f-min").fill("12.5")
    expect(total(deck)).to_have_text("5 items · 32.5 min planned")
    deck.locator("#ed-add").click()
    expect(total(deck)).to_have_text("6 items · 37.5 min planned")


def test_close_button_discards_like_cancel(deck):
    open_contents(deck)
    deck.locator("#editor .row").nth(0).locator(".f-title").fill("Changed")
    deck.locator("#ed-close").click()
    expect(deck.locator("#editor")).to_be_hidden()
    expect(deck.locator(".slide .title").nth(0)).to_have_text("Priorities for 2026 & 2027")
    expect(deck.locator("#ed-close")).to_have_attribute("aria-label", "Close settings")


@pytest.mark.parametrize("combo", ["Control+Enter", "Meta+Enter"])
def test_ctrl_or_cmd_enter_applies(deck, combo):
    open_contents(deck)
    deck.locator("#editor .row").nth(0).locator(".f-title").fill("Shortcut")
    deck.keyboard.press(combo)
    expect(deck.locator("#editor")).to_be_hidden()
    expect(deck.locator(".slide .title").nth(0)).to_have_text("Shortcut")


def test_ctrl_enter_with_errors_stays_open(deck):
    open_contents(deck)
    deck.locator("#editor .row").nth(0).locator(".f-title").fill("")
    deck.keyboard.press("Control+Enter")
    expect(deck.locator("#editor")).to_be_visible()
    expect(deck.locator("#ed-error")).to_have_text("1 item needs attention")


def test_footer_status_counts_items_needing_attention(deck):
    open_contents(deck)
    rows = deck.locator("#editor .row")
    rows.nth(1).locator(".f-title").fill("")
    rows.nth(2).locator(".f-min").fill("0")
    deck.locator("#ed-apply").click()
    expect(deck.locator("#ed-error")).to_have_text("2 items need attention")
    expect(rows.nth(1).locator(".row-err")).to_have_text("Add a title")
    expect(rows.nth(2).locator(".row-err")).to_have_text("Minutes must be more than 0")


def test_edits_survive_switching_views(deck):
    open_contents(deck)
    deck.locator("#editor .row").nth(1).locator(".f-title").fill("From quick")
    deck.locator("#vtab-detailed").click()
    deck.locator(".dv-item").nth(1).click()
    expect(deck.locator("#dv-title")).to_have_value("From quick")
    deck.locator("#dv-title").fill("From detailed")
    deck.locator("#vtab-quick").click()
    expect(deck.locator("#editor .row").nth(1).locator(".f-title")).to_have_value("From detailed")


def test_last_used_view_is_remembered(deck):
    detailed(deck)
    deck.locator("#ed-cancel").click()
    open_contents(deck)
    expect(deck.locator("#view-detailed")).to_be_visible()
    deck.reload()
    open_contents(deck)
    expect(deck.locator("#vtab-detailed")).to_have_attribute("aria-selected", "true")


# ---------- Quick View ----------

def test_quick_rows_have_no_repeated_visible_labels(deck):
    open_contents(deck)
    row = deck.locator("#editor .row").first
    expect(row.get_by_text("Minutes", exact=True)).to_have_count(0)
    expect(row.get_by_text("Title", exact=True)).to_have_count(0)
    expect(row.locator(".f-min")).to_have_attribute("aria-label", "Minutes for item 1")
    expect(row.locator(".f-title")).to_have_attribute("aria-label", "Title of item 1")
    expect(row.locator(".min-unit")).to_have_text("min")


def test_quick_row_actions_show_on_hover_or_focus_only(deck):
    open_contents(deck)
    deck.mouse.move(5, 5)
    rows = deck.locator("#editor .row")
    op = "el => getComputedStyle(el.querySelector('.row-btns')).opacity"
    assert rows.nth(2).evaluate(op) == "0"
    rows.nth(2).locator(".f-title").focus()
    assert rows.nth(2).evaluate(op) == "1"
    rows.nth(3).hover()
    assert rows.nth(3).evaluate(op) == "1"


def test_quick_sub_points_grow_with_content(deck):
    open_contents(deck)
    pts = deck.locator("#editor .row").nth(3).locator(".f-points")
    expect(pts).to_have_attribute("placeholder", "Add sub-points…")
    pts.fill("")                     # demo item 4 has two sub-points; start from one line
    h1 = pts.evaluate("el => el.getBoundingClientRect().height")
    pts.fill("a\nb\nc\nd")
    h2 = pts.evaluate("el => el.getBoundingClientRect().height")
    assert h2 > h1 * 2, (h1, h2)


# ---------- Detailed View ----------

def test_detailed_lists_items_and_shows_the_selected_one(deck):
    detailed(deck)
    items = deck.locator(".dv-item")
    expect(items).to_have_count(5)
    expect(items.nth(0)).to_contain_text("01")
    expect(items.nth(0)).to_contain_text("Priorities for 2026 & 2027")
    expect(items.nth(0)).to_contain_text("10m")
    expect(items.nth(0)).to_have_attribute("aria-current", "true")
    expect(deck.locator("#dv-title")).to_have_value("Priorities for 2026 & 2027")
    expect(deck.locator("#dv-min")).to_have_value("10")
    expect(deck.locator(".dv-point")).to_have_count(2)
    items.nth(2).click()
    expect(deck.locator("#dv-title")).to_have_value("Resourcing & budget")
    expect(items.nth(2)).to_have_attribute("aria-current", "true")


def test_detailed_title_edit_updates_the_list_and_applies(deck):
    detailed(deck)
    deck.locator("#dv-title").fill("Renamed")
    expect(deck.locator(".dv-item").nth(0)).to_contain_text("Renamed")
    deck.locator("#ed-apply").click()
    expect(deck.locator(".slide .title").nth(0)).to_have_text("Renamed")


def test_detailed_stepper_and_quick_picks(deck):
    detailed(deck)
    deck.locator("#dv-plus").click()
    expect(deck.locator("#dv-min")).to_have_value("11")
    deck.locator("#dv-minus").click()
    deck.locator("#dv-minus").click()
    expect(deck.locator("#dv-min")).to_have_value("9")
    deck.locator('.dv-pick[data-min="15"]').click()
    expect(deck.locator("#dv-min")).to_have_value("15")
    expect(deck.locator('.dv-pick[data-min="15"]')).to_have_attribute("aria-pressed", "true")
    expect(total(deck)).to_have_text("5 items · 35 min planned")
    expect(deck.locator(".dv-item").nth(0)).to_contain_text("15m")
    deck.locator("#dv-min").fill("1")
    deck.locator("#dv-minus").click()
    deck.locator("#dv-minus").click()
    expect(deck.locator("#dv-min")).to_have_value("0.5")   # never below 0.5


def test_detailed_sub_points_add_edit_remove(deck):
    detailed(deck)
    deck.locator("#dv-add-point").click()
    expect(deck.locator(".dv-point")).to_have_count(3)
    expect(deck.locator(".dv-point").nth(2)).to_be_focused()
    deck.keyboard.type("Third")
    deck.keyboard.press("Enter")
    expect(deck.locator(".dv-point")).to_have_count(4)
    expect(deck.locator(".dv-point").nth(3)).to_be_focused()
    deck.locator(".dv-point-remove").nth(0).click()
    expect(deck.locator(".dv-point")).to_have_count(3)
    deck.locator("#ed-apply").click()
    expect(deck.locator(".slide").nth(0).locator(".points li")).to_have_text(
        ["What are the priorities for 2027?", "Third"])


def test_detailed_add_move_delete_items(deck):
    detailed(deck)
    deck.locator("#dv-add").click()
    expect(deck.locator(".dv-item")).to_have_count(6)
    expect(deck.locator(".dv-item").nth(5)).to_have_attribute("aria-current", "true")
    expect(deck.locator("#dv-title")).to_be_focused()
    deck.keyboard.type("New one")
    deck.locator("#dv-up").click()
    expect(deck.locator(".dv-item").nth(4)).to_contain_text("New one")
    expect(deck.locator(".dv-item").nth(4)).to_have_attribute("aria-current", "true")
    deck.locator("#dv-delete").click()
    expect(deck.locator(".dv-item")).to_have_count(5)
    expect(total(deck)).to_have_text("5 items · 30 min planned")


def test_detailed_cannot_delete_the_last_item(deck):
    detailed(deck)
    for _ in range(4):
        deck.locator("#dv-delete").click()
    expect(deck.locator(".dv-item")).to_have_count(1)
    expect(deck.locator("#dv-delete")).to_be_disabled()


def test_detailed_validation_marks_list_and_detail(deck):
    detailed(deck)
    deck.locator("#dv-title").fill("")
    deck.locator("#ed-apply").click()
    expect(deck.locator("#editor")).to_be_visible()
    expect(deck.locator(".dv-item.invalid")).to_have_count(1)
    expect(deck.locator("#dv-err")).to_have_text("Add a title")
    expect(deck.locator("#ed-error")).to_have_text("1 item needs attention")
    deck.locator("#dv-title").fill("Fixed")
    expect(deck.locator(".dv-item.invalid")).to_have_count(0)


def test_detailed_view_saves_like_quick_view(deck):
    detailed(deck)
    deck.locator(".dv-item").nth(3).click()
    deck.locator("#dv-title").fill("Risks")
    deck.locator("#ed-apply").click()
    stored = json.loads(deck.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))
    assert stored["items"][3]["title"] == "Risks"


# ---------- phone ----------

@pytest.fixture
def phone(browser):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    p = ctx.new_page()
    p.clock.install()
    p.goto(URL)
    yield p
    ctx.close()


def test_phone_settings_is_a_bottom_sheet_with_big_buttons(phone):
    phone.locator("#btn-edit").tap()
    box = phone.locator(".ed-panel").bounding_box()
    assert abs(box["y"] + box["height"] - 844) <= 1, box
    assert box["width"] >= 389
    for b in ("#ed-cancel", "#ed-apply"):
        assert phone.locator(b).bounding_box()["height"] >= 44


def test_phone_detailed_view_stacks_list_above_detail(phone):
    phone.locator("#btn-edit").tap()
    phone.locator("#vtab-detailed").tap()
    lst = phone.locator("#dv-list").bounding_box()
    det = phone.locator("#dv-detail").bounding_box()
    assert lst["y"] + lst["height"] <= det["y"] + 1, (lst, det)
    assert phone.evaluate("document.documentElement.scrollWidth <= window.innerWidth")


# ---------- polish ----------

def test_detailed_list_items_span_the_list(deck):
    detailed(deck)
    widths = deck.evaluate("""() => {
        const list = document.getElementById('dv-items').getBoundingClientRect().width;
        return [...document.querySelectorAll('.dv-item')].map(b => b.getBoundingClientRect().width / list);
    }""")
    assert all(w > 0.97 for w in widths), widths


def test_minutes_chip_is_compact(deck):
    open_contents(deck)
    w = deck.locator("#editor .row").first.locator(".min-wrap").bounding_box()["width"]
    assert w <= 76, w


def test_shortcut_hint_hidden_on_touch_screens(phone, deck):
    phone.locator("#btn-edit").tap()
    expect(phone.locator("#apply-kbd")).to_be_hidden()
    open_contents(deck)
    expect(deck.locator("#apply-kbd")).to_be_visible()


def test_no_tap_highlight_on_settings_buttons(phone):
    phone.locator("#btn-edit").tap()
    hl = phone.evaluate("getComputedStyle(document.getElementById('vtab-detailed')).webkitTapHighlightColor")
    assert hl.replace(" ", "") in ("rgba(0,0,0,0)", "transparent"), hl
