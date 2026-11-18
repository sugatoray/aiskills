"""Settings → Contents: edit the deck title (shown top-left and as the page title)."""
import json
import re

from playwright.sync_api import expect

from conftest import STORAGE_KEY

DEFAULT = "Team Planning Meeting"


def open_contents(page):
    page.locator("#btn-edit").click()
    expect(page.locator("#panel-contents")).to_be_visible()
    return page.locator("#f-deck-title")


def test_contents_tab_has_a_deck_title_field_above_the_rows(deck):
    field = open_contents(deck)
    expect(field).to_be_visible()
    expect(field).to_have_value(DEFAULT)
    expect(deck.locator('label[for="f-deck-title"]')).to_have_text("Deck title")
    above = deck.evaluate("""document.getElementById('f-deck-title')
        .compareDocumentPosition(document.getElementById('ed-rows')) & Node.DOCUMENT_POSITION_FOLLOWING""")
    assert above


def test_apply_updates_header_page_title_and_storage(deck):
    open_contents(deck).fill("  Q4 Offsite  ")
    deck.locator("#ed-apply").click()
    expect(deck.locator("#meeting-title")).to_have_text("Q4 Offsite")
    assert deck.title() == "Q4 Offsite"
    assert json.loads(deck.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))["title"] == "Q4 Offsite"
    deck.reload()
    expect(deck.locator("#meeting-title")).to_have_text("Q4 Offsite")
    expect(open_contents(deck)).to_have_value("Q4 Offsite")


def test_cancel_and_escape_discard_title_edits(deck):
    open_contents(deck).fill("Changed")
    deck.locator("#ed-cancel").click()
    expect(deck.locator("#meeting-title")).to_have_text(DEFAULT)
    open_contents(deck).fill("Changed again")
    deck.keyboard.press("Escape")
    expect(deck.locator("#meeting-title")).to_have_text(DEFAULT)
    expect(open_contents(deck)).to_have_value(DEFAULT)


def test_blank_title_is_allowed_and_hides_the_header_text(deck):
    open_contents(deck).fill("   ")
    deck.locator("#ed-apply").click()
    expect(deck.locator("#editor")).to_be_hidden()
    expect(deck.locator("#meeting-title")).to_have_text("")
    assert deck.title() == "Meeting Agenda"


def test_reset_restores_the_file_title(deck):
    open_contents(deck).fill("Temp")
    deck.locator("#ed-apply").click()
    open_contents(deck)
    deck.once("dialog", lambda d: d.accept())
    deck.locator("#ed-reset").click()
    expect(deck.locator("#meeting-title")).to_have_text(DEFAULT)


def test_save_html_writes_the_edited_title(deck, browser, tmp_path):
    open_contents(deck).fill("Board </script> review")
    with deck.expect_download() as dl:
        deck.locator("#ed-save").click()
    out = tmp_path / "saved.html"
    dl.value.save_as(out)
    raw = re.search(r'id="agenda-data">(.*?)</script>', out.read_text(), re.S).group(1)
    assert "<" not in raw
    assert json.loads(raw)["title"] == "Board </script> review"
    ctx = browser.new_context()
    try:
        p = ctx.new_page()
        p.goto(out.as_uri())
        expect(p.locator("#meeting-title")).to_have_text("Board </script> review")
        assert p.title() == "Board </script> review"
    finally:
        ctx.close()


def test_title_is_text_not_html(deck):
    open_contents(deck).fill('<img src=x onerror="window.pwned=1">')
    deck.locator("#ed-apply").click()
    expect(deck.locator("#meeting-title")).to_have_text('<img src=x onerror="window.pwned=1">')
    expect(deck.locator("#meeting-title img")).to_have_count(0)
    assert deck.evaluate("window.pwned") is None


def test_typing_in_the_title_field_does_not_drive_the_deck(deck):
    field = open_contents(deck)
    field.fill("")
    field.type("Prep room 1 ")       # includes p, r and Space
    expect(field).to_have_value("Prep room 1 ")
    deck.locator("#ed-cancel").click()
    expect(deck.locator(".slide.active .num")).to_have_text("01")
    expect(deck.locator("#timer.paused")).to_have_count(0)
