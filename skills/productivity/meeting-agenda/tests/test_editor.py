"""Gear-button editor: rows, buttons, validation, apply, storage, save HTML."""
import json
import re

from playwright.sync_api import expect

from conftest import STORAGE_KEY, tick


def open_editor(page):
    page.locator("#btn-edit").click()
    expect(page.locator("#editor")).to_be_visible()
    return page.locator("#editor .row")


def test_gear_opens_editor_with_one_row_per_item(deck):
    rows = open_editor(deck)
    expect(rows).to_have_count(5)
    first = rows.nth(0)
    expect(first.locator(".f-min")).to_have_value("10")
    expect(first.locator(".f-min")).to_have_attribute("step", "0.5")
    expect(first.locator(".f-title")).to_have_value("Priorities for 2026 & 2027")
    expect(first.locator(".f-points")).to_have_value(
        "What are the priorities for 2026?\nWhat are the priorities for 2027?")
    for cls in [".btn-up", ".btn-down", ".btn-remove"]:
        expect(first.locator(cls)).to_have_count(1)


def test_editor_pauses_timer_and_blocks_slide_keys(deck):
    tick(deck, 10)
    open_editor(deck)
    tick(deck, 30)
    deck.keyboard.press("ArrowRight")
    deck.keyboard.press("End")
    deck.keyboard.press("r")
    deck.locator("#ed-cancel").click()
    expect(deck.locator("#editor")).to_be_hidden()
    expect(deck.locator(".slide.active .num")).to_have_text("01")
    expect(deck.locator("#timer-text")).to_have_text("9:50")
    tick(deck, 5)
    expect(deck.locator("#timer-text")).to_have_text("9:45")


def test_add_item_and_apply_rebuilds_deck_and_saves(deck):
    rows = open_editor(deck)
    deck.locator("#ed-add").click()
    expect(rows).to_have_count(6)
    new = rows.nth(5)
    new.locator(".f-min").fill("2.5")
    new.locator(".f-title").fill("Wrap-up")
    new.locator(".f-points").fill("Thanks\nNext meeting")
    deck.locator("#ed-apply").click()
    expect(deck.locator("#editor")).to_be_hidden()
    expect(deck.locator(".slide")).to_have_count(6)
    expect(deck.locator(".slide .num").nth(5)).to_have_text("06")
    expect(deck.locator(".slide").nth(5).locator(".points li")).to_have_text(["Thanks", "Next meeting"])
    expect(deck.locator("#meeting-text")).to_have_text("Meeting: 0:00 used / 32:30 planned")
    stored = json.loads(deck.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))
    assert stored["items"][5] == {"minutes": 2.5, "title": "Wrap-up", "points": ["Thanks", "Next meeting"]}
    deck.reload()
    expect(deck.locator(".slide")).to_have_count(6)


def test_reorder_and_remove(deck):
    rows = open_editor(deck)
    rows.nth(1).locator(".btn-up").click()
    expect(rows.nth(0).locator(".f-title")).to_have_value("Identify trainings for 2027")
    rows.nth(0).locator(".btn-down").click()
    expect(rows.nth(0).locator(".f-title")).to_have_value("Priorities for 2026 & 2027")
    expect(rows.nth(0).locator(".btn-up")).to_be_disabled()
    expect(rows.nth(4).locator(".btn-down")).to_be_disabled()
    rows.nth(2).locator(".btn-remove").click()
    expect(rows).to_have_count(4)
    deck.locator("#ed-apply").click()
    expect(deck.locator(".slide .title")).to_have_text([
        "Priorities for 2026 & 2027", "Identify trainings for 2027",
        "Risks & blockers", "Decisions, owners & next steps"])


def test_last_row_can_never_be_removed(deck):
    rows = open_editor(deck)
    for _ in range(4):
        rows.nth(0).locator(".btn-remove").click()
    expect(rows).to_have_count(1)
    expect(rows.nth(0).locator(".btn-remove")).to_be_disabled()
    rows.nth(0).locator(".btn-remove").click(force=True)
    expect(rows).to_have_count(1)


def test_validation_highlights_invalid_rows_and_blocks_apply(deck):
    rows = open_editor(deck)
    rows.nth(1).locator(".f-title").fill("   ")
    rows.nth(3).locator(".f-min").fill("0")
    deck.locator("#ed-apply").click()
    expect(deck.locator("#editor")).to_be_visible()
    expect(deck.locator("#editor .row.invalid")).to_have_count(2)
    expect(rows.nth(1)).to_have_class(re.compile(r"\binvalid\b"))
    expect(rows.nth(3)).to_have_class(re.compile(r"\binvalid\b"))
    expect(deck.locator("#ed-error")).to_be_visible()
    rows.nth(1).locator(".f-title").fill("Fixed")
    rows.nth(3).locator(".f-min").fill("0.5")
    expect(deck.locator("#editor .row.invalid")).to_have_count(0)
    deck.locator("#ed-apply").click()
    expect(deck.locator("#editor")).to_be_hidden()
    expect(deck.locator(".slide .title").nth(1)).to_have_text("Fixed")


def test_negative_and_blank_minutes_are_invalid(deck):
    rows = open_editor(deck)
    rows.nth(0).locator(".f-min").fill("-1")
    rows.nth(2).locator(".f-min").fill("")
    deck.locator("#ed-apply").click()
    expect(deck.locator("#editor .row.invalid")).to_have_count(2)


def test_cancel_and_escape_discard_changes(deck):
    rows = open_editor(deck)
    rows.nth(0).locator(".f-title").fill("Changed")
    deck.locator("#ed-cancel").click()
    expect(deck.locator(".slide .title").nth(0)).to_have_text("Priorities for 2026 & 2027")
    rows = open_editor(deck)
    expect(rows.nth(0).locator(".f-title")).to_have_value("Priorities for 2026 & 2027")
    rows.nth(0).locator(".f-title").fill("Changed again")
    deck.keyboard.press("Escape")
    expect(deck.locator("#editor")).to_be_hidden()
    expect(deck.locator(".slide .title").nth(0)).to_have_text("Priorities for 2026 & 2027")


def test_reset_to_file_defaults_asks_first(deck):
    rows = open_editor(deck)
    rows.nth(0).locator(".f-title").fill("Custom")
    deck.locator("#ed-apply").click()
    expect(deck.locator(".slide .title").nth(0)).to_have_text("Custom")

    open_editor(deck)
    deck.once("dialog", lambda d: d.dismiss())
    deck.locator("#ed-reset").click()
    expect(deck.locator("#editor .row").nth(0).locator(".f-title")).to_have_value("Custom")

    messages = []
    def accept(d):
        messages.append(d.message)
        d.accept()
    deck.once("dialog", accept)
    deck.locator("#ed-reset").click()
    expect(deck.locator("#editor")).to_be_hidden()
    assert messages and "default" in messages[0].lower()
    expect(deck.locator(".slide .title").nth(0)).to_have_text("Priorities for 2026 & 2027")
    assert deck.evaluate(f"localStorage.getItem('{STORAGE_KEY}')") is None


def test_save_html_downloads_copy_with_escaped_agenda(deck, browser, tmp_path):
    rows = open_editor(deck)
    rows.nth(0).locator(".f-title").fill("Evil </script><script>window.pwned=1</script>")
    with deck.expect_download() as dl:
        deck.locator("#ed-save").click()
    download = dl.value
    assert download.suggested_filename.endswith(".html")
    out = tmp_path / "saved.html"
    download.save_as(out)
    src = out.read_text(encoding="utf-8")

    blocks = re.findall(r'<script type="application/json" id="agenda-data">(.*?)</script>', src, re.S)
    assert len(blocks) == 1
    assert "<" not in blocks[0], "every < in the JSON is escaped"
    assert "\\u003c/script>" in blocks[0]
    data = json.loads(blocks[0])
    assert data["items"][0]["title"].startswith("Evil </script>")
    assert src.count('class="slide') == 0, "saved copy has no rendered slides baked in"

    ctx = browser.new_context()
    try:
        p2 = ctx.new_page()
        p2.goto(out.as_uri())
        expect(p2.locator(".slide")).to_have_count(5)
        expect(p2.locator(".slide .title").nth(0)).to_have_text(
            "Evil </script><script>window.pwned=1</script>")
        assert p2.evaluate("window.pwned") is None
    finally:
        ctx.close()


def test_save_html_blocked_when_invalid(deck):
    rows = open_editor(deck)
    rows.nth(0).locator(".f-title").fill("")
    downloads = []
    deck.on("download", lambda d: downloads.append(d))
    deck.locator("#ed-save").click()
    expect(deck.locator("#editor .row.invalid")).to_have_count(1)
    assert downloads == []
