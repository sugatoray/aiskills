"""Capture the reference screenshots (also checks the states render)."""
import pytest
from playwright.sync_api import expect

from conftest import SHOTS, URL, tick


@pytest.fixture
def hd(browser):
    ctx = browser.new_context(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
    p = ctx.new_page()
    p.clock.install()
    p.goto(URL)
    yield p
    ctx.close()


SETTLE = """document.getAnimations().forEach(a => {
  const t = a.effect && a.effect.getComputedTiming();
  if (t && t.iterations === Infinity) a.pause(); else a.finish();
})"""


# Only these are kept in the repo (the skill is copied on install, so stay small).
# The other states are still asserted by their tests, just not saved.
KEEP = {"01-slide-normal.png", "03-timer-overtime.png", "04-editor.png", "07-progress-by-section.png"}


def snap(page, name):
    """Finish transitions/fade-ins (and freeze the infinite pulse) so the
    picture shows the settled state rather than a frame mid-animation."""
    page.evaluate(SETTLE)
    if name not in KEEP:
        return
    SHOTS.mkdir(exist_ok=True)
    page.screenshot(path=str(SHOTS / name))


def test_shot_normal(hd):
    tick(hd, 95)
    expect(hd.locator("#timer-text")).to_have_text("8:25")
    snap(hd, "01-slide-normal.png")


def test_shot_amber(hd):
    hd.keyboard.press("ArrowRight")
    tick(hd, 7 * 60)
    expect(hd.locator("#timer.warn")).to_have_count(1)
    snap(hd, "02-timer-amber.png")


def test_shot_overtime(hd):
    hd.keyboard.press("End")
    tick(hd, 4 * 60 + 42)
    expect(hd.locator("#timer.over")).to_have_count(1)
    snap(hd, "03-timer-overtime.png")


def test_shot_editor(hd):
    hd.locator("#btn-edit").click()
    expect(hd.locator("#editor")).to_be_visible()
    snap(hd, "04-editor.png")


def test_shot_editor_invalid(hd):
    hd.locator("#btn-edit").click()
    rows = hd.locator("#editor .row")
    rows.nth(1).locator(".f-title").fill("")
    rows.nth(2).locator(".f-min").fill("0")
    hd.locator("#ed-apply").click()
    expect(hd.locator("#editor .row.invalid")).to_have_count(2)
    snap(hd, "05-editor-validation.png")


def test_shot_meeting_over(hd):
    for _ in range(4):
        tick(hd, 8 * 60)
        hd.keyboard.press("ArrowRight")
    tick(hd, 2 * 60)
    expect(hd.locator("#meeting-bar.over")).to_have_count(1)
    snap(hd, "06-meeting-over.png")


def test_shot_progress_by_section(hd):
    tick(hd, 4 * 60)
    hd.keyboard.press("ArrowRight")
    hd.keyboard.press("ArrowRight")
    tick(hd, 3 * 60)
    hd.keyboard.press("End")
    tick(hd, 60)
    expect(hd.locator("#meeting-text")).to_have_text("Meeting: 8:00 used / 30:00 planned")
    snap(hd, "07-progress-by-section.png")
