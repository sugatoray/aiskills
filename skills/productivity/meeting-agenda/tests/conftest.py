"""Shared fixtures: one Chromium per session, a fresh context (empty
localStorage) per test, and Playwright's fake clock so timer tests are fast
and deterministic."""
import json
import os
import pathlib

import pytest
from playwright.sync_api import expect, sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / "assets" / "meeting-agenda.html"
URL = HTML.as_uri()
SHOTS = ROOT / "meta" / "screenshots"
STORAGE_KEY = "meetingAgenda"

expect.set_options(timeout=2000)


def _chromium_path():
    env = os.environ.get("CHROMIUM_PATH")
    if env:
        return env
    if os.path.exists("/opt/pw-browsers/chromium"):
        return "/opt/pw-browsers/chromium"
    return None  # fall back to Playwright's own download


@pytest.fixture(scope="session")
def browser():
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=_chromium_path())
        yield b
        b.close()


@pytest.fixture
def context(browser):
    ctx = browser.new_context(viewport={"width": 1280, "height": 720}, accept_downloads=True)
    yield ctx
    ctx.close()


@pytest.fixture
def page(context):
    p = context.new_page()
    p.clock.install()
    return p


@pytest.fixture
def deck(page):
    page.goto(URL)
    return page


def tick(page, seconds):
    """Advance the fake clock, firing timers along the way."""
    page.clock.run_for(int(seconds * 1000))


def store_agenda(page, items, title="Test meeting"):
    """Put an agenda in localStorage and reload so the deck picks it up."""
    page.evaluate(
        "([k, v]) => localStorage.setItem(k, v)",
        [STORAGE_KEY, json.dumps({"title": title, "items": items})],
    )
    page.reload()
